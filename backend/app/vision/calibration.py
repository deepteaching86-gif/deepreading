"""
Calibration-based Gaze Correction Module
=========================================

개인별 시선 보정 시스템 (9-point calibration 활용)
"""
import numpy as np
from typing import List, Dict, Tuple, Optional


class CalibrationCorrector:
    """
    9-point 캘리브레이션 기반 시선 보정 클래스

    개인별 시선 특성(오프셋, 스케일)을 학습하여 정확도 향상
    """

    def __init__(self):
        self.scale_x: Optional[float] = None
        self.scale_y: Optional[float] = None
        self.offset_x: Optional[float] = None
        self.offset_y: Optional[float] = None
        self.y_anatomical_offset: float = 0.0
        self.is_calibrated: bool = False

    def train(self, calibration_points: List[Dict]) -> Dict[str, float]:
        """
        캘리브레이션 데이터로 개인별 보정 계수 계산

        Args:
            calibration_points: [{
                "screen_x": float,  # 목표 화면 좌표
                "screen_y": float,
                "gaze_x": float,    # 실제 측정 시선
                "gaze_y": float,
                "timestamp": int
            }]

        Returns:
            {
                "scale_x": float,
                "scale_y": float,
                "offset_x": float,
                "offset_y": float,
                "anatomical_offset_y": float,
                "error_mean": float,  # 평균 오차 (pixels)
                "error_std": float    # 오차 표준편차
            }
        """
        if len(calibration_points) < 5:
            raise ValueError(f"Need at least 5 calibration points, got {len(calibration_points)}")

        # Extract coordinates
        screen_x = np.array([p['screen_x'] for p in calibration_points])
        screen_y = np.array([p['screen_y'] for p in calibration_points])
        gaze_x = np.array([p['gaze_x'] for p in calibration_points])
        gaze_y = np.array([p['gaze_y'] for p in calibration_points])

        # X-axis linear regression: screen_x = scale_x * gaze_x + offset_x
        self.scale_x, self.offset_x = np.polyfit(gaze_x, screen_x, 1)

        # Y-axis linear regression: screen_y = scale_y * gaze_y + offset_y
        self.scale_y, self.offset_y = np.polyfit(gaze_y, screen_y, 1)

        # Anatomical Y-axis correction
        # 화면 중앙(±15%)을 볼 때의 평균 오프셋 계산
        screen_height = np.max(screen_y)
        center_mask = (screen_y > screen_height * 0.35) & (screen_y < screen_height * 0.65)

        if np.sum(center_mask) > 0:
            center_gaze_y = gaze_y[center_mask]
            center_screen_y = screen_y[center_mask]
            target_y = screen_height * 0.5
            avg_gaze_y = np.mean(center_gaze_y)
            avg_screen_y = np.mean(center_screen_y)

            # 실제 중앙값과 목표 중앙값의 차이
            self.y_anatomical_offset = target_y - avg_screen_y
        else:
            self.y_anatomical_offset = 0.0

        # Calculate error metrics
        corrected_x = self.scale_x * gaze_x + self.offset_x
        corrected_y = self.scale_y * gaze_y + self.offset_y + self.y_anatomical_offset

        errors = np.sqrt((screen_x - corrected_x)**2 + (screen_y - corrected_y)**2)
        error_mean = float(np.mean(errors))
        error_std = float(np.std(errors))

        self.is_calibrated = True

        print(f"✅ Calibration trained:")
        print(f"   X: scale={self.scale_x:.3f}, offset={self.offset_x:.1f}px")
        print(f"   Y: scale={self.scale_y:.3f}, offset={self.offset_y:.1f}px")
        print(f"   Anatomical Y offset: {self.y_anatomical_offset:.1f}px")
        print(f"   Error: {error_mean:.1f}px ± {error_std:.1f}px")

        return {
            "scale_x": float(self.scale_x),
            "scale_y": float(self.scale_y),
            "offset_x": float(self.offset_x),
            "offset_y": float(self.offset_y),
            "anatomical_offset_y": float(self.y_anatomical_offset),
            "error_mean": error_mean,
            "error_std": error_std
        }

    def correct(self, raw_gaze_x: float, raw_gaze_y: float) -> Tuple[float, float]:
        """
        시선 좌표 보정

        Args:
            raw_gaze_x: 보정 전 X 좌표
            raw_gaze_y: 보정 전 Y 좌표

        Returns:
            (corrected_x, corrected_y)
        """
        if not self.is_calibrated:
            # No calibration yet, return raw values
            return raw_gaze_x, raw_gaze_y

        # Apply linear correction with anatomical offset
        corrected_x = self.scale_x * raw_gaze_x + self.offset_x
        corrected_y = self.scale_y * raw_gaze_y + self.offset_y + self.y_anatomical_offset

        return corrected_x, corrected_y

    def reset(self):
        """캘리브레이션 리셋"""
        self.scale_x = None
        self.scale_y = None
        self.offset_x = None
        self.offset_y = None
        self.y_anatomical_offset = 0.0
        self.is_calibrated = False
        print("🔄 Calibration reset")


def estimate_face_distance(
    face_width_pixels: int,
    camera_width_pixels: int,
    camera_fov_horizontal: float = 60.0
) -> float:
    """
    얼굴 너비로 카메라와의 거리 추정

    Args:
        face_width_pixels: 얼굴 bounding box 너비 (pixels)
        camera_width_pixels: 카메라 이미지 너비 (pixels)
        camera_fov_horizontal: 카메라 수평 FOV (degrees)

    Returns:
        거리 (cm)
    """
    # 평균 성인 얼굴 너비: 14cm
    AVERAGE_FACE_WIDTH_CM = 14.0

    # Camera FOV를 radians로 변환
    fov_rad = np.deg2rad(camera_fov_horizontal)

    # Focal length in pixels
    focal_length_pixels = (camera_width_pixels / 2.0) / np.tan(fov_rad / 2.0)

    # Distance = (Real Width * Focal Length) / Pixel Width
    distance_cm = (AVERAGE_FACE_WIDTH_CM * focal_length_pixels) / face_width_pixels

    return distance_cm
