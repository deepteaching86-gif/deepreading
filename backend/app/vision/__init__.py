"""
Vision Tracking Module
=====================

Real-time eye tracking system using OpenCV and MediaPipe.
Based on JEO EyeTracker 3D tracking algorithms.
"""

from .pupil_detector import OrloskyPupilDetector
from .head_pose import HeadPoseEstimator
from .tracker import VisionTracker

__all__ = [
    "OrloskyPupilDetector",
    "HeadPoseEstimator",
    "VisionTracker",
]
