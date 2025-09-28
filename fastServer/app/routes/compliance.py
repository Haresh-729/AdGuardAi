from fastapi import APIRouter, HTTPException, status
from app.models.schemas import (
    ComplianceCheckRequest, 
    ComplianceResponse,
    TextAnalysisRequest,
    ImageAnalysisRequest,
    AudioAnalysisRequest,
    VideoAnalysisRequest,
    PCCAnalysisRequest,
    GenerateReportRequest,
    PCCAnalysisResponse,
    GenerateReportResponse
)
from app.services.compliance_service import ComplianceService
from typing import Dict, Any
import os

router = APIRouter()

# Initialize compliance service
compliance_service = ComplianceService()

@router.post("/check", response_model=Dict[str, Any])
async def check_comprehensive_compliance(request: ComplianceCheckRequest):
    """
    Comprehensive compliance check for text, images, audio, videos, and links
    Handles cases where any combination of media types is provided
    """
    try:
        result = compliance_service.check_comprehensive_compliance(request)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Compliance check failed: {str(e)}"
        )

@router.post("/text")
async def check_text_compliance(request: TextAnalysisRequest):
    """
    Analyze text content for policy compliance
    """
    try:
        result = compliance_service.analyze_text(request.text)
        return {"text_analysis": result}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text analysis failed: {str(e)}"
        )

@router.post("/image")
async def check_image_compliance(request: ImageAnalysisRequest):
    """
    Analyze single image for policy compliance
    """
    try:
        results = compliance_service.analyze_images([request.image_url])
        return {"image_analysis": results[0] if results else None}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image analysis failed: {str(e)}"
        )

@router.post("/audio")
async def check_audio_compliance(request: AudioAnalysisRequest):
    """
    Analyze single audio file for policy compliance
    """
    try:
        results = compliance_service.analyze_audios([request.audio_url])
        return {"audio_analysis": results[0] if results else None}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio analysis failed: {str(e)}"
        )

@router.post("/video")
async def check_video_compliance(request: VideoAnalysisRequest):
    """
    Analyze single video for policy compliance
    """
    try:
        results = compliance_service.analyze_videos([request.video_url])
        return {"video_analysis": results[0] if results else None}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video analysis failed: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """
    Health check endpoint for compliance service
    """
    return {
        "status": "healthy",
        "service": "compliance_checker",
        "checkers_available": {
            "policy_checker": compliance_service.policy_checker is not None,
            "image_checker": compliance_service.image_checker is not None,
            "audio_checker": compliance_service.audio_checker is not None,
            "video_checker": compliance_service.video_checker is not None
        }
    }

@router.post("/test-audio")
async def test_audio_extraction(video_url: str):
    """Test audio extraction from video URL"""
    try:
        from app.helpers.media_downloader import MediaDownloader
        from app.helpers.video_compliance_checker import VideoComplianceChecker
        
        # Download video
        downloader = MediaDownloader()
        local_path = downloader.download_file(video_url, '.mp4')
        
        # Test extraction
        checker = VideoComplianceChecker(include_audio_analysis=True)
        audio_path = checker.extract_audio_from_video(local_path)
        
        return {
            "success": True,
            "audio_file": audio_path,
            "file_size": os.path.getsize(audio_path)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    
@router.post("/pcc-analysis", response_model=Dict[str, Any])
async def analyze_pcc_call(request: PCCAnalysisRequest):
    """
    Post-call compliance analysis based on compliance results and call transcript
    """
    try:
        result = compliance_service.analyze_pcc_call(request)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PCC analysis failed: {str(e)}"
        )

@router.post("/generate-report", response_model=Dict[str, Any])
async def generate_comprehensive_report(request: GenerateReportRequest):
    """
    Generate comprehensive compliance report combining all analysis results
    """
    try:
        result = compliance_service.generate_comprehensive_report(request)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report generation failed: {str(e)}"
        )