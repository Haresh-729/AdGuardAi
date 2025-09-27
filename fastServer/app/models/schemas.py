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
    target_age_group: Dict[str, Any]
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