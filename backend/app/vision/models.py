"""
Pydantic 데이터 모델
"""
from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime

class CreateVisionSessionRequest(BaseModel):
    student_id: str
    template_id: str
    device_info: Dict

class VisionSessionResponse(BaseModel):
    id: str
    student_id: str
    template_id: str
    status: str
    created_at: datetime

class GazeDataPoint(BaseModel):
    x: float
    y: float
    timestamp: int
    pupil_left: Optional[Dict] = None
    pupil_right: Optional[Dict] = None
    head_pose: Optional[Dict] = None
    confidence: float

class CalibrationPoint(BaseModel):
    screen_x: float
    screen_y: float
    gaze_x: float
    gaze_y: float
    timestamp: int

class CalibrationRequest(BaseModel):
    points: List[CalibrationPoint]
    screen_width: int
    screen_height: int
    accuracy: float
