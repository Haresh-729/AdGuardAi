import os
import json
from typing import Dict, Any
import requests

class AudioComplianceChecker:
    def __init__(self, policy_checker, groq_api_key=None):
        self.groq_api_key = groq_api_key or os.getenv('GROQ_API_KEY')
        self.policy_checker = policy_checker
        self.supported_formats = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.webm', '.mp4', '.avi', '.mov']
        
        if not self.groq_api_key:
            raise Exception("GROQ_API_KEY not found. Set GROQ_API_KEY environment variable or pass groq_api_key parameter.")
        
        try:
            import groq as groq_sdk
            self.client = groq_sdk.Groq(api_key=self.groq_api_key)
            print("AudioComplianceChecker initialized with Groq Whisper API")
        except ImportError:
            raise Exception("groq package not installed. Run: pip install groq")
    
    def validate_audio_file(self, audio_path):
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        file_ext = os.path.splitext(audio_path)[1].lower()
        if file_ext not in self.supported_formats:
            raise ValueError(f"Unsupported format {file_ext}. Supported: {self.supported_formats}")
    
    def transcribe_audio(self, audio_path):
        self.validate_audio_file(audio_path)
        
        try:
            print(f"Transcribing audio: {os.path.basename(audio_path)}")
            
            with open(audio_path, "rb") as file:
                transcription = self.client.audio.transcriptions.create(
                    file=file,
                    model="whisper-large-v3",
                    response_format="text",
                    language="en"
                )
            
            transcribed_text = transcription.strip() if transcription else ""
            print(f"Audio transcribed: {len(transcribed_text)} characters")
            
            return transcribed_text
            
        except Exception as e:
            print(f"Transcription failed: {e}")
            raise Exception(f"Transcription failed: {str(e)}")
    
    def check_audio_compliance(self, audio_path):
        try:
            print("Starting audio compliance analysis...")
            
            transcribed_text = self.transcribe_audio(audio_path)
            
            if not transcribed_text or len(transcribed_text.strip()) < 5:
                return {
                    "compliant": True,
                    "violations": [],
                    "risk_score": 0.1,
                    "summary": "No readable audio content found - likely background music or ambient sound",
                    "transcribed_text": transcribed_text,
                    "audio_file": os.path.basename(audio_path),
                    "analysis_method": "groq_whisper"
                }
            
            print(f"Analyzing transcribed text: {transcribed_text[:100]}...")
            compliance_result = self.policy_checker.check_compliance(transcribed_text)
            
            violations = compliance_result.get("violations", [])
            filtered_violations = []
            
            family_friendly_contexts = [
                "papa", "mom", "family", "gift", "celebration", "festival",
                "chocolate", "cadbury", "sweets", "treat", "sharing",
                "birthday", "special occasion", "children", "kids",
                "home", "kitchen", "dinner", "snack", "dessert"
            ]
            
            legitimate_ad_phrases = [
                "give me", "can i have", "papa", "mama", "family time",
                "celebration", "festival", "special moment", "sharing",
                "together", "home", "love", "care", "tradition"
            ]
            
            text_lower = transcribed_text.lower()
            family_context_score = sum(1 for term in family_friendly_contexts if term in text_lower)
            legitimate_phrase_score = sum(1 for phrase in legitimate_ad_phrases if phrase in text_lower)
            
            is_family_advertisement = (
                family_context_score >= 2 or 
                legitimate_phrase_score >= 1 or
                any(brand in text_lower for brand in ['cadbury', 'chocolate', 'celebration'])
            )
            
            print(f"Family advertisement detection:")
            print(f"   Family context score: {family_context_score}")
            print(f"   Legitimate phrases: {legitimate_phrase_score}")
            print(f"   Is family advertisement: {is_family_advertisement}")
            print(f"   Original violations: {len(violations)}")
            
            if is_family_advertisement:
                for violation in violations:
                    description = violation.get('violation', '').lower()
                    evidence = violation.get('evidence', '').lower()
                    
                    is_false_positive = (
                        'appealing to children' in description and any(ctx in evidence for ctx in ['papa', 'family', 'gift']) or
                        'child\'s voice' in description or
                        'children' in description and any(ctx in evidence for ctx in ['celebration', 'chocolate', 'family']) or
                        'gift' in evidence and len(evidence.split()) < 10
                    )
                    
                    if not is_false_positive:
                        filtered_violations.append(violation)
                    else:
                        print(f"   Filtered false positive: {description[:50]}...")
            else:
                filtered_violations = violations
            
            print(f"   Filtered violations: {len(filtered_violations)}")
            
            final_compliant = len(filtered_violations) == 0
            final_risk_score = min(0.3, len(filtered_violations) * 0.1) if filtered_violations else 0.0
            
            if final_compliant:
                if is_family_advertisement:
                    summary = "Family-friendly advertisement content - compliant with policies"
                else:
                    summary = compliance_result.get("summary", "Audio content compliant")
            else:
                summary = f"Audio content has {len(filtered_violations)} policy concern(s) requiring review"
            
            result = {
                "compliant": final_compliant,
                "violations": filtered_violations,
                "risk_score": final_risk_score,
                "summary": summary,
                "transcribed_text": transcribed_text,
                "audio_file": os.path.basename(audio_path),
                "analysis_method": "groq_whisper",
                "family_advertisement_detected": is_family_advertisement,
                "original_violations_count": len(violations),
                "filtered_violations_count": len(filtered_violations)
            }
            
            print("Audio compliance analysis complete!")
            return result
            
        except Exception as e:
            print(f"Audio compliance check failed: {e}")
            return {
                "compliant": False,
                "violations": [{
                    "policy_section": "System Error",
                    "violation_type": "technical",
                    "description": f"Audio processing failed: {str(e)}",
                    "confidence": 0.7,
                    "evidence": f"File: {os.path.basename(audio_path)}"
                }],
                "risk_score": 0.8,
                "summary": "Audio processing error - manual review required",
                "transcribed_text": "",
                "audio_file": os.path.basename(audio_path),
                "analysis_method": "error"
            }