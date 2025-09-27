import os
import tempfile
from typing import Dict, Any, List, Optional
from app.helpers.media_downloader import MediaDownloader
from app.helpers.policy_compliance_checker import PolicyComplianceChecker
from app.helpers.image_compliance_checker import ImageComplianceChecker
from app.helpers.audio_compliance_checker import AudioComplianceChecker
from app.helpers.video_compliance_checker import VideoComplianceChecker
from app.models.schemas import ComplianceCheckRequest
import requests
from urllib.parse import urlparse

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
                max_frames_per_video=20,
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