"""
JEO OrloskyPupilDetector 포팅
안경 반사광 제거 및 정밀 동공 검출
"""
import cv2
import numpy as np
from typing import Optional, Dict, Tuple

class OrloskyPupilDetector:
    """JEO의 동공 검출 알고리즘 (안경 반사광 대응)"""

    def __init__(self):
        self.min_pupil_radius = 10
        self.max_pupil_radius = 30

    def detect(self, eye_region: np.ndarray) -> Optional[Dict]:
        """
        눈 영역에서 동공 검출

        Args:
            eye_region: 눈 영역 이미지 (BGR)

        Returns:
            {"center": (x, y), "radius": r, "confidence": 0.0-1.0}
        """
        if eye_region is None or eye_region.size == 0:
            return None

        # 1. 그레이스케일 변환
        gray = cv2.cvtColor(eye_region, cv2.COLOR_BGR2GRAY)

        # 2. 반사광 제거 (JEO 방식)
        gray = self._remove_glare(gray)

        # 3. 가우시안 블러
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # 4. 적응형 임계값 (JEO 특징)
        binary = cv2.adaptiveThreshold(
            blurred, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV, 11, 2
        )

        # 5. Morphological operations (JEO)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

        # 6. Contour 기반 동공 검출
        contours, _ = cv2.findContours(
            binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        return self._select_best_pupil(contours, eye_region.shape)

    def _remove_glare(self, gray: np.ndarray) -> np.ndarray:
        """안경 반사광 제거 (JEO 알고리즘)"""
        # 매우 밝은 영역 마스크 (반사광)
        _, glare_mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)

        # Morphological opening으로 노이즈 제거
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        glare_mask = cv2.morphologyEx(glare_mask, cv2.MORPH_OPEN, kernel)

        # Inpainting으로 반사광 제거
        result = cv2.inpaint(gray, glare_mask, 3, cv2.INPAINT_TELEA)

        return result

    def _select_best_pupil(
        self, contours, image_shape: Tuple[int, int]
    ) -> Optional[Dict]:
        """가장 동공 같은 컨투어 선택"""
        best_pupil = None
        max_score = 0

        h, w = image_shape[:2]
        image_center = (w // 2, h // 2)

        for contour in contours:
            # 면적 필터
            area = cv2.contourArea(contour)
            if area < 100 or area > 2000:
                continue

            # 타원 피팅
            if len(contour) < 5:
                continue

            try:
                ellipse = cv2.fitEllipse(contour)
                (cx, cy), (ma, mi), angle = ellipse
            except:
                continue

            # 원형도 계산
            if ma == 0:
                continue
            circularity = min(ma, mi) / max(ma, mi)
            if circularity < 0.7:  # 너무 찌그러진 것 제외
                continue

            # 중심부에 있을수록 높은 점수
            dist_to_center = np.sqrt((cx - image_center[0])**2 +
                                     (cy - image_center[1])**2)
            center_score = 1.0 / (1.0 + dist_to_center / 50)

            # 종합 점수
            score = circularity * 0.6 + center_score * 0.4

            if score > max_score:
                max_score = score
                radius = (ma + mi) / 4  # 평균 반지름
                best_pupil = {
                    "center": (int(cx), int(cy)),
                    "radius": int(radius),
                    "confidence": score
                }

        return best_pupil
