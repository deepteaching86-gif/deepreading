"""
FastAPI Router for Visual Perception Test API
"""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from typing import List, Dict
import logging

from .models import (
    StartSessionRequest, SaveCalibrationRequest, SaveGazeDataRequest,
    SubmitAnswerRequest, CompleteSessionRequest,
    SessionResponse, TestResultResponse, ErrorResponse,
    PassageResponse, QuestionResponse,
    ConcentrationMetricsResponse, GazeAnalysisResponse
)
from .database import PerceptionDatabase
from .analysis import GazeAnalyzer

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Database instance
db = PerceptionDatabase()


# ===== API Endpoints =====

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "module": "perception-test"}


@router.get("/debug")
async def debug_check():
    """Debug endpoint to diagnose database/connection issues"""
    try:
        await db.connect()
    except Exception:
        pass  # debug_check handles its own errors
    return await db.debug_check()


@router.post("/sessions/start", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(request: StartSessionRequest):
    """
    Start a new visual perception test session

    1. Get a passage for the student's grade
    2. Create a new session
    3. Return session info with passage and questions
    """
    try:
        logger.info(f"Starting perception test - student_id={request.student_id}, grade={request.grade}")

        await db.connect()

        passage = await db.get_passage_for_grade(request.grade)

        if not passage:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No passages available for grade {request.grade}. Database may need seeding."
            )

        session = await db.create_session(
            student_id=request.student_id,
            grade=request.grade,
            passage_id=passage["id"]
        )

        logger.info(f"Session created: {session['id']}")

        return SessionResponse(
            id=session["id"],
            session_code=session["session_code"],
            student_id=session["student_id"],
            grade=session["grade"],
            current_phase=session["current_phase"],
            status=session["status"],
            passage=PassageResponse(
                id=passage["id"],
                title=passage["title"],
                content=passage["content"],
                word_count=passage["word_count"],
                sentence_count=passage["sentence_count"]
            ),
            questions=[
                QuestionResponse(
                    id=q["id"],
                    question_number=q["question_number"],
                    question_text=q["question_text"],
                    options=q["options"]
                )
                for q in passage["questions"]
            ]
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(f"Error starting perception test: {type(e).__name__}: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start session: {type(e).__name__}: {str(e)}"
        )


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """Get session information"""
    try:
        await db.connect()

        session = await db.get_session(session_id)

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )

        response = SessionResponse(
            id=session["id"],
            session_code=session["session_code"],
            student_id=session["student_id"],
            grade=session["grade"],
            current_phase=session["current_phase"],
            status=session["status"],
            calibration_accuracy=session.get("calibration_accuracy")
        )

        if "passage" in session and session["passage"]:
            passage = session["passage"]
            response.passage = PassageResponse(
                id=passage["id"],
                title=passage["title"],
                content=passage["content"],
                word_count=passage["word_count"],
                sentence_count=passage["sentence_count"]
            )

            if "questions" in passage:
                response.questions = [
                    QuestionResponse(
                        id=q["id"],
                        question_number=q["question_number"],
                        question_text=q["question_text"],
                        options=q["options"]
                    )
                    for q in passage["questions"]
                ]

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve session"
        )


@router.post("/sessions/{session_id}/calibration")
async def save_calibration(session_id: str, request: SaveCalibrationRequest):
    """Save calibration data and move to reading phase"""
    try:
        await db.connect()

        await db.save_calibration(
            session_id=session_id,
            calibration_points=request.calibration_points,
            calibration_accuracy=request.calibration_accuracy
        )

        await db.update_session_phase(session_id, "reading")

        return {
            "success": True,
            "message": "Calibration saved",
            "calibration_accuracy": request.calibration_accuracy
        }

    except Exception as e:
        logger.error(f"Error saving calibration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save calibration"
        )


@router.post("/sessions/{session_id}/gaze")
async def save_gaze_data(session_id: str, request: SaveGazeDataRequest):
    """Save gaze tracking data"""
    try:
        await db.connect()

        gaze_data = request.dict()
        await db.save_gaze_data(session_id, gaze_data)

        return {"success": True}

    except Exception as e:
        logger.error(f"Error saving gaze data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save gaze data"
        )


@router.post("/sessions/{session_id}/reading-complete")
async def complete_reading(session_id: str):
    """Mark reading phase as complete and move to questions"""
    try:
        await db.connect()

        await db.update_session_phase(session_id, "questions")

        return {
            "success": True,
            "message": "Reading phase completed"
        }

    except Exception as e:
        logger.error(f"Error completing reading: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete reading phase"
        )


@router.post("/sessions/{session_id}/answers")
async def submit_answer(session_id: str, request: SubmitAnswerRequest):
    """Submit answer to a question"""
    try:
        await db.connect()

        session = await db.get_session(session_id)

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )

        # Find question
        question = None
        for q in session["passage"]["questions"]:
            if q["id"] == request.question_id:
                question = q
                break

        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )

        is_correct = request.selected_answer == question["correct_answer"]

        await db.save_response(
            session_id=session_id,
            question_id=request.question_id,
            selected_answer=request.selected_answer,
            is_correct=is_correct,
            response_time=request.response_time
        )

        return {
            "success": True,
            "is_correct": is_correct
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting answer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit answer"
        )


@router.post("/sessions/{session_id}/complete", response_model=TestResultResponse)
async def complete_session(session_id: str, request: CompleteSessionRequest):
    """
    Complete the test session and generate results
    """
    try:
        await db.connect()

        session = await db.get_session(session_id)

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )

        reading_gaze = await db.get_gaze_data(session_id, "reading")
        question_gaze = await db.get_gaze_data(session_id, "questions")
        all_gaze = reading_gaze + question_gaze

        responses = await db.get_responses(session_id)

        passage_bounds = {"x": 100, "y": 100, "width": 800, "height": 600}

        analyzer = GazeAnalyzer(
            gaze_data=all_gaze,
            responses=responses,
            passage_bounds=passage_bounds
        )

        concentration_score, concentration_metrics = analyzer.calculate_concentration_score()
        gaze_analysis = analyzer.calculate_gaze_analysis()

        correct_count = sum(1 for r in responses if r["is_correct"])
        comprehension_score = int((correct_count / len(responses)) * 100) if responses else 0

        overall_score = (comprehension_score + concentration_score) / 2
        overall_grade = _score_to_grade(overall_score)

        strengths, improvements, recommendations = _generate_analysis(
            concentration_metrics, gaze_analysis, comprehension_score
        )

        result_data = {
            "comprehension_score": comprehension_score,
            "concentration_score": concentration_score,
            "overall_grade": overall_grade,
            **concentration_metrics,
            **gaze_analysis,
            "strengths": strengths,
            "improvements": improvements,
            "recommendations": recommendations
        }

        result = await db.save_result(session_id, result_data)
        await db.complete_session(session_id)

        return TestResultResponse(
            id=result["id"],
            session_id=result["session_id"],
            comprehension_score=result["comprehension_score"],
            concentration_score=result["concentration_score"],
            overall_grade=result["overall_grade"],
            concentration_metrics=ConcentrationMetricsResponse(**concentration_metrics),
            gaze_analysis=GazeAnalysisResponse(**gaze_analysis),
            strengths=result["strengths"],
            improvements=result["improvements"],
            recommendations=result["recommendations"],
            created_at=result["created_at"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete session"
        )


@router.get("/sessions/{session_id}/result", response_model=TestResultResponse)
async def get_result(session_id: str):
    """Get test result for a session"""
    try:
        await db.connect()

        result = await db.get_result(session_id)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Result not found"
            )

        concentration_metrics = ConcentrationMetricsResponse(
            fixation_stability=result["fixation_stability"],
            reading_pattern_regularity=result["reading_pattern_regularity"],
            regression_frequency=result["regression_frequency"],
            focus_retention_rate=result["focus_retention_rate"],
            reading_speed_consistency=result["reading_speed_consistency"],
            blink_frequency_score=result["blink_frequency_score"],
            fixation_duration_score=result["fixation_duration_score"],
            vertical_drift_score=result["vertical_drift_score"],
            horizontal_regression_score=result["horizontal_regression_score"],
            sustained_attention_score=result["sustained_attention_score"]
        )

        gaze_analysis = GazeAnalysisResponse(
            avg_reading_speed_wpm=result["avg_reading_speed_wpm"],
            total_fixation_count=result["total_fixation_count"],
            avg_fixation_duration=result["avg_fixation_duration"],
            saccade_count=result["saccade_count"],
            avg_saccade_length=result["avg_saccade_length"],
            in_text_gaze_ratio=result["in_text_gaze_ratio"],
            regression_count=result["regression_count"],
            line_drift_count=result["line_drift_count"],
            max_sustained_attention=result["max_sustained_attention"],
            distraction_index=result["distraction_index"],
            regression_accuracy_corr=result.get("regression_accuracy_corr"),
            fixation_accuracy_corr=result.get("fixation_accuracy_corr"),
            speed_accuracy_corr=result.get("speed_accuracy_corr"),
            option_gaze_distribution=result["option_gaze_distribution"],
            revisit_frequency=result["revisit_frequency"]
        )

        return TestResultResponse(
            id=result["id"],
            session_id=result["session_id"],
            comprehension_score=result["comprehension_score"],
            concentration_score=result["concentration_score"],
            overall_grade=result["overall_grade"],
            concentration_metrics=concentration_metrics,
            gaze_analysis=gaze_analysis,
            strengths=result["strengths"],
            improvements=result["improvements"],
            recommendations=result["recommendations"],
            created_at=result["created_at"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting result: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve result"
        )


# ===== Helper Functions =====

def _score_to_grade(score: float) -> str:
    """Convert numeric score to letter grade"""
    if score >= 95:
        return "A+"
    elif score >= 90:
        return "A"
    elif score >= 85:
        return "B+"
    elif score >= 80:
        return "B"
    elif score >= 75:
        return "C+"
    elif score >= 70:
        return "C"
    elif score >= 65:
        return "D+"
    elif score >= 60:
        return "D"
    else:
        return "F"


def _generate_analysis(
    concentration_metrics: Dict[str, float],
    gaze_analysis: Dict,
    comprehension_score: int
) -> tuple:
    """Generate strengths, improvements, and recommendations"""

    strengths = []
    improvements = []
    recommendations = []

    for metric, value in concentration_metrics.items():
        if value >= 80:
            strengths.append({
                "metric": metric,
                "value": f"{value:.1f}",
                "description": _get_metric_description(metric, "strength")
            })
        elif value < 60:
            improvements.append({
                "metric": metric,
                "value": f"{value:.1f}",
                "description": _get_metric_description(metric, "improvement")
            })

    if concentration_metrics.get("fixation_stability", 100) < 60:
        recommendations.append("시선 고정 안정성을 높이기 위해 읽기 속도를 조금 늦춰보세요.")

    if concentration_metrics.get("focus_retention_rate", 100) < 60:
        recommendations.append("화면에서 시선이 자주 벗어납니다. 집중력 향상 훈련이 필요합니다.")

    if gaze_analysis.get("regression_count", 0) > 10:
        recommendations.append("역행 빈도가 높습니다. 한 번에 정확히 읽는 연습을 해보세요.")

    if comprehension_score < 70:
        recommendations.append("이해도가 낮습니다. 읽기 전 미리 질문을 확인해보세요.")

    return strengths, improvements, recommendations


def _get_metric_description(metric: str, type: str) -> str:
    """Get metric description for analysis"""
    descriptions = {
        "fixation_stability": {
            "strength": "시선 고정이 매우 안정적입니다.",
            "improvement": "시선 고정이 불안정합니다. 집중력 훈련이 필요합니다."
        },
        "reading_pattern_regularity": {
            "strength": "규칙적인 읽기 패턴을 보입니다.",
            "improvement": "읽기 패턴이 불규칙합니다."
        },
        "focus_retention_rate": {
            "strength": "화면 집중도가 매우 높습니다.",
            "improvement": "화면에서 시선이 자주 벗어납니다."
        },
        "sustained_attention_score": {
            "strength": "주의력 지속 시간이 우수합니다.",
            "improvement": "주의력 지속 시간이 짧습니다."
        }
    }

    return descriptions.get(metric, {}).get(type, "")
