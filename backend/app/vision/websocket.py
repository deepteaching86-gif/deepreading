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

    async def connect(self, websocket: WebSocket, session_id: str):
        """클라이언트 연결"""
        await websocket.accept()
        self.active_connections[session_id] = websocket
        self.gaze_buffer[session_id] = []
        print(f"Vision session {session_id} connected")

    def disconnect(self, session_id: str):
        """클라이언트 연결 해제"""
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        if session_id in self.gaze_buffer:
            del self.gaze_buffer[session_id]
        print(f"Vision session {session_id} disconnected")

    async def handle_frame(
        self,
        session_id: str,
        frame_data: Dict
    ):
        """
        프레임 수신 및 시선 추적 처리

        Args:
            session_id: 세션 ID
            frame_data: {
                "image": "data:image/jpeg;base64,...",
                "screenWidth": 1920,
                "screenHeight": 1080,
                "timestamp": 1234567890
            }
        """
        try:
            # Base64 디코딩
            img_data = base64.b64decode(frame_data['image'].split(',')[1])
            nparr = np.frombuffer(img_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                return

            # 시선 추적
            result = self.tracker.track(frame)

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

                websocket = self.active_connections.get(session_id)
                if websocket:
                    await websocket.send_json(response)

                # 버퍼에 추가 (배치 저장)
                self.gaze_buffer[session_id].append(response)

                # 100개마다 DB 저장
                if len(self.gaze_buffer[session_id]) >= 100:
                    await self._flush_buffer(session_id)

        except Exception as e:
            print(f"Error processing frame: {e}")

    async def _flush_buffer(self, session_id: str):
        """버퍼의 시선 데이터를 DB에 저장"""
        if session_id in self.gaze_buffer and self.gaze_buffer[session_id]:
            await save_gaze_data_batch(session_id, self.gaze_buffer[session_id])
            self.gaze_buffer[session_id] = []

# 싱글톤 인스턴스
vision_ws_handler = VisionWebSocketHandler()
