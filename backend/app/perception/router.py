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


# ===== Lifecycle Events =====
# Note: Database connection is now lazy (connects on first request)
# This prevents startup failures if the Prisma Query Engine is unavailable


# ===== API Endpoints =====

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "module": "perception-test"}


@router.post("/sessions/start", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(request: StartSessionRequest):
    """
    Start a new visual perception test session

    1. Get a passage for the student's grade
    2. Create a new session
    3. Return session info with passage and questions
    """
    import traceback

    try:
        logger.info(f"🚀 Starting perception test - student_id={request.student_id} (len={len(request.student_id)}), grade={request.grade}")

        # Ensure database connection (lazy connect)
        await db.connect()
        logger.info("✅ Database connected")

        # Get passage for grade
        passage = await db.get_passage_for_grade(request.grade)
        logger.info(f"✅ Found passage: {passage['id'] if passage else 'None'} (len={len(passage['id']) if passage else 0})")

        if not passage:
            logger.warning(f"⚠️ No passages available for grade {request.grade}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No passages available for grade {request.grade}"
            )

        # Log data being sent to database
        logger.info(f"📝 Creating session with:")
        logger.info(f"  - student_id: {request.student_id} (type={type(request.student_id).__name__}, len={len(request.student_id)})")
        logger.info(f"  - passage_id: {passage['id']} (type={type(passage['id']).__name__}, len={len(passage['id'])})")
        logger.info(f"  - grade: {request.grade} (type={type(request.grade).__name__})")

        # Create session
        session = await db.create_session(
            student_id=request.student_id,
            grade=request.grade,
            passage_id=passage["id"]
        )

        logger.info(f"✅ Session created successfully:")
        logger.info(f"  - session_id: {session['id']}")
        logger.info(f"  - session_code: {session['sessionCode']} (len={len(session['sessionCode'])})")
        logger.info(f"  - current_phase: {session['currentPhase']}")

        # Format response
        return SessionResponse(
            id=session["id"],
            session_code=session["sessionCode"],
            student_id=session["studentId"],
            grade=session["grade"],
            current_phase=session["currentPhase"],
            status=session["status"],
            passage=PassageResponse(
                id=passage["id"],
                title=passage["title"],
                content=passage["content"],
                word_count=passage["wordCount"],
                sentence_count=passage["sentenceCount"]
            ),
            questions=[
                QuestionResponse(
                    id=q["id"],
                    question_number=q["questionNumber"],
                    question_text=q["questionText"],
                    options=q["options"]
                )
                for q in passage["questions"]
            ]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error starting perception test session: {type(e).__name__}: {str(e)}")
        logger.error(f"📋 Traceback: {traceback.format_exc()}")
        logger.error(f"📝 Request details:")
        logger.error(f"  - student_id: {request.student_id} (type={type(request.student_id).__name__}, len={len(request.student_id)})")
        logger.error(f"  - grade: {request.grade} (type={type(request.grade).__name__})")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start session"
        )


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """Get session information"""
    try:
        # Ensure database connection (lazy connect)
        await db.connect()

        session = await db.get_session(session_id)

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )

        # Format response
        response = SessionResponse(
            id=session["id"],
            session_code=session["sessionCode"],
            student_id=session["studentId"],
            grade=session["grade"],
            current_phase=session["currentPhase"],
            status=session["status"],
            calibration_accuracy=session.get("calibrationAccuracy")
        )

        # Add passage if available
        if "passage" in session and session["passage"]:
            passage = session["passage"]
            response.passage = PassageResponse(
                id=passage["id"],
                title=passage["title"],
                content=passage["content"],
                word_count=passage["wordCount"],
                sentence_count=passage["sentenceCount"]
            )

            # Add questions
            if "questions" in passage:
                response.questions = [
                    QuestionResponse(
                        id=q["id"],
                        question_number=q["questionNumber"],
                        question_text=q["questionText"],
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
        # Ensure database connection (lazy connect)
        await db.connect()

        # Save calibration
        session = await db.save_calibration(
            session_id=session_id,
            calibration_points=request.calibration_points,
            calibration_accuracy=request.calibration_accuracy
        )

        # Update phase to reading
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
        # Ensure database connection (lazy connect)
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
        # Ensure database connection (lazy connect)
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
        # Ensure database connection (lazy connect)
        await db.connect()

        # Get question to check correct answer
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

        # Check if answer is correct
        is_correct = request.selected_answer == question["correctAnswer"]

        # Save response
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

    1. Get all gaze data
    2. Get all responses
    3. Analyze gaze data
    4. Calculate scores
    5. Save results
    6. Return results
    """
    try:
        # Ensure database connection (lazy connect)
        await db.connect()

        # Get session
        session = await db.get_session(session_id)

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )

        # Get gaze data
        reading_gaze = await db.get_gaze_data(session_id, "reading")
        question_gaze = await db.get_gaze_data(session_id, "questions")
        all_gaze = reading_gaze + question_gaze

        # Get responses
        responses = await db.get_responses(session_id)

        # Analyze gaze data (using passage bounds from session)
        # TODO: Get actual passage bounds from frontend
        passage_bounds = {"x": 100, "y": 100, "width": 800, "height": 600}

        analyzer = GazeAnalyzer(
            gaze_data=all_gaze,
            responses=responses,
            passage_bounds=passage_bounds
        )

        # Calculate concentration score
        concentration_score, concentration_metrics = analyzer.calculate_concentration_score()

        # Calculate gaze analysis
        gaze_analysis = analyzer.calculate_gaze_analysis()

        # Calculate comprehension score
        correct_count = sum(1 for r in responses if r["isCorrect"])
        comprehension_score = int((correct_count / len(responses)) * 100) if responses else 0

        # Determine overall grade
        overall_score = (comprehension_score + concentration_score) / 2
        overall_grade = _score_to_grade(overall_score)

        # Generate analysis (strengths, improvements, recommendations)
        strengths, improvements, recommendations = _generate_analysis(
            concentration_metrics, gaze_analysis, comprehension_score
        )

        # Save result
        result_data = {
            "comprehensionScore": comprehension_score,
            "concentrationScore": concentration_score,
            "overallGrade": overall_grade,
            # Concentration metrics
            **{k: v for k, v in concentration_metrics.items()},
            # Gaze analysis
            **{k: v for k, v in gaze_analysis.items()},
            # Analysis
            "strengths": strengths,
            "improvements": improvements,
            "recommendations": recommendations
        }

        result = await db.save_result(session_id, result_data)

        # Mark session as completed
        await db.complete_session(session_id)

        # Return response
        return TestResultResponse(
            id=result["id"],
            session_id=result["sessionId"],
            comprehension_score=result["comprehensionScore"],
            concentration_score=result["concentrationScore"],
            overall_grade=result["overallGrade"],
            concentration_metrics=ConcentrationMetricsResponse(**concentration_metrics),
            gaze_analysis=GazeAnalysisResponse(**gaze_analysis),
            strengths=result["strengths"],
            improvements=result["improvements"],
            recommendations=result["recommendations"],
            created_at=result["createdAt"]
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
        # Ensure database connection (lazy connect)
        await db.connect()

        result = await db.get_result(session_id)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Result not found"
            )

        # Extract concentration metrics
        concentration_metrics = ConcentrationMetricsResponse(
            fixation_stability=result["fixationStability"],
            reading_pattern_regularity=result["readingPatternRegularity"],
            regression_frequency=result["regressionFrequency"],
            focus_retention_rate=result["focusRetentionRate"],
            reading_speed_consistency=result["readingSpeedConsistency"],
            blink_frequency_score=result["blinkFrequencyScore"],
            fixation_duration_score=result["fixationDurationScore"],
            vertical_drift_score=result["verticalDriftScore"],
            horizontal_regression_score=result["horizontalRegressionScore"],
            sustained_attention_score=result["sustainedAttentionScore"]
        )

        # Extract gaze analysis
        gaze_analysis = GazeAnalysisResponse(
            avg_reading_speed_wpm=result["avgReadingSpeedWpm"],
            total_fixation_count=result["totalFixationCount"],
            avg_fixation_duration=result["avgFixationDuration"],
            saccade_count=result["saccadeCount"],
            avg_saccade_length=result["avgSaccadeLength"],
            in_text_gaze_ratio=result["inTextGazeRatio"],
            regression_count=result["regressionCount"],
            line_drift_count=result["lineDriftCount"],
            max_sustained_attention=result["maxSustainedAttention"],
            distraction_index=result["distractionIndex"],
            regression_accuracy_corr=result.get("regressionAccuracyCorr"),
            fixation_accuracy_corr=result.get("fixationAccuracyCorr"),
            speed_accuracy_corr=result.get("speedAccuracyCorr"),
            option_gaze_distribution=result["optionGazeDistribution"],
            revisit_frequency=result["revisitFrequency"]
        )

        return TestResultResponse(
            id=result["id"],
            session_id=result["sessionId"],
            comprehension_score=result["comprehensionScore"],
            concentration_score=result["concentrationScore"],
            overall_grade=result["overallGrade"],
            concentration_metrics=concentration_metrics,
            gaze_analysis=gaze_analysis,
            strengths=result["strengths"],
            improvements=result["improvements"],
            recommendations=result["recommendations"],
            created_at=result["createdAt"]
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

    # Analyze concentration metrics
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

    # Generate recommendations based on weaknesses
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
