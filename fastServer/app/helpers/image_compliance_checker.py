# Copy the ImageComplianceChecker class from your provided code
# Remove emoji prints and keep only essential debug prints

import os
import json
import base64
import io
import time
from datetime import datetime
from typing import Union, List, Dict, Any, Optional
import requests
from PIL import Image
import numpy as np
import cv2
import warnings
warnings.filterwarnings('ignore')

import torch
from transformers import Qwen2VLForConditionalGeneration, AutoTokenizer, AutoProcessor
from qwen_vl_utils import process_vision_info

class ImageComplianceChecker:
    def __init__(self, 
                 policy_file="policy.txt", 
                 policy_checker=None,
                 deployment_mode="hf_api",
                 hf_api_key=None):
        
        self.policy_file = policy_file
        self.policy_content = ""
        self.policy_checker = policy_checker
        
        self.deployment_mode = deployment_mode
        self.hf_api_key = hf_api_key or os.getenv('HUGGINGFACE_API_KEY')
        
        self.model_name = "Qwen/Qwen2.5-VL-7B-Instruct"
        self.model = None
        self.processor = None
        
        self.hf_api_url = "https://router.huggingface.co/v1/chat/completions"
        self.hf_serverless_url = f"https://api-inference.huggingface.co/models/{self.model_name}"
        
        if self.deployment_mode in ["hf_api", "hf_serverless"]:
            if not self.hf_api_key:
                raise ValueError(f"Hugging Face API key required for {deployment_mode} mode. Set HUGGINGFACE_API_KEY environment variable or pass hf_api_key parameter.")
            self.device = "api"
            print(f"ImageComplianceChecker initializing with Hugging Face {deployment_mode.upper()}")
        else:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"ImageComplianceChecker initializing on {self.device}")
        
        if policy_checker:
            print("Using existing PolicyComplianceChecker for advanced policy analysis")
        
    def load_qwen_model(self):
        if self.deployment_mode in ["hf_api", "hf_serverless"]:
            print(f"Setting up Hugging Face {self.deployment_mode.upper()} client...")
            print("Hugging Face API client ready - no local model loading required")
            return
            
        try:
            print("Loading Qwen2.5-VL-7B model locally...")
            
            self.model = Qwen2VLForConditionalGeneration.from_pretrained(
                self.model_name,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                device_map="auto" if self.device == "cuda" else None,
                trust_remote_code=True
            )
            
            self.processor = AutoProcessor.from_pretrained(
                self.model_name,
                trust_remote_code=True
            )
            
            print("Qwen2.5-VL model loaded successfully")
            
        except Exception as e:
            print(f"Local model loading failed: {e}")
            raise Exception(f"Failed to load Qwen2.5-VL model: {e}")
    
    def query_huggingface_api(self, image: Image.Image, prompt: str) -> str:
        try:
            import io
            import base64
            
            img_buffer = io.BytesIO()
            image.save(img_buffer, format='JPEG', quality=90)
            img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
            
            headers = {
                "Authorization": f"Bearer {self.hf_api_key}",
                "Content-Type": "application/json"
            }
            
            if self.deployment_mode == "hf_api":
                payload = {
                    "model": self.model_name,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": prompt
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{img_base64}"
                                    }
                                }
                            ]
                        }
                    ],
                    "max_tokens": 2048,
                    "temperature": 0.1
                }
            else:
                payload = {
                    "inputs": {
                        "image": img_base64,
                        "question": prompt
                    }
                }
            
            print(f"Querying Hugging Face {self.deployment_mode.upper()}...")
            
            endpoint = self.hf_api_url if self.deployment_mode == "hf_api" else self.hf_serverless_url
            
            response = requests.post(
                endpoint,
                headers=headers,
                json=payload,
                timeout=120
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if self.deployment_mode == "hf_api":
                    if "choices" in result and len(result["choices"]) > 0:
                        return result["choices"][0]["message"]["content"]
                    else:
                        return str(result)
                else:
                    if isinstance(result, list) and len(result) > 0:
                        return result[0].get('generated_text', str(result))
                    elif isinstance(result, dict):
                        return result.get('generated_text', result.get('answer', str(result)))
                    else:
                        return str(result)
                        
            elif response.status_code == 503:
                print("Model is loading on Hugging Face servers, this may take a few minutes...")
                import time
                time.sleep(30)
                return self.query_huggingface_api(image, prompt)
                
            else:
                error_msg = f"HF API Error {response.status_code}: {response.text}"
                print(f"Error: {error_msg}")
                raise Exception(error_msg)
                
        except requests.exceptions.Timeout:
            raise Exception("Hugging Face API timeout - model may be cold starting")
        except Exception as e:
            print(f"Hugging Face API error: {e}")
            raise Exception(f"HF API call failed: {e}")
    
    def load_policy(self):
        try:
            if os.path.exists(self.policy_file):
                with open(self.policy_file, 'r', encoding='utf-8') as f:
                    self.policy_content = f.read()
                print(f"Policy loaded: {self.policy_file}")
            else:
                print("Policy file not found, using basic policy")
                self.policy_content = "Basic policy: No adult content, no misleading claims, no harmful substances"
        except Exception as e:
            print(f"Policy loading error: {e}")
            self.policy_content = "Basic advertising policy guidelines"

    def preprocess_image(self, image_input: Union[str, Image.Image, np.ndarray]) -> Image.Image:
        try:
            if isinstance(image_input, str):
                if image_input.startswith('http'):
                    response = requests.get(image_input)
                    image = Image.open(io.BytesIO(response.content))
                elif image_input.startswith('data:image'):
                    header, encoded = image_input.split(',', 1)
                    image_data = base64.b64decode(encoded)
                    image = Image.open(io.BytesIO(image_data))
                elif os.path.exists(image_input):
                    image = Image.open(image_input)
                else:
                    raise ValueError("Invalid image input")
                    
            elif isinstance(image_input, Image.Image):
                image = image_input
                
            elif isinstance(image_input, np.ndarray):
                if len(image_input.shape) == 3 and image_input.shape[2] == 3:
                    image_input = cv2.cvtColor(image_input, cv2.COLOR_BGR2RGB)
                image = Image.fromarray(image_input)
            else:
                raise ValueError("Unsupported image type")
            
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            max_size = 1024
            if max(image.size) > max_size:
                image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
            return image
            
        except Exception as e:
            raise Exception(f"Image preprocessing failed: {e}")

    def create_analysis_prompt(self, analysis_type="full", extracted_text=""):
        if analysis_type == "ocr":
            return """Please extract all visible text from this image. 
Return only the text content you can see, preserving the layout and formatting as much as possible.
If no text is visible, return 'NO_TEXT_FOUND'."""

        elif analysis_type == "full":
            relevant_policy = self.policy_content[:1500]
            
            if self.policy_checker and extracted_text:
                try:
                    print("Using PolicyComplianceChecker for relevant policy extraction...")
                    relevant_policy = self.policy_checker.extract_relevant_policy_sections(extracted_text)
                    print("Advanced policy sections extracted")
                except Exception as e:
                    print(f"Policy extraction failed, using basic policy: {e}")
                    relevant_policy = self.policy_content[:1500]
            
            return f"""You are an expert advertisement compliance analyzer. Analyze this image for ACTUAL policy violations only.

RELEVANT POLICY GUIDELINES:
{relevant_policy}

CRITICAL INSTRUCTIONS FOR ADVERTISEMENT ANALYSIS:
===============================================

THIS IS ADVERTISING CONTENT ANALYSIS:
- Promotional content and product branding are EXPECTED and NORMAL
- ONLY flag ACTUAL violations, NOT routine compliance confirmations  
- DO NOT create violations for things that are correctly done
- Family-friendly product ads with children are typically APPROPRIATE and COMPLIANT
- Standard brand logos and product promotion are EXPECTED and NORMAL
- Gift-giving and family celebration scenes are APPROPRIATE for consumer products

LEGITIMATE ADVERTISEMENTS (Should be marked COMPLIANT with low risk scores):
- Food products (Cadbury, chocolates, snacks, beverages) advertised to families
- Consumer goods with appropriate branding and family targeting  
- Family-friendly content featuring children in appropriate contexts
- Standard product demonstrations and marketing scenes
- Normal promotional language and celebratory branding
- Gift-giving scenarios for consumer products (birthdays, celebrations)
- Family bonding moments around appropriate products

THESE ARE NOT VIOLATIONS (Do not flag these):
- Children present in family-appropriate product advertisements
- Parents and children interacting with appropriate consumer products
- Celebration themes (birthdays, festivals) with appropriate products
- Gift-giving with consumer products like chocolates, snacks
- Family dining or sharing food products
- Age-appropriate product targeting (children with children's products, families with family products)
- Happy family moments featuring legitimate consumer goods

ACTUAL VIOLATIONS TO DETECT (Only flag if genuinely harmful):

1. PROHIBITED CONTENT:
   - Actual adult/sexual content or nudity 
   - Real violence or genuinely dangerous activities
   - Illegal substances promoted inappropriately
   - Explicit gambling content targeting minors

2. FALSE/MISLEADING CLAIMS:
   - Unsubstantiated medical/health claims about products
   - Deceptive before/after imagery
   - False product benefits or fake testimonials

3. INAPPROPRIATE TARGETING:
   - Age-restricted products (alcohol, tobacco, gambling) targeting children
   - Adult products marketed to minors
   - Genuinely harmful targeting practices

4. REGULATORY NON-COMPLIANCE:
   - Missing required disclaimers on health/financial/pharmaceutical products
   - Counterfeit product sales
   - Clear trademark infringement

DO NOT FLAG AS VIOLATIONS (These are normal advertising practices):
- "No adult content detected" (This means the ad is APPROPRIATE)
- "Family-friendly content" (This is GOOD for consumer ads)  
- "Product promotion detected" (This is THE PURPOSE of advertisements)
- "Children present in advertisement" (APPROPRIATE for family products)
- "Gift-giving scenario" (NORMAL for celebratory products)
- "Targeting families/children with appropriate products" (STANDARD practice)
- Normal branding, logos, and promotional elements

ANALYSIS APPROACH FOR CONSUMER PRODUCT ADVERTISEMENTS:
- Cadbury/chocolate advertisements with families: COMPLIANT (risk_score: 0.1-0.2)
- Food products shown in family contexts: COMPLIANT (risk_score: 0.1-0.2)  
- Children appropriately featured with age-appropriate products: COMPLIANT
- Gift-giving with consumer products: COMPLIANT
- Empty violations array = compliant legitimate advertisement
- High risk scores (0.7+) ONLY for genuinely harmful violations

For legitimate consumer product advertisements like Cadbury Celebrations:
- Mark compliant: true
- Set risk_score: 0.1-0.2 (very low risk)
- Leave violations array EMPTY
- Summary: "Legitimate consumer product advertisement - fully compliant"

Return analysis in JSON format:

{{
  "visual_analysis": {{
    "scene_description": "description of scene",
    "detected_objects": ["objects", "present"],
    "people_present": true/false,
    "text_visible": true/false,
    "content_category": "product_promotion/service_ad/health_warning/other",
    "promotional_intent": "promotion/anti_promotion/educational",
    "campaign_type": "product_ad/service_ad/health_campaign/other"
  }},
  "extracted_text": "{extracted_text}",
  "safety_assessment": {{
    "adult_content_detected": false,
    "violence_detected": false,
    "inappropriate_content": false,
    "child_safety_concern": false,
    "safety_score": 0.0
  }},
  "policy_violations": [
    // LEAVE EMPTY for legitimate consumer product advertisements without genuine violations
    // ONLY add entries for actual harmful policy violations
  ],
  "compliance_assessment": {{
    "compliant": true,
    "risk_score": 0.1,
    "summary": "Legitimate consumer product advertisement - fully compliant with advertising policies"
  }},
  "recommendations": [
    // LEAVE EMPTY for compliant consumer product advertisements
    // ONLY provide recommendations for genuine violations
  ]
}}

MANDATORY SETTINGS FOR FOOD/CONSUMER PRODUCT ADS (Cadbury, snacks, family products):
- compliant: true (unless genuinely harmful content detected)
- risk_score: 0.1-0.2 (low risk for legitimate consumer ads)
- violations: [] (empty array for compliant ads)
- summary: "Legitimate consumer product advertisement - fully compliant"
- recommendations: [] (empty for compliant ads)

Return ONLY the JSON response."""

    def analyze_image_with_qwen(self, image: Image.Image) -> Dict[str, Any]:
        try:
            if self.deployment_mode in ["hf_api", "hf_serverless"]:
                return self._analyze_with_hf_api(image)
            else:
                return self._analyze_with_local_model(image)
                
        except Exception as e:
            print(f"Qwen2-VL analysis failed: {e}")
            return self.create_error_response(str(e))
    
    def _analyze_with_hf_api(self, image: Image.Image) -> Dict[str, Any]:
        try:
            extracted_text = ""
            if self.policy_checker:
                print("Extracting text from image via HF API...")
                try:
                    ocr_prompt = self.create_analysis_prompt("ocr")
                    ocr_response = self.query_huggingface_api(image, ocr_prompt)
                    
                    if ocr_response.strip() and ocr_response.strip() != "NO_TEXT_FOUND":
                        extracted_text = ocr_response.strip()
                        print(f"Extracted text: {extracted_text[:100]}...")
                    
                except Exception as e:
                    print(f"OCR extraction failed: {e}")
            
            print("Analyzing with Qwen2-VL via HF API...")
            full_prompt = self.create_analysis_prompt("full", extracted_text)
            
            response = self.query_huggingface_api(image, full_prompt)
            
            return self.parse_analysis_response(response)
            
        except Exception as e:
            print(f"HF API analysis failed: {e}")
            return self.create_error_response(f"HF API analysis failed: {e}")
    
    def _analyze_with_local_model(self, image: Image.Image) -> Dict[str, Any]:
        try:
            if self.model is None:
                raise Exception("Model not loaded. Call initialize() first.")
            
            extracted_text = ""
            if self.policy_checker:
                print("Extracting text from image for policy analysis...")
                try:
                    ocr_prompt = self.create_analysis_prompt("ocr")
                    
                    ocr_messages = [
                        {
                            "role": "user",
                            "content": [
                                {"type": "image", "image": image},
                                {"type": "text", "text": ocr_prompt}
                            ]
                        }
                    ]
                    
                    text = self.processor.apply_chat_template(
                        ocr_messages, tokenize=False, add_generation_prompt=True
                    )
                    
                    image_inputs, video_inputs = process_vision_info(ocr_messages)
                    
                    inputs = self.processor(
                        text=[text],
                        images=image_inputs,
                        videos=video_inputs,
                        padding=True,
                        return_tensors="pt"
                    )
                    
                    inputs = inputs.to(self.device)
                    
                    with torch.no_grad():
                        generated_ids = self.model.generate(
                            **inputs,
                            max_new_tokens=512,
                            temperature=0.1,
                            do_sample=True
                        )
                    
                    generated_ids_trimmed = [
                        out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
                    ]
                    
                    ocr_response = self.processor.batch_decode(
                        generated_ids_trimmed, 
                        skip_special_tokens=True, 
                        clean_up_tokenization_spaces=False
                    )[0]
                    
                    if ocr_response.strip() and ocr_response.strip() != "NO_TEXT_FOUND":
                        extracted_text = ocr_response.strip()
                        print(f"Extracted text: {extracted_text[:100]}...")
                    
                except Exception as e:
                    print(f"OCR extraction failed: {e}")
            
            print("Analyzing with local Qwen2-VL model...")
            prompt = self.create_analysis_prompt("full", extracted_text)
            
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "image": image},
                        {"type": "text", "text": prompt}
                    ]
                }
            ]
            
            text = self.processor.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )
            
            image_inputs, video_inputs = process_vision_info(messages)
            
            inputs = self.processor(
                text=[text],
                images=image_inputs,
                videos=video_inputs,
                padding=True,
                return_tensors="pt"
            )
            
            inputs = inputs.to(self.device)
            
            with torch.no_grad():
                generated_ids = self.model.generate(
                    **inputs,
                    max_new_tokens=2048,
                    temperature=0.1,
                    do_sample=True
                )
            
            generated_ids_trimmed = [
                out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
            ]
            
            response = self.processor.batch_decode(
                generated_ids_trimmed, 
                skip_special_tokens=True, 
                clean_up_tokenization_spaces=False
            )[0]
            
            return self.parse_analysis_response(response)
            
        except Exception as e:
            print(f"Local model analysis failed: {e}")
            return self.create_error_response(f"Local model analysis failed: {e}")

    def parse_analysis_response(self, response: str) -> Dict[str, Any]:
        try:
            response_clean = response.strip()
            
            if "```json" in response_clean:
                json_part = response_clean.split("```json")[1].split("```")[0].strip()
            elif "```" in response_clean:
                json_part = response_clean.split("```")[1].split("```")[0].strip()
            elif response_clean.startswith('{') and response_clean.endswith('}'):
                json_part = response_clean
            else:
                start = response_clean.find('{')
                end = response_clean.rfind('}') + 1
                if start != -1 and end > start:
                    json_part = response_clean[start:end]
                else:
                    raise ValueError("No valid JSON found in response")
            
            result = json.loads(json_part)
            
            required_fields = ['visual_analysis', 'policy_violations', 'compliance_assessment']
            if not all(field in result for field in required_fields):
                raise ValueError("Missing required fields in response")
            
            formatted_result = {
                "image_compliance": {
                    "compliant": result.get('compliance_assessment', {}).get('compliant', False),
                    "violations": result.get('policy_violations', []),
                    "risk_score": result.get('compliance_assessment', {}).get('risk_score', 0.5),
                    "summary": result.get('compliance_assessment', {}).get('summary', 'Analysis completed'),
                    "extracted_text": result.get('extracted_text', ''),
                    "visual_analysis": result.get('visual_analysis', {}),
                    "safety_assessment": result.get('safety_assessment', {}),
                    "recommendations": result.get('recommendations', []),
                    "analysis_method": "qwen2vl_api" if self.deployment_mode in ["hf_api", "hf_serverless"] else "qwen2vl_local"
                }
            }
            
            return formatted_result
            
        except Exception as e:
            print(f"Response parsing error: {e}")
            return self.create_error_response(f"Response parsing failed: {e}")

    def create_error_response(self, error_msg: str) -> Dict[str, Any]:
        return {
            "image_compliance": {
                "compliant": False,
                "violations": [{
                    "policy_section": "System Error",
                    "violation_type": "technical",
                    "description": f"Analysis failed: {error_msg}",
                    "confidence": 0.5,
                    "evidence": "System error occurred"
                }],
                "risk_score": 0.8,
                "summary": "Analysis error - manual review required",
                "extracted_text": "",
                "analysis_method": "error"
            }
        }

    def check_image_compliance(self, image_input: Union[str, Image.Image, np.ndarray]) -> Dict[str, Any]:
        try:
            print("Starting image compliance analysis...")
            
            image = self.preprocess_image(image_input)
            print("Image preprocessed")
            
            print("Analyzing with Qwen2-VL...")
            result = self.analyze_image_with_qwen(image)
            
            print("Image compliance analysis complete!")
            return result
            
        except Exception as e:
            print(f"Compliance check failed: {e}")
            return self.create_error_response(str(e))

    def initialize(self):
        print("Initializing Image Compliance Checker...")
        
        try:
            self.load_policy()
            self.load_qwen_model()
            print("Image Compliance Checker ready!")
            
        except Exception as e:
            print(f"Initialization failed: {e}")
            raise