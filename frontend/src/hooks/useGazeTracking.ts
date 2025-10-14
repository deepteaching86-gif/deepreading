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
  onFacePosition?: (position: { x: number; y: number; width: number; height: number }) => void; // Face position callback
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
  const { enabled, onGazePoint, calibrationMatrix, targetFPS = 30, onFacePosition } = options;

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
      console.log('🔧 Starting TensorFlow.js initialization...');

      // Detect if running on iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      console.log('📱 Platform detection:', { isIOS, userAgent: navigator.userAgent });

      // For iOS, try to set backend explicitly
      if (isIOS) {
        console.log('🍎 iOS detected, attempting to set WASM backend...');
        try {
          await tf.setBackend('wasm');
          console.log('✅ WASM backend set successfully');
        } catch (wasmError) {
          console.warn('⚠️ WASM backend failed, trying WebGL:', wasmError);
          try {
            await tf.setBackend('webgl');
            console.log('✅ WebGL backend set successfully');
          } catch (webglError) {
            console.warn('⚠️ WebGL backend failed, using default:', webglError);
          }
        }
      }

      // Load TensorFlow.js backend
      await tf.ready();
      const backend = tf.getBackend();
      console.log('✅ TensorFlow.js ready with backend:', backend);

      // Create MediaPipe Face Landmarks detector with tfjs runtime
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig = {
        runtime: 'tfjs',
        refineLandmarks: true, // Enable iris tracking
        maxFaces: 1
      };

      console.log('🔧 Creating face detector...');
      const detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
      detectorRef.current = detector;
      console.log('✅ MediaPipe Face Mesh loaded successfully');

      setIsInitialized(true);
      setError(null);
    } catch (err) {
      console.error('❌ Failed to initialize gaze tracking:', err);
      console.error('❌ Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      setError('시선 추적 초기화 실패. 페이지를 새로고침하세요.');
      setIsInitialized(false);
    }
  }, []);

  // Start camera and tracking
  const startTracking = useCallback(async () => {
    if (!detectorRef.current) {
      console.log('🔧 Detector not initialized, initializing...');
      await initialize();
    }

    if (!detectorRef.current) {
      console.error('❌ Face detector not initialized after initialization attempt');
      setError('Face detector not initialized');
      return;
    }

    try {
      console.log('📹 Requesting camera access...');

      // Detect if running on iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      // iOS-optimized camera constraints
      const constraints: MediaStreamConstraints = {
        video: isIOS ? {
          facingMode: 'user',
          width: { ideal: 640 },  // Lower resolution for iOS
          height: { ideal: 480 },
          frameRate: { ideal: 30, max: 30 }
        } : {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      console.log('📹 Camera constraints:', constraints);

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Camera stream obtained:', {
        active: stream.active,
        tracks: stream.getTracks().length,
        videoTracks: stream.getVideoTracks().length
      });

      streamRef.current = stream;

      if (videoRef.current) {
        console.log('📹 Setting video srcObject...');
        videoRef.current.srcObject = stream;

        // iOS requires explicit play() call with user interaction
        try {
          // Set attributes for iOS compatibility
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('autoplay', 'true');
          videoRef.current.muted = true; // Required for autoplay on iOS

          await videoRef.current.play();
          console.log('✅ Video playback started:', {
            readyState: videoRef.current.readyState,
            videoWidth: videoRef.current.videoWidth,
            videoHeight: videoRef.current.videoHeight
          });
        } catch (playError) {
          console.error('❌ Video play error:', playError);
          // Sometimes iOS needs a moment before play() works
          setTimeout(async () => {
            try {
              await videoRef.current?.play();
              console.log('✅ Video playback started on retry');
            } catch (retryError) {
              console.error('❌ Video play retry failed:', retryError);
            }
          }, 100);
        }
      }

      setIsTracking(true);
      setError(null);
      console.log('✅ Camera started successfully');
    } catch (err) {
      console.error('❌ Camera access error:', err);
      console.error('❌ Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
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
      console.log('⏭️ Skipping detection:', {
        hasDetector: !!detectorRef.current,
        hasVideo: !!videoRef.current,
        isTracking
      });
      return;
    }

    const video = videoRef.current;

    // Wait for video to be ready
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('⏳ Video not ready:', {
        readyState: video.readyState,
        width: video.videoWidth,
        height: video.videoHeight
      });
      // Video not ready yet, try again next frame
      animationFrameRef.current = window.requestAnimationFrame(detectAndEstimateGaze);
      return;
    }

    // Detect face landmarks
    let faces;
    try {
      faces = await detectorRef.current.estimateFaces(video, {
        flipHorizontal: false
      });
    } catch (error) {
      console.error('❌ Face detection error:', error);
      // Schedule next frame
      animationFrameRef.current = window.requestAnimationFrame(detectAndEstimateGaze);
      return;
    }

    if (faces.length === 0) {
      // No face detected
      console.log('👤 No face detected');
      setCurrentGaze(null);
      // Schedule next frame
      animationFrameRef.current = window.requestAnimationFrame(detectAndEstimateGaze);
      return;
    }

    console.log('✅ Face detected!');

    const face = faces[0];
    const keypoints = face.keypoints;

    console.log('✅ Face detected, total keypoints:', keypoints.length);

    // Calculate face bounding box for position visualization
    if (face.box) {
      const { xMin, yMin, width, height } = face.box;
      // Normalize to 0-1 range
      const normalizedBox = {
        x: (xMin + width / 2) / video.videoWidth, // Center X
        y: (yMin + height / 2) / video.videoHeight, // Center Y
        width: width / video.videoWidth,
        height: height / video.videoHeight
      };

      console.log('📦 Face position:', normalizedBox);

      if (onFacePosition) {
        onFacePosition(normalizedBox);
      }
    }

    // Extract eye and iris landmarks
    // MediaPipe Face Mesh indices:
    // Left eye: 33, 133, 159, 145
    // Right eye: 263, 362, 386, 374
    // With refineLandmarks, iris points are at the end (468-477 for tfjs runtime)
    const leftEyeCenter = keypoints[33]; // Left eye outer corner
    const rightEyeCenter = keypoints[263]; // Right eye outer corner
    const noseTip = keypoints[1]; // Nose tip

    // For iris, check if we have refined landmarks (478+ keypoints)
    let leftIris, rightIris;
    if (keypoints.length >= 478) {
      // Refined landmarks available - iris at indices 468-477
      leftIris = keypoints[468]; // Left iris center
      rightIris = keypoints[473]; // Right iris center
      console.log('👁️ Using iris landmarks (refined)');
    } else {
      // Fall back to eye center approximation
      leftIris = keypoints[468] || keypoints[33]; // Use eye corner if iris not available
      rightIris = keypoints[473] || keypoints[263];
      console.log('⚠️ Iris not available, using eye centers');
    }

    if (!leftIris || !rightIris) {
      console.warn('❌ No eye landmarks found');
      // Schedule next frame
      animationFrameRef.current = window.requestAnimationFrame(detectAndEstimateGaze);
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
    console.log('🎯 Gaze updated:', { x: calibratedX.toFixed(2), y: calibratedY.toFixed(2), confidence: gaze.confidence });

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

    // Schedule next frame immediately for maximum FPS
    animationFrameRef.current = window.requestAnimationFrame(detectAndEstimateGaze);
  }, [isTracking, onGazePoint, calibrationMatrix, targetFPS, onFacePosition]);

  // Start detection loop when tracking starts
  useEffect(() => {
    if (isTracking && enabled) {
      console.log('🔄 Starting detection loop');
      detectAndEstimateGaze();
    } else {
      console.log('⏸️ Detection loop not started:', { isTracking, enabled });
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
