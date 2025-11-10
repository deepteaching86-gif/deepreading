"""
WebSocket을 통한 실시간 시선 추적 데이터 스트리밍
"""
from fastapi import WebSocket
import cv2
import numpy as np
import base64
from typing import Dict
import json
from .tracker import VisionTracker
from .database import save_gaze_data_batch

class VisionWebSocketHandler:
    """Vision 추적 WebSocket 핸들러"""

    def __init__(self):
        self.tracker = VisionTracker()
        self.active_connections: Dict[str, WebSocket] = {}
        self.gaze_buffer: Dict[str, list] = {}  # 배치 저장용 버퍼
        self.debug_mode: Dict[str, bool] = {}  # 세션별 디버그 모드 활성화 여부

    async def connect(self, websocket: WebSocket, session_id: str):
        """클라이언트 연결"""
        await websocket.accept()
        self.active_connections[session_id] = websocket
        self.gaze_buffer[session_id] = []
        self.debug_mode[session_id] = False  # 기본값: 디버그 모드 비활성화
        print(f"Vision session {session_id} connected")

    def disconnect(self, session_id: str):
        """클라이언트 연결 해제"""
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        if session_id in self.gaze_buffer:
            del self.gaze_buffer[session_id]
        if session_id in self.debug_mode:
            del self.debug_mode[session_id]
        print(f"Vision session {session_id} disconnected")

    async def handle_frame(
        self,
        session_id: str,
        frame_data: Dict
    ):
        """
        프레임 수신 및 시선 추적 처리 (Adaptive Resolution 지원)

        Args:
            session_id: 세션 ID
            frame_data: {
                "image": "data:image/jpeg;base64,...",
                "screenWidth": 1920,
                "screenHeight": 1080,
                "frameWidth": 1280,  # 카메라 프레임 해상도 (adaptive)
                "frameHeight": 720,   # 카메라 프레임 해상도 (adaptive)
                "enableDebug": false,  # 디버그 이미지 생성 여부 (optional, default: false)
                "timestamp": 1234567890
            }
        """
        websocket = self.active_connections.get(session_id)

        # 디버그 모드 업데이트 (클라이언트 요청에 따라)
        enable_debug = frame_data.get('enableDebug', False)
        if enable_debug != self.debug_mode.get(session_id, False):
            self.debug_mode[session_id] = enable_debug
            print(f"[{session_id}] 🐛 Debug mode: {'ON' if enable_debug else 'OFF'}")

        # 프레임 해상도 정보 추출 (기본값: 화면 해상도 사용)
        frame_width = frame_data.get('frameWidth', frame_data['screenWidth'])
        frame_height = frame_data.get('frameHeight', frame_data['screenHeight'])

        # 첫 프레임에서 해상도 로깅
        if session_id not in getattr(self, '_logged_resolutions', set()):
            if not hasattr(self, '_logged_resolutions'):
                self._logged_resolutions = set()
            print(f"[{session_id}] 📹 Camera resolution: {frame_width}x{frame_height} (adaptive)")
            print(f"[{session_id}] 🖥️  Screen resolution: {frame_data['screenWidth']}x{frame_data['screenHeight']}")
            self._logged_resolutions.add(session_id)

        try:
            # Base64 디코딩
            img_data = base64.b64decode(frame_data['image'].split(',')[1])
            nparr = np.frombuffer(img_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                print(f"[{session_id}] Frame decode failed")
                if websocket:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Frame decode failed"
                    })
                return

            # 시선 추적
            result = self.tracker.track(frame)

            # 디버그 이미지 생성 (조건부 - 디버그 모드일 때만)
            debug_image = None
            if self.debug_mode.get(session_id, False):
                debug_frame = self.tracker.draw_debug_overlay(frame, result)
                _, buffer = cv2.imencode('.jpg', debug_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                debug_image = base64.b64encode(buffer).decode('utf-8')

            if result:
                # 화면 좌표로 변환
                screen_x, screen_y = self.tracker.map_to_screen(
                    np.array(result['gaze_vector']),
                    result['head_pose']['translation'],
                    frame_data['screenWidth'],
                    frame_data['screenHeight']
                )

                # 클라이언트로 전송
                response = {
                    "type": "gaze_data",
                    "x": screen_x,
                    "y": screen_y,
                    "confidence": result['confidence'],
                    "pupilLeft": result.get('pupil_left'),
                    "pupilRight": result.get('pupil_right'),
                    "headPose": result['head_pose'],
                    "timestamp": frame_data['timestamp']
                }

                # 디버그 이미지 추가 (디버그 모드일 때만)
                if debug_image:
                    response["debugImage"] = f"data:image/jpeg;base64,{debug_image}"

                if websocket:
                    await websocket.send_json(response)

                # 버퍼에 추가 (배치 저장)
                self.gaze_buffer[session_id].append(response)

                # 100개마다 DB 저장
                if len(self.gaze_buffer[session_id]) >= 100:
                    await self._flush_buffer(session_id)
            else:
                # Tracking 실패 - 경고 전송
                print(f"[{session_id}] Tracking failed - no face detected or tracking error")
                if websocket:
                    warning_response = {
                        "type": "warning",
                        "message": "No face detected - please position your face in front of camera"
                    }
                    # 디버그 이미지 추가 (디버그 모드일 때만)
                    if debug_image:
                        warning_response["debugImage"] = f"data:image/jpeg;base64,{debug_image}"
                    await websocket.send_json(warning_response)

        except Exception as e:
            print(f"[{session_id}] Error processing frame: {e}")
            import traceback
            traceback.print_exc()
            if websocket:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Frame processing error: {str(e)}"
                })

    async def _flush_buffer(self, session_id: str):
        """버퍼의 시선 데이터를 DB에 저장"""
        if session_id in self.gaze_buffer and self.gaze_buffer[session_id]:
            await save_gaze_data_batch(session_id, self.gaze_buffer[session_id])
            self.gaze_buffer[session_id] = []

    def train_calibration(self, session_id: str, calibration_points: list) -> dict:
        """
        세션별 캘리브레이션 학습

        Args:
            session_id: 세션 ID
            calibration_points: List of calibration data points

        Returns:
            Calibration metrics dictionary
        """
        print(f"[{session_id}] 🎯 Training calibration with {len(calibration_points)} points")

        # Train the tracker's calibration corrector
        metrics = self.tracker.train_calibration(calibration_points)

        print(f"[{session_id}] ✅ Calibration trained successfully")
        print(f"   Error: {metrics['error_mean']:.1f}px ± {metrics['error_std']:.1f}px")

        return metrics

# 싱글톤 인스턴스
vision_ws_handler = VisionWebSocketHandler()
