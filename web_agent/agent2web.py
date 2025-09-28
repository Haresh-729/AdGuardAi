import os
import json
import asyncio
import sys
import logging
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings
from llama_index.llms.groq import Groq
from langdetect import detect, DetectorFactory
import google.generativeai as genai
from playwright.async_api import async_playwright
import time
from tenacity import retry, stop_after_attempt, wait_exponential

# Make language detection deterministic
DetectorFactory.seed = 0

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PolicyComplianceChecker:
    def __init__(self, policy_file: str = "policy.txt"):
        self.policy_file = policy_file
        self.config = self._load_configuration()
        self._validate_configuration()
        self._setup_llm_clients()
        self._load_policy_documents()

    def _load_configuration(self) -> Dict[str, str]:
        config = {
            'groq_api_key': os.getenv('GROQ_API_KEY'),
            'gemini_api_key': os.getenv('GEMINI_API_KEY'),
            'hf_token': os.getenv('HF_TOKEN'),
        }
        
        # Mask sensitive keys in logs
        masked_config = {k: v[:10] + "..." if v else None for k, v in config.items()}
        logger.info(f"Loaded configuration: {masked_config}")
        
        return config

    def _validate_configuration(self) -> None:
        if not self.config['groq_api_key'] and not self.config['gemini_api_key']:
            raise ValueError("At least one of GROQ_API_KEY or GEMINI_API_KEY is required")
        
        if not os.path.exists(self.policy_file):
            raise FileNotFoundError(f"Policy file {self.policy_file} not found")
        
        # Check if policy file has content
        with open(self.policy_file, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            if not content:
                logger.warning(f"Policy file {self.policy_file} is empty")

    def _setup_llm_clients(self) -> None:
        try:
            from llama_index.embeddings.huggingface import HuggingFaceEmbedding
            
            cache_dir = os.path.join(os.getcwd(), ".cache", "sentence_transformers")
            os.makedirs(cache_dir, exist_ok=True)
            
            embed_model = HuggingFaceEmbedding(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                cache_folder=cache_dir
            )
            Settings.embed_model = embed_model
            logger.info("HuggingFace embedding initialized successfully")
            
        except ImportError as e:
            logger.error(f"Required packages not installed: {e}")
            raise Exception("Please install required packages: pip install sentence-transformers torch")
        except Exception as e:
            logger.error(f"Failed to setup embeddings: {e}")
            raise Exception(f"Failed to setup HuggingFace embeddings: {e}")
        
        # Setup Groq LLM
        if self.config['groq_api_key']:
            try:
                self.groq_llm = Groq(
                    model="llama-3.1-8b-instant", 
                    api_key=self.config['groq_api_key']
                )
                Settings.llm = self.groq_llm
                logger.info("Groq LLM initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Groq: {e}")

        # Setup Gemini
        if self.config['gemini_api_key']:
            try:
                genai.configure(api_key=self.config['gemini_api_key'])
                self.gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
                logger.info("Gemini model initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {e}")

    def _load_policy_documents(self) -> None:
        try:
            documents = SimpleDirectoryReader(input_files=[self.policy_file]).load_data()
            
            if not documents:
                logger.warning("No documents loaded from policy file")
                return
                
            self.index = VectorStoreIndex.from_documents(documents)
            self.query_engine = self.index.as_query_engine(
                similarity_top_k=3, 
                response_mode="compact"
            )
            logger.info(f"Policy documents loaded and indexed from {self.policy_file}")
            
        except Exception as e:
            logger.error(f"Failed to load policy documents: {e}")
            raise

    def _extract_policy_context(self, text: str) -> str:
        if not hasattr(self, 'query_engine'):
            logger.warning("No policy context available - query engine not initialized")
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
            except Exception as e:
                logger.error(f"Policy query failed: {e}")
                continue
        
        combined = "\n\n".join(sections[:2])
        return combined[:3000] if len(combined) > 3000 else combined

    def _detect_language_safe(self, text: str) -> str:
        """Safely detect language with fallback"""
        try:
            if len(text.strip()) < 3:
                return "en"  # Default for very short text
            return detect(text)
        except Exception as e:
            logger.warning(f"Language detection failed: {e}")
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

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=4, max=10))
    def _call_groq_api(self, prompt: str) -> str:
        """Actually call Groq API, not query engine"""
        if not hasattr(self, 'groq_llm'):
            raise Exception("Groq LLM not available")
        
        try:
            response = self.groq_llm.complete(prompt)
            return str(response)
        except Exception as e:
            logger.error(f"Groq API call failed: {e}")
            raise

    def _parse_json_response(self, response_text: str, fallback_text: str) -> Dict[str, Any]:
        try:
            text = str(response_text)
            
            # Try to extract JSON from various formats
            if "```json" in text:
                json_part = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                json_part = text.split("```")[1].split("```")[0]
            else:
                json_part = text.strip()
            
            result = json.loads(json_part.strip())
            
            # Validate required keys
            required_keys = ["compliant", "violations", "risk_score"]
            if all(k in result for k in required_keys):
                return result
            else:
                logger.warning(f"Missing required keys in response: {result.keys()}")
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed: {e}")
        except Exception as e:
            logger.error(f"Response parsing failed: {e}")
        
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
                except Exception as e:
                    logger.warning(f"Groq failed: {e}, trying Gemini")
            
            # Fallback to Gemini
            if hasattr(self, 'gemini_model'):
                try:
                    response = self.gemini_model.generate_content(prompt)
                    return self._parse_json_response(response.text, text)
                except Exception as e:
                    logger.error(f"Gemini also failed: {e}")
            
            raise Exception("No working LLM available")
            
        except Exception as e:
            logger.error(f"Compliance check failed: {e}")
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

    async def extract_page_content(self, url: str, visible: bool = False) -> str:
        """Extract content from webpage using Playwright"""
        try:
            async with async_playwright() as p:
                browser_options = {
                    'headless': not visible,
                    'args': ['--no-default-browser-check', '--disable-infobars']
                }
                
                if visible:
                    browser_options.update({
                        'slow_mo': 1000,
                        'args': browser_options['args'] + ['--start-maximized']
                    })
                    logger.info(f"Opening browser to analyze: {url}")
                
                browser = await p.chromium.launch(**browser_options)
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    viewport={'width': 1920, 'height': 1080} if visible else None
                )
                page = await context.new_page()
                
                try:
                    if visible:
                        logger.info("Loading page...")
                    
                    await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    
                    # Wait for content to load
                    wait_time = 3000 if visible else 2000
                    await page.wait_for_timeout(wait_time)
                    
                    # Extract structured content
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
                    
                    # Build summary
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
                    
                    if visible:
                        logger.info("Content extraction complete!")
                    
                    return summary[:2000] if summary else "No meaningful content extracted"
                
                finally:
                    if visible:
                        logger.info("Analysis complete! Browser will close in 5 seconds...")
                        await page.wait_for_timeout(5000)
                    await browser.close()
                    
        except Exception as e:
            logger.error(f"Content extraction failed: {e}")
            return f"Failed to extract content: {str(e)}"

    def check_ad_page_alignment(self, ad_text: str, page_content: str) -> List[Dict[str, str]]:
        """Check if ad claims are supported by page content"""
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

    async def analyze_compliance(self, url: str, ad_text: Optional[str] = None, show_browser: bool = False) -> Dict[str, Any]:
        """Main compliance analysis method"""
        logger.info(f"Starting compliance analysis for: {url}")
        
        # Extract page content
        page_content = await self.extract_page_content(url, visible=show_browser)
        
        if show_browser:
            logger.info("Running AI policy compliance check...")
        
        # Check page compliance
        page_compliance = self.check_text_compliance(page_content)
        
        result = {
            "url": url,
            "timestamp": time.time(),
            "page_compliance": page_compliance,
            "page_content_preview": page_content[:200] + "..." if len(page_content) > 200 else page_content,
            "overall_compliant": page_compliance["compliant"]
        }
        
        # If ad text provided, analyze it too
        if ad_text:
            if show_browser:
                logger.info("Analyzing ad text compliance...")
                
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
        
        compliance_status = "COMPLIANT" if result["overall_compliant"] else "NON-COMPLIANT"
        logger.info(f"Analysis complete: {compliance_status}")
        
        return result


def parse_arguments() -> tuple:
    """Parse command line arguments"""
    if len(sys.argv) < 2:
        print("Usage: python script.py \"<URL>\" [\"ad_text\"] [--visible]")
        print("IMPORTANT: URLs with parameters MUST be wrapped in quotes!")
        print("\nOptions:")
        print("  --visible         Show browser window during analysis")
        print("\nExamples:")
        print("  python script.py \"https://example.com\"")
        print("  python script.py \"https://example.com\" \"Try our amazing product!\" --visible")
        print("  python script.py \"https://example.com?param=value\" --visible")
        sys.exit(1)
    
    url = sys.argv[1]
    ad_text = None
    show_browser = False
    
    for arg in sys.argv[2:]:
        if arg == "--visible":
            show_browser = True
        elif not ad_text and not arg.startswith('--'):
            ad_text = arg
    
    return url, ad_text, show_browser


async def main():
    """Main execution function"""
    try:
        url, ad_text, show_browser = parse_arguments()
        
        logger.info("Initializing Policy Compliance Checker...")
        checker = PolicyComplianceChecker("policy.txt")
        
        result = await checker.analyze_compliance(url, ad_text, show_browser)
        
        # Output results as JSON
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
    except KeyboardInterrupt:
        logger.info("Analysis interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        error_result = {
            "error": str(e),
            "success": False,
            "timestamp": time.time()
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())