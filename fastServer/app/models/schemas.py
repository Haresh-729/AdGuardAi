from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

class UserData(BaseModel):
    name: str
    email: str
    sector: str
    mobile: str

class AdDetails(BaseModel):
    advertisement_id: Union[int, str]
    title: str
    description: str
    user_id: int
    type: int
    target_region: str
    language: str
    landing_url: str
    target_audience: str
    target_age_group: Union[Dict[str, Any], List[int]] = {}
    created_at: datetime
    updated_at: datetime

class ComplianceCheckRequest(BaseModel):
    user_data: UserData
    video_links: Optional[List[str]] = []
    image_links: Optional[List[str]] = []
    audio_links: Optional[List[str]] = []
    ad_details: AdDetails

class TextAnalysisRequest(BaseModel):
    text: str

class ImageAnalysisRequest(BaseModel):
    image_url: str

class AudioAnalysisRequest(BaseModel):
    audio_url: str

class VideoAnalysisRequest(BaseModel):
    video_url: str

class ComplianceResponse(BaseModel):
    text_op: Optional[Dict[str, Any]] = None
    image_op: Optional[Dict[str, Any]] = None
    audio_op: Optional[Dict[str, Any]] = None
    link_op: Optional[Dict[str, Any]] = None
    video_op: Optional[Dict[str, Any]] = None
    processing_summary: Dict[str, Any]

class PCCAnalysisRequest(BaseModel):
    compliance_results: Optional[Dict[str, Any]] = None
    transcript: Optional[Dict[str, Any]] = None

class GenerateReportRequest(BaseModel):
    compliance_results: Optional[Dict[str, Any]] = None
    raw_output: Optional[Dict[str, Any]] = None
    pcc_analysis: Optional[Dict[str, Any]] = None
    user_data: Optional[Dict[str, Any]] = None
    ad_details: Optional[Dict[str, Any]] = None

class PCCAnalysisResponse(BaseModel):
    pcc_verdict: str
    pcc_reason: str
    confidence_score: float
    compliance_score: int
    call_insights: Dict[str, Any]
    confidence_while_answering: int
    truth_level: int
    recommendation: str
    analysis_timestamp: str

class GenerateReportResponse(BaseModel):
    report_id: str
    executive_summary: Dict[str, Any]
    detailed_analysis: Dict[str, Any]
    recommendations: List[str]
    compliance_status: str
    generated_at: str