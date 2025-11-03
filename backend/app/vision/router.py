"""
Vision 추적 API 라우터
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
from .websocket import vision_ws_handler
from .database import create_vision_session, save_calibration, get_all_vision_sessions
from .models import CreateVisionSessionRequest, VisionSessionResponse, CalibrationRequest

router = APIRouter()

@router.post("/sessions", response_model=VisionSessionResponse)
async def start_vision_session(request: CreateVisionSessionRequest):
    """Vision 테스트 세션 시작"""
    session = await create_vision_session(
        student_id=request.student_id,
        template_id=request.template_id,
        device_info=request.device_info
    )
    return session

@router.get("/sessions")
async def get_vision_sessions():
    """모든 Vision 세션 조회"""
    sessions = await get_all_vision_sessions()
    return {"sessions": sessions}

@router.websocket("/ws/{session_id}")
async def vision_tracking_websocket(websocket: WebSocket, session_id: str):
    """실시간 시선 추적 WebSocket"""
    await vision_ws_handler.connect(websocket, session_id)

    try:
        while True:
            # 클라이언트로부터 프레임 수신
            data = await websocket.receive_text()
            frame_data = json.loads(data)

            # 시선 추적 처리 및 응답
            await vision_ws_handler.handle_frame(session_id, frame_data)

    except WebSocketDisconnect:
        vision_ws_handler.disconnect(session_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        vision_ws_handler.disconnect(session_id)

@router.post("/sessions/{session_id}/calibration")
async def save_session_calibration(
    session_id: str,
    calibration: CalibrationRequest
):
    """캘리브레이션 데이터 저장"""
    await save_calibration(session_id, calibration)
    return {"status": "success", "message": "Calibration saved"}

@router.get("/test")
async def test_vision_module():
    """Vision 모듈 테스트 엔드포인트"""
    return {
        "status": "ok",
        "message": "Vision tracking module is running",
        "features": [
            "JEO pupil detection",
            "MediaPipe head pose estimation",
            "3D gaze vector calculation",
            "WebSocket real-time tracking"
        ]
    }
