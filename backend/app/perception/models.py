"""
Pydantic Models for Visual Perception Test API
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


class PerceptionTestPhase(str, Enum):
    """Test phase enumeration"""
    INTRODUCTION = "introduction"
    CALIBRATION = "calibration"
    READING = "reading"
    QUESTIONS = "questions"
    COMPLETED = "completed"


class PerceptionTestStatus(str, Enum):
    """Test status enumeration"""
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


# ===== Request Models =====

class StartSessionRequest(BaseModel):
    """Request to start a new perception test session"""
    student_id: str = Field(..., description="Student UUID")
    grade: int = Field(..., ge=1, le=9, description="Student grade (1-9)")


class SaveCalibrationRequest(BaseModel):
    """Request to save calibration data"""
    calibration_points: List[Dict] = Field(..., description="Calibration point data")
    calibration_accuracy: float = Field(..., ge=0.0, le=1.0, description="Accuracy (0.0-1.0)")


class SaveGazeDataRequest(BaseModel):
    """Request to save gaze data"""
    phase: PerceptionTestPhase
    gaze_x: float
    gaze_y: float
    confidence: float = Field(..., ge=0.0, le=1.0)
    head_pitch: Optional[float] = None
    head_yaw: Optional[float] = None
    head_roll: Optional[float] = None
    left_pupil_diameter: Optional[float] = None
    right_pupil_diameter: Optional[float] = None
    timestamp: datetime


class SubmitAnswerRequest(BaseModel):
    """Request to submit an answer"""
    question_id: str
    selected_answer: str = Field(..., min_length=1, max_length=1)
    response_time: Optional[int] = None


class CompleteSessionRequest(BaseModel):
    """Request to complete a test session"""
    pass


# ===== Response Models =====

class PassageResponse(BaseModel):
    """Passage information"""
    id: str
    title: str
    content: str
    word_count: int
    sentence_count: int


class QuestionResponse(BaseModel):
    """Question information"""
    id: str
    question_number: int
    question_text: str
    options: List[Dict[str, str]]


class SessionResponse(BaseModel):
    """Session information"""
    id: str
    session_code: str
    student_id: str
    grade: int
    current_phase: PerceptionTestPhase
    status: PerceptionTestStatus
    passage: Optional[PassageResponse] = None
    questions: Optional[List[QuestionResponse]] = None
    calibration_accuracy: Optional[float] = None


class ConcentrationMetricsResponse(BaseModel):
    """10 Concentration metrics (0-100)"""
    fixation_stability: float
    reading_pattern_regularity: float
    regression_frequency: float
    focus_retention_rate: float
    reading_speed_consistency: float
    blink_frequency_score: float
    fixation_duration_score: float
    vertical_drift_score: float
    horizontal_regression_score: float
    sustained_attention_score: float


class GazeAnalysisResponse(BaseModel):
    """15 Gaze analysis items"""
    # Reading Behavior (5 items)
    avg_reading_speed_wpm: float
    total_fixation_count: int
    avg_fixation_duration: float
    saccade_count: int
    avg_saccade_length: float

    # Concentration (5 items)
    in_text_gaze_ratio: float
    regression_count: int
    line_drift_count: int
    max_sustained_attention: float
    distraction_index: float

    # Comprehension Correlation (3 items)
    regression_accuracy_corr: Optional[float]
    fixation_accuracy_corr: Optional[float]
    speed_accuracy_corr: Optional[float]

    # Question Solving (2 items)
    option_gaze_distribution: Dict[str, float]
    revisit_frequency: float


class TestResultResponse(BaseModel):
    """Complete test result"""
    id: str
    session_id: str

    # Overall scores
    comprehension_score: int
    concentration_score: int
    overall_grade: str

    # Metrics
    concentration_metrics: ConcentrationMetricsResponse
    gaze_analysis: GazeAnalysisResponse

    # Analysis
    strengths: List[Dict[str, str]]
    improvements: List[Dict[str, str]]
    recommendations: List[str]

    created_at: datetime


class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    detail: Optional[str] = None
