"""
통합 Vision 추적 엔진 (JEO EyeTracker 방식 적용)
동공 검출 + 3D 헤드 포즈 → 정교한 화면 좌표 시선 계산
"""
import cv2
import numpy as np
from typing import Optional, Dict, Tuple, List
from .pupil_detector import OrloskyPupilDetector
from .head_pose import HeadPoseEstimator
from .calibration import CalibrationCorrector

class VisionTracker:
    """통합 시선 추적 엔진 (JEO 3D gaze ray computation)"""

    # MediaPipe 468-point Face Mesh 랜드마크 인덱스
    LEFT_EYE_INDICES = [33, 133, 160, 159, 158, 157, 173, 246]
    RIGHT_EYE_INDICES = [362, 263, 387, 386, 385, 384, 398, 466]
    LEFT_IRIS_CENTER = 468  # MediaPipe iris landmark (refine_landmarks=True)
    RIGHT_IRIS_CENTER = 473

    def __init__(self):
        self.pupil_detector = OrloskyPupilDetector()
        self.head_pose_estimator = HeadPoseEstimator()
        self.calibration_corrector = CalibrationCorrector()

        # 3D 눈 모델 (mm 단위, 얼굴 중심 기준)
        self.eye_ball_center_left = np.array([-29.0, 0.0, -42.0])
        self.eye_ball_center_right = np.array([29.0, 0.0, -42.0])
        self.eye_ball_radius = 12.0  # mm

    def track(self, frame: np.ndarray) -> Optional[Dict]:
        """
        프레임에서 시선 추적

        Returns:
            {
                "gaze_vector": (vx, vy, vz),
                "pupil_left": {"center": (x, y), "radius": r, "center_3d": (x,y,z)},
                "pupil_right": {"center": (x, y), "radius": r, "center_3d": (x,y,z)},
                "head_pose": {"pitch": ..., "yaw": ..., "roll": ...},
                "confidence": 0.0-1.0,
                "eye_centers_3d": {"left": (x,y,z), "right": (x,y,z)}
            }
        """
        # 1. 헤드 포즈 추정
        head_pose = self.head_pose_estimator.estimate(frame)
        if not head_pose:
            return None

        # MediaPipe 랜드마크 가져오기
        landmarks = self.head_pose_estimator.get_last_landmarks()
        if not landmarks:
            return None

        # 2. MediaPipe 기반 눈 영역 추출
        h, w = frame.shape[:2]
        left_eye_region, left_eye_box = self._extract_eye_region_from_landmarks(
            frame, landmarks, 'left', w, h
        )
        right_eye_region, right_eye_box = self._extract_eye_region_from_landmarks(
            frame, landmarks, 'right', w, h
        )

        # 3. 동공 검출 (OrloskyPupilDetector)
        pupil_left = None
        pupil_right = None

        if left_eye_region is not None:
            pupil_left = self.pupil_detector.detect(left_eye_region)
            if pupil_left:
                # 전체 프레임 좌표로 변환
                pupil_left['center'] = (
                    pupil_left['center'][0] + left_eye_box[0],
                    pupil_left['center'][1] + left_eye_box[1]
                )

        if right_eye_region is not None:
            pupil_right = self.pupil_detector.detect(right_eye_region)
            if pupil_right:
                # 전체 프레임 좌표로 변환
                pupil_right['center'] = (
                    pupil_right['center'][0] + right_eye_box[0],
                    pupil_right['center'][1] + right_eye_box[1]
                )

        if not pupil_left and not pupil_right:
            return None

        # 4. MediaPipe iris 중심 (더 정확한 동공 위치)
        iris_left_2d = None
        iris_right_2d = None

        if len(landmarks.landmark) > self.LEFT_IRIS_CENTER:
            lm = landmarks.landmark[self.LEFT_IRIS_CENTER]
            iris_left_2d = (int(lm.x * w), int(lm.y * h))

        if len(landmarks.landmark) > self.RIGHT_IRIS_CENTER:
            lm = landmarks.landmark[self.RIGHT_IRIS_CENTER]
            iris_right_2d = (int(lm.x * w), int(lm.y * h))

        # 5. 3D 눈 중심 계산 (헤드 포즈 적용)
        rotation_matrix = np.array(head_pose['rotation_matrix'])
        translation = np.array(head_pose['translation'])

        eye_center_left_3d = rotation_matrix @ self.eye_ball_center_left + translation.flatten()
        eye_center_right_3d = rotation_matrix @ self.eye_ball_center_right + translation.flatten()

        # 6. 3D 시선 벡터 계산 (JEO 방식: 동공 위치 반영)
        gaze_vector_left = None
        gaze_vector_right = None

        if pupil_left or iris_left_2d:
            pupil_2d = iris_left_2d if iris_left_2d else pupil_left['center']
            gaze_vector_left = self._calculate_gaze_vector_3d(
                pupil_2d, eye_center_left_3d, head_pose, w, h, 'left'
            )

        if pupil_right or iris_right_2d:
            pupil_2d = iris_right_2d if iris_right_2d else pupil_right['center']
            gaze_vector_right = self._calculate_gaze_vector_3d(
                pupil_2d, eye_center_right_3d, head_pose, w, h, 'right'
            )

        # 평균 시선 벡터 (양쪽 눈 사용 가능 시)
        if gaze_vector_left is not None and gaze_vector_right is not None:
            gaze_vector = (gaze_vector_left + gaze_vector_right) / 2
        elif gaze_vector_left is not None:
            gaze_vector = gaze_vector_left
        elif gaze_vector_right is not None:
            gaze_vector = gaze_vector_right
        else:
            gaze_vector = np.array([0, 0, -1])

        # 정규화
        gaze_vector = gaze_vector / np.linalg.norm(gaze_vector)

        # 7. 신뢰도 계산
        confidence = self._calculate_confidence(pupil_left, pupil_right, head_pose)

        return {
            "gaze_vector": gaze_vector.tolist(),
            "pupil_left": pupil_left,
            "pupil_right": pupil_right,
            "iris_left_2d": iris_left_2d,
            "iris_right_2d": iris_right_2d,
            "head_pose": head_pose,
            "confidence": confidence,
            "eye_centers_3d": {
                "left": eye_center_left_3d.tolist(),
                "right": eye_center_right_3d.tolist()
            },
            "eye_boxes": {
                "left": left_eye_box,
                "right": right_eye_box
            }
        }

    def _extract_eye_region_from_landmarks(
        self,
        frame: np.ndarray,
        landmarks,
        side: str,
        width: int,
        height: int
    ) -> Tuple[Optional[np.ndarray], Optional[Tuple[int, int, int, int]]]:
        """
        MediaPipe 랜드마크로 정확한 눈 영역 추출 (JEO 방식)

        Returns:
            (eye_region_image, (x1, y1, x2, y2))
        """
        indices = self.LEFT_EYE_INDICES if side == 'left' else self.RIGHT_EYE_INDICES

        # 눈 윤곽 랜드마크 좌표 추출
        eye_points = []
        for idx in indices:
            if idx < len(landmarks.landmark):
                lm = landmarks.landmark[idx]
                eye_points.append((int(lm.x * width), int(lm.y * height)))

        if len(eye_points) < 4:
            return None, None

        # Bounding box 계산
        xs = [p[0] for p in eye_points]
        ys = [p[1] for p in eye_points]

        x1, x2 = max(0, min(xs) - 10), min(width, max(xs) + 10)
        y1, y2 = max(0, min(ys) - 10), min(height, max(ys) + 10)

        if x2 <= x1 or y2 <= y1:
            return None, None

        eye_region = frame[y1:y2, x1:x2]
        return eye_region, (x1, y1, x2, y2)

    def _calculate_gaze_vector_3d(
        self,
        pupil_2d: Tuple[int, int],
        eye_center_3d: np.ndarray,
        head_pose: Dict,
        width: int,
        height: int,
        side: str
    ) -> np.ndarray:
        """
        2D 동공 위치 + 3D 눈 중심 → 3D 시선 벡터 (JEO 방식)

        핵심 아이디어:
        1. 동공 2D 위치를 카메라 역투영으로 3D 광선으로 변환
        2. 이 광선과 눈구 표면의 교점 = 동공 3D 위치
        3. 눈 중심에서 동공 3D 위치로 향하는 벡터 = 시선 벡터
        """
        # 카메라 내부 파라미터
        camera_matrix = self.head_pose_estimator.camera_matrix
        fx = camera_matrix[0, 0]
        fy = camera_matrix[1, 1]
        cx = camera_matrix[0, 2]
        cy = camera_matrix[1, 2]

        # 동공 2D → 정규화 이미지 평면 좌표
        pupil_x_norm = (pupil_2d[0] - cx) / fx
        pupil_y_norm = (pupil_2d[1] - cy) / fy

        # 카메라 좌표계에서 동공으로 향하는 광선 방향
        ray_direction = np.array([pupil_x_norm, pupil_y_norm, 1.0])
        ray_direction = ray_direction / np.linalg.norm(ray_direction)

        # 광선 시작점 (카메라 원점)
        ray_origin = np.array([0, 0, 0])

        # 눈구 중심 (월드 좌표계)
        sphere_center = eye_center_3d
        sphere_radius = self.eye_ball_radius

        # 광선-구 교차 계산 (ray casting)
        # (ray_origin + t*ray_direction - sphere_center)^2 = sphere_radius^2
        oc = ray_origin - sphere_center
        a = np.dot(ray_direction, ray_direction)
        b = 2.0 * np.dot(oc, ray_direction)
        c = np.dot(oc, oc) - sphere_radius * sphere_radius
        discriminant = b*b - 4*a*c

        if discriminant < 0:
            # 교점 없음 (오류) → 기본 정면 시선
            rotation_matrix = np.array(head_pose['rotation_matrix'])
            return rotation_matrix @ np.array([0, 0, -1])

        # 가까운 교점 사용
        t = (-b - np.sqrt(discriminant)) / (2.0 * a)
        pupil_3d = ray_origin + t * ray_direction

        # 눈 중심에서 동공 3D 위치로 향하는 벡터 = 시선 벡터
        gaze_vector = pupil_3d - sphere_center
        gaze_vector = gaze_vector / np.linalg.norm(gaze_vector)

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
        3D 시선 벡터를 화면 2D 좌표로 투영 (JEO ray-plane intersection)

        개선사항:
        1. 화면 거리 (Z축) 추정 개선
        2. Y축 스케일링 수정
        3. 원근 보정
        """
        tx, ty, tz = head_translation
        vx, vy, vz = gaze_vector

        # 화면 평면 위치 추정 (얼굴에서 약 60cm 전방)
        screen_distance = 600.0  # mm
        screen_z = tz - screen_distance

        # 시선 광선과 화면 평면 (Z = screen_z)의 교차점 계산
        if abs(vz) < 0.001:  # 거의 평행
            return (screen_width // 2, screen_height // 2)

        # t = (screen_z - tz) / vz
        t = (screen_z - tz) / vz

        # 교차점 (mm 단위)
        px = tx + t * vx
        py = ty + t * vy

        # 픽셀 좌표로 변환 (개선된 스케일링)
        # 화면 너비를 약 400mm로 가정 (일반적인 모니터)
        mm_to_pixel_x = screen_width / 400.0
        mm_to_pixel_y = screen_height / 300.0  # 화면 높이 약 300mm

        screen_x = int(px * mm_to_pixel_x + screen_width / 2)
        screen_y = int(-py * mm_to_pixel_y + screen_height / 2)  # Y축 반전

        # 화면 범위 클리핑
        screen_x = max(0, min(screen_width - 1, screen_x))
        screen_y = max(0, min(screen_height - 1, screen_y))

        return (screen_x, screen_y)

    def draw_debug_overlay(self, frame: np.ndarray, result: Optional[Dict]) -> np.ndarray:
        """
        JEO 스타일 디버그 시각화 오버레이
        - 파란색 눈 bounding box
        - 초록색 MediaPipe 랜드마크
        - 빨간색 동공 원
        - 청록색 iris 중심
        - 청록색 시선 광선 (gaze ray)
        - 노란색 화면 시선점
        - 초록색 시선 방향 십자선
        """
        debug_frame = frame.copy()
        h, w = frame.shape[:2]

        if not result:
            cv2.putText(
                debug_frame, "NO FACE DETECTED", (w // 4, h // 2),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2
            )
            return debug_frame

        # 1. MediaPipe 얼굴 랜드마크 (초록색 점)
        landmarks = self.head_pose_estimator.get_last_landmarks()
        if landmarks:
            for landmark in landmarks.landmark:
                x = int(landmark.x * w)
                y = int(landmark.y * h)
                cv2.circle(debug_frame, (x, y), 1, (0, 255, 0), -1)

        # 2. 눈 Bounding Box (파란색)
        if 'eye_boxes' in result:
            left_box = result['eye_boxes'].get('left')
            right_box = result['eye_boxes'].get('right')

            if left_box:
                x1, y1, x2, y2 = left_box
                cv2.rectangle(debug_frame, (x1, y1), (x2, y2), (255, 0, 0), 2)

            if right_box:
                x1, y1, x2, y2 = right_box
                cv2.rectangle(debug_frame, (x1, y1), (x2, y2), (255, 0, 0), 2)

        # 3. MediaPipe Iris 중심 (청록색 원)
        if result.get('iris_left_2d'):
            cx, cy = result['iris_left_2d']
            cv2.circle(debug_frame, (cx, cy), 8, (255, 255, 0), 2)  # 청록색
            cv2.putText(debug_frame, "L", (cx - 10, cy - 15),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)

        if result.get('iris_right_2d'):
            cx, cy = result['iris_right_2d']
            cv2.circle(debug_frame, (cx, cy), 8, (255, 255, 0), 2)  # 청록색
            cv2.putText(debug_frame, "R", (cx + 10, cy - 15),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)

        # 4. 동공 위치 (빨간색 원)
        if result.get('pupil_left') and 'center' in result['pupil_left']:
            cx, cy = result['pupil_left']['center']
            radius = result['pupil_left'].get('radius', 5)
            cv2.circle(debug_frame, (int(cx), int(cy)), radius, (0, 0, 255), 2)

        if result.get('pupil_right') and 'center' in result['pupil_right']:
            cx, cy = result['pupil_right']['center']
            radius = result['pupil_right'].get('radius', 5)
            cv2.circle(debug_frame, (int(cx), int(cy)), radius, (0, 0, 255), 2)

        # 5. 시선 방향 벡터 시각화 (초록색 십자선)
        if result.get('gaze_vector'):
            gaze_vec = np.array(result['gaze_vector'])

            # 얼굴 중심점 (코끝 근처)
            nose_x, nose_y = w // 2, int(h * 0.55)

            # 시선 방향으로 화살표 그리기
            arrow_length = 80
            end_x = int(nose_x + gaze_vec[0] * arrow_length)
            end_y = int(nose_y - gaze_vec[1] * arrow_length)  # Y축 반전

            cv2.arrowedLine(debug_frame, (nose_x, nose_y), (end_x, end_y),
                           (0, 255, 0), 3, tipLength=0.3)

        # 6. Head pose 정보 표시
        if result.get('head_pose'):
            pose = result['head_pose']
            info_text = [
                f"Pitch: {pose['pitch']:.1f}deg",
                f"Yaw: {pose['yaw']:.1f}deg",
                f"Roll: {pose['roll']:.1f}deg",
                f"Confidence: {result['confidence']*100:.1f}%",
                f"Gaze: ({result['gaze_vector'][0]:.2f}, {result['gaze_vector'][1]:.2f}, {result['gaze_vector'][2]:.2f})"
            ]
            for i, text in enumerate(info_text):
                cv2.putText(debug_frame, text, (10, 30 + i * 25),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        return debug_frame

    def train_calibration(self, calibration_points: List[Dict]) -> Dict[str, float]:
        """
        캘리브레이션 데이터로 개인별 보정 학습

        Args:
            calibration_points: List of calibration data points from 9-point calibration

        Returns:
            Calibration metrics (scale, offset, error)
        """
        return self.calibration_corrector.train(calibration_points)

    def map_to_screen_calibrated(
        self,
        gaze_vector: np.ndarray,
        head_translation: list,
        screen_width: int,
        screen_height: int
    ) -> Tuple[int, int]:
        """
        3D 시선 벡터 → 화면 좌표 변환 (캘리브레이션 보정 적용)

        Args:
            gaze_vector: 3D gaze direction vector
            head_translation: Head position (tx, ty, tz)
            screen_width: Screen width in pixels
            screen_height: Screen height in pixels

        Returns:
            (calibrated_x, calibrated_y) - Calibrated screen coordinates
        """
        # 1. 기본 투영
        raw_x, raw_y = self.map_to_screen(
            gaze_vector, head_translation, screen_width, screen_height
        )

        # 2. 캘리브레이션 보정 적용
        if self.calibration_corrector.is_calibrated:
            corrected_x, corrected_y = self.calibration_corrector.correct(
                float(raw_x), float(raw_y)
            )
            # 화면 범위 클리핑
            corrected_x = max(0, min(screen_width - 1, int(corrected_x)))
            corrected_y = max(0, min(screen_height - 1, int(corrected_y)))
            return (corrected_x, corrected_y)
        else:
            # 캘리브레이션 전에는 raw 값 반환
            return (raw_x, raw_y)

    def reset_calibration(self):
        """캘리브레이션 리셋"""
        self.calibration_corrector.reset()
