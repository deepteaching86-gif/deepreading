"""
통합 Vision 추적 엔진
동공 검출 + 3D 헤드 포즈 → 화면 좌표 시선 계산
"""
import cv2
import numpy as np
from typing import Optional, Dict, Tuple
from .pupil_detector import OrloskyPupilDetector
from .head_pose import HeadPoseEstimator

class VisionTracker:
    """통합 시선 추적 엔진"""

    def __init__(self):
        self.pupil_detector = OrloskyPupilDetector()
        self.head_pose_estimator = HeadPoseEstimator()

    def track(self, frame: np.ndarray) -> Optional[Dict]:
        """
        프레임에서 시선 추적

        Returns:
            {
                "gaze_vector": (vx, vy, vz),
                "pupil_left": {"center": (x, y), "radius": r},
                "pupil_right": {"center": (x, y), "radius": r},
                "head_pose": {"pitch": ..., "yaw": ..., "roll": ...},
                "confidence": 0.0-1.0
            }
        """
        # 1. 헤드 포즈 추정
        head_pose = self.head_pose_estimator.estimate(frame)
        if not head_pose:
            return None

        # 2. 눈 영역 추출 (MediaPipe 랜드마크 기반)
        left_eye_region = self._extract_eye_region(frame, 'left', head_pose)
        right_eye_region = self._extract_eye_region(frame, 'right', head_pose)

        # 3. 동공 검출
        pupil_left = None
        pupil_right = None

        if left_eye_region is not None:
            pupil_left = self.pupil_detector.detect(left_eye_region)

        if right_eye_region is not None:
            pupil_right = self.pupil_detector.detect(right_eye_region)

        if not pupil_left and not pupil_right:
            return None

        # 4. 3D 시선 벡터 계산
        gaze_vector = self._calculate_gaze_vector(
            pupil_left, pupil_right, head_pose
        )

        # 5. 신뢰도 계산
        confidence = self._calculate_confidence(pupil_left, pupil_right, head_pose)

        return {
            "gaze_vector": gaze_vector.tolist() if gaze_vector is not None else [0, 0, -1],
            "pupil_left": pupil_left,
            "pupil_right": pupil_right,
            "head_pose": head_pose,
            "confidence": confidence
        }

    def _extract_eye_region(
        self, frame: np.ndarray, side: str, head_pose: Dict
    ) -> Optional[np.ndarray]:
        """
        프레임에서 눈 영역 추출
        TODO: MediaPipe 랜드마크 사용하여 정확한 영역 추출
        현재는 간단한 휴리스틱 사용
        """
        h, w = frame.shape[:2]

        if side == 'left':
            # 왼쪽 눈 영역 (화면 기준 오른쪽)
            x1, y1 = int(w * 0.6), int(h * 0.35)
            x2, y2 = int(w * 0.85), int(h * 0.55)
        else:
            # 오른쪽 눈 영역 (화면 기준 왼쪽)
            x1, y1 = int(w * 0.15), int(h * 0.35)
            x2, y2 = int(w * 0.4), int(h * 0.55)

        return frame[y1:y2, x1:x2]

    def _calculate_gaze_vector(
        self,
        pupil_left: Optional[Dict],
        pupil_right: Optional[Dict],
        head_pose: Dict
    ) -> Optional[np.ndarray]:
        """
        동공 위치 + 헤드 포즈 → 3D 시선 벡터
        JEO의 gaze ray computation 방식
        """
        # 기본 시선 벡터 (정면)
        base_vector = np.array([0, 0, -1])

        # 헤드 회전 매트릭스 적용
        rotation_matrix = np.array(head_pose['rotation_matrix'])

        # 회전된 시선 벡터
        gaze_vector = rotation_matrix @ base_vector

        # TODO: 동공 위치 기반 미세 조정 추가
        # 현재는 헤드 포즈만 사용

        return gaze_vector

    def _calculate_confidence(
        self,
        pupil_left: Optional[Dict],
        pupil_right: Optional[Dict],
        head_pose: Dict
    ) -> float:
        """종합 신뢰도 계산"""
        confidences = []

        if pupil_left:
            confidences.append(pupil_left.get('confidence', 0))

        if pupil_right:
            confidences.append(pupil_right.get('confidence', 0))

        if not confidences:
            return 0.0

        return sum(confidences) / len(confidences)

    def map_to_screen(
        self,
        gaze_vector: np.ndarray,
        head_translation: list,
        screen_width: int,
        screen_height: int
    ) -> Tuple[int, int]:
        """
        3D 시선 벡터를 화면 2D 좌표로 투영
        JEO의 ray-plane intersection
        """
        tx, ty, tz = head_translation
        vx, vy, vz = gaze_vector

        # 화면 평면 (Z = 0)과 시선 벡터의 교차점 계산
        if abs(vz) < 0.001:  # 거의 평행
            return (screen_width // 2, screen_height // 2)

        # t = -tz / vz
        t = -tz / vz

        # 교차점
        px = tx + t * vx
        py = ty + t * vy

        # 픽셀 좌표로 변환
        screen_x = int(px + screen_width / 2)
        screen_y = int(-py + screen_height / 2)  # Y축 반전

        # 화면 범위 클리핑
        screen_x = max(0, min(screen_width - 1, screen_x))
        screen_y = max(0, min(screen_height - 1, screen_y))

        return (screen_x, screen_y)

    def draw_debug_overlay(self, frame: np.ndarray, result: Optional[Dict]) -> np.ndarray:
        """
        디버그 시각화 오버레이 그리기
        - MediaPipe 얼굴 랜드마크 (초록색 점)
        - 동공 위치 (빨간 원)
        - Head pose 정보 (텍스트)
        """
        debug_frame = frame.copy()
        h, w = frame.shape[:2]

        if not result:
            # 얼굴 미감지 메시지
            cv2.putText(
                debug_frame,
                "NO FACE DETECTED",
                (w // 4, h // 2),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 0, 255),
                2
            )
            return debug_frame

        # MediaPipe 얼굴 랜드마크 그리기
        head_pose_data = self.head_pose_estimator.get_last_landmarks()
        if head_pose_data:
            for landmark in head_pose_data.landmark:
                x = int(landmark.x * w)
                y = int(landmark.y * h)
                cv2.circle(debug_frame, (x, y), 1, (0, 255, 0), -1)

        # 동공 위치 그리기
        if result.get('pupil_left'):
            pupil = result['pupil_left']
            if 'center' in pupil:
                # 왼쪽 눈 영역 오프셋 계산
                offset_x = int(w * 0.6)
                offset_y = int(h * 0.35)
                center_x = int(pupil['center'][0]) + offset_x
                center_y = int(pupil['center'][1]) + offset_y
                radius = int(pupil.get('radius', 5))
                cv2.circle(debug_frame, (center_x, center_y), radius, (0, 0, 255), 2)
                cv2.putText(
                    debug_frame,
                    "L",
                    (center_x - 10, center_y - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0, 0, 255),
                    1
                )

        if result.get('pupil_right'):
            pupil = result['pupil_right']
            if 'center' in pupil:
                # 오른쪽 눈 영역 오프셋 계산
                offset_x = int(w * 0.15)
                offset_y = int(h * 0.35)
                center_x = int(pupil['center'][0]) + offset_x
                center_y = int(pupil['center'][1]) + offset_y
                radius = int(pupil.get('radius', 5))
                cv2.circle(debug_frame, (center_x, center_y), radius, (0, 0, 255), 2)
                cv2.putText(
                    debug_frame,
                    "R",
                    (center_x + 10, center_y - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0, 0, 255),
                    1
                )

        # Head pose 정보 표시
        if result.get('head_pose'):
            pose = result['head_pose']
            info_text = [
                f"Pitch: {pose['pitch']:.1f}deg",
                f"Yaw: {pose['yaw']:.1f}deg",
                f"Roll: {pose['roll']:.1f}deg",
                f"Confidence: {result['confidence']*100:.1f}%"
            ]
            for i, text in enumerate(info_text):
                cv2.putText(
                    debug_frame,
                    text,
                    (10, 30 + i * 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (255, 255, 255),
                    2
                )

        return debug_frame
