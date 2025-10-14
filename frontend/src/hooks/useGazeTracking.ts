// useGazeTracking Hook
// Real-time gaze tracking using TensorFlow.js + MediaPipe Face Landmarks Detection

import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as tf from '@tensorflow/tfjs';
import { GazePoint, GazeType, GazeEstimation, FaceLandmarks } from '../types/vision.types';

interface UseGazeTrackingOptions {
  enabled: boolean;
  onGazePoint?: (point: GazePoint) => void;
  calibrationMatrix?: number[][]; // 3x3 affine transformation matrix
  targetFPS?: number; // Default 30 FPS
}

interface UseGazeTrackingReturn {
  isInitialized: boolean;
  isTracking: boolean;
  error: string | null;
  currentGaze: GazeEstimation | null;
  fps: number;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
}

export const useGazeTracking = (
  options: UseGazeTrackingOptions
): UseGazeTrackingReturn => {
  const { enabled, onGazePoint, calibrationMatrix, targetFPS = 30 } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentGaze, setCurrentGaze] = useState<GazeEstimation | null>(null);
  const [fps, setFps] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fpsCounterRef = useRef({ frames: 0, lastTime: Date.now() });
  const lastGazeRef = useRef<{ x: number; y: number; timestamp: number } | null>(null);

  // Initialize TensorFlow.js and MediaPipe
  const initialize = useCallback(async () => {
    try {
      // Load TensorFlow.js backend
      await tf.ready();
      console.log('✅ TensorFlow.js ready');

      // Create MediaPipe Face Landmarks detector with tfjs runtime
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig = {
        runtime: 'tfjs',
        refineLandmarks: true, // Enable iris tracking
        maxFaces: 1
      };

      const detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
      detectorRef.current = detector;
      console.log('✅ MediaPipe Face Mesh loaded');

      setIsInitialized(true);
      setError(null);
    } catch (err) {
      console.error('❌ Failed to initialize gaze tracking:', err);
      setError('시선 추적 초기화 실패. 페이지를 새로고침하세요.');
      setIsInitialized(false);
    }
  }, []);

  // Start camera and tracking
  const startTracking = useCallback(async () => {
    if (!detectorRef.current) {
      await initialize();
    }

    if (!detectorRef.current) {
      setError('Face detector not initialized');
      return;
    }

    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setIsTracking(true);
      setError(null);
      console.log('✅ Camera started');
    } catch (err) {
      console.error('❌ Camera access denied:', err);
      setError('카메라 접근 권한이 필요합니다.');
      setIsTracking(false);
    }
  }, [initialize]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsTracking(false);
    console.log('🛑 Tracking stopped');
  }, []);

  // Detect face landmarks and estimate gaze
  const detectAndEstimateGaze = useCallback(async () => {
    if (!detectorRef.current || !videoRef.current || !isTracking) {
      return;
    }

    const video = videoRef.current;

    // Wait for video to be ready
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      // Video not ready yet, try again next frame
      animationFrameRef.current = window.requestAnimationFrame(detectAndEstimateGaze);
      return;
    }

    // Detect face landmarks
    const faces = await detectorRef.current.estimateFaces(video, {
      flipHorizontal: false
    });

    if (faces.length === 0) {
      // No face detected
      setCurrentGaze(null);
      return;
    }

    const face = faces[0];
    const keypoints = face.keypoints;

    // Extract eye and iris landmarks
    // MediaPipe Face Mesh indices:
    // Left eye: 33, 133, 159, 145, 469-477 (iris)
    // Right eye: 263, 362, 386, 374, 474-482 (iris)
    const leftEyeCenter = keypoints[33]; // Left eye outer corner
    const rightEyeCenter = keypoints[263]; // Right eye outer corner
    const leftIris = keypoints[468]; // Left iris center
    const rightIris = keypoints[473]; // Right iris center
    const noseTip = keypoints[1]; // Nose tip

    if (!leftIris || !rightIris) {
      return;
    }

    const landmarks: FaceLandmarks = {
      leftEye: { x: leftEyeCenter.x, y: leftEyeCenter.y },
      rightEye: { x: rightEyeCenter.x, y: rightEyeCenter.y },
      leftIris: { x: leftIris.x, y: leftIris.y },
      rightIris: { x: rightIris.x, y: rightIris.y },
      noseTip: { x: noseTip.x, y: noseTip.y }
    };

    // Estimate gaze position on screen
    const gaze = estimateGazeFromLandmarks(landmarks, video.videoWidth, video.videoHeight);

    // Apply calibration transformation if available
    let calibratedX = gaze.x;
    let calibratedY = gaze.y;

    if (calibrationMatrix) {
      const transformed = applyAffineTransform(gaze.x, gaze.y, calibrationMatrix);
      calibratedX = transformed.x;
      calibratedY = transformed.y;
    }

    const gazeEstimation: GazeEstimation = {
      x: calibratedX,
      y: calibratedY,
      confidence: gaze.confidence,
      landmarks
    };

    setCurrentGaze(gazeEstimation);

    // Classify gaze type and create GazePoint
    const timestamp = Date.now();
    const gazeType = classifyGazeType(
      calibratedX,
      calibratedY,
      lastGazeRef.current,
      timestamp
    );

    const gazePoint: GazePoint = {
      timestamp,
      x: calibratedX,
      y: calibratedY,
      confidence: gaze.confidence,
      type: gazeType
    };

    lastGazeRef.current = { x: calibratedX, y: calibratedY, timestamp };

    // Callback with gaze point
    if (onGazePoint) {
      onGazePoint(gazePoint);
    }

    // Update FPS counter
    fpsCounterRef.current.frames++;
    const now = Date.now();
    if (now - fpsCounterRef.current.lastTime >= 1000) {
      setFps(fpsCounterRef.current.frames);
      fpsCounterRef.current = { frames: 0, lastTime: now };
    }

    // Schedule next frame
    const frameDelay = 1000 / targetFPS;
    animationFrameRef.current = window.requestAnimationFrame(() => {
      setTimeout(detectAndEstimateGaze, frameDelay);
    });
  }, [isTracking, onGazePoint, calibrationMatrix, targetFPS]);

  // Start detection loop when tracking starts
  useEffect(() => {
    if (isTracking && enabled) {
      detectAndEstimateGaze();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isTracking, enabled, detectAndEstimateGaze]);

  // Initialize on mount
  useEffect(() => {
    if (enabled) {
      initialize();
    }

    return () => {
      stopTracking();
    };
  }, [enabled, initialize, stopTracking]);

  return {
    isInitialized,
    isTracking,
    error,
    currentGaze,
    fps,
    videoRef,
    canvasRef,
    startTracking,
    stopTracking
  };
};

// Helper: Estimate gaze from face landmarks
function estimateGazeFromLandmarks(
  landmarks: FaceLandmarks,
  videoWidth: number,
  videoHeight: number
): { x: number; y: number; confidence: number } {
  // Calculate average iris position
  const avgIrisX = (landmarks.leftIris.x + landmarks.rightIris.x) / 2;
  const avgIrisY = (landmarks.leftIris.y + landmarks.rightIris.y) / 2;

  // Normalize to screen coordinates (0-1)
  const x = avgIrisX / videoWidth;
  const y = avgIrisY / videoHeight;

  // Calculate confidence based on landmark stability
  const confidence = 0.85; // Simplified - in production, use landmark confidence

  return { x, y, confidence };
}

// Helper: Apply affine transformation matrix
function applyAffineTransform(
  x: number,
  y: number,
  matrix: number[][]
): { x: number; y: number } {
  // [x']   [m00 m01 m02]   [x]
  // [y'] = [m10 m11 m12] * [y]
  // [1 ]   [0   0   1  ]   [1]
  const transformedX = matrix[0][0] * x + matrix[0][1] * y + matrix[0][2];
  const transformedY = matrix[1][0] * x + matrix[1][1] * y + matrix[1][2];

  return { x: transformedX, y: transformedY };
}

// Helper: Classify gaze type (fixation, saccade, blink)
function classifyGazeType(
  x: number,
  y: number,
  lastGaze: { x: number; y: number; timestamp: number } | null,
  timestamp: number
): GazeType {
  if (!lastGaze) {
    return GazeType.FIXATION;
  }

  const dx = Math.abs(x - lastGaze.x);
  const dy = Math.abs(y - lastGaze.y);
  const distance = Math.sqrt(dx * dx + dy * dy);
  const timeDiff = (timestamp - lastGaze.timestamp) / 1000; // seconds

  // Check if off-page (outside 0-1 range)
  if (x < -0.1 || x > 1.1 || y < -0.1 || y > 1.1) {
    return GazeType.OFF_PAGE;
  }

  // Classify based on velocity
  const velocity = timeDiff > 0 ? distance / timeDiff : 0;

  // Saccade: fast movement (> 1.0 normalized units/second)
  if (velocity > 1.0) {
    return GazeType.SACCADE;
  }

  // Fixation: slow/no movement
  return GazeType.FIXATION;
}
