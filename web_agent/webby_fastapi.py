import os
import json
import asyncio
import logging
import warnings
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl
from dotenv import load_dotenv
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings, StorageContext, load_index_from_storage
from llama_index.llms.groq import Groq
from langdetect import detect, DetectorFactory
import google.generativeai as genai
from playwright.async_api import async_playwright
import time
from tenacity import retry, stop_after_attempt, wait_exponential
import uvicorn

# Suppress warnings
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)
os.environ['TOKENIZERS_PARALLELISM'] = 'false'

# Make language detection deterministic
DetectorFactory.seed = 0

# Load environment variables
load_dotenv()

# Setup minimal logging (suppress verbose logs)
logging.basicConfig(
    level=logging.WARNING,  # Changed to WARNING to reduce logs
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Suppress specific loggers
logging.getLogger("sentence_transformers").setLevel(logging.ERROR)
logging.getLogger("transformers").setLevel(logging.ERROR)
logging.getLogger("torch").setLevel(logging.ERROR)
logging.getLogger("httpx").setLevel(logging.ERROR)
logging.getLogger("playwright").setLevel(logging.ERROR)

# FastAPI app
app = FastAPI(title="Policy Compliance Checker API", version="1.0.0")

# Global checker instance (initialized once)
checker = None

class AnalysisRequest(BaseModel):
    url: HttpUrl
    ad_text: Optional[str] = None

class AnalysisResponse(BaseModel):
    url: str
    timestamp: float
    page_compliance: Dict[str, Any]
    page_content_preview: str
    overall_compliant: bool
    ad_text: Optional[str] = None
    ad_compliance: Optional[Dict[str, Any]] = None
    alignment_issues: Optional[List[Dict[str, str]]] = None

class PolicyComplianceChecker:
    _instance = None
    _initialized = False

    def __new__(cls, policy_file: str = "policy.txt"):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, policy_file: str = "policy.txt"):
        if self._initialized:
            return
        
        self.policy_file = policy_file
        self.config = self._load_configuration()
        self._validate_configuration()
        self._setup_llm_clients()
        self._load_policy_documents()
        self._initialized = True

    def _load_configuration(self) -> Dict[str, str]:
        config = {
            'groq_api_key': os.getenv('GROQ_API_KEY'),
            'gemini_api_key': os.getenv('GEMINI_API_KEY'),
            'hf_token': os.getenv('HF_TOKEN'),
        }
        return config

    def _validate_configuration(self) -> None:
        if not self.config['groq_api_key'] and not self.config['gemini_api_key']:
            raise ValueError("At least one of GROQ_API_KEY or GEMINI_API_KEY is required")
        
        if not os.path.exists(self.policy_file):
            raise FileNotFoundError(f"Policy file {self.policy_file} not found")

    def _setup_llm_clients(self) -> None:
        try:
            from llama_index.embeddings.huggingface import HuggingFaceEmbedding
            
            # Set proper cache directories
            home_dir = os.path.expanduser("~")
            cache_dir = os.path.join(home_dir, ".cache", "sentence_transformers")
            hf_cache = os.path.join(home_dir, ".cache", "huggingface", "transformers")
            
            # Create cache directories
            os.makedirs(cache_dir, exist_ok=True)
            os.makedirs(hf_cache, exist_ok=True)
            
            # Set environment variables for caching
            os.environ['SENTENCE_TRANSFORMERS_HOME'] = cache_dir
            os.environ['HF_HOME'] = os.path.join(home_dir, ".cache", "huggingface")
            os.environ['TRANSFORMERS_CACHE'] = hf_cache
            
            # Initialize embedding model (will use cache if available)
            embed_model = HuggingFaceEmbedding(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )
            Settings.embed_model = embed_model
            
        except Exception as e:
            raise Exception(f"Failed to setup embeddings: {e}")
        
        # Setup Groq LLM
        if self.config['groq_api_key']:
            try:
                self.groq_llm = Groq(
                    model="llama-3.1-8b-instant", 
                    api_key=self.config['groq_api_key']
                )
                Settings.llm = self.groq_llm
            except Exception as e:
                logger.error(f"Failed to initialize Groq: {e}")

        # Setup Gemini
        if self.config['gemini_api_key']:
            try:
                genai.configure(api_key=self.config['gemini_api_key'])
                self.gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {e}")

    def _load_policy_documents(self) -> None:
        try:
            # Check if we already have a cached index
            index_cache_path = os.path.join(os.getcwd(), ".cache", "policy_index")
            
            if os.path.exists(index_cache_path):
                try:
                    storage_context = StorageContext.from_defaults(persist_dir=index_cache_path)
                    self.index = load_index_from_storage(storage_context)
                    self.query_engine = self.index.as_query_engine(
                        similarity_top_k=3, 
                        response_mode="compact"
                    )
                    return
                except Exception:
                    pass
            
            # Build new index
            documents = SimpleDirectoryReader(input_files=[self.policy_file]).load_data()
            
            if not documents:
                logger.warning("No documents loaded from policy file")
                return
                
            self.index = VectorStoreIndex.from_documents(documents)
            self.query_engine = self.index.as_query_engine(
                similarity_top_k=3, 
                response_mode="compact"
            )
            
            # Cache the index
            os.makedirs(index_cache_path, exist_ok=True)
            self.index.storage_context.persist(persist_dir=index_cache_path)
            
        except Exception as e:
            logger.error(f"Failed to load policy documents: {e}")
            raise

    def _extract_policy_context(self, text: str) -> str:
        if not hasattr(self, 'query_engine'):
            return "No policy context available"
            
        queries = [
            f"Policy violations for: {text[:100]}",
            "prohibited content advertising restrictions",
            "target audience compliance guidelines"
        ]
        
        sections = []
        for query in queries:
            try:
                response = self.query_engine.query(query)
                response_str = str(response).strip()
                if len(response_str) > 20:
                    sections.append(response_str)
            except Exception:
                continue
        
        combined = "\n\n".join(sections[:2])
        return combined[:3000] if len(combined) > 3000 else combined

    def _detect_language_safe(self, text: str) -> str:
        try:
            if len(text.strip()) < 3:
                return "en"
            return detect(text)
        except Exception:
            return "en"

    def _create_compliance_prompt(self, text: str, policy_context: str, language: str = "en") -> str:
        return f"""Analyze advertisement compliance against policy sections.

POLICY CONTEXT:
{policy_context}

ADVERTISEMENT ({language}):
{text}

Return JSON only:
{{
  "compliant": true/false,
  "violations": [
    {{
      "policy_section": "specific section",
      "violation": "description",
      "confidence": 0.0-1.0,
      "evidence": "violating text"
    }}
  ],
  "risk_score": 0.0-1.0,
  "summary": "brief status",
  "language": "{language}"
}}

Focus on: prohibited content, misleading claims, target audience violations."""

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=5))
    def _call_groq_api(self, prompt: str) -> str:
        if not hasattr(self, 'groq_llm'):
            raise Exception("Groq LLM not available")
        
        try:
            response = self.groq_llm.complete(prompt)
            return str(response)
        except Exception as e:
            raise

    def _parse_json_response(self, response_text: str, fallback_text: str) -> Dict[str, Any]:
        try:
            text = str(response_text)
            
            if "```json" in text:
                json_part = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                json_part = text.split("```")[1].split("```")[0]
            else:
                json_part = text.strip()
            
            result = json.loads(json_part.strip())
            
            required_keys = ["compliant", "violations", "risk_score"]
            if all(k in result for k in required_keys):
                return result
                
        except Exception:
            pass
        
        # Fallback response
        language = self._detect_language_safe(fallback_text)
        return {
            "compliant": False,
            "violations": [{
                "policy_section": "Parse Error", 
                "violation": "Analysis response could not be parsed", 
                "confidence": 0.5, 
                "evidence": fallback_text[:100]
            }],
            "risk_score": 0.8,
            "summary": "Manual review required - parsing error",
            "language": language
        }

    def check_text_compliance(self, text: str) -> Dict[str, Any]:
        if not text or len(text.strip()) < 5:
            return {
                "compliant": True,
                "violations": [],
                "risk_score": 0.0,
                "summary": "No meaningful content to analyze",
                "language": "unknown"
            }
        
        try:
            language = self._detect_language_safe(text)
            policy_context = self._extract_policy_context(text)
            prompt = self._create_compliance_prompt(text, policy_context, language)
            
            # Try Groq first for English content
            if language == 'en' and hasattr(self, 'groq_llm'):
                try:
                    response_text = self._call_groq_api(prompt)
                    return self._parse_json_response(response_text, text)
                except Exception:
                    pass
            
            # Fallback to Gemini
            if hasattr(self, 'gemini_model'):
                try:
                    response = self.gemini_model.generate_content(prompt)
                    return self._parse_json_response(response.text, text)
                except Exception:
                    pass
            
            raise Exception("No working LLM available")
            
        except Exception as e:
            return {
                "compliant": False,
                "violations": [{
                    "policy_section": "System Error", 
                    "violation": str(e), 
                    "confidence": 0.5, 
                    "evidence": text[:100]
                }],
                "risk_score": 0.9,
                "summary": "System error occurred during analysis",
                "language": self._detect_language_safe(text)
            }

    async def extract_page_content(self, url: str) -> str:
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                )
                page = await context.new_page()
                
                try:
                    await page.goto(str(url), wait_until="domcontentloaded", timeout=15000)
                    await page.wait_for_timeout(2000)
                    
                    content = await page.evaluate("""
                    () => {
                        const getText = (selector) => {
                            const elements = document.querySelectorAll(selector);
                            return Array.from(elements)
                                .map(el => el.textContent?.trim())
                                .filter(text => text && text.length > 10);
                        };
                        
                        return {
                            title: document.title || '',
                            headings: getText('h1, h2, h3').slice(0, 5),
                            paragraphs: getText('p').slice(0, 10),
                            claims: getText('[class*="guarantee"], [class*="promise"], [class*="claim"]'),
                            pricing: getText('[class*="price"], [class*="cost"], [class*="fee"]'),
                            disclaimers: getText('[class*="disclaimer"], [class*="terms"], .fine-print, .legal')
                        };
                    }
                    """)
                    
                    summary_parts = []
                    if content['title']:
                        summary_parts.append(f"Title: {content['title']}")
                    if content['headings']:
                        summary_parts.append(f"Headings: {' | '.join(content['headings'])}")
                    if content['paragraphs']:
                        summary_parts.append(f"Content: {' '.join(content['paragraphs'][:3])}")
                    if content['claims']:
                        summary_parts.append(f"Claims: {' | '.join(content['claims'])}")
                    if content['pricing']:
                        summary_parts.append(f"Pricing: {' | '.join(content['pricing'])}")
                    if content['disclaimers']:
                        summary_parts.append(f"Disclaimers: {' | '.join(content['disclaimers'])}")
                    
                    summary = "\n".join(summary_parts)
                    return summary[:2000] if summary else "No meaningful content extracted"
                
                finally:
                    await browser.close()
                    
        except Exception as e:
            return f"Failed to extract content: {str(e)}"

    def check_ad_page_alignment(self, ad_text: str, page_content: str) -> List[Dict[str, str]]:
        claim_keywords = ["guaranteed", "100%", "instant", "free", "best", "proven", "certified", "risk-free"]
        
        ad_lower = ad_text.lower()
        page_lower = page_content.lower()
        
        ad_claims = [kw for kw in claim_keywords if kw in ad_lower]
        alignment_issues = []
        
        for claim in ad_claims:
            if claim not in page_lower:
                alignment_issues.append({
                    "type": "unsupported_claim",
                    "claim": claim,
                    "evidence": f"'{claim}' mentioned in ad but not supported on landing page"
                })
        
        return alignment_issues

    async def analyze_compliance(self, url: str, ad_text: Optional[str] = None) -> Dict[str, Any]:
        # Extract page content
        page_content = await self.extract_page_content(url)
        
        # Check page compliance
        page_compliance = self.check_text_compliance(page_content)
        
        result = {
            "url": str(url),
            "timestamp": time.time(),
            "page_compliance": page_compliance,
            "page_content_preview": page_content[:200] + "..." if len(page_content) > 200 else page_content,
            "overall_compliant": page_compliance["compliant"]
        }
        
        # If ad text provided, analyze it too
        if ad_text:
            ad_compliance = self.check_text_compliance(ad_text)
            alignment_issues = self.check_ad_page_alignment(ad_text, page_content)
            
            result.update({
                "ad_text": ad_text,
                "ad_compliance": ad_compliance,
                "alignment_issues": alignment_issues,
                "overall_compliant": (
                    ad_compliance["compliant"] and 
                    page_compliance["compliant"] and 
                    len(alignment_issues) == 0
                )
            })
        
        return result

@app.on_event("startup")
async def startup_event():
    """Initialize the compliance checker on startup"""
    global checker
    try:
        checker = PolicyComplianceChecker("policy.txt")
        logger.info("Policy Compliance Checker initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize checker: {e}")
        raise

@app.get("/")
async def root():
    return {"message": "Policy Compliance Checker API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_url(request: AnalysisRequest):
    """Analyze a URL for policy compliance"""
    if checker is None:
        raise HTTPException(status_code=500, detail="Checker not initialized")
    
    try:
        result = await checker.analyze_compliance(
            url=str(request.url),
            ad_text=request.ad_text
        )
        return JSONResponse(content=result)
    
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/analyze")
async def analyze_url_get(url: str, ad_text: Optional[str] = None):
    """Analyze a URL for policy compliance (GET method for simple testing)"""
    if checker is None:
        raise HTTPException(status_code=500, detail="Checker not initialized")
    
    try:
        result = await checker.analyze_compliance(url=url, ad_text=ad_text)
        return JSONResponse(content=result)
    
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    print("Starting Policy Compliance Checker API...")
    print("API Documentation: http://localhost:8000/docs")
    print("Health Check: http://localhost:8000/health")
    print("Example: http://localhost:8000/analyze?url=https://nike.com")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000, 
        log_level="warning"  # Suppress uvicorn logs
    )