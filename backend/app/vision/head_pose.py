"""
3D 헤드 포즈 추정 (MediaPipe Face Mesh 기반)
JEO의 3D gaze ray computation 방식 적용
"""
import mediapipe as mp
import numpy as np
import cv2
from typing import Tuple, Optional, Dict

class HeadPoseEstimator:
    """3D 헤드 포즈 추정 (pitch, yaw, roll)"""

    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

        # 카메라 매트릭스 (기본값, 나중에 캘리브레이션으로 개선)
        self.camera_matrix = None
        self.dist_coeffs = np.zeros((4, 1))

        # 디버그용: 마지막 얼굴 랜드마크 저장
        self.last_face_landmarks = None

    def estimate(self, frame: np.ndarray) -> Optional[Dict]:
        """
        프레임에서 헤드 포즈 추정

        Returns:
            {
                "pitch": float,  # X축 회전 (위/아래)
                "yaw": float,    # Y축 회전 (좌/우)
                "roll": float,   # Z축 회전 (기울기)
                "translation": (x, y, z)
            }
        """
        # MediaPipe 처리
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)

        if not results.multi_face_landmarks:
            self.last_face_landmarks = None
            return None

        # 첫 번째 얼굴 사용
        face_landmarks = results.multi_face_landmarks[0]
        self.last_face_landmarks = face_landmarks  # 디버그용 저장

        # 카메라 매트릭스 초기화 (처음 한번)
        h, w = frame.shape[:2]
        if self.camera_matrix is None:
            focal_length = w
            center = (w / 2, h / 2)
            self.camera_matrix = np.array([
                [focal_length, 0, center[0]],
                [0, focal_length, center[1]],
                [0, 0, 1]
            ], dtype=np.float64)

        # PnP로 3D 포즈 계산
        return self._solve_pnp(face_landmarks, w, h)

    def _solve_pnp(
        self, face_landmarks, width: int, height: int
    ) -> Dict:
        """
        Perspective-n-Point 알고리즘으로 3D 포즈 계산
        """
        # 6개 주요 얼굴 포인트 (3D 모델)
        model_points = np.array([
            (0.0, 0.0, 0.0),             # 코끝
            (0.0, -330.0, -65.0),        # 턱
            (-225.0, 170.0, -135.0),     # 왼쪽 눈 외측
            (225.0, 170.0, -135.0),      # 오른쪽 눈 외측
            (-150.0, -150.0, -125.0),    # 왼쪽 입꼬리
            (150.0, -150.0, -125.0)      # 오른쪽 입꼬리
        ])

        # 2D 이미지 포인트 추출 (MediaPipe 랜드마크)
        image_points = np.array([
            self._get_landmark_coords(face_landmarks.landmark[1], width, height),    # 코끝
            self._get_landmark_coords(face_landmarks.landmark[152], width, height),  # 턱
            self._get_landmark_coords(face_landmarks.landmark[226], width, height),  # 왼쪽 눈
            self._get_landmark_coords(face_landmarks.landmark[446], width, height),  # 오른쪽 눈
            self._get_landmark_coords(face_landmarks.landmark[57], width, height),   # 왼쪽 입
            self._get_landmark_coords(face_landmarks.landmark[287], width, height)   # 오른쪽 입
        ], dtype=np.float64)

        # solvePnP로 회전/이동 벡터 계산
        success, rotation_vec, translation_vec = cv2.solvePnP(
            model_points,
            image_points,
            self.camera_matrix,
            self.dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE
        )

        if not success:
            return None

        # 회전 벡터 → 오일러 각도 (pitch, yaw, roll)
        rotation_mat, _ = cv2.Rodrigues(rotation_vec)
        pose_mat = cv2.hconcat((rotation_mat, translation_vec))
        _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(pose_mat)

        pitch, yaw, roll = euler_angles.flatten()[:3]

        return {
            "pitch": float(pitch),
            "yaw": float(yaw),
            "roll": float(roll),
            "translation": translation_vec.flatten().tolist(),
            "rotation_matrix": rotation_mat.tolist()
        }

    def _get_landmark_coords(self, landmark, width: int, height: int) -> Tuple[float, float]:
        """MediaPipe 랜드마크를 픽셀 좌표로 변환"""
        return (landmark.x * width, landmark.y * height)

    def get_last_landmarks(self):
        """디버그용: 마지막으로 감지된 얼굴 랜드마크 반환"""
        return self.last_face_landmarks
