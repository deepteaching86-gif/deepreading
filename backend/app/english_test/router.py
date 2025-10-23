"""
FastAPI Router for English Adaptive Test API
============================================

Endpoints:
- POST /api/english-test/start - Start new test session
- POST /api/english-test/submit-response - Submit item response and get next item
- GET /api/english-test/session/{session_id} - Get session status
- POST /api/english-test/finalize - Finalize test and generate report
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

from .irt_engine import IRTEngine
from .service_v2 import EnglishTestServiceV2
from .database import EnglishTestDB

router = APIRouter(tags=["English Adaptive Test"])

# Initialize IRT engine and database
irt_engine = IRTEngine()
db_layer = EnglishTestDB()

# Create service instance
def get_service() -> EnglishTestServiceV2:
    """Get English Test Service instance"""
    return EnglishTestServiceV2(db=db_layer, irt_engine=irt_engine)


# ===== Request/Response Models =====

class StartTestRequest(BaseModel):
    """Request to start a new English adaptive test session"""
    user_id: str = Field(..., description="User UUID")


class StartTestResponse(BaseModel):
    """Response containing session info and first item"""
    session_id: int
    stage: int
    panel: str
    item: Dict
    total_items_planned: int = 40
    message: str = "English Adaptive Test Started"


class SubmitResponseRequest(BaseModel):
    """Submit answer to current item"""
    session_id: int
    item_id: int
    selected_answer: str = Field(..., pattern="^[A-D]$")
    response_time: Optional[int] = Field(None, description="Response time in milliseconds")


class SubmitResponseResponse(BaseModel):
    """Response after submitting answer"""
    is_correct: bool
    next_item: Optional[Dict] = None
    current_theta: float
    standard_error: float
    items_completed: int
    total_items: int
    stage: int
    panel: str
    test_completed: bool = False


class SessionStatusResponse(BaseModel):
    """Current session status"""
    session_id: int
    user_id: str
    started_at: datetime
    completed_at: Optional[datetime]
    status: str
    items_completed: int
    current_theta: Optional[float]
    current_se: Optional[float]
    stage: int
    panel: str


class FinalizeTestRequest(BaseModel):
    """Request to finalize test session"""
    session_id: int


class FinalizeTestResponse(BaseModel):
    """Final test results"""
    session_id: int
    final_theta: float
    standard_error: float
    proficiency_level: int
    lexile_score: Optional[int]
    ar_level: Optional[float]
    vocabulary_size: Optional[int]
    vocabulary_bands: Optional[Dict]
    total_items: int
    correct_count: int
    accuracy_percentage: float
    completed_at: datetime


# ===== API Endpoints =====

@router.post("/start", response_model=StartTestResponse)
async def start_test(request: StartTestRequest):
    """
    Start a new English adaptive test session.

    Process:
    1. Create new session in database
    2. Select first routing item (Stage 1)
    3. Return session info and first item
    """
    try:
        service = get_service()
        result = service.start_session(request.user_id)

        return StartTestResponse(
            session_id=result['session_id'],
            stage=result['stage'],
            panel=result['panel'],
            item=result['first_item'],
            total_items_planned=result['total_items']
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start test: {str(e)}")


@router.post("/submit-response", response_model=SubmitResponseResponse)
async def submit_response(request: SubmitResponseRequest):
    """
    Submit item response and get next item.

    Process:
    1. Record response in database
    2. Update θ estimate using IRT EAP
    3. Check if stage transition needed
    4. Select next item using Fisher Information
    5. Return next item or completion status
    """
    try:
        service = get_service()
        result = service.submit_response(
            session_id=request.session_id,
            item_id=request.item_id,
            selected_answer=request.selected_answer,
            response_time=request.response_time
        )

        return SubmitResponseResponse(**result)

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit response: {str(e)}")


@router.get("/session/{session_id}", response_model=SessionStatusResponse)
async def get_session_status(session_id: int):
    """
    Get current test session status.

    Returns session metadata, progress, and current ability estimate.
    """
    try:
        service = get_service()
        session_data = service.get_session_status(session_id)

        return SessionStatusResponse(**session_data)

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get session: {str(e)}")


@router.post("/finalize", response_model=FinalizeTestResponse)
async def finalize_test(request: FinalizeTestRequest):
    """
    Finalize test session and generate comprehensive report.

    Process:
    1. Mark session as completed
    2. Calculate final θ and proficiency level
    3. Estimate Lexile/AR scores (if ML model available)
    4. Calculate vocabulary size (if vocabulary test completed)
    5. Generate final report
    """
    try:
        service = get_service()
        final_results = service.finalize_session(request.session_id)

        return FinalizeTestResponse(**final_results)

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to finalize test: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "English Adaptive Test API",
        "version": "1.0.0",
        "irt_engine": "3PL EAP"
    }
