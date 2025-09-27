import os
import json
import time
import cv2
import numpy as np
from datetime import datetime
from typing import Union, List, Dict, Any, Optional
import subprocess
import tempfile

class VideoComplianceChecker:
    def __init__(self, 
                 image_checker=None,
                 audio_checker=None,
                 max_frames_per_video=20,
                 sampling_strategy="adaptive",
                 include_audio_analysis=True):
        
        self.image_checker = image_checker
        self.audio_checker = audio_checker
        self.max_frames_per_video = max_frames_per_video
        self.sampling_strategy = sampling_strategy
        self.include_audio_analysis = include_audio_analysis
        
        print(f"VideoComplianceChecker initialized")
        print(f"Max frames per video: {max_frames_per_video}")
        print(f"Sampling strategy: {sampling_strategy}")
        print(f"Audio analysis: {'Enabled' if self.include_audio_analysis else 'Disabled'}")
    
    def extract_audio_from_video(self, video_path: str, temp_dir: str = None) -> str:
        if not self.include_audio_analysis:
            raise Exception("Audio analysis not enabled")
        
        try:
            if temp_dir is None:
                temp_dir = tempfile.gettempdir()
            
            video_name = os.path.splitext(os.path.basename(video_path))[0]
            audio_path = os.path.join(temp_dir, f"{video_name}_audio.wav")
            
            print(f"Extracting audio from video: {os.path.basename(video_path)}")
            
            ffmpeg_cmd = [
                'ffmpeg', '-i', video_path,
                '-vn',
                '-acodec', 'pcm_s16le',
                '-ar', '16000',
                '-ac', '1',
                '-y',
                audio_path
            ]
            
            result = subprocess.run(
                ffmpeg_cmd, 
                capture_output=True, 
                text=True,
                timeout=300
            )
            
            if result.returncode != 0:
                raise Exception(f"FFmpeg failed: {result.stderr}")
            
            if not os.path.exists(audio_path) or os.path.getsize(audio_path) == 0:
                raise Exception("Audio extraction produced empty file")
            
            print(f"Audio extracted: {os.path.basename(audio_path)}")
            return audio_path
            
        except subprocess.TimeoutExpired:
            raise Exception("Audio extraction timed out")
        except FileNotFoundError:
            raise Exception("FFmpeg not found. Please install FFmpeg for audio analysis.")
        except Exception as e:
            raise Exception(f"Audio extraction failed: {e}")
    
    def analyze_video_audio(self, video_path: str) -> Dict[str, Any]:
        if not self.include_audio_analysis or not self.audio_checker:
            return {
                "compliant": True,
                "violations": [],
                "risk_score": 0.0,
                "summary": "Audio analysis not available",
                "transcribed_text": "",
                "analysis_method": "disabled"
            }
        
        temp_audio_path = None
        try:
            temp_audio_path = self.extract_audio_from_video(video_path)
            audio_result = self.audio_checker.check_audio_compliance(temp_audio_path)
            return audio_result
            
        except Exception as e:
            print(f"Audio analysis failed: {e}")
            return {
                "compliant": True,
                "violations": [{
                    "policy_section": "Audio Analysis",
                    "violation_type": "technical",
                    "description": f"Audio analysis failed: {e}",
                    "confidence": 0.3,
                    "evidence": "Technical limitation",
                    "severity": "minor"
                }],
                "risk_score": 0.1,
                "summary": f"Audio analysis unavailable: {e}",
                "transcribed_text": "",
                "analysis_method": "error"
            }
        finally:
            if temp_audio_path and os.path.exists(temp_audio_path):
                try:
                    os.remove(temp_audio_path)
                    print("Temporary audio file cleaned up")
                except:
                    pass
    
    def load_video(self, video_path: str) -> cv2.VideoCapture:
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise ValueError("Could not open video")
            return cap
        except Exception as e:
            raise Exception(f"Failed to load video: {e}")
    
    def get_video_metadata(self, cap: cv2.VideoCapture) -> Dict[str, Any]:
        try:
            metadata = {
                "total_frames": int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
                "fps": float(cap.get(cv2.CAP_PROP_FPS)),
                "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
                "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
                "duration_seconds": 0,
                "codec": int(cap.get(cv2.CAP_PROP_FOURCC))
            }
            
            if metadata["fps"] > 0:
                metadata["duration_seconds"] = metadata["total_frames"] / metadata["fps"]
            
            return metadata
            
        except Exception as e:
            print(f"Metadata extraction error: {e}")
            return {
                "total_frames": 0,
                "fps": 30,
                "width": 640,
                "height": 480,
                "duration_seconds": 0,
                "codec": 0
            }
    
    def calculate_frame_sampling(self, metadata: Dict[str, Any]) -> List[int]:
        total_frames = metadata["total_frames"]
        max_frames = min(self.max_frames_per_video, total_frames)
        
        if total_frames == 0 or max_frames == 0:
            return []
        
        if max_frames <= 3:
            if max_frames == 1:
                return [total_frames // 2]
            elif max_frames == 2:
                return [0, total_frames - 1]
            elif max_frames == 3:
                return [0, total_frames // 2, total_frames - 1]
        
        if self.sampling_strategy == "uniform":
            if max_frames >= total_frames:
                return list(range(total_frames))
            else:
                step = max(1, total_frames // max_frames)
                return [i * step for i in range(max_frames)]
        
        elif self.sampling_strategy == "adaptive":
            frames = []
            
            if max_frames < 6:
                step = max(1, total_frames // max_frames)
                return [i * step for i in range(max_frames)]
            
            beginning_count = max(1, int(max_frames * 0.4))
            beginning_end = min(total_frames // 4, total_frames)
            if beginning_count > 0 and beginning_end > 0:
                beginning_step = max(1, beginning_end // beginning_count)
                beginning_frames = list(range(0, beginning_end, beginning_step))[:beginning_count]
                frames.extend(beginning_frames)
            
            middle_count = max(1, int(max_frames * 0.3))
            middle_start = total_frames // 3
            middle_end = (total_frames * 2) // 3
            if middle_count > 0 and middle_end > middle_start:
                middle_step = max(1, (middle_end - middle_start) // middle_count)
                middle_frames = list(range(middle_start, middle_end, middle_step))[:middle_count]
                frames.extend(middle_frames)
            
            current_frame_count = len(frames)
            end_count = max(0, max_frames - current_frame_count)
            if end_count > 0:
                end_start = (total_frames * 3) // 4
                end_range = total_frames - end_start
                if end_range > 0:
                    end_step = max(1, end_range // end_count)
                    end_frames = list(range(end_start, total_frames, end_step))[:end_count]
                    frames.extend(end_frames)
            
            unique_frames = sorted(list(set(frames)))
            if len(unique_frames) < max_frames:
                remaining_count = max_frames - len(unique_frames)
                step = max(1, total_frames // (remaining_count + 1))
                for i in range(remaining_count):
                    candidate_frame = (i + 1) * step
                    if candidate_frame < total_frames and candidate_frame not in unique_frames:
                        unique_frames.append(candidate_frame)
                unique_frames = sorted(unique_frames)[:max_frames]
            
            return unique_frames
        
        else:
            if max_frames >= total_frames:
                return list(range(total_frames))
            step = max(1, total_frames // max_frames)
            return [i * step for i in range(max_frames)]
    
    def extract_frame(self, cap: cv2.VideoCapture, frame_number: int) -> Union[np.ndarray, None]:
        try:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
            ret, frame = cap.read()
            
            if ret:
                return frame
            else:
                return None
                
        except Exception as e:
            print(f"Frame extraction error at frame {frame_number}: {e}")
            return None
    
    def analyze_frame_sequence(self, cap: cv2.VideoCapture, frame_numbers: List[int], video_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        frame_results = []
        
        for i, frame_num in enumerate(frame_numbers):
            try:
                frame = self.extract_frame(cap, frame_num)
                if frame is None:
                    print(f"Skipping frame {frame_num} (extraction failed)")
                    continue
                
                fps = video_metadata.get("fps", 30)
                timestamp = frame_num / fps if fps > 0 else 0
                
                print(f"Analyzing frame {frame_num} (t={timestamp:.2f}s)")
                result = self.image_checker.check_image_compliance(frame)
                
                result['frame_number'] = frame_num
                result['timestamp'] = timestamp
                result['frame_position'] = frame_num / video_metadata.get('total_frames', 1)
                
                frame_results.append(result)
                
            except Exception as e:
                print(f"Error analyzing frame {frame_num}: {e}")
                error_result = {
                    'frame_number': frame_num,
                    'timestamp': frame_num / video_metadata.get("fps", 30),
                    'image_compliance': {
                        'compliant': False,
                        'violations': [{
                            'policy_section': 'System Error',
                            'violation_type': 'technical',
                            'description': f'Frame analysis failed: {e}',
                            'confidence': 0.5,
                            'evidence': 'Processing error'
                        }],
                        'risk_score': 0.8,
                        'summary': 'Frame analysis error'
                    }
                }
                frame_results.append(error_result)
        
        return frame_results
    
    def create_video_compliance_summary(self, frame_results: List[Dict[str, Any]], audio_result: Dict[str, Any], video_metadata: Dict[str, Any], video_path: str = "") -> Dict[str, Any]:
        total_frames = len(frame_results)
        compliant_frames = sum(1 for r in frame_results if r.get('image_compliance', {}).get('compliant', False))
        non_compliant_frames = total_frames - compliant_frames
        
        visual_violations = []
        violation_timeline = []
        
        for frame_result in frame_results:
            frame_violations = frame_result.get('image_compliance', {}).get('violations', [])
            frame_num = frame_result.get('frame_number', 0)
            timestamp = frame_result.get('timestamp', 0)
            
            for violation in frame_violations:
                violation_with_time = violation.copy()
                violation_with_time['frame_number'] = frame_num
                violation_with_time['timestamp'] = timestamp
                violation_with_time['source'] = 'visual'
                visual_violations.append(violation_with_time)
                
                violation_timeline.append({
                    'timestamp': timestamp,
                    'frame_number': frame_num,
                    'violation_type': violation.get('violation_type', 'unknown'),
                    'severity': violation.get('severity', 'unknown'),
                    'description': violation.get('description', ''),
                    'source': 'visual'
                })
        
        audio_violations = []
        audio_compliant = audio_result.get('compliant', True)
        audio_risk_score = audio_result.get('risk_score', 0.0)
        
        raw_audio_violations = audio_result.get('violations', [])
        
        for violation in raw_audio_violations:
            audio_violation = violation.copy()
            audio_violation['source'] = 'audio'
            audio_violation['timestamp'] = 0
            audio_violations.append(audio_violation)
            
            violation_timeline.append({
                'timestamp': 0,
                'frame_number': -1,
                'violation_type': violation.get('violation_type', 'unknown'),
                'severity': violation.get('severity', 'unknown'),
                'description': violation.get('description', ''),
                'source': 'audio'
            })
        
        all_violations = visual_violations + audio_violations
        
        total_violations = len(all_violations)
        critical_violations = sum(1 for v in all_violations if v.get('severity') == 'critical')
        major_violations = sum(1 for v in all_violations if v.get('severity') == 'major')
        minor_violations = sum(1 for v in all_violations if v.get('severity') == 'minor')
        
        visual_compliance_score = compliant_frames / total_frames if total_frames > 0 else 1.0
        
        family_ad_detected = audio_result.get('family_advertisement_detected', False)
        
        audio_weight = 0.3
        visual_weight = 0.7
        
        if audio_compliant:
            audio_compliance_score = 1.0 - audio_risk_score
        else:
            audio_compliance_score = max(0.0, 0.5 - audio_risk_score)
        
        combined_compliance_score = (visual_weight * visual_compliance_score) + (audio_weight * audio_compliance_score)
        combined_risk_score = 1 - combined_compliance_score
        
        if family_ad_detected and visual_compliance_score >= 0.9:
            video_compliant = (combined_compliance_score >= 0.65 and critical_violations == 0)
        else:
            video_compliant = (combined_compliance_score >= 0.75 and critical_violations == 0 and audio_compliant)
        
        summary = {
            "video_metadata": video_metadata,
            "video_path": video_path,
            "processing_summary": {
                "total_frames_analyzed": total_frames,
                "sampling_strategy": self.sampling_strategy,
                "max_frames_limit": self.max_frames_per_video,
                "frames_processed": total_frames,
                "processing_coverage": total_frames / video_metadata.get('total_frames', 1) if video_metadata.get('total_frames') else 0,
                "audio_analysis_included": self.include_audio_analysis,
                "audio_transcribed": bool(audio_result.get('transcribed_text', '').strip())
            },
            "compliance_assessment": {
                "video_compliant": video_compliant,
                "compliance_score": combined_compliance_score,
                "risk_score": combined_risk_score,
                "visual_compliance_score": visual_compliance_score,
                "audio_compliance_score": audio_compliance_score if self.include_audio_analysis else None,
                "compliant_frames": compliant_frames,
                "non_compliant_frames": non_compliant_frames,
                "compliance_percentage": (compliant_frames / total_frames * 100) if total_frames > 0 else 100,
                "audio_compliant": audio_compliant
            },
            "violation_summary": {
                "total_violations": total_violations,
                "visual_violations": len(visual_violations),
                "audio_violations": len(audio_violations),
                "critical_violations": critical_violations,
                "major_violations": major_violations, 
                "minor_violations": minor_violations,
                "violation_density": total_violations / total_frames if total_frames > 0 else 0,
                "violation_timeline": sorted(violation_timeline, key=lambda x: x['timestamp'])[:20]
            },
            "detailed_frame_results": frame_results,
            "audio_analysis": audio_result,
            "analysis_timestamp": datetime.now().isoformat()
        }
        
        return summary
    
    def check_video_compliance(self, video_path: str) -> Dict[str, Any]:
        start_time = time.time()
        
        try:
            print(f"Starting comprehensive video compliance analysis...")
            print(f"Sampling strategy: {self.sampling_strategy}")
            print(f"Max frames per video: {self.max_frames_per_video}")
            print(f"Audio analysis: {'Enabled' if self.include_audio_analysis else 'Disabled'}")
            
            cap = self.load_video(video_path)
            video_metadata = self.get_video_metadata(cap)
            
            print(f"Video loaded: {video_metadata['width']}x{video_metadata['height']}")
            print(f"Duration: {video_metadata['duration_seconds']:.2f}s")
            print(f"Total frames: {video_metadata['total_frames']}")
            print(f"FPS: {video_metadata['fps']:.2f}")
            
            frame_numbers = self.calculate_frame_sampling(video_metadata)
            print(f"Analyzing {len(frame_numbers)} frames")
            
            if not frame_numbers:
                raise Exception("No frames selected for analysis")
            
            audio_result = {"compliant": True, "violations": [], "risk_score": 0.0, 
                           "summary": "Audio analysis not performed", "transcribed_text": "",
                           "analysis_method": "disabled"}
            
            if self.include_audio_analysis:
                try:
                    print("Starting audio analysis...")
                    audio_result = self.analyze_video_audio(video_path)
                    print("Audio analysis complete")
                except Exception as e:
                    print(f"Audio analysis failed, continuing with visual only: {e}")
                    audio_result = {
                        "compliant": True,
                        "violations": [],
                        "risk_score": 0.0,
                        "summary": f"Audio analysis failed: {e}",
                        "transcribed_text": "",
                        "analysis_method": "error"
                    }
            
            print("Starting visual frame analysis...")
            frame_results = self.analyze_frame_sequence(cap, frame_numbers, video_metadata)
            print("Visual analysis complete")
            
            video_summary = self.create_video_compliance_summary(
                frame_results, audio_result, video_metadata, video_path
            )
            
            processing_time = time.time() - start_time
            video_summary["processing_time"] = processing_time
            
            print(f"Comprehensive video compliance analysis complete!")
            print(f"Processing time: {processing_time:.2f}s")
            print(f"Combined compliance score: {video_summary['compliance_assessment']['compliance_score']:.2%}")
            print(f"Visual compliance: {video_summary['compliance_assessment']['visual_compliance_score']:.2%}")
            if self.include_audio_analysis:
                audio_score = video_summary['compliance_assessment']['audio_compliance_score']
                if audio_score is not None:
                    print(f"Audio compliance: {audio_score:.2%}")
            
            cap.release()
            
            return video_summary
            
        except Exception as e:
            print(f"Video compliance check failed: {e}")
            
            error_summary = {
                "video_metadata": {"error": str(e)},
                "video_path": video_path, 
                "compliance_assessment": {
                    "video_compliant": False,
                    "compliance_score": 0.0,
                    "risk_score": 1.0,
                    "visual_compliance_score": 0.0,
                    "audio_compliance_score": None,
                    "error": str(e)
                },
                "violation_summary": {
                    "total_violations": 1,
                    "visual_violations": 1,
                    "audio_violations": 0,
                    "critical_violations": 1,
                    "violation_timeline": [{
                        "timestamp": 0,
                        "frame_number": 0,
                        "violation_type": "technical",
                        "severity": "critical", 
                        "description": f"Video processing failed: {e}",
                        "source": "system"
                    }]
                },
                "audio_analysis": {
                    "compliant": False,
                    "violations": [],
                    "risk_score": 0.0,
                    "summary": "Not analyzed due to system error",
                    "transcribed_text": "",
                    "analysis_method": "error"
                },
                "processing_time": time.time() - start_time,
                "analysis_timestamp": datetime.now().isoformat()
            }
            
            return error_summary