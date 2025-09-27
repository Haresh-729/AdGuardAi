# Copy the PolicyComplianceChecker class from your provided code
# Remove emoji prints and keep only essential debug prints

import os
import json
import re
from dotenv import load_dotenv
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext
from llama_index.llms.groq import Groq
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core import Settings
from langdetect import detect
import google.generativeai as genai

load_dotenv()

class PolicyComplianceChecker:
    def __init__(self, policy_file="policy.txt"):
        self.policy_file = policy_file
        
        # Get API keys from environment variables
        self.groq_api_key = os.getenv('GROQ_API_KEY')
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        
        self.index = None
        self.query_engine = None
        self.policy_content = ""

        if not self.groq_api_key:
            raise Exception("GROQ_API_KEY not found in environment")
        if not self.gemini_api_key:
            raise Exception("GEMINI_API_KEY not found in environment")

        genai.configure(api_key=self.gemini_api_key)
        self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')

    def setup_models(self):
        embed_model = HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
        llm = Groq(model="llama-3.1-8b-instant", api_key=self.groq_api_key)

        Settings.embed_model = embed_model
        Settings.llm = llm

    def load_policy_documents(self):
        if not os.path.exists(self.policy_file):
            raise FileNotFoundError(f"Policy file {self.policy_file} not found")

        documents = SimpleDirectoryReader(input_files=[self.policy_file]).load_data()
        self.index = VectorStoreIndex.from_documents(documents)
        self.query_engine = self.index.as_query_engine(
            similarity_top_k=3,
            response_mode="compact"
        )

        with open(self.policy_file, 'r', encoding='utf-8') as f:
            self.policy_content = f.read()

        print(f"Policy document loaded: {self.policy_file}")

    def extract_relevant_policy_sections(self, ad_text):
        try:
            policy_search_queries = [
                f"What policies apply to this content: {ad_text[:150]}",
                f"Policy violations and restrictions for: {ad_text[:100]}",
                "prohibited content advertising restrictions",
                "target audience guidelines compliance rules"
            ]

            relevant_sections = []

            for query in policy_search_queries:
                try:
                    response = self.query_engine.query(query)
                    policy_text = str(response).strip()

                    if policy_text and len(policy_text) > 20:
                        relevant_sections.append(policy_text)

                except Exception as e:
                    print(f"Policy search failed for query: {query[:50]}...")
                    continue

            if relevant_sections:
                combined_policy = "\n\n--- POLICY SECTION ---\n\n".join(relevant_sections[:3])

                if len(combined_policy) > 4000:
                    combined_policy = combined_policy[:4000] + "\n\n[Additional policy sections truncated...]"

                return combined_policy
            else:
                return self.policy_content[:2000]

        except Exception as e:
            print(f"Error extracting policy sections: {e}")
            return self.policy_content[:2000]

    def detect_language(self, text):
        try:
            lang = detect(text)
            return lang
        except:
            return 'en'

    def create_groq_prompt(self, ad_text):
        return f"""You are an expert advertisement policy compliance analyzer.

Analyze the following advertisement text against the loaded policy documents and provide a detailed compliance assessment.

ADVERTISEMENT TEXT:
{ad_text}

Please analyze this advertisement and return your response in the following JSON format ONLY:

{{
  "compliant": true/false,
  "violations": [
    {{
      "policy_section": "specific policy rule name or section",
      "violation": "detailed description of the violation",
      "confidence": 0.0-1.0,
      "evidence": "specific text from the advertisement that violates the policy"
    }}
  ],
  "risk_score": 0.0-1.0,
  "summary": "brief summary of compliance status",
  "processed_content": "{ad_text[:200]}..."
}}

Focus on:
1. Prohibited content (drugs, medical claims, financial guarantees)
2. Target audience restrictions (children, vulnerable groups)
3. Misleading claims or guarantees
4. Required disclaimers or warnings

Return ONLY the JSON response, no additional text."""

    def create_gemini_prompt_with_rag_sections(self, ad_text, detected_lang, relevant_policy_sections):
        return f"""You are an expert advertisement policy compliance analyzer with multilingual capabilities.

RELEVANT POLICY SECTIONS (Retrieved from policy database):
{relevant_policy_sections}

ADVERTISEMENT TEXT (Language: {detected_lang}):
{ad_text}

ANALYSIS INSTRUCTIONS:
1. Analyze the advertisement against the SPECIFIC policy sections provided above
2. The policy sections were retrieved based on the advertisement content using semantic search
3. Consider the cultural/linguistic context of language "{detected_lang}"
4. Focus on actual policy violations, not cultural differences or normal business language
5. Do NOT flag standard festival greetings, product mentions, or family conversations as violations

Please analyze this advertisement and return your response in the following JSON format ONLY:

{{
  "compliant": true/false,
  "violations": [
    {{
      "policy_section": "specific policy rule from the sections above",
      "violation": "detailed description of the violation",
      "confidence": 0.0-1.0,
      "evidence": "specific text from the advertisement that violates the policy"
    }}
  ],
  "risk_score": 0.0-1.0,
  "summary": "brief summary of compliance status",
  "processed_content": "{ad_text[:200]}...",
  "detected_language": "{detected_lang}",
  "analysis_method": "rag_to_gemini"
}}

ONLY flag violations of:
1. Prohibited content (illegal substances, unsubstantiated medical claims)
2. Inappropriate content for target audience
3. False or misleading guarantees
4. Missing required disclaimers

RESPONSE REQUIREMENTS:
- Keep violations concise (max 2 sentences each) with not more than 30 words
- Summary should be 1-2 sentences maximum and not more than 40 words
- Focus only on clear policy violations
- Be direct and specific

Return ONLY the JSON response, no additional text."""

    def analyze_with_groq(self, ad_text):
        prompt = self.create_groq_prompt(ad_text)
        response = self.query_engine.query(prompt)
        return self.parse_response(response, ad_text, "groq_rag")

    def analyze_with_gemini_rag_enhanced(self, ad_text, detected_lang):
        try:
            print(f"Extracting relevant policy sections using RAG...")
            relevant_policy_sections = self.extract_relevant_policy_sections(ad_text)

            print(f"Analyzing with Gemini using extracted policy sections...")
            prompt = self.create_gemini_prompt_with_rag_sections(ad_text, detected_lang, relevant_policy_sections)
            response = self.gemini_model.generate_content(prompt)

            return self.parse_gemini_response(response.text, ad_text, detected_lang)

        except Exception as e:
            print(f"RAG-to-Gemini analysis error: {e}")
            return {
                "compliant": False,
                "violations": [{
                    "policy_section": "System Error",
                    "violation": f"RAG-to-Gemini analysis failed: {str(e)}",
                    "confidence": 0.5,
                    "evidence": ad_text[:100]
                }],
                "risk_score": 0.7,
                "summary": "Analysis error - manual review required",
                "processed_content": ad_text[:200],
                "detected_language": detected_lang,
                "analysis_method": "rag_to_gemini_error"
            }

    def parse_response(self, response_text, ad_text, method="unknown"):
        try:
            response_str = str(response_text)

            if "```json" in response_str:
                json_part = response_str.split("```json")[1].split("```")[0].strip()
            elif "```" in response_str:
                json_part = response_str.split("```")[1].split("```")[0].strip()
            else:
                json_part = response_str.strip()

            if json_part.startswith('{') and json_part.endswith('}'):
                result = json.loads(json_part)
                if all(key in result for key in ["compliant", "violations", "risk_score"]):
                    result["analysis_method"] = method
                    return result

            raise ValueError("Invalid JSON structure")

        except Exception as e:
            print(f"JSON parsing error: {e}")
            return {
                "compliant": False,
                "violations": [{
                    "policy_section": "Analysis Error",
                    "violation": f"Could not parse compliance analysis: {str(e)}",
                    "confidence": 0.5,
                    "evidence": ad_text[:100]
                }],
                "risk_score": 0.7,
                "summary": "Analysis failed - manual review required",
                "processed_content": ad_text[:200],
                "analysis_method": f"{method}_parse_error"
            }

    def parse_gemini_response(self, response_text, ad_text, detected_lang):
        try:
            response_str = str(response_text)

            if "```json" in response_str:
                json_part = response_str.split("```json")[1].split("```")[0].strip()
            elif "```" in response_str:
                json_part = response_str.split("```")[1].split("```")[0].strip()
            else:
                json_part = response_str.strip()

            if json_part.startswith('{') and json_part.endswith('}'):
                result = json.loads(json_part)
                if all(key in result for key in ["compliant", "violations", "risk_score"]):
                    result["detected_language"] = detected_lang
                    if "analysis_method" not in result:
                        result["analysis_method"] = "rag_to_gemini"
                    return result

            raise ValueError("Invalid JSON structure")

        except Exception as e:
            print(f"Gemini JSON parsing error: {e}")
            return {
                "compliant": False,
                "violations": [{
                    "policy_section": "Analysis Error",
                    "violation": f"Could not parse Gemini analysis: {str(e)}",
                    "confidence": 0.5,
                    "evidence": ad_text[:100]
                }],
                "risk_score": 0.7,
                "summary": "Gemini analysis parsing failed - manual review required",
                "processed_content": ad_text[:200],
                "detected_language": detected_lang,
                "analysis_method": "rag_to_gemini_parse_error"
            }

    def check_compliance(self, ad_text):
        if not self.query_engine:
            raise Exception("Policy documents not loaded. Call initialize() first.")

        try:
            detected_lang = self.detect_language(ad_text)

            if detected_lang == 'en':
                print(f"Language: English -> Using Groq + RAG")
                return self.analyze_with_groq(ad_text)
            else:
                print(f"Language: {detected_lang} -> Using RAG-to-Gemini approach")
                return self.analyze_with_gemini_rag_enhanced(ad_text, detected_lang)

        except Exception as e:
            print(f"Compliance check error: {e}")
            return {
                "compliant": False,
                "violations": [{
                    "policy_section": "System Error",
                    "violation": f"Analysis failed: {str(e)}",
                    "confidence": 0.5,
                    "evidence": ad_text[:100]
                }],
                "risk_score": 0.8,
                "summary": "System error - manual review required",
                "processed_content": ad_text[:200],
                "detected_language": self.detect_language(ad_text),
                "analysis_method": "system_error"
            }

    def initialize(self):
        self.setup_models()
        self.load_policy_documents()