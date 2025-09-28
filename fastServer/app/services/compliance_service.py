import os
import tempfile
from typing import Dict, Any, List, Optional
from app.helpers.media_downloader import MediaDownloader
from app.helpers.policy_compliance_checker import PolicyComplianceChecker
from app.helpers.image_compliance_checker import ImageComplianceChecker
from app.helpers.audio_compliance_checker import AudioComplianceChecker
from app.helpers.video_compliance_checker import VideoComplianceChecker
from app.models.schemas import ComplianceCheckRequest, PCCAnalysisRequest, GenerateReportRequest
from app.helpers.llm_client import call_llm_gemini
import requests
from urllib.parse import urlparse
import json
from datetime import datetime

class ComplianceService:
    def __init__(self):
        self.policy_checker = None
        self.image_checker = None
        self.audio_checker = None
        self.video_checker = None
        self.media_downloader = MediaDownloader()
        self.initialize_checkers()
    
    def initialize_checkers(self):
        try:
            print("Initializing compliance checkers...")
            
            # Initialize PolicyComplianceChecker
            self.policy_checker = PolicyComplianceChecker()
            self.policy_checker.initialize()
            print("PolicyComplianceChecker initialized")
            
            # Initialize ImageComplianceChecker
            self.image_checker = ImageComplianceChecker(
                policy_checker=self.policy_checker,
                deployment_mode="hf_api",
                hf_api_key=os.getenv('HUGGINGFACE_API_KEY')
            )
            self.image_checker.initialize()
            print("ImageComplianceChecker initialized")
            
            # Initialize AudioComplianceChecker
            if os.getenv('GROQ_API_KEY'):
                self.audio_checker = AudioComplianceChecker(
                    policy_checker=self.policy_checker,
                    groq_api_key=os.getenv('GROQ_API_KEY')
                )
                print("AudioComplianceChecker initialized")
            else:
                print("GROQ_API_KEY not found - audio analysis disabled")
            
            # Initialize VideoComplianceChecker
            self.video_checker = VideoComplianceChecker(
                image_checker=self.image_checker,
                audio_checker=self.audio_checker,
                max_frames_per_video=3,
                sampling_strategy="adaptive",
                include_audio_analysis=bool(self.audio_checker)
            )
            print("VideoComplianceChecker initialized")
            
        except Exception as e:
            print(f"Error initializing compliance checkers: {e}")
            raise Exception(f"Failed to initialize compliance system: {e}")
    
    def validate_url(self, url: str) -> bool:
        """Validate if URL is accessible"""
        try:
            parsed = urlparse(url)
            return bool(parsed.netloc and parsed.scheme in ['http', 'https'])
        except:
            return False
    
    def analyze_text(self, text: str) -> Dict[str, Any]:
        """Analyze text content for compliance"""
        try:
            if not text or not text.strip():
                return {
                    "compliant": True,
                    "violations": [],
                    "risk_score": 0.0,
                    "summary": "No text content provided",
                    "processed_content": "",
                    "analysis_method": "no_content"
                }
            
            print(f"Analyzing text: {text[:100]}...")
            result = self.policy_checker.check_compliance(text)
            print("Text analysis complete")
            return result
            
        except Exception as e:
            print(f"Text analysis failed: {e}")
            return {
                "compliant": False,
                "violations": [{
                    "policy_section": "System Error",
                    "violation": f"Text analysis failed: {str(e)}",
                    "confidence": 0.5,
                    "evidence": text[:100] if text else "No text"
                }],
                "risk_score": 0.8,
                "summary": "Text analysis error - manual review required",
                "processed_content": text[:200] if text else "",
                "analysis_method": "error"
            }
    
    def analyze_images(self, image_urls: List[str]) -> List[Dict[str, Any]]:
        """Analyze multiple images for compliance"""
        results = []
        
        if not image_urls:
            return results
        
        try:
            print(f"Downloading {len(image_urls)} images...")
            local_image_paths = self.media_downloader.download_images(image_urls)
            
            for i, image_path in enumerate(local_image_paths):
                try:
                    print(f"Analyzing image {i+1}/{len(local_image_paths)}")
                    result = self.image_checker.check_image_compliance(image_path)
                    result['source_url'] = image_urls[i] if i < len(image_urls) else "unknown"
                    results.append(result)
                except Exception as e:
                    print(f"Error analyzing image {image_path}: {e}")
                    error_result = {
                        "image_compliance": {
                            "compliant": False,
                            "violations": [{
                                "policy_section": "System Error",
                                "violation_type": "technical",
                                "description": f"Image analysis failed: {str(e)}",
                                "confidence": 0.5,
                                "evidence": "Processing error"
                            }],
                            "risk_score": 0.8,
                            "summary": "Image analysis error",
                            "analysis_method": "error"
                        },
                        "source_url": image_urls[i] if i < len(image_urls) else "unknown"
                    }
                    results.append(error_result)
            
            print(f"Image analysis complete: {len(results)} results")
            return results
            
        except Exception as e:
            print(f"Image analysis batch failed: {e}")
            return [{
                "image_compliance": {
                    "compliant": False,
                    "violations": [{
                        "policy_section": "System Error",
                        "violation_type": "technical",
                        "description": f"Image batch processing failed: {str(e)}",
                        "confidence": 0.5,
                        "evidence": "Batch processing error"
                    }],
                    "risk_score": 0.8,
                    "summary": "Image batch processing error",
                    "analysis_method": "error"
                }
            }]
    
    def analyze_audios(self, audio_urls: List[str]) -> List[Dict[str, Any]]:
        """Analyze multiple audio files for compliance"""
        results = []
        
        if not audio_urls or not self.audio_checker:
            return results
        
        try:
            print(f"Downloading {len(audio_urls)} audio files...")
            local_audio_paths = self.media_downloader.download_audios(audio_urls)
            
            for i, audio_path in enumerate(local_audio_paths):
                try:
                    print(f"Analyzing audio {i+1}/{len(local_audio_paths)}")
                    result = self.audio_checker.check_audio_compliance(audio_path)
                    result['source_url'] = audio_urls[i] if i < len(audio_urls) else "unknown"
                    results.append(result)
                except Exception as e:
                    print(f"Error analyzing audio {audio_path}: {e}")
                    error_result = {
                        "compliant": False,
                        "violations": [{
                            "policy_section": "System Error",
                            "violation_type": "technical",
                            "description": f"Audio analysis failed: {str(e)}",
                            "confidence": 0.5,
                            "evidence": f"File: {audio_path}"
                        }],
                        "risk_score": 0.8,
                        "summary": "Audio analysis error",
                        "source_url": audio_urls[i] if i < len(audio_urls) else "unknown"
                    }
                    results.append(error_result)
            
            print(f"Audio analysis complete: {len(results)} results")
            return results
            
        except Exception as e:
            print(f"Audio analysis batch failed: {e}")
            return [{
                "compliant": False,
                "violations": [{
                    "policy_section": "System Error",
                    "violation_type": "technical",
                    "description": f"Audio batch processing failed: {str(e)}",
                    "confidence": 0.5,
                    "evidence": "Batch processing error"
                }],
                "risk_score": 0.8,
                "summary": "Audio batch processing error"
            }]
    
    def analyze_videos(self, video_urls: List[str]) -> List[Dict[str, Any]]:
        """Analyze multiple videos for compliance"""
        results = []
        
        if not video_urls:
            return results
        
        try:
            print(f"Downloading {len(video_urls)} videos...")
            local_video_paths = self.media_downloader.download_videos(video_urls)
            
            for i, video_path in enumerate(local_video_paths):
                try:
                    print(f"Analyzing video {i+1}/{len(local_video_paths)}")
                    result = self.video_checker.check_video_compliance(video_path)
                    result['source_url'] = video_urls[i] if i < len(video_urls) else "unknown"
                    results.append(result)
                except Exception as e:
                    print(f"Error analyzing video {video_path}: {e}")
                    error_result = {
                        "video_metadata": {"error": str(e)},
                        "compliance_assessment": {
                            "video_compliant": False,
                            "compliance_score": 0.0,
                            "risk_score": 1.0,
                            "error": str(e)
                        },
                        "violation_summary": {
                            "total_violations": 1,
                            "critical_violations": 1
                        },
                        "source_url": video_urls[i] if i < len(video_urls) else "unknown"
                    }
                    results.append(error_result)
            
            print(f"Video analysis complete: {len(results)} results")
            return results
            
        except Exception as e:
            print(f"Video analysis batch failed: {e}")
            return [{
                "video_metadata": {"error": str(e)},
                "compliance_assessment": {
                    "video_compliant": False,
                    "compliance_score": 0.0,
                    "risk_score": 1.0,
                    "error": f"Video batch processing failed: {str(e)}"
                },
                "violation_summary": {
                    "total_violations": 1,
                    "critical_violations": 1
                }
            }]
    
    def analyze_link(self, url: str) -> Dict[str, Any]:
        """Analyze landing page URL for compliance"""
        try:
            if not url or not self.validate_url(url):
                return {
                    "compliant": True,
                    "violations": [],
                    "risk_score": 0.0,
                    "summary": "No valid URL provided or URL validation failed",
                    "url": url,
                    "analysis_method": "url_validation"
                }
            
            print(f"Analyzing landing URL: {url}")
            
            # Basic URL analysis (you can enhance this to fetch and analyze page content)
            parsed_url = urlparse(url)
            
            # Check for suspicious patterns in URL
            suspicious_patterns = ['adult', 'casino', 'gambling', 'pharma', 'pills']
            violations = []
            
            for pattern in suspicious_patterns:
                if pattern in url.lower():
                    violations.append({
                        "policy_section": "Prohibited Content",
                        "violation": f"URL contains suspicious pattern: {pattern}",
                        "confidence": 0.7,
                        "evidence": url
                    })
            
            risk_score = len(violations) * 0.3
            compliant = len(violations) == 0
            
            result = {
                "compliant": compliant,
                "violations": violations,
                "risk_score": min(risk_score, 1.0),
                "summary": f"URL analysis completed - {'compliant' if compliant else 'potential issues found'}",
                "url": url,
                "domain": parsed_url.netloc,
                "analysis_method": "url_pattern_analysis"
            }
            
            print("Link analysis complete")
            return result
            
        except Exception as e:
            print(f"Link analysis failed: {e}")
            return {
                "compliant": False,
                "violations": [{
                    "policy_section": "System Error",
                    "violation": f"URL analysis failed: {str(e)}",
                    "confidence": 0.5,
                    "evidence": url
                }],
                "risk_score": 0.8,
                "summary": "URL analysis error",
                "url": url,
                "analysis_method": "error"
            }
    
    def check_comprehensive_compliance(self, request: ComplianceCheckRequest) -> Dict[str, Any]:
        """Main comprehensive compliance check"""
        try:
            print("Starting comprehensive compliance analysis...")
            
            # Extract text from ad_details
            ad_text = f"{request.ad_details.title} {request.ad_details.description}".strip()
            if isinstance(request.ad_details.target_age_group, list):
                if request.ad_details.target_age_group:
                    min_age = min(request.ad_details.target_age_group)
                    max_age = max(request.ad_details.target_age_group)
                    request.ad_details.target_age_group = {"min": min_age, "max": max_age}
                else:
                    request.ad_details.target_age_group = {"min": 5, "max": 65}
            
            # Initialize results
            results = {
                "text_op": None,
                "image_op": None,
                "audio_op": None,
                "link_op": None,
                "video_op": None,
                "processing_summary": {
                    "user_data": request.user_data.dict(),
                    "ad_details": request.ad_details.dict(),
                    "total_items_processed": 0,
                    "processing_errors": []
                }
            }
            
            items_processed = 0
            
            # Text Analysis
            if ad_text:
                try:
                    print("Processing text content...")
                    results["text_op"] = self.analyze_text(ad_text)
                    items_processed += 1
                except Exception as e:
                    print(f"Text analysis error: {e}")
                    results["processing_summary"]["processing_errors"].append(f"Text analysis: {str(e)}")
            
            # Image Analysis
            if request.image_links:
                try:
                    print(f"Processing {len(request.image_links)} images...")
                    image_results = self.analyze_images(request.image_links)
                    results["image_op"] = {
                        "total_images": len(request.image_links),
                        "analyzed_images": len(image_results),
                        "results": image_results
                    }
                    items_processed += len(image_results)
                except Exception as e:
                    print(f"Image analysis error: {e}")
                    results["processing_summary"]["processing_errors"].append(f"Image analysis: {str(e)}")
            
            # Audio Analysis
            if request.audio_links:
                try:
                    print(f"Processing {len(request.audio_links)} audio files...")
                    audio_results = self.analyze_audios(request.audio_links)
                    results["audio_op"] = {
                        "total_audios": len(request.audio_links),
                        "analyzed_audios": len(audio_results),
                        "results": audio_results
                    }
                    items_processed += len(audio_results)
                except Exception as e:
                    print(f"Audio analysis error: {e}")
                    results["processing_summary"]["processing_errors"].append(f"Audio analysis: {str(e)}")
            
            # Video Analysis
            if request.video_links:
                try:
                    print(f"Processing {len(request.video_links)} videos...")
                    video_results = self.analyze_videos(request.video_links)
                    results["video_op"] = {
                        "total_videos": len(request.video_links),
                        "analyzed_videos": len(video_results),
                        "results": video_results
                    }
                    items_processed += len(video_results)
                except Exception as e:
                    print(f"Video analysis error: {e}")
                    results["processing_summary"]["processing_errors"].append(f"Video analysis: {str(e)}")
            
            # Link Analysis
            if request.ad_details.landing_url:
                try:
                    print("Processing landing URL...")
                    results["link_op"] = self.analyze_link(request.ad_details.landing_url)
                    items_processed += 1
                except Exception as e:
                    print(f"Link analysis error: {e}")
                    results["processing_summary"]["processing_errors"].append(f"Link analysis: {str(e)}")
            
            results["processing_summary"]["total_items_processed"] = items_processed
            
            print(f"Comprehensive compliance analysis complete!")
            print(f"Total items processed: {items_processed}")

            try:
                # Extract modality results
                modality_results = {
                    "text": self.extract_modality_result(results.get("text_op")),
                    "image": self.extract_modality_result(results.get("image_op", {}).get("results", [{}])[0] if results.get("image_op") else None),
                    "audio": self.extract_modality_result(results.get("audio_op", {}).get("results", [{}])[0] if results.get("audio_op") else None),
                    "video": self.extract_modality_result(results.get("video_op", {}).get("results", [{}])[0] if results.get("video_op") else None),
                    "link": self.extract_modality_result(results.get("link_op"))
                }
                
                # Call LLM for final analysis
                llm_analysis = self.call_llm_for_compliance(results, modality_results)
                
                # Calculate risk score
                risk_score = max(m["risk_score"] for m in modality_results.values())
                
                # Generate queries if clarification needed
                queries_for_call = []
                make_call = False
                if llm_analysis["verdict"] == "clarification_needed":
                    queries_for_call = self.generate_queries_for_call(results, modality_results)
                    make_call = True
                
                # Add compliance results to response
                results["compliance_results"] = {
                    "advertisement_id": request.ad_details.advertisement_id,
                    "verdict": llm_analysis["verdict"],
                    "reason": llm_analysis["reason"], 
                    "risk_score": llm_analysis.get("overall_risk_score", risk_score),
                    "modalities": modality_results,
                    "queries_for_call": queries_for_call,
                    "make_call": make_call,
                    "modalities_summary": llm_analysis.get("modalities_summary", {})
                }
                
            except Exception as e:
                print(f"LLM analysis failed: {e}")
                results["compliance_results"] = {
                    "advertisement_id": request.ad_details.advertisement_id,
                    "verdict": "manual_review",
                    "reason": "Error processing compliance results",
                    "risk_score": 0.5,
                    "modalities": {},
                    "queries_for_call": [],
                    "make_call": False
                }
            
            # Cleanup downloaded files
            try:
                self.media_downloader.cleanup()
            except Exception as e:
                print(f"Cleanup error: {e}")
            
            return results
            
        except Exception as e:
            print(f"Comprehensive compliance check failed: {e}")
            return {
                "text_op": None,
                "image_op": None,
                "audio_op": None,
                "link_op": None,
                "video_op": None,
                "processing_summary": {
                    "total_items_processed": 0,
                    "processing_errors": [f"System error: {str(e)}"],
                    "error": str(e)
                }
            }
        

    def extract_modality_result(self, modality_output):
        if not modality_output:
            return {
                "compliant": True,
                "violations": [],
                "summary": "",
                "risk_score": 0.0
            }
        
        violations = modality_output.get('violations', [])
        return {
            "compliant": len(violations) == 0,
            "violations": [
                {
                    "policy_section": v.get('policy_section', 'Unknown'),
                    "violation": v.get('violation', ''),
                    "confidence": v.get('confidence', 0.0),
                    "evidence": v.get('evidence', '')
                } for v in violations
            ],
            "summary": modality_output.get('summary', ''),
            "risk_score": modality_output.get('risk_score', 0.0)
        }

    def call_llm_for_compliance(self, raw_output, modality_results):
        prompt = f"""
    You are an advertisement compliance expert. Analyze the following compliance check results and provide a final normalized decision JSON.

    Raw Output: {json.dumps(raw_output, default=str, indent=2)}
    Modality Results: {json.dumps(modality_results, default=str, indent=2)}
    If you dont understand anything or if there are inconsistencies, flag for clarification_needed.

    Respond ONLY with valid JSON in this exact format:
    {{
    "verdict": "pass" | "fail" | "manual_review" | "clarification_needed",
    "reason": "One line summary explaining the decision",
    "compatibility_score": number (10 to 100),
    "overall_risk_score": number,
    "modalities_summary": {{
        "text": "short human-readable summary of text modality (max 1 line)",
        "image": "short human-readable summary of image modality",
        "audio": "short human-readable summary of audio modality", 
        "video": "short human-readable summary of video modality",
        "link": "short human-readable summary of link modality"
    }}
    }}

    Rules:
    - If all modalities are compliant => verdict = "pass"
    - If clear high-risk violations exist => verdict = "fail"
    - If ambiguous edge cases => verdict = "clarification_needed"
    - If errors or unusual inconsistencies => verdict = "manual_review"
    """
        
        try:
            response = call_llm_gemini(prompt, "You are an advertisement compliance expert. Always respond with valid JSON only.")
            return json.loads(response)
        except Exception as e:
            print(f"LLM compliance analysis failed: {e}")
            
            # Fallback logic
            has_violations = any(not m["compliant"] for m in modality_results.values())
            max_risk = max(m["risk_score"] for m in modality_results.values())
            
            if not has_violations:
                verdict = "pass"
                reason = "All content complies with advertising policies"
            elif max_risk > 0.7:
                verdict = "fail" 
                reason = "Significant policy violations detected"
            else:
                verdict = "manual_review"
                reason = "Error in automated analysis - manual review required"
                
            return {
                "verdict": verdict,
                "reason": reason,
                "overall_risk_score": max_risk,
                "compatibility_score": int((1 - max_risk) * 90) + 10,
                "modalities_summary": {
                    "text": "Analysis completed",
                    "image": "Review completed", 
                    "audio": "Processing finished",
                    "video": "Analysis done",
                    "link": "Check completed"
                }
            }

    def generate_queries_for_call(self, raw_output, modality_results):
        prompt = f"""
    Generate 3-5 strategic questions for advertiser clarification call based on compliance analysis.

    Modality Results: {json.dumps(modality_results, default=str, indent=2)}
    Raw Output From ML model: {json.dumps(raw_output, default=str, indent=2)}

    Respond ONLY with valid JSON in this exact format:
    [
    {{
        "question": "Specific question to ask the advertiser",
        "reason": "Why this question is important for compliance assessment"
    }}
    ]

    Requirements:
    - Generate 3-5 questions maximum
    - Questions should be professional and non-accusatory
    - Focus on gathering context and intent
    - Prioritize questions about the highest risk content found
    """
        
        try:
            response = call_llm_gemini(prompt, "You are an expert at conducting compliance clarification calls.", 800)
            queries = json.loads(response)
            return queries[:5]
        except Exception as e:
            print(f"Query generation failed: {e}")
            return [
                {
                    "question": "Can you explain the main message and target audience for this advertisement?",
                    "reason": "Understanding intent and audience helps assess compliance context"
                },
                {
                    "question": "What specific claims are you making about your product or service?", 
                    "reason": "Verifying accuracy and substantiation of advertising claims"
                }
            ]
        
    def analyze_pcc_call(self, request: PCCAnalysisRequest) -> Dict[str, Any]:
            """
            Analyze post-call compliance based on call transcript and compliance results
            """
            try:
                print("Starting PCC analysis...")
                
                # Prepare data for LLM analysis
                analysis_data = {
                    "compliance_results": request.compliance_results or {},
                    "transcript": request.transcript or {}
                }
                
                # Call LLM for PCC analysis
                pcc_result = self.call_llm_for_pcc_analysis(analysis_data)
                
                print("PCC analysis complete")
                return pcc_result
                
            except Exception as e:
                print(f"PCC analysis failed: {e}")
                return {
                    "pcc_verdict": "manual_review",
                    "pcc_reason": f"Analysis failed: {str(e)}",
                    "confidence_score": 0.0,
                    "compliance_score": 0,
                    "call_insights": {
                        "clarifications_received": [],
                        "concerns_addressed": False,
                        "additional_flags": ["Analysis error"]
                    },
                    "confidence_while_answering": 0,
                    "truth_level": 0,
                    "recommendation": "further_review",
                    "analysis_timestamp": datetime.now().isoformat()
                }

    def generate_comprehensive_report(self, request: GenerateReportRequest) -> Dict[str, Any]:
        """
        Generate comprehensive compliance report
        """
        try:
            print("Starting comprehensive report generation...")
            
            # Prepare data for report generation
            report_data = {
                "compliance_results": request.compliance_results,
                "raw_output": request.raw_output,
                "pcc_analysis": request.pcc_analysis,
                "user_data": request.user_data,
                "ad_details": request.ad_details
            }
            
            # Call LLM for report generation
            report_result = self.call_llm_for_report_generation(report_data)
            
            print("Comprehensive report generation complete")
            return report_result
            
        except Exception as e:
            print(f"Report generation failed: {e}")
            return {
                "executive_summary": {
                    "overall_status": "Error",
                    "risk_level": "High",
                    "recommendation": "Manual review required",
                    "error": str(e)
                },
                "detailed_analysis": {
                    "error": f"Report generation failed: {str(e)}"
                },
                "recommendations": ["Manual review required due to system error"],
                "compliance_status": "error",
                "generated_at": datetime.now().isoformat()
            }

    def call_llm_for_pcc_analysis(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call LLM for post-call compliance analysis
        """
        transcript_data = analysis_data.get("transcript", {})
        
        prompt = f"""
You are an expert post-call compliance analyst. Analyze the following call transcript and compliance results to determine the final compliance verdict.

Compliance Results: {json.dumps(analysis_data.get("compliance_results", {}), default=str, indent=2)}
Call Transcript Data: {json.dumps(transcript_data, default=str, indent=2)}

Based on the call transcript and original compliance results, provide a comprehensive post-call analysis.

Consider:
1. Did the call clarify any ambiguous compliance issues?
2. Were advertiser explanations satisfactory?
3. Did new information emerge that changes the compliance assessment?
4. How confident and truthful were the advertiser's responses?
5. Are there any red flags or concerns from the conversation?

Respond ONLY with valid JSON in this exact format:
{{
    "pcc_verdict": "pass" | "fail" | "manual_review",
    "pcc_reason": "Detailed analysis reason based on call insights and original compliance results",
    "confidence_score": 0.0-1.0,
    "compliance_score": 0-100,
    "call_insights": {{
        "clarifications_received": ["specific clarification 1", "specific clarification 2"],
        "concerns_addressed": true/false,
        "additional_flags": ["flag1", "flag2"] or []
    }},
    "confidence_while_answering": 0-100,
    "truth_level": 0-100,
    "recommendation": "approve" | "reject" | "further_review",
    "analysis_timestamp": "{datetime.now().isoformat()}"
}}

Rules:
- If call resolved compliance issues satisfactorily => "pass"
- If call revealed more concerns or unsatisfactory answers => "fail"  
- If inconclusive or need more information => "manual_review"
- Base confidence_score on how well the call addressed original concerns
- Rate truth_level based on consistency and believability of responses
- Rate confidence_while_answering based on how confidently the advertiser responded
"""
        
        try:
            response = call_llm_gemini(prompt, "You are an expert post-call compliance analyst. Always respond with valid JSON only.", 1500)
            return json.loads(response)
        except Exception as e:
            print(f"LLM PCC analysis failed: {e}")
            raise Exception(f"PCC analysis failed: {str(e)}")

    def call_llm_for_report_generation(self, report_data: Dict[str, Any]) -> Dict[str, Any]:
        pcc_analysis = report_data.get('pcc_analysis')
        has_call_analysis = pcc_analysis is not None
        
        if has_call_analysis:
            # CASE 1: WITH CALL ANALYSIS
            prompt = f"""
    You are an expert compliance report generator for post-call analysis.

    SCENARIO: A compliance call was conducted after initial automated analysis.

    Original Compliance Results: {json.dumps(report_data.get('compliance_results', {}), default=str)}
    Call Analysis Results: {json.dumps(pcc_analysis, default=str)}

    FOCUS: Show how the call changed or confirmed the original automated decision.
    - What failed in original analysis?
    - How did the call clarify or resolve issues?
    - Why did the verdict change (or stay the same)?
    - What specific insights from the call influenced the final decision?

    Original verdict: {report_data.get('compliance_results', {}).get('verdict', 'unknown')}
    Post-call verdict: {pcc_analysis.get('pcc_verdict', 'unknown')}
            """
        else:
            # CASE 2: NO CALL ANALYSIS  
            prompt = f"""
    You are an expert compliance report generator for automated analysis.

    SCENARIO: Direct automated compliance analysis without human call intervention.

    Compliance Results: {json.dumps(report_data.get('compliance_results', {}), default=str)}
    Raw Analysis Output: {json.dumps(report_data.get('raw_output', {}), default=str)}

    FOCUS: Comprehensive report based solely on automated analysis.
    - No call was conducted
    - Decision based on AI analysis only
    - Leave call-related fields empty but present
            """
        
        # COMMON SCHEMA - ADD TO BOTH PROMPTS
        prompt += f"""

    Respond ONLY with valid JSON in this exact format:
    {{
        "executive_summary": {{
            "overall_status": "Compliant" | "Non-Compliant" | "Requires Review",
            "risk_level": "Low" | "Medium" | "High", 
            "key_findings": ["finding1", "finding2"],
            "recommendation": "Brief executive recommendation",
            "compliance_percentage": 0-100,
            "call_conducted": {str(has_call_analysis).lower()},
            "final_decision_basis": "{"post_call_analysis" if has_call_analysis else "automated_analysis"}"
        }},
        "detailed_analysis": {{
            "original_compliance": {{
                "automated_verdict": "pass/fail/review",
                "key_violations": ["violation1", "violation2"],
                "risk_factors": ["factor1", "factor2"]
            }},
            "call_analysis": {{
                "call_verdict": "{"pass/fail/manual_review" if has_call_analysis else ""}",
                "clarifications_provided": [],
                "concerns_addressed": {str(pcc_analysis.get('call_insights', {}).get('concerns_addressed', False)).lower() if has_call_analysis else "false"},
                "confidence_level": {pcc_analysis.get('confidence_while_answering', 0) if has_call_analysis else 0},
                "truth_assessment": {pcc_analysis.get('truth_level', 0) if has_call_analysis else 0}
            }},
            "decision_reconciliation": {{
                "original_vs_final": "explanation",
                "key_changes": [],
                "reasoning": "detailed explanation"
            }}
        }},
        "recommendations": ["rec1", "rec2"],
        "compliance_status": "approved" | "rejected" | "pending_review", 
        "generated_at": "{datetime.now().isoformat()}"
    }}
    """
        
        try:
            response = call_llm_gemini(prompt, "You are an expert compliance report generator. Always respond with valid JSON only.", 2000)
            return json.loads(response)
        except Exception as e:
            print(f"LLM report generation failed: {e}")
            raise Exception(f"Report generation failed: {str(e)}")
        

