"""
Vision 데이터베이스 레이어
Supabase PostgreSQL 연결 (나중에 Prisma 통합)
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from typing import Dict, List, Optional
from .models import CreateVisionSessionRequest, CalibrationRequest

# DATABASE_URL 환경 변수에서 가져오기
DATABASE_URL = os.getenv("DATABASE_URL")

# 메모리 기반 세션 저장소 (임시)
vision_sessions: Dict[str, Dict] = {}

def get_connection():
    """데이터베이스 연결"""
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

async def create_vision_session(
    student_id: str,
    template_id: str,
    device_info: Dict
) -> Dict:
    """Vision 테스트 세션 생성"""
    # TODO: Prisma 스키마 추가 후 실제 구현
    # 현재는 메모리 세션으로 시작
    session_id = f"vision_session_{datetime.now().timestamp()}"

    session = {
        "id": session_id,
        "student_id": student_id,
        "template_id": template_id,
        "status": "active",
        "created_at": datetime.now().isoformat(),
        "total_frames": 0
    }

    # 메모리에 저장
    vision_sessions[session_id] = session

    return session

async def get_all_vision_sessions() -> List[Dict]:
    """모든 Vision 세션 조회"""
    return list(vision_sessions.values())

async def save_gaze_data_batch(session_id: str, gaze_data: List[Dict]):
    """시선 데이터 배치 저장"""
    # TODO: Prisma 스키마 추가 후 실제 구현
    pass

async def save_calibration(session_id: str, calibration: CalibrationRequest):
    """캘리브레이션 데이터 저장"""
    # TODO: Prisma 스키마 추가 후 실제 구현
    pass
