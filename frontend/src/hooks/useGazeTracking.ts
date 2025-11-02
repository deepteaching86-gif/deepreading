// useGazeTracking Hook v3 - Hybrid Gaze Tracking
// Real-time gaze tracking using @mediapipe/tasks-vision (official MediaPipe package)
// Now with 3D tracking support based on JEOresearch approach
// ✨ NEW: Hybrid algorithm fusion (MediaPipe + OpenCV + 3D Model)

import { useState, useEffect, useRef, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { GazePoint, GazeType, GazeEstimation, FaceLandmarks } from '../types/vision.types';
import { ConcentrationRawData } from '../types/concentration.types';
import { AdaptiveKalmanFilter } from '../utils/kalmanFilter';
import { loadCalibration, applyCalibrationModel, PolynomialRegressionModel } from '../utils/gazeCalibration';
import {
  Point3D,
  Vector3D,
  FaceCoordinateSystem,
  EyeSphereTracker,
  GazeSmoother,
  NOSE_LANDMARK_INDICES,
  DEFAULT_VIRTUAL_MONITOR,
  computeFaceCoordinateSystem,
  computeCombinedGaze,
  computeMonitorIntersection,
  intersectionToScreenCoords,
  formatPoint3D,
  formatVector3D,
  addPoints,
  subtractPoints,
  multiplyScalar,
  normalize
} from '../utils/gazeTracking3D';
import { OpenCVPupilDetector } from '../utils/opencvPupilDetector';
import { HybridGazeEstimator, HybridGazeInput, pupilToGaze } from '../utils/hybridGazeEstimator';
import { VerticalGazeCorrector } from '../utils/verticalGazeCorrection';
// ✨ Phase 3: Performance Optimization Components
import { getWorkerManager, OpenCVWorkerManager } from '../utils/opencvWorkerManager';
import { AdaptiveROIOptimizer } from '../utils/adaptiveROI';
import { AdaptiveFrameSkipper } from '../utils/adaptiveFrameSkip';
// MatPool import removed - MatPool is managed inside Worker
// ✨ Phase 8-2: Ellipse Fitting for Precise Iris Tracking
import { extractBothEyesIrisData, type IrisData } from '../lib/gaze/irisTracking';

interface UseGazeTrackingOptions {
  enabled: boolean;
  onGazePoint?: (point: GazePoint) => void;
  calibrationMatrix?: number[][]; // 3x3 affine transformation matrix
  targetFPS?: number; // Default 30 FPS
  onFacePosition?: (position: { x: number; y: number; width: number; height: number }) => void; // Face position callback
  onRawGazeData?: (data: {
    irisOffset: { x: number; y: number };
    headPose: { yaw: number; pitch: number };
    timestamp: number;
  }) => void; // Raw iris offset and head pose callback (for calibration)
  onConcentrationData?: (data: ConcentrationRawData) => void; // 집중력 분석용 원시 데이터 콜백
  onMediaPipeData?: (data: {
    faceLandmarks: Array<{ x: number; y: number; z: number }>;
    irisLandmarks: { left: Array<{ x: number; y: number; z: number }>; right: Array<{ x: number; y: number; z: number }> };
    headPose: { pitch: number; yaw: number; roll: number };
  }) => void; // ML 데이터 수집용 전체 MediaPipe 랜드마크
  use3DTracking?: boolean; // Enable 3D tracking mode (default: true - 3D only mode)
  enableHybridMode?: boolean; // ✨ NEW: Enable hybrid gaze fusion (MediaPipe + OpenCV + 3D Model) (default: false)
  enableVerticalCorrection?: boolean; // ✨ NEW: Enable vertical gaze correction (default: false)
  // ✨ Phase 3: Performance Optimization Options
  enableWebWorker?: boolean; // Enable Web Worker for background OpenCV processing (default: false)
  enableROIOptimization?: boolean; // Enable adaptive ROI optimization (default: false)
  enableFrameSkip?: boolean; // Enable adaptive frame skipping (default: false)
  performanceMode?: 'performance' | 'balanced' | 'quality'; // Performance mode preset (default: 'balanced')
  disableVisualization?: boolean; // ✨ DEBUG: Disable automatic canvas visualization (default: false)
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
  const {
    enabled, onGazePoint, calibrationMatrix, onFacePosition, onRawGazeData, onConcentrationData, onMediaPipeData,
    use3DTracking = true,
    enableHybridMode = false,
    enableVerticalCorrection = false,
    // Phase 3 options
    enableWebWorker = false,
    enableROIOptimization = false,
    enableFrameSkip = false,
    performanceMode = 'balanced',
    disableVisualization = false
  } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentGaze, setCurrentGaze] = useState<GazeEstimation | null>(null);
  const currentGazeRayRef = useRef<{ origin: Point3D; direction: Vector3D } | null>(null);
  const [fps, setFps] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fpsCounterRef = useRef({ frames: 0, lastTime: Date.now() });
  const lastGazeRef = useRef<{ x: number; y: number; timestamp: number } | null>(null);

  // Kalman Filter for noise reduction (replaces EMA)
  const kalmanFilterRef = useRef<AdaptiveKalmanFilter>(new AdaptiveKalmanFilter({
    processNoise: 0.001,
    measurementNoise: 0.05,
    initialCovariance: 1.0
  }));

  // Calibration model
  const calibrationModelRef = useRef<PolynomialRegressionModel | null>(null);

  // 3D Tracking System References
  const eyeSphereTrackerRef = useRef<EyeSphereTracker>(new EyeSphereTracker());
  const gazeSmoother3DRef = useRef<GazeSmoother>(new GazeSmoother(10)); // JEOresearch: filter_length=10
  const previousFaceAxesRef = useRef<FaceCoordinateSystem | null>(null);
  const is3DCalibrated = useRef(false);
  const frameCounter3D = useRef(0); // For debugging and performance control

  // ✨ NEW: Hybrid Gaze Tracking System References
  const opencvPupilDetectorRef = useRef<OpenCVPupilDetector | null>(null);
  const hybridGazeEstimatorRef = useRef<HybridGazeEstimator>(new HybridGazeEstimator({
    baseWeights: {
      mediapipe: 0.6,  // 60% weight
      opencv: 0.25,    // 25% weight
      model3d: 0.15    // 15% weight
    },
    useDynamicWeighting: true,
    minConfidence: 0.3,
    enableMediaPipe: true,
    enableOpenCV: enableHybridMode,  // Only enable OpenCV if hybrid mode is on
    enable3DModel: use3DTracking
  }));
  const hybridModeInitialized = useRef(false);

  // ✨ NEW: Vertical Gaze Correction System References
  const verticalCorrectorRef = useRef<VerticalGazeCorrector>(new VerticalGazeCorrector({
    pitchFactor: 0.3,
    earFactor: 0.5,
    nonlinearFactor: 0.2,
    enableCorrection: enableVerticalCorrection,
    verticalThreshold: 0.3
  }));

  // ✨ Phase 3: Performance Optimization System References
  const workerManagerRef = useRef<OpenCVWorkerManager | null>(null);
  const roiOptimizerRef = useRef<AdaptiveROIOptimizer>(new AdaptiveROIOptimizer());
  const frameSkipperRef = useRef<AdaptiveFrameSkipper>(new AdaptiveFrameSkipper());
  // matPoolRef removed - MatPool is managed inside Worker
  const workerInitializedRef = useRef(false);
  const prevGazeRef = useRef<{ x: number; y: number } | null>(null);
  const prevFaceRef = useRef<{ x: number; y: number } | null>(null);

  // 3D mode is always enabled
  useEffect(() => {
    console.log('🎯 3D Tracking Mode ACTIVE - Using JEOresearch nose-based coordinate system');
    console.log('📊 3D Mode Config:', { use3DTracking, onRawGazeData: !!onRawGazeData });
  }, [use3DTracking, onRawGazeData]);

  // Initialize MediaPipe Tasks Vision
  const initialize = useCallback(async () => {
    try {
      console.log('🔧 Starting MediaPipe Tasks Vision initialization...');
      console.log('📱 Platform detection:', {
        userAgent: navigator.userAgent,
        platform: navigator.platform
      });

      // Load WASM runtime from CDN
      console.log('🔧 Loading WASM runtime...');
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      console.log('✅ WASM runtime loaded successfully');

      // Create Face Landmarker with model from Google Storage
      console.log('🔧 Creating Face Landmarker...');
      const faceLandmarker = await FaceLandmarker.createFromModelPath(
        vision,
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
      );
      console.log('✅ Face Landmarker created successfully');

      // Configure face detection options
      // CRITICAL: Must enable iris tracking for 3D mode to work (adds landmarks 468-477)
      faceLandmarker.setOptions({
        runningMode: 'VIDEO',                // REQUIRED: Set video mode for video streams
        numFaces: 1,                         // Track single face
        minFaceDetectionConfidence: 0.5,     // Lower = more sensitive detection
        minFacePresenceConfidence: 0.5,      // Lower = better tracking
        minTrackingConfidence: 0.5,          // Lower = better tracking continuity
        outputFaceBlendshapes: false,        // Don't need expression data
        outputFacialTransformationMatrixes: false  // Don't need 3D pose matrix
      });
      console.log('✅ Face Landmarker configured');

      faceLandmarkerRef.current = faceLandmarker;
      setIsInitialized(true);
      setError(null);
      console.log('✅ MediaPipe Tasks Vision initialized successfully');
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
    // If already tracking, just return
    if (isTracking && streamRef.current?.active && videoRef.current?.srcObject) {
      console.log('✅ Already tracking with active stream');
      return;
    }

    if (!faceLandmarkerRef.current) {
      console.log('🔧 Face Landmarker not initialized, initializing...');
      await initialize();
    }

    if (!faceLandmarkerRef.current) {
      console.error('❌ Face Landmarker not initialized after initialization attempt');
      setError('Face Landmarker not initialized');
      return;
    }

    // Load calibration model if available
    const storedCalibration = loadCalibration();
    if (storedCalibration) {
      calibrationModelRef.current = storedCalibration.model;
      console.log('✅ Loaded stored calibration:', {
        points: storedCalibration.points.length,
        accuracy: storedCalibration.accuracy.toFixed(4),
        order: storedCalibration.model.order
      });
    } else {
      console.log('ℹ️ No calibration model found - using raw gaze estimates');
    }

    // Reset Kalman filter and 3D tracking
    kalmanFilterRef.current.reset();
    eyeSphereTrackerRef.current.reset();
    is3DCalibrated.current = false;
    previousFaceAxesRef.current = null;

    // ✨ NEW: Initialize OpenCV Pupil Detector if hybrid mode enabled
    if (enableHybridMode && !hybridModeInitialized.current) {
      try {
        console.log('🚀 Initializing OpenCV.js for hybrid mode...');
        opencvPupilDetectorRef.current = new OpenCVPupilDetector();
        await opencvPupilDetectorRef.current.initialize();
        hybridModeInitialized.current = true;
        console.log('✅ Hybrid mode initialized successfully');
        console.log('📊 Hybrid configuration:', hybridGazeEstimatorRef.current.getConfig());
      } catch (opencvError) {
        console.error('❌ Failed to initialize OpenCV:', opencvError);
        console.warn('⚠️ Falling back to MediaPipe-only mode');
        // Update hybrid estimator to disable OpenCV
        hybridGazeEstimatorRef.current.updateConfig({
          enableOpenCV: false
        });
      }
    }

    // ✨ Phase 3: Initialize Web Worker and MatPool
    if ((enableWebWorker || enableROIOptimization) && !workerInitializedRef.current) {
      try {
        console.log('🚀 Phase 3: Initializing Web Worker and MatPool...');

        // Initialize Worker Manager
        if (enableWebWorker) {
          workerManagerRef.current = getWorkerManager();
          await workerManagerRef.current.initialize();
          console.log('✅ Web Worker initialized successfully');
        }

        // Initialize MatPool (requires OpenCV to be loaded)
        if (enableWebWorker) {
          // MatPool will be initialized inside Worker
          console.log('✅ MatPool will be managed by Worker');
        }

        workerInitializedRef.current = true;
        console.log('📊 Phase 3 Configuration:', {
          webWorker: enableWebWorker,
          roiOptimization: enableROIOptimization,
          frameSkip: enableFrameSkip,
          performanceMode
        });
      } catch (phase3Error) {
        console.error('❌ Failed to initialize Phase 3 optimizations:', phase3Error);
        console.warn('⚠️ Falling back to standard processing');
      }
    }

    // Check if stream already exists and is active
    if (streamRef.current && streamRef.current.active && videoRef.current) {
      console.log('♻️ Reusing existing camera stream');
      // Make sure video is connected to stream
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      // Ensure video is playing
      if (videoRef.current.paused) {
        try {
          await videoRef.current.play();
          console.log('✅ Video playback resumed');
        } catch (playError) {
          console.error('❌ Failed to resume video playback:', playError);
        }
      }
      setIsTracking(true);
      setError(null);
      return;
    } else {
      try {
        console.log('📹 Requesting camera access...');

        // Detect if running on iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        // iOS-optimized camera constraints
        const constraints: MediaStreamConstraints = {
          video: isIOS ? {
            facingMode: 'user',
            width: { ideal: 640 },
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

          // Wait for metadata to load before playing
          await new Promise<void>((resolve) => {
            if (videoRef.current!.readyState >= 2) {
              resolve();
            } else {
              videoRef.current!.onloadedmetadata = () => {
                console.log('✅ Video metadata loaded');
                resolve();
              };
            }
          });

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
              videoHeight: videoRef.current.videoHeight,
              paused: videoRef.current.paused,
              currentTime: videoRef.current.currentTime
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
    }

    setIsTracking(true);
    setError(null);
    console.log('✅ Camera started successfully');
  }, [initialize, isTracking]);

  // Stop tracking
  const stopTracking = useCallback((preserveStream: boolean = false) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Option to preserve stream for stage transitions
    if (!preserveStream) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    setIsTracking(false);
    console.log('🛑 Tracking stopped', preserveStream ? '(stream preserved)' : '(stream closed)');
  }, []);

  // Detect face landmarks and estimate gaze
  const detectAndEstimateGaze = useCallback(async () => {
    if (!faceLandmarkerRef.current || !videoRef.current || !isTracking) {
      console.log('⏭️ Skipping detection:', {
        hasFaceLandmarker: !!faceLandmarkerRef.current,
        hasVideo: !!videoRef.current,
        isTracking
      });
      // Keep trying if tracking is enabled
      if (isTracking) {
        animationFrameRef.current = window.requestAnimationFrame(detectAndEstimateGaze);
      }
      return;
    }

    const video = videoRef.current;

    // Check if video has valid dimensions (more reliable than readyState)
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('⏳ Video not ready:', {
        readyState: video.readyState,
        width: video.videoWidth,
        height: video.videoHeight,
        srcObject: !!video.srcObject,
        currentTime: video.currentTime
      });
      // Video not ready yet, try again next frame
      animationFrameRef.current = window.requestAnimationFrame(detectAndEstimateGaze);
      return;
    }

    // Detect face landmarks
    let result: FaceLandmarkerResult;
    try {
      // DEBUG: Log detection attempt
      if (fpsCounterRef.current.frames % 60 === 0) {
        console.log('🔍 Attempting face detection:', {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState,
          currentTime: video.currentTime
        });
      }

      // Use detectForVideo for video streams (better performance than detect())
      const timestamp = performance.now();
      result = faceLandmarkerRef.current.detectForVideo(video, timestamp);

      // DEBUG: Log detection result
      if (fpsCounterRef.current.frames % 60 === 0) {
        console.log('🔍 Detection result:', {
          hasFaceLandmarks: !!result.faceLandmarks,
          facesDetected: result.faceLandmarks?.length || 0,
          firstFacePoints: result.faceLandmarks?.[0]?.length || 0
        });
      }

      // Draw visualization on canvas (skip if disabled)
      if (canvasRef.current && !disableVisualization) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          // Match canvas size to video
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          // Draw video frame
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Draw face position guide box (center of canvas)
          const guideWidth = canvas.width * 0.4;
          const guideHeight = canvas.height * 0.6;
          const guideX = (canvas.width - guideWidth) / 2;
          const guideY = (canvas.height - guideHeight) / 2;

          // Draw guide box with dashed border
          ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 5]);
          ctx.strokeRect(guideX, guideY, guideWidth, guideHeight);
          ctx.setLineDash([]);

          // Draw guide text (normal orientation - video is already mirrored)
          ctx.save();
          ctx.font = 'bold 16px Arial';
          ctx.fillStyle = '#22c55e';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          const guideText = '👤 여기에 얼굴 위치';
          const textMetrics = ctx.measureText(guideText);
          const textX = (canvas.width - textMetrics.width) / 2;
          ctx.strokeText(guideText, textX, guideY - 10);
          ctx.fillText(guideText, textX, guideY - 10);
          ctx.restore();

          // Draw detection status (normal orientation)
          ctx.save();
          ctx.font = 'bold 20px Arial';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.fillStyle = result.faceLandmarks.length > 0 ? '#22c55e' : '#ef4444';
          const statusText = result.faceLandmarks.length > 0
            ? `✅ Face: ${result.faceLandmarks.length} | Landmarks: ${result.faceLandmarks[0]?.length || 0}`
            : '❌ No Face';
          ctx.strokeText(statusText, 10, 30);
          ctx.fillText(statusText, 10, 30);
          ctx.restore();

          // If face detected, draw landmarks
          if (result.faceLandmarks.length > 0) {
            const landmarks = result.faceLandmarks[0];

            // Convert normalized coordinates to canvas coordinates
            const toCanvasCoords = (landmark: { x: number; y: number; z: number }) => ({
              x: landmark.x * canvas.width,
              y: landmark.y * canvas.height
            });

            // Draw all landmarks as small dots
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            landmarks.forEach((landmark) => {
              const point = toCanvasCoords(landmark);
              ctx.beginPath();
              ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
              ctx.fill();
            });

            // Draw face mesh outline
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const faceOvalIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
            faceOvalIndices.forEach((idx, i) => {
              if (landmarks[idx]) {
                const point = toCanvasCoords(landmarks[idx]);
                if (i === 0) {
                  ctx.moveTo(point.x, point.y);
                } else {
                  ctx.lineTo(point.x, point.y);
                }
              }
            });
            ctx.closePath();
            ctx.stroke();

            // Draw eyes
            ctx.strokeStyle = '#22c55e';
            ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
            ctx.lineWidth = 2;

            // Left eye
            ctx.beginPath();
            const leftEyeIndices = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
            leftEyeIndices.forEach((idx, i) => {
              if (landmarks[idx]) {
                const point = toCanvasCoords(landmarks[idx]);
                if (i === 0) {
                  ctx.moveTo(point.x, point.y);
                } else {
                  ctx.lineTo(point.x, point.y);
                }
              }
            });
            ctx.closePath();
            ctx.stroke();
            ctx.fill();

            // Right eye
            ctx.beginPath();
            const rightEyeIndices = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466];
            rightEyeIndices.forEach((idx, i) => {
              if (landmarks[idx]) {
                const point = toCanvasCoords(landmarks[idx]);
                if (i === 0) {
                  ctx.moveTo(point.x, point.y);
                } else {
                  ctx.lineTo(point.x, point.y);
                }
              }
            });
            ctx.closePath();
            ctx.stroke();
            ctx.fill();

            // Helper function to get eye center approximation
            const getEyeCenter = (landmarks: any[], eye: 'left' | 'right') => {
              // MediaPipe eye landmark indices
              const eyeIndices = eye === 'left' 
                ? [33, 160, 158, 133, 153, 144] // Left eye key points
                : [362, 385, 387, 263, 373, 380]; // Right eye key points
              
              let centerX = 0;
              let centerY = 0;
              let centerZ = 0;
              let count = 0;
              
              eyeIndices.forEach(idx => {
                if (landmarks[idx]) {
                  centerX += landmarks[idx].x;
                  centerY += landmarks[idx].y;
                  centerZ += landmarks[idx].z || 0;
                  count++;
                }
              });
              
              if (count > 0) {
                return {
                  x: centerX / count,
                  y: centerY / count,
                  z: centerZ / count
                };
              }
              
              return null;
            };

            // Draw eye centers for 3D tracking (MediaPipe doesn't have iris landmarks)
            // Always draw eye centers since we use approximation for 3D
            ctx.fillStyle = '#00ffff';
            
            // Left eye center approximation
            const leftEyeCenter = getEyeCenter(landmarks, 'left');
            if (leftEyeCenter) {
              const point = toCanvasCoords(leftEyeCenter);
              ctx.beginPath();
              ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
              ctx.fill();
              
              // Draw crosshair for 3D tracking
              if (use3DTracking) {
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(point.x - 10, point.y);
                ctx.lineTo(point.x + 10, point.y);
                ctx.moveTo(point.x, point.y - 10);
                ctx.lineTo(point.x, point.y + 10);
                ctx.stroke();
              }
            }
            
            // Right eye center approximation  
            const rightEyeCenter = getEyeCenter(landmarks, 'right');
            if (rightEyeCenter) {
              const point = toCanvasCoords(rightEyeCenter);
              ctx.beginPath();
              ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
              ctx.fill();
              
              // Draw crosshair for 3D tracking
              if (use3DTracking) {
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(point.x - 10, point.y);
                ctx.lineTo(point.x + 10, point.y);
                ctx.moveTo(point.x, point.y - 10);
                ctx.lineTo(point.x, point.y + 10);
                ctx.stroke();
              }
            }

            // Draw nose tip (red)
            if (landmarks[1]) {
              const point = toCanvasCoords(landmarks[1]);
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
              ctx.fill();
            }

            // Draw status info (normal orientation - video is already mirrored)
            ctx.save();
            ctx.font = 'bold 16px Arial';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.fillStyle = '#22c55e';
            const infoText = `Landmarks: ${landmarks.length}`;
            ctx.strokeText(infoText, 10, 60);
            ctx.fillText(infoText, 10, 60);

            // 3D tracking status
            if (use3DTracking) {
              ctx.fillStyle = '#ffff00';
              const trackingText = '🎯 3D TRACKING ACTIVE';
              ctx.strokeText(trackingText, 10, 85);
              ctx.fillText(trackingText, 10, 85);
            }

            ctx.restore();
            
            // Draw 3D gaze rays and coordinate axes (JEOresearch style)
            if (use3DTracking) {
              // Draw coordinate axes on face
              const draw3DAxes = () => {
                // Get nose tip (landmark 1) as origin
                const noseTip = landmarks[1];
                if (!noseTip) return;
                
                const origin = toCanvasCoords(noseTip);
                const axisLength = 60;
                
                // X-axis (Red) - pointing right
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(origin.x, origin.y);
                ctx.lineTo(origin.x + axisLength, origin.y);
                ctx.stroke();
                
                // Y-axis (Green) - pointing down
                ctx.strokeStyle = '#00ff00';
                ctx.beginPath();
                ctx.moveTo(origin.x, origin.y);
                ctx.lineTo(origin.x, origin.y + axisLength);
                ctx.stroke();
                
                // Z-axis (Blue/Cyan) - pointing forward (simulated)
                ctx.strokeStyle = '#00ffff';
                ctx.beginPath();
                ctx.moveTo(origin.x, origin.y);
                ctx.lineTo(origin.x - axisLength * 0.5, origin.y - axisLength * 0.5);
                ctx.stroke();
                
                // Draw axis labels
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Arial';
                ctx.fillText('X', origin.x + axisLength + 5, origin.y);
                ctx.fillText('Y', origin.x, origin.y + axisLength + 15);
                ctx.fillText('Z', origin.x - axisLength * 0.5 - 15, origin.y - axisLength * 0.5 - 5);
              };
              
              // Draw 3D gaze rays from eyes
              const draw3DGazeRay = (eyeCenter: any, gazeDirection: any, color: string, label: string) => {
                if (!eyeCenter) return;
                
                const eyePoint = toCanvasCoords(eyeCenter);
                const rayLength = 200; // Extend ray 200px for better visibility
                
                // Calculate ray end point based on gaze direction
                const rayEndX = eyePoint.x + gazeDirection.x * rayLength;
                const rayEndY = eyePoint.y + gazeDirection.y * rayLength;
                
                // Draw eye sphere
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(eyePoint.x, eyePoint.y, 15, 0, Math.PI * 2);
                ctx.stroke();
                
                // Draw gaze ray
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(eyePoint.x, eyePoint.y);
                ctx.lineTo(rayEndX, rayEndY);
                ctx.stroke();
                
                // Draw arrow head
                const angle = Math.atan2(gazeDirection.y, gazeDirection.x);
                const arrowSize = 10;
                ctx.beginPath();
                ctx.moveTo(rayEndX, rayEndY);
                ctx.lineTo(
                  rayEndX - arrowSize * Math.cos(angle - Math.PI / 6),
                  rayEndY - arrowSize * Math.sin(angle - Math.PI / 6)
                );
                ctx.lineTo(
                  rayEndX - arrowSize * Math.cos(angle + Math.PI / 6),
                  rayEndY - arrowSize * Math.sin(angle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fillStyle = color;
                ctx.fill();
                
                // Draw eye label
                ctx.fillStyle = color;
                ctx.font = 'bold 10px Arial';
                ctx.fillText(label, eyePoint.x - 5, eyePoint.y - 20);
              };
              
              // Draw coordinate axes
              draw3DAxes();
              
              // Get eye positions
              const leftEyeCenter = getEyeCenter(landmarks, 'left');
              const rightEyeCenter = getEyeCenter(landmarks, 'right');
              
              // Calculate gaze directions (simplified for visualization)
              // In actual 3D tracking, these come from the ray calculations
              const leftGazeDir = { x: 0.3, y: 0.1 }; // Placeholder direction
              const rightGazeDir = { x: -0.3, y: 0.1 }; // Placeholder direction
              
              // If we have actual 3D gaze ray data, use it
              if (currentGazeRayRef.current) {
                // Use the actual gaze direction from 3D tracking
                const gazeDir = {
                  x: currentGazeRayRef.current.direction.x,
                  y: currentGazeRayRef.current.direction.y
                };
                draw3DGazeRay(leftEyeCenter, gazeDir, '#00ffff', 'L');
                draw3DGazeRay(rightEyeCenter, gazeDir, '#ffff00', 'R');
              } else if (currentGaze) {
                // Fallback to 2D gaze estimation
                const gazeDirFromCenter = {
                  x: (currentGaze.x - 0.5) * 2,
                  y: (currentGaze.y - 0.5) * 2
                };
                draw3DGazeRay(leftEyeCenter, gazeDirFromCenter, '#00ffff', 'L');
                draw3DGazeRay(rightEyeCenter, gazeDirFromCenter, '#ffff00', 'R');
              } else {
                // Default gaze rays
                draw3DGazeRay(leftEyeCenter, leftGazeDir, '#00ffff', 'L');
                draw3DGazeRay(rightEyeCenter, rightGazeDir, '#ffff00', 'R');
              }
              
              // Draw screen intersection point if available
              if (currentGaze) {
                ctx.fillStyle = '#00ff00';
                ctx.font = 'bold 14px monospace';
                const screenX = Math.round(currentGaze.x * canvas.width);
                const screenY = Math.round(currentGaze.y * canvas.height);
                ctx.fillText(`Screen: (${screenX}, ${screenY})`, 10, canvas.height - 20);
              }
            }
          }

          // Draw gaze position marker (red circle + yellow crosshair) for all modes
          if (currentGaze) {
            const screenX = currentGaze.x * canvas.width;
            const screenY = currentGaze.y * canvas.height;

            // 🔍 Debug gaze marker rendering
            if (fpsCounterRef.current.frames % 30 === 0) {
              console.log('🎨 Drawing Gaze Marker:', {
                currentGazeX: currentGaze.x.toFixed(3),
                currentGazeY: currentGaze.y.toFixed(3),
                screenX: screenX.toFixed(0),
                screenY: screenY.toFixed(0),
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
                isVisible: screenX >= 0 && screenX <= canvas.width && screenY >= 0 && screenY <= canvas.height
              });
            }

            // Red circle - outer (semi-transparent)
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 20, 0, Math.PI * 2);
            ctx.fill();

            // Red circle - inner (solid)
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
            ctx.fill();

            // Yellow crosshair
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Horizontal line
            ctx.moveTo(screenX - 25, screenY);
            ctx.lineTo(screenX + 25, screenY);
            // Vertical line
            ctx.moveTo(screenX, screenY - 25);
            ctx.lineTo(screenX, screenY + 25);
            ctx.stroke();
          } else {
            // 🔍 Debug when currentGaze is null
            if (fpsCounterRef.current.frames % 60 === 0) {
              console.warn('⚠️ currentGaze is NULL - gaze marker not rendering');
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Face detection error:', error);
      console.error('❌ Detection error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error)
      });
      // Schedule next frame
      animationFrameRef.current = window.requestAnimationFrame(detectAndEstimateGaze);
      return;
    }

    if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
      // No face detected - analyze brightness
      let brightness = 0;
      let analysisText = 'unknown';

      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          try {
            const sampleSize = 100;
            const sampleX = (canvas.width - sampleSize) / 2;
            const sampleY = (canvas.height - sampleSize) / 2;
            const imageData = ctx.getImageData(sampleX, sampleY, sampleSize, sampleSize);
            const data = imageData.data;

            let sum = 0;
            for (let i = 0; i < data.length; i += 4) {
              sum += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            }
            brightness = sum / (data.length / 4);

            if (brightness < 50) {
              analysisText = '🌑 TOO DARK';
            } else if (brightness < 100) {
              analysisText = '🌘 Dim';
            } else if (brightness < 200) {
              analysisText = '✅ Good lighting';
            } else {
              analysisText = '☀️ Bright';
            }
          } catch (brightnessError) {
            analysisText = 'Failed to analyze';
          }
        }
      }

      // 🔍 CRITICAL DEBUG: Log every 30 frames for faster feedback
      if (fpsCounterRef.current.frames % 30 === 0) {
        console.warn('👤 ❌ NO FACE DETECTED - currentGaze will be NULL');
        console.log('💡 Lighting:', analysisText, `(${Math.round(brightness)}/255)`);
      }

      setCurrentGaze(null);
      animationFrameRef.current = window.requestAnimationFrame(detectAndEstimateGaze);
      return;
    }

    // 🔍 CRITICAL DEBUG: Log face detection success
    if (fpsCounterRef.current.frames % 30 === 0) {
      console.log('✅ Face detected:', result.faceLandmarks[0].length, 'landmarks');
    }

    const landmarks = result.faceLandmarks[0];

    // Call onFacePosition if provided
    if (onFacePosition && landmarks.length > 0) {
      // Calculate face bounding box from landmarks
      const allX = landmarks.map(l => l.x);
      const allY = landmarks.map(l => l.y);
      const minX = Math.min(...allX);
      const maxX = Math.max(...allX);
      const minY = Math.min(...allY);
      const maxY = Math.max(...allY);

      // Calculate center and size (normalized 0-1)
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const width = maxX - minX;
      const height = maxY - minY;

      onFacePosition({
        x: centerX,
        y: centerY,
        width,
        height
      });
    }

    // Call onMediaPipeData for ML sample collection
    if (onMediaPipeData && landmarks.length >= 478) {
      // Extract iris landmarks (468-477)
      const leftIrisLandmarks = landmarks.slice(468, 473); // Left iris: 468-472
      const rightIrisLandmarks = landmarks.slice(473, 478); // Right iris: 473-477

      // Calculate headPose from face landmarks
      // Left eye: 33, Right eye: 263, Nose tip: 1
      const leftEye = landmarks[33];
      const rightEye = landmarks[263];
      const noseTip = landmarks[1];

      const eyeCenterX = (leftEye.x + rightEye.x) / 2;
      const eyeCenterY = (leftEye.y + rightEye.y) / 2;

      // Yaw (left-right rotation): nose tip offset from eye center
      const yaw = Math.atan2(noseTip.x - eyeCenterX, 1) * (180 / Math.PI);

      // Pitch (up-down rotation): nose tip offset from eye center
      const pitch = -Math.atan2(noseTip.y - eyeCenterY, 1) * (180 / Math.PI);

      // Roll (tilt): eye line angle
      const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

      onMediaPipeData({
        faceLandmarks: landmarks.map(lm => ({ x: lm.x, y: lm.y, z: lm.z || 0 })),
        irisLandmarks: {
          left: leftIrisLandmarks.map(lm => ({ x: lm.x, y: lm.y, z: lm.z || 0 })),
          right: rightIrisLandmarks.map(lm => ({ x: lm.x, y: lm.y, z: lm.z || 0 }))
        },
        headPose: { pitch, yaw, roll }
      });
    }

    // Convert normalized coordinates to pixel coordinates for our calculations
    const toPixelCoords = (landmark: { x: number; y: number; z: number }) => ({
      x: landmark.x * video.videoWidth,
      y: landmark.y * video.videoHeight,
      z: landmark.z
    });

    // ========================================================================
    // 3D TRACKING MODE
    // ========================================================================
    console.log('🔍 Checking 3D mode:', {
      use3DTracking,
      landmarksLength: landmarks.length,
      required: 468,
      canUse3D: use3DTracking && landmarks.length >= 468
    });
    
    if (use3DTracking && landmarks.length >= 468) {
      console.log('🎯 3D TRACKING MODE ACTIVE');
      
      // Extract nose landmarks for stable coordinate system
      const noseLandmarks3D: Point3D[] = NOSE_LANDMARK_INDICES.map(idx => {
        const lm = landmarks[idx];
        return {
          x: lm.x * video.videoWidth,
          y: lm.y * video.videoHeight,
          z: (lm.z || 0) * video.videoWidth // Scale Z to pixel space
        };
      });

      // Compute face coordinate system from nose
      const faceCoords = computeFaceCoordinateSystem(
        noseLandmarks3D,
        previousFaceAxesRef.current?.axes
      );
      previousFaceAxesRef.current = faceCoords;

      // Get iris positions (MediaPipe provides these if available)
      let leftIris3D: Point3D | null = null;
      let rightIris3D: Point3D | null = null;

      // JEOresearch: Check for iris landmarks (indices 468-477)
      const LEFT_IRIS_CENTER = 468;
      const RIGHT_IRIS_CENTER = 473;
      
      // Check if MediaPipe provides iris landmarks
      if (landmarks.length > RIGHT_IRIS_CENTER) {
        // Try to use actual iris landmarks
        const leftIrisLandmark = landmarks[LEFT_IRIS_CENTER];
        const rightIrisLandmark = landmarks[RIGHT_IRIS_CENTER];
        
        if (leftIrisLandmark && rightIrisLandmark && 
            leftIrisLandmark.x !== undefined && rightIrisLandmark.x !== undefined) {
          // Use actual iris landmarks from MediaPipe
          leftIris3D = {
            x: leftIrisLandmark.x * video.videoWidth,
            y: leftIrisLandmark.y * video.videoHeight,
            z: (leftIrisLandmark.z || 0) * video.videoWidth
          };
          rightIris3D = {
            x: rightIrisLandmark.x * video.videoWidth,
            y: rightIrisLandmark.y * video.videoHeight,
            z: (rightIrisLandmark.z || 0) * video.videoWidth
          };
          
          console.log('🎯 JEOresearch: Using iris landmarks', {
            leftIris: formatPoint3D(leftIris3D),
            rightIris: formatPoint3D(rightIris3D),
            totalLandmarks: landmarks.length
          });
        }
      }
      
      // Fallback: Use eye center with offset estimation
      if (!leftIris3D || !rightIris3D) {
        // JEOresearch fallback: Use eye center with dynamic offset
        const leftEyeIndices = [33, 133, 159, 145, 158, 144]; // Include more points
        const rightEyeIndices = [263, 362, 386, 374, 385, 373];
        
        const leftEyeCenter = leftEyeIndices.reduce((sum, idx) => ({
          x: sum.x + landmarks[idx].x * video.videoWidth / leftEyeIndices.length,
          y: sum.y + landmarks[idx].y * video.videoHeight / leftEyeIndices.length,
          z: sum.z + (landmarks[idx].z || 0) * video.videoWidth / leftEyeIndices.length
        }), { x: 0, y: 0, z: 0 });

        const rightEyeCenter = rightEyeIndices.reduce((sum, idx) => ({
          x: sum.x + landmarks[idx].x * video.videoWidth / rightEyeIndices.length,
          y: sum.y + landmarks[idx].y * video.videoHeight / rightEyeIndices.length,
          z: sum.z + (landmarks[idx].z || 0) * video.videoWidth / rightEyeIndices.length
        }), { x: 0, y: 0, z: 0 });
        
        // JEOresearch: Add small dynamic offset based on face orientation
        const noseVector = subtractPoints(noseLandmarks3D[0], faceCoords.center);
        const gazeOffset = multiplyScalar(normalize(noseVector), 2); // 2px offset
        
        leftIris3D = addPoints(leftEyeCenter, gazeOffset);
        rightIris3D = addPoints(rightEyeCenter, gazeOffset);
        
        console.log('📐 JEOresearch fallback: Eye center + offset', {
          totalLandmarks: landmarks.length
        });
      }

      // JEOresearch: Calibrate eye spheres (similar to pressing 'c' key)
      // Always calibrate on first frame with valid iris data
      if (!is3DCalibrated.current && leftIris3D && rightIris3D) {
        console.log('🔧 JEOresearch: Initial 3D calibration...', {
          leftIris: formatPoint3D(leftIris3D),
          rightIris: formatPoint3D(rightIris3D),
          faceCenter: formatPoint3D(faceCoords.center),
          noseScale: faceCoords.scale.toFixed(3)
        });
        eyeSphereTrackerRef.current.calibrate(faceCoords, leftIris3D, rightIris3D);
        is3DCalibrated.current = true;
        console.log('✅ JEOresearch: Eye spheres locked!');
      }

      // JEOresearch: Track eye spheres in current frame
      // IMPROVED: Start tracking immediately, even before calibration (with lower confidence)
      if (leftIris3D && rightIris3D) {
        const eyeSpheres = eyeSphereTrackerRef.current.track(faceCoords);
        
        // Compute combined gaze ray
        const gazeRay = computeCombinedGaze(
          eyeSpheres.left,
          eyeSpheres.right,
          leftIris3D!,
          rightIris3D!
        );

        // JEOresearch: Apply smoothing filter (deque with filter_length=10)
        const smoothedDirection = gazeSmoother3DRef.current.addSample(gazeRay.direction);
        const smoothedRay = { ...gazeRay, direction: smoothedDirection };
        
        // Store the current gaze ray for visualization
        currentGazeRayRef.current = smoothedRay;

        // Compute intersection with virtual monitor
        const intersection = computeMonitorIntersection(smoothedRay, DEFAULT_VIRTUAL_MONITOR);
        
        if (intersection) {
          // Convert to screen coordinates
          const screenCoords = intersectionToScreenCoords(intersection, DEFAULT_VIRTUAL_MONITOR);
          
          // Clamp to valid range
          const clampedGaze = {
            x: Math.max(0, Math.min(1, screenCoords.x)),
            y: Math.max(0, Math.min(1, screenCoords.y))
          };

          // Apply Kalman filter
          const filtered = kalmanFilterRef.current.filter(clampedGaze.x, clampedGaze.y, Date.now());

          // Call raw gaze data callback for 3D mode calibration
          if (onRawGazeData) {
            // Calculate pseudo iris offset for 3D mode (based on gaze direction)
            const irisOffset = {
              x: (clampedGaze.x - 0.5) * 0.1, // Convert to normalized offset
              y: (clampedGaze.y - 0.5) * 0.1
            };
            const headPose = {
              yaw: smoothedDirection.x * 0.5,  // Approximate yaw from gaze direction
              pitch: smoothedDirection.y * 0.5  // Approximate pitch from gaze direction
            };
            
            // Debug: Log every 30th frame
            if (frameCounter3D.current % 30 === 0) {
              console.log('📡 Sending raw gaze data from 3D mode:', {
                irisOffset,
                headPose,
                calibrated: is3DCalibrated.current,
                gazePoint: { x: clampedGaze.x.toFixed(3), y: clampedGaze.y.toFixed(3) }
              });
            }
            
            onRawGazeData({
              irisOffset,
              headPose,
              timestamp: Date.now()
            });
          }

          // Update state with full GazeEstimation object
          // For 3D mode, create minimal landmarks object
          const minimalLandmarks: FaceLandmarks = {
            leftEye: { x: 0, y: 0, z: 0 },
            rightEye: { x: 0, y: 0, z: 0 },
            leftIris: leftIris3D!,
            rightIris: rightIris3D!,
            noseTip: { x: faceCoords.center.x, y: faceCoords.center.y, z: faceCoords.center.z }
          };
          
          const gazeEstimation: GazeEstimation = {
            x: filtered.x,
            y: filtered.y,
            confidence: is3DCalibrated.current ? 0.9 : 0.5, // Lower confidence before calibration
            landmarks: minimalLandmarks
          };
          setCurrentGaze(gazeEstimation);
          
          // CRITICAL: Call onGazePoint callback for CalibrationScreen
          if (onGazePoint) {
            const gazePoint: GazePoint = {
              x: filtered.x,
              y: filtered.y,
              timestamp: Date.now(),
              confidence: is3DCalibrated.current ? 0.9 : 0.5, // Lower confidence before calibration
              type: GazeType.FIXATION
            };
            onGazePoint(gazePoint);
            
            // Log for debugging
            if (frameCounter3D.current % 60 === 0) {
              console.log('📍 3D GazePoint sent to calibration:', {
                x: gazePoint.x.toFixed(3),
                y: gazePoint.y.toFixed(3)
              });
            }
          }

          // Debug logging (reduced frequency)
          if (fpsCounterRef.current.frames % 60 === 0) {
            console.log('🎯 3D Gaze:', {
              ray: formatVector3D(smoothedDirection),
              intersection: formatPoint3D(intersection),
              screen: `(${clampedGaze.x.toFixed(3)}, ${clampedGaze.y.toFixed(3)})`,
              faceScale: faceCoords.scale.toFixed(2),
              calibrated: is3DCalibrated.current,
              dataCallback: onRawGazeData ? 'active' : 'none'
            });
          }
        }

        // Increment frame counter for 3D mode debugging
        frameCounter3D.current++;

        // Schedule next frame
        animationFrameRef.current = window.requestAnimationFrame(detectAndEstimateGaze);
        return;
      }
    }

    // ========================================================================
    // 2D TRACKING MODE (ORIGINAL CODE)
    // ========================================================================

    // Extract key landmarks (same indices as before)
    const leftEyeOuter = toPixelCoords(landmarks[33]);
    const leftEyeInner = toPixelCoords(landmarks[133]);
    const leftEyeTop = toPixelCoords(landmarks[159]);
    const leftEyeBottom = toPixelCoords(landmarks[145]);
    const leftEyeTopMid = toPixelCoords(landmarks[157]);
    const leftEyeBottomMid = toPixelCoords(landmarks[144]);

    const rightEyeOuter = toPixelCoords(landmarks[263]);
    const rightEyeInner = toPixelCoords(landmarks[362]);
    const rightEyeTop = toPixelCoords(landmarks[386]);
    const rightEyeBottom = toPixelCoords(landmarks[374]);
    const rightEyeTopMid = toPixelCoords(landmarks[387]);
    const rightEyeBottomMid = toPixelCoords(landmarks[373]);

    const noseTip = toPixelCoords(landmarks[1]);

    // Calculate Eye Aspect Ratio (EAR)
    const leftEAR = calculateEAR(
      leftEyeTopMid, leftEyeBottomMid,
      leftEyeTop, leftEyeBottom,
      leftEyeOuter, leftEyeInner
    );
    const rightEAR = calculateEAR(
      rightEyeTopMid, rightEyeBottomMid,
      rightEyeTop, rightEyeBottom,
      rightEyeOuter, rightEyeInner
    );
    const avgEAR = (leftEAR + rightEAR) / 2;

    // 🔍 CRITICAL DEBUG: Always log EAR for diagnosis
    if (fpsCounterRef.current.frames % 30 === 0) {
      console.log('👁️ EAR Monitoring:', {
        avgEAR: avgEAR.toFixed(3),
        leftEAR: leftEAR.toFixed(3),
        rightEAR: rightEAR.toFixed(3),
        threshold: 0.08,
        willBlock: avgEAR < 0.08
      });
    }

    // Lowered threshold from 0.18 → 0.12 → 0.08 to allow more eye movements
    // When eyes look up/down, eyelid coverage changes EAR significantly
    const EAR_THRESHOLD = 0.08;

    if (avgEAR < EAR_THRESHOLD) {
      console.warn('👓 Eyes closed or occluded - EAR:', avgEAR.toFixed(3), '< threshold', EAR_THRESHOLD);
      setCurrentGaze(null);
      animationFrameRef.current = window.requestAnimationFrame(detectAndEstimateGaze);
      return;
    }

    // Get iris landmarks (468-477)
    let leftIris = {
      x: (leftEyeOuter.x + leftEyeInner.x) / 2,
      y: (leftEyeTop.y + leftEyeBottom.y) / 2,
      z: leftEyeOuter.z || 0
    };
    let rightIris = {
      x: (rightEyeOuter.x + rightEyeInner.x) / 2,
      y: (rightEyeTop.y + rightEyeBottom.y) / 2,
      z: rightEyeOuter.z || 0
    };
    let usingIrisLandmarks = false;

    // JEOresearch: Check for iris landmarks (indices 468-477)
    // MediaPipe FaceLandmarker with refined_landmarks=true provides iris tracking
    const LEFT_IRIS_CENTER = 468;  // Left iris center landmark
    const RIGHT_IRIS_CENTER = 473; // Right iris center landmark
    
    if (landmarks.length > LEFT_IRIS_CENTER && landmarks.length > RIGHT_IRIS_CENTER) {
      // Use actual iris landmarks from MediaPipe
      const leftIrisLandmark = landmarks[LEFT_IRIS_CENTER];
      const rightIrisLandmark = landmarks[RIGHT_IRIS_CENTER];
      
      if (leftIrisLandmark && rightIrisLandmark) {
        leftIris = {
          x: leftIrisLandmark.x,
          y: leftIrisLandmark.y,
          z: leftIrisLandmark.z || 0
        };
        
        rightIris = {
          x: rightIrisLandmark.x,
          y: rightIrisLandmark.y,
          z: rightIrisLandmark.z || 0
        };
        
        usingIrisLandmarks = true;

        // Debug log occasionally
        if (fpsCounterRef.current.frames % 30 === 0) {
          console.log('🎯 JEOresearch: Using actual iris landmarks', {
            leftIris: `(${leftIris.x.toFixed(3)}, ${leftIris.y.toFixed(3)})`,
            rightIris: `(${rightIris.x.toFixed(3)}, ${rightIris.y.toFixed(3)})`,
            landmarkCount: landmarks.length,
            mode: 'MediaPipe-Iris'
          });
        }
      } else {
        console.warn('⚠️ MediaPipe iris landmarks not available', {
          landmarkCount: landmarks.length,
          hasLeftIris: landmarks.length > LEFT_IRIS_CENTER,
          hasRightIris: landmarks.length > RIGHT_IRIS_CENTER
        });
      }
    }
    
    // Fallback: Estimate iris if landmarks not available
    if (!usingIrisLandmarks) {
      // Calculate eye centers
      const leftEyeCenterCalc = {
        x: (leftEyeOuter.x + leftEyeInner.x) / 2,
        y: (leftEyeTop.y + leftEyeBottom.y) / 2,
        z: leftEyeOuter.z || 0
      };
      const rightEyeCenterCalc = {
        x: (rightEyeOuter.x + rightEyeInner.x) / 2,
        y: (rightEyeTop.y + rightEyeBottom.y) / 2,
        z: rightEyeOuter.z || 0
      };
      
      // Calculate eye dimensions for estimation
      const leftEyeHeight = Math.abs(leftEyeTop.y - leftEyeBottom.y);
      const leftEyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x);
      
      // JEOresearch-inspired: Smooth iris offset calculation
      // Use eye center with small dynamic offset based on head pose
      const headYaw = landmarks[1] ? Math.atan2(landmarks[1].x - 0.5, landmarks[1].z || -0.1) : 0;
      const headPitch = landmarks[1] ? Math.atan2(landmarks[1].y - 0.5, landmarks[1].z || -0.1) : 0;
      
      // Subtle iris offset (JEOresearch uses ~10-20% of eye width)
      const irisOffsetX = headYaw * leftEyeWidth * 0.15;
      const irisOffsetY = headPitch * leftEyeHeight * 0.1;
      
      leftIris = {
        x: leftEyeCenterCalc.x + irisOffsetX,
        y: leftEyeCenterCalc.y + irisOffsetY,
        z: leftEyeOuter.z || 0
      };
      
      rightIris = {
        x: rightEyeCenterCalc.x + irisOffsetX,
        y: rightEyeCenterCalc.y + irisOffsetY,
        z: rightEyeOuter.z || 0
      };
      
      // Debug log fallback mode
      if (fpsCounterRef.current.frames % 60 === 0) {
        console.log('📐 Fallback: Estimating iris from eye center', {
          landmarkCount: landmarks.length,
          headYaw: headYaw.toFixed(3),
          headPitch: headPitch.toFixed(3)
        });
      }
    }

    // Calculate eye centers for face landmarks
    const leftEyeCenter = {
      x: (leftEyeOuter.x + leftEyeInner.x) / 2,
      y: (leftEyeTop.y + leftEyeBottom.y) / 2
    };
    const rightEyeCenter = {
      x: (rightEyeOuter.x + rightEyeInner.x) / 2,
      y: (rightEyeTop.y + rightEyeBottom.y) / 2
    };

    const faceLandmarks: FaceLandmarks = {
      leftEye: { x: leftEyeCenter.x, y: leftEyeCenter.y, z: leftEyeOuter.z },
      rightEye: { x: rightEyeCenter.x, y: rightEyeCenter.y, z: rightEyeOuter.z },
      leftIris: { x: leftIris.x, y: leftIris.y, z: leftIris.z },
      rightIris: { x: rightIris.x, y: rightIris.y, z: rightIris.z },
      noseTip: { x: noseTip.x, y: noseTip.y, z: noseTip.z }
    };

    // Estimate gaze (returns raw gaze with iris + head pose)
    const gaze = estimateGazeFromLandmarks(
      faceLandmarks,
      video.videoWidth,
      video.videoHeight,
      onRawGazeData
    );

    // 🔍 Debug raw gaze calculation
    if (fpsCounterRef.current.frames % 30 === 0) {
      console.log('📍 Raw Gaze Estimation:', {
        rawX: gaze.x.toFixed(3),
        rawY: gaze.y.toFixed(3),
        leftIrisX: faceLandmarks.leftIris.x.toFixed(3),
        rightIrisX: faceLandmarks.rightIris.x.toFixed(3),
        leftEyeX: faceLandmarks.leftEye.x.toFixed(3),
        rightEyeX: faceLandmarks.rightEye.x.toFixed(3),
        usingIrisLandmarks
      });
    }

    // Clamp gaze values to valid screen range (0.0 ~ 1.0) BEFORE filtering
    const clampedGaze = {
      x: Math.max(0.0, Math.min(1.0, gaze.x)),
      y: Math.max(0.0, Math.min(1.0, gaze.y))
    };

    // Apply calibration model if available
    let calibratedGaze = clampedGaze;
    if (calibrationModelRef.current && onRawGazeData) {
      // Extract raw gaze data from the most recent callback
      // Note: onRawGazeData is already called in estimateGazeFromLandmarks
      // We need to use the stored values from faceLandmarks
      const avgIrisRatioX = (faceLandmarks.leftIris.x - faceLandmarks.leftEye.x +
                            faceLandmarks.rightIris.x - faceLandmarks.rightEye.x) / (2 * video.videoWidth);
      const avgIrisRatioY = (faceLandmarks.leftIris.y - faceLandmarks.leftEye.y +
                            faceLandmarks.rightIris.y - faceLandmarks.rightEye.y) / (2 * video.videoHeight);

      const eyesCenterX = (faceLandmarks.leftEye.x + faceLandmarks.rightEye.x) / 2;
      const noseTipX = faceLandmarks.noseTip.x;
      const headYaw = (noseTipX - eyesCenterX) / video.videoWidth;

      const eyesCenterY = (faceLandmarks.leftEye.y + faceLandmarks.rightEye.y) / 2;
      const noseTipY = faceLandmarks.noseTip.y;
      const headPitch = -(noseTipY - eyesCenterY) / video.videoHeight;

      // Apply polynomial regression model
      calibratedGaze = applyCalibrationModel(
        calibrationModelRef.current,
        avgIrisRatioX,
        avgIrisRatioY,
        headYaw,
        headPitch
      );

      console.log('📐 Applied calibration model:', {
        raw: `${clampedGaze.x.toFixed(3)}, ${clampedGaze.y.toFixed(3)}`,
        calibrated: `${calibratedGaze.x.toFixed(3)}, ${calibratedGaze.y.toFixed(3)}`
      });
    }

    // Apply Kalman Filter for noise reduction (replaces EMA)
    const timestamp = Date.now();
    const filteredGaze = kalmanFilterRef.current.filter(
      calibratedGaze.x,
      calibratedGaze.y,
      timestamp
    );

    // Log Kalman filtering only occasionally
    if (fpsCounterRef.current.frames % 120 === 0) {
      console.log('🎯 Kalman filtered:', {
        input: `${calibratedGaze.x.toFixed(3)}, ${calibratedGaze.y.toFixed(3)}`,
        filtered: `${filteredGaze.x.toFixed(3)}, ${filteredGaze.y.toFixed(3)}`
      });
    }

    // Use filtered values for final gaze
    let finalX = filteredGaze.x;
    let finalY = filteredGaze.y;
    let finalConfidence = gaze.confidence;

    // ✨ Phase 3: Adaptive Frame Skipping
    let shouldProcessOpenCV = true;
    if (enableFrameSkip && frameSkipperRef.current) {
      // Calculate gaze velocity
      const gazeVelocity = prevGazeRef.current
        ? Math.sqrt(
            Math.pow(filteredGaze.x - prevGazeRef.current.x, 2) +
            Math.pow(filteredGaze.y - prevGazeRef.current.y, 2)
          )
        : 0;

      // Calculate face movement velocity
      const faceMovementVelocity = prevFaceRef.current
        ? Math.sqrt(
            Math.pow(noseTip.x - prevFaceRef.current.x, 2) +
            Math.pow(noseTip.y - prevFaceRef.current.y, 2)
          )
        : 0;

      shouldProcessOpenCV = frameSkipperRef.current.shouldProcess(gazeVelocity, faceMovementVelocity);

      // Update previous positions
      prevGazeRef.current = { x: filteredGaze.x, y: filteredGaze.y };
      prevFaceRef.current = { x: noseTip.x, y: noseTip.y };

      // Log frame skip stats (throttled)
      if (fpsCounterRef.current.frames % 120 === 0) {
        console.log('⏭️ Frame Skip Stats:', {
          processingRate: `${(frameSkipperRef.current.getProcessingRate() * 100).toFixed(1)}%`,
          skipRate: `${(frameSkipperRef.current.getSkipRate() * 100).toFixed(1)}%`,
          cpuSavings: `${frameSkipperRef.current.getEstimatedCPUSavings().toFixed(1)}%`,
          currentInterval: frameSkipperRef.current.getCurrentInterval()
        });
      }
    }

    // ✨ NEW: Hybrid Gaze Fusion (MediaPipe + OpenCV + 3D Model)
    if (enableHybridMode && shouldProcessOpenCV && (opencvPupilDetectorRef.current || workerManagerRef.current) && videoRef.current) {
      try {
        // Extract base eye ROIs from MediaPipe landmarks
        const baseROIs = OpenCVPupilDetector.extractEyeROIs(
          landmarks,
          video.videoWidth,
          video.videoHeight
        );

        // ✨ Phase 3: Apply ROI Optimization
        let eyeROIs = baseROIs;
        if (enableROIOptimization && roiOptimizerRef.current) {
          // Calculate face movement velocity for cache decision
          const faceMovementVelocity = prevFaceRef.current
            ? Math.sqrt(
                Math.pow(noseTip.x - prevFaceRef.current.x, 2) +
                Math.pow(noseTip.y - prevFaceRef.current.y, 2)
              )
            : 1.0; // High velocity if no previous face

          // Check if we can reuse cached ROI
          if (roiOptimizerRef.current.shouldReuseROI(faceMovementVelocity)) {
            const cachedROI = roiOptimizerRef.current.getCachedROI();
            if (cachedROI) {
              eyeROIs = cachedROI;
            }
          } else {
            // Apply adaptive padding and downsampling
            const detectionSuccess = true; // Assume success if we got here
            const optimizedLeft = roiOptimizerRef.current.calculateOptimizedROI(
              baseROIs.left,
              detectionSuccess,
              true // enableDownsample
            );
            const optimizedRight = roiOptimizerRef.current.calculateOptimizedROI(
              baseROIs.right,
              detectionSuccess,
              true // enableDownsample
            );
            eyeROIs = { left: optimizedLeft, right: optimizedRight };

            // Cache the optimized ROI
            roiOptimizerRef.current.cacheROI(optimizedLeft, optimizedRight);
          }
        }

        // ✨ Phase 3: Detect pupils using Web Worker or main thread
        let pupilResult = null;
        if (enableWebWorker && workerManagerRef.current?.isReady()) {
          // Use Web Worker for background processing
          pupilResult = await workerManagerRef.current.detectPupils(
            videoRef.current,
            eyeROIs
          );
        } else if (opencvPupilDetectorRef.current) {
          // Fallback to main thread OpenCV
          pupilResult = opencvPupilDetectorRef.current.detectPupils(
            videoRef.current,
            eyeROIs
          );
        }

        if (pupilResult && (pupilResult.left || pupilResult.right)) {
          // Convert pupil positions to gaze coordinates
          const opencvGaze = pupilToGaze(
            pupilResult.left,
            pupilResult.right,
            video.videoWidth,
            video.videoHeight
          );

          if (opencvGaze) {
            // Prepare hybrid input
            const hybridInput: HybridGazeInput = {
              mediapipe: {
                x: finalX,
                y: finalY,
                confidence: gaze.confidence,
                source: 'mediapipe'
              },
              opencv: {
                x: opencvGaze.x,
                y: opencvGaze.y,
                confidence: pupilResult.confidence,
                source: 'opencv'
              },
              model3d: null // 2D mode doesn't use 3D model
            };

            // Fuse estimates using hybrid estimator
            const fusedEstimate = hybridGazeEstimatorRef.current.estimate(hybridInput);

            // Use fused estimate
            finalX = fusedEstimate.x;
            finalY = fusedEstimate.y;
            finalConfidence = fusedEstimate.confidence;

            // Log hybrid fusion (throttled)
            if (fpsCounterRef.current.frames % 120 === 0) {
              console.log('🔀 Hybrid Fusion:', {
                mediapipe: `(${filteredGaze.x.toFixed(1)}, ${filteredGaze.y.toFixed(1)})`,
                opencv: `(${opencvGaze.x.toFixed(1)}, ${opencvGaze.y.toFixed(1)})`,
                fused: `(${finalX.toFixed(1)}, ${finalY.toFixed(1)})`,
                confidence: finalConfidence.toFixed(3)
              });
            }
          }
        }
      } catch (hybridError) {
        // Hybrid fusion failed, fall back to MediaPipe-only
        console.warn('⚠️ Hybrid fusion failed, using MediaPipe only:', hybridError);
      }
    }

    // ✨ NEW: Vertical Gaze Correction
    if (enableVerticalCorrection && verticalCorrectorRef.current) {
      try {
        // Detect if current gaze is vertical or horizontal
        const isVerticalGaze = verticalCorrectorRef.current.isVerticalGaze(finalX, finalY);

        // Apply dynamic weights if vertical gaze detected
        if (isVerticalGaze && enableHybridMode) {
          const dynamicWeights = verticalCorrectorRef.current.getDynamicWeights(true);
          hybridGazeEstimatorRef.current.updateConfig({
            baseWeights: dynamicWeights
          });
        }

        // Calculate head pitch (already computed earlier, but recalculate for clarity)
        const eyesCenterY = (leftEyeCenter.y + rightEyeCenter.y) / 2;
        const headPitch = (noseTip.y - eyesCenterY) / video.videoHeight;

        // Apply vertical correction to Y coordinate
        const normalizedY = finalY / video.videoHeight; // Convert to 0-1 range
        const correctedY = verticalCorrectorRef.current.correctVertical(
          normalizedY,
          headPitch,
          avgEAR
        );
        finalY = correctedY * video.videoHeight; // Convert back to pixel coordinates

        // Log vertical correction (throttled)
        if (fpsCounterRef.current.frames % 120 === 0) {
          console.log('🔧 Vertical Correction Applied:', {
            isVertical: isVerticalGaze,
            originalY: normalizedY.toFixed(3),
            correctedY: correctedY.toFixed(3),
            headPitch: headPitch.toFixed(3),
            avgEAR: avgEAR.toFixed(3)
          });
        }
      } catch (verticalError) {
        console.warn('⚠️ Vertical correction failed:', verticalError);
      }
    }

    // Apply legacy calibration matrix if provided (for backward compatibility)
    if (calibrationMatrix) {
      const transformed = applyAffineTransform(finalX, finalY, calibrationMatrix);
      finalX = transformed.x;
      finalY = transformed.y;
    }

    const gazeEstimation: GazeEstimation = {
      x: finalX,
      y: finalY,
      confidence: finalConfidence,
      landmarks: faceLandmarks
    };

    // 🔍 Critical Debug: Final gaze values before rendering
    if (fpsCounterRef.current.frames % 30 === 0) {
      const canvas = canvasRef.current;
      console.log('🎯 FINAL Gaze Values (setCurrentGaze):', {
        finalX: finalX.toFixed(3),
        finalY: finalY.toFixed(3),
        filteredX: filteredGaze.x.toFixed(3),
        filteredY: filteredGaze.y.toFixed(3),
        rawX: gaze.x.toFixed(3),
        rawY: gaze.y.toFixed(3),
        canvasWidth: canvas?.width || 'N/A',
        canvasHeight: canvas?.height || 'N/A',
        screenX: canvas ? (finalX * canvas.width).toFixed(0) : 'N/A',
        screenY: canvas ? (finalY * canvas.height).toFixed(0) : 'N/A',
        confidence: finalConfidence
      });
    }

    setCurrentGaze(gazeEstimation);

    // Classify gaze type
    const gazeType = classifyGazeType(
      finalX,
      finalY,
      lastGazeRef.current,
      timestamp
    );

    const gazePoint: GazePoint = {
      timestamp,
      x: finalX,
      y: finalY,
      confidence: gaze.confidence,
      type: gazeType
    };

    lastGazeRef.current = { x: finalX, y: finalY, timestamp };

    if (onGazePoint) {
      onGazePoint(gazePoint);
    }

    // === 집중력 분석용 데이터 생성 ===
    if (onConcentrationData) {
      // ✨ Phase 8-2: Precise pupil size using ellipse fitting
      const irisData = extractBothEyesIrisData(
        landmarks,
        video.videoWidth,
        video.videoHeight
      );

      // Calculate average pupil size from both eyes
      let avgPupilSize = 0;
      if (irisData.left && irisData.right) {
        // Both eyes visible: average diameter
        avgPupilSize = (irisData.left.diameter + irisData.right.diameter) / 2;
      } else if (irisData.left) {
        // Only left eye visible
        avgPupilSize = irisData.left.diameter;
      } else if (irisData.right) {
        // Only right eye visible
        avgPupilSize = irisData.right.diameter;
      } else {
        // Fallback: Use old approximation method
        const leftEyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x);
        const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x);
        const leftIrisToOuter = Math.abs(leftIris.x - leftEyeOuter.x);
        const leftIrisToInner = Math.abs(leftIris.x - leftEyeInner.x);
        const rightIrisToOuter = Math.abs(rightIris.x - rightEyeOuter.x);
        const rightIrisToInner = Math.abs(rightIris.x - rightEyeInner.x);
        const leftPupilRatio = Math.min(leftIrisToOuter, leftIrisToInner) / leftEyeWidth;
        const rightPupilRatio = Math.min(rightIrisToOuter, rightIrisToInner) / rightEyeWidth;
        avgPupilSize = (leftPupilRatio + rightPupilRatio) / 2 * 10; // Scale to pixel approximation
      }

      // 눈 움직임 속도 계산
      let eyeMovementVelocity = 0;
      if (lastGazeRef.current) {
        const dx = finalX - lastGazeRef.current.x;
        const dy = finalY - lastGazeRef.current.y;
        const dt = (timestamp - lastGazeRef.current.timestamp) / 1000; // 초 단위
        const distance = Math.sqrt(dx * dx + dy * dy);
        eyeMovementVelocity = dt > 0 ? distance / dt : 0;
      }

      // Head pose 계산 (이미 estimateGazeFromLandmarks에서 계산됨)
      const eyesCenterX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
      const eyesCenterY = (leftEyeCenter.y + rightEyeCenter.y) / 2;
      const headYaw = (noseTip.x - eyesCenterX) / video.videoWidth;
      const headPitch = (noseTip.y - eyesCenterY) / video.videoHeight;

      // 머리 기울기 (roll) 추정 - 두 눈의 Y축 차이로 계산
      const headRoll = Math.atan2(
        rightEyeCenter.y - leftEyeCenter.y,
        rightEyeCenter.x - leftEyeCenter.x
      );

      const concentrationRawData: ConcentrationRawData = {
        pupilSize: avgPupilSize,
        eyeAspectRatio: avgEAR,
        gazeVector: { x: finalX, y: finalY },
        eyeMovementVelocity,
        headPose: {
          yaw: headYaw,
          pitch: headPitch,
          roll: headRoll
        },
        fixationPoint: gazeType === GazeType.FIXATION ? { x: finalX, y: finalY } : null,
        timestamp
      };

      onConcentrationData(concentrationRawData);
    }

    // Update FPS counter
    fpsCounterRef.current.frames++;
    const now = Date.now();
    if (now - fpsCounterRef.current.lastTime >= 1000) {
      setFps(fpsCounterRef.current.frames);
      fpsCounterRef.current = { frames: 0, lastTime: now };
    }

    // Schedule next frame
    animationFrameRef.current = window.requestAnimationFrame(detectAndEstimateGaze);
  }, [isTracking, onGazePoint, calibrationMatrix, onFacePosition, onRawGazeData, onConcentrationData, onMediaPipeData]);

  // Start detection loop when tracking starts
  // CRITICAL: Start loop once and let it self-sustain via requestAnimationFrame
  useEffect(() => {
    if (isTracking && enabled && !animationFrameRef.current) {
      console.log('🔄 Starting detection loop');
      detectAndEstimateGaze();
    } else if (!enabled && animationFrameRef.current) {
      console.log('⏸️ Stopping detection loop');
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTracking, enabled]); // Removed detectAndEstimateGaze - self-sustaining loop!

  // Initialize MediaPipe on mount
  useEffect(() => {
    if (enabled && !isInitialized) {
      initialize();
    }

    return () => {
      // Cancel animation frame on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [enabled, isInitialized, initialize]);

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

// Helper functions (unchanged from original)

function estimateGazeFromLandmarks(
  landmarks: FaceLandmarks,
  videoWidth: number,
  videoHeight: number,
  onRawGazeData?: (data: {
    irisOffset: { x: number; y: number };
    headPose: { yaw: number; pitch: number };
    timestamp: number;
  }) => void
): { x: number; y: number; confidence: number } {
  // === SCREEN SIZE ADAPTIVE SENSITIVITY ===
  // Calculate screen dimensions and viewing angle
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const screenDiagonalPx = Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight);

  // Estimate screen diagonal in inches (assuming standard pixel density)
  // Typical screens: 96 DPI (desktop), 163 DPI (mobile), 264 DPI (retina)
  const pixelDensity = window.devicePixelRatio || 1;
  const estimatedDPI = 96 * pixelDensity; // Rough estimate
  const screenDiagonalInches = screenDiagonalPx / estimatedDPI;

  // Calculate eye-to-eye distance in pixels (typical: 60-70mm, ~10% of face width)
  const eyeDistance = Math.abs(landmarks.leftEye.x - landmarks.rightEye.x);

  // Estimate viewing distance based on eye distance in video
  // Typical interpupillary distance: 63mm
  // If eyes appear larger in video → closer to camera
  // If eyes appear smaller → farther from camera
  const eyeDistanceRatio = eyeDistance / videoWidth; // Normalized eye distance

  // Reference values:
  // - Close viewing (30cm): eyeDistanceRatio ~0.20
  // - Medium viewing (50cm): eyeDistanceRatio ~0.12
  // - Far viewing (80cm): eyeDistanceRatio ~0.08

  // Calculate adaptive sensitivity multipliers
  // Larger screens need HIGHER sensitivity (more pixels to cover)
  // Closer viewing needs LOWER sensitivity (less eye movement needed)

  // Screen size factor: larger screens = higher sensitivity
  // Base: 24" desktop monitor, scale proportionally
  // const screenSizeFactor = Math.max(0.5, Math.min(2.0, screenDiagonalInches / 24.0));

  // Viewing distance factor: closer viewing = lower sensitivity
  // Normalize so 0.12 (50cm) = 1.0x
  // const viewingDistanceFactor = Math.max(0.5, Math.min(2.0, 0.12 / eyeDistanceRatio));

  // Aspect ratio factor: wider screens need more horizontal sensitivity
  // const aspectRatio = screenWidth / screenHeight;
  // const aspectRatioFactorX = Math.max(1.0, aspectRatio / 1.6); // 16:10 as baseline

  // Final adaptive multipliers - disabled for now for stable 2D tracking
  // const adaptiveMultiplierX = screenSizeFactor * viewingDistanceFactor * aspectRatioFactorX;
  // const adaptiveMultiplierY = screenSizeFactor * viewingDistanceFactor;
  // Use fixed multipliers for consistent behavior
  const adaptiveMultiplierX = 1.0;
  const adaptiveMultiplierY = 1.0;

  // Log adaptive parameters (every 60 frames to avoid spam)
  if (Math.random() < 0.016) { // ~1 in 60 frames at 60fps
    console.log('📐 Adaptive sensitivity:', {
      screenSize: `${screenWidth}x${screenHeight} (${screenDiagonalInches.toFixed(1)}")`,
      eyeDistance: eyeDistanceRatio.toFixed(3),
      multipliers: {
        X: adaptiveMultiplierX.toFixed(2),
        Y: adaptiveMultiplierY.toFixed(2)
      }
    });
  }

  // === HORIZONTAL (X-axis) CALCULATION ===
  // Calculate horizontal iris distance from eye center (signed: left = negative, right = positive)
  const leftIrisOffsetX = landmarks.leftIris.x - landmarks.leftEye.x;
  const rightIrisOffsetX = landmarks.rightIris.x - landmarks.rightEye.x;

  // Normalize by video width (range approximately -0.05 to +0.05 for typical eye movements)
  const leftIrisRatioX = leftIrisOffsetX / videoWidth;
  const rightIrisRatioX = rightIrisOffsetX / videoWidth;
  const avgIrisRatioX = (leftIrisRatioX + rightIrisRatioX) / 2;

  // Head yaw compensation (left-right head rotation)
  const eyesCenterX = (landmarks.leftEye.x + landmarks.rightEye.x) / 2;
  const noseTipX = landmarks.noseTip.x;
  const headYaw = (noseTipX - eyesCenterX) / videoWidth;

  // Combine iris position with head rotation
  // BALANCED sensitivity for equal X/Y responsiveness
  // Get sensitivity from localStorage or use default
  const storedSensitivity = localStorage.getItem('gaze-sensitivity');
  const baseSensitivityX = storedSensitivity ? parseFloat(storedSensitivity) : 20; // Default 20 for better responsiveness
  const headCompensatedX = (avgIrisRatioX * baseSensitivityX) - (headYaw * 2.0); // Minimal head influence for 2D

  // === VERTICAL (Y-axis) CALCULATION WITH 3D DEPTH ===
  // Calculate vertical iris distance from eye center
  // Video coords: Y increases downward (top=0, bottom=height)
  // Looking UP: iris.y < eye.y → negative offset
  // Looking DOWN: iris.y > eye.y → positive offset
  const leftIrisOffsetY = landmarks.leftIris.y - landmarks.leftEye.y;
  const rightIrisOffsetY = landmarks.rightIris.y - landmarks.rightEye.y;

  // Normalize by video height
  const leftIrisRatioY = leftIrisOffsetY / videoHeight;
  const rightIrisRatioY = rightIrisOffsetY / videoHeight;
  const avgIrisRatioY = (leftIrisRatioY + rightIrisRatioY) / 2;

  // Head pitch compensation (up-down head tilt)
  // CRITICAL FIX: Invert headPitch sign!
  // When looking UP: nose moves UP → noseTip.y < eyesCenter.y → should give NEGATIVE headPitch → smaller Y (top of screen)
  // When looking DOWN: nose moves DOWN → noseTip.y > eyesCenter.y → should give POSITIVE headPitch → larger Y (bottom of screen)
  // MediaPipe coords: Y increases downward, so we need to NEGATE the difference
  const eyesCenterY = (landmarks.leftEye.y + landmarks.rightEye.y) / 2;
  const noseTipY = landmarks.noseTip.y;
  const headPitch = -(noseTipY - eyesCenterY) / videoHeight; // NEGATED: flip the sign!

  // === 3D DEPTH-BASED VERTICAL CORRECTION ===
  // Use Z-depth from landmarks to improve vertical gaze accuracy
  // When looking up: eyelid occludes iris → use head pitch as primary signal
  // Z-depth indicates viewing distance → closer = more head movement influence

  // Get Z-depth from iris landmarks
  // MediaPipe provides Z in normalized scale where Z=0 is camera plane
  // Negative Z = closer to camera, Positive Z = farther from camera
  const leftZ = landmarks.leftIris.z ?? 0;
  const rightZ = landmarks.rightIris.z ?? 0;
  const avgZ = (leftZ + rightZ) / 2;

  // Calculate depth-aware pitch multiplier
  // Closer viewing (more negative Z): Head pitch has MORE influence on vertical gaze
  // Farther viewing (less negative Z): Iris position has MORE influence
  // Use exponential function to scale influence: e^(-Z*2)
  // When Z=-0.1 (close): factor ≈ 1.22 (22% boost)
  // When Z=0.0 (normal): factor = 1.0 (baseline)
  // When Z=0.1 (far): factor ≈ 0.82 (18% reduction)
  const depthFactor = Math.exp(-avgZ * 2.0);
  const pitchInfluence = 0.05 * depthFactor; // REDUCED from 0.5 to 0.05 - was causing Y overflow to 1.0

  // Apply depth-corrected pitch compensation to vertical iris ratio
  // This helps when iris is occluded by eyelid during upward gaze
  // For 2D mode, reduce pitch influence to 2.0 for stability
  const enhancedPitchInfluence = 2.0 * depthFactor; // Reduced for 2D mode stability
  const depthCorrectedY = avgIrisRatioY + (headPitch * enhancedPitchInfluence);

  // DEBUG: Log vertical tracking components
  if (import.meta.env.DEV && Math.random() < 0.033) { // ~2 times per second at 60fps
    console.log('📊 Vertical Tracking Components:', {
      avgIrisRatioY: avgIrisRatioY.toFixed(4),
      headPitch: headPitch.toFixed(4),
      enhancedPitchInfluence: enhancedPitchInfluence.toFixed(4),
      headContribution: (headPitch * enhancedPitchInfluence).toFixed(4),
      depthCorrectedY: depthCorrectedY.toFixed(4),
      avgZ: avgZ.toFixed(4),
      depthFactor: depthFactor.toFixed(3)
    });
  }

  // === RAW DATA CALLBACK (for calibration) ===
  // Call the callback with raw iris offset and head pose BEFORE any sensitivity calculations
  if (onRawGazeData) {
    onRawGazeData({
      irisOffset: {
        x: avgIrisRatioX, // Normalized iris offset X (-0.05 to +0.05 typically)
        y: avgIrisRatioY  // Normalized iris offset Y
      },
      headPose: {
        yaw: headYaw,     // Normalized head yaw (-1 to +1)
        pitch: headPitch  // Normalized head pitch
      },
      timestamp: Date.now()
    });
  }

  // Combine iris position with head rotation using depth-corrected value
  // Y-AXIS SENSITIVITY FIX:
  // Problem: Y축은 headPitch만 사용하고 avgIrisRatioY(눈동자 움직임)를 무시함
  // Solution: depthCorrectedY (iris + head pitch 조합)를 사용하고 적절한 sensitivity 적용
  // depthCorrectedY = avgIrisRatioY + (headPitch * pitchInfluence)
  // pitchInfluence = 0.05는 너무 작아서 35로 증가 (iris + head 모두 반영)
  const baseSensitivityY = storedSensitivity ? parseFloat(storedSensitivity) : 20; // Matching X axis for balanced 2D tracking
  const headCompensatedY = (depthCorrectedY * baseSensitivityY);

  // === FINAL GAZE COORDINATES ===
  // Horizontal: Center at 0.5, direct mapping (no flip needed with correct iris offset)
  const rawX = 0.5 + (headCompensatedX * 1.0);  // Reduced multiplier for stable 2D tracking
  const x = rawX;  // ✅ FIXED: No flip - iris offset already provides correct direction

  // Vertical: Use depth-corrected Y (iris + head pitch combined)
  //   depthCorrectedY combines iris position with head pitch influence
  //   baseSensitivityY=35 scales the combined value to screen space
  //   Typical range: depthCorrectedY ~±0.03 → headCompensatedY ~±1.05 → rawY 0.0-1.0
  const yMultiplier = 1.0;
  const rawY = 0.5 - (headCompensatedY * yMultiplier); // SUBTRACT for correct direction mapping
  const y = rawY; // No clamping here - let smoothing handle it

  // Calculate confidence
  const eyeSymmetryX = 1 - Math.abs(leftIrisRatioX - rightIrisRatioX) * 20;
  const frontalFactor = 1 - (Math.abs(headYaw) * 2 + Math.abs(headPitch));
  const confidence = Math.max(0.3, Math.min(1.0, (eyeSymmetryX + frontalFactor) / 2));

  // === DEBUG: X & Y CALCULATION CHAIN ===
  // Log only occasionally to reduce console spam
  if (Math.random() < 0.01) { // 1% of frames
    console.log('🔍 X & Y Calculation:', {
      finalX: x.toFixed(3),
      finalY: y.toFixed(3),
      confidence: confidence.toFixed(2)
    });
  }

  // === DEBUG LOGGING (development mode only) ===
  // Only log every 60 frames (~1 second at 60fps) to reduce console spam
  const isDev = import.meta.env.DEV;
  if (isDev && Math.random() < 0.016) {
    console.group('🔍 Gaze Calculation Debug (3D)');
    console.log('📊 Raw Iris:', {
      avgX: avgIrisRatioX.toFixed(4),
      avgY: avgIrisRatioY.toFixed(4),
      avgZ: avgZ.toFixed(4)
    });
    console.log('🎭 Head:', {
      yaw: headYaw.toFixed(4),
      pitch: headPitch.toFixed(4)
    });
    console.log('🌊 3D Depth:', {
      depthFactor: depthFactor.toFixed(3),
      pitchInfluence: pitchInfluence.toFixed(3),
      depthCorrectedY: depthCorrectedY.toFixed(4)
    });
    console.log('✅ Final:', {
      x: x.toFixed(4),
      y: y.toFixed(4),
      conf: confidence.toFixed(2)
    });
    console.groupEnd();
  }

  return { x, y, confidence };
}

function applyAffineTransform(
  x: number,
  y: number,
  matrix: number[][]
): { x: number; y: number } {
  const transformedX = matrix[0][0] * x + matrix[0][1] * y + matrix[0][2];
  const transformedY = matrix[1][0] * x + matrix[1][1] * y + matrix[1][2];
  return { x: transformedX, y: transformedY };
}

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
  const timeDiff = (timestamp - lastGaze.timestamp) / 1000;

  if (x < -0.1 || x > 1.1 || y < -0.1 || y > 1.1) {
    return GazeType.OFF_PAGE;
  }

  const velocity = timeDiff > 0 ? distance / timeDiff : 0;

  if (velocity > 1.0) {
    return GazeType.SACCADE;
  }

  return GazeType.FIXATION;
}

function calculateEAR(
  p2: { x: number; y: number },
  p6: { x: number; y: number },
  p3: { x: number; y: number },
  p5: { x: number; y: number },
  p1: { x: number; y: number },
  p4: { x: number; y: number }
): number {
  const verticalDist1 = Math.sqrt(
    Math.pow(p2.x - p6.x, 2) + Math.pow(p2.y - p6.y, 2)
  );
  const verticalDist2 = Math.sqrt(
    Math.pow(p3.x - p5.x, 2) + Math.pow(p3.y - p5.y, 2)
  );
  const horizontalDist = Math.sqrt(
    Math.pow(p1.x - p4.x, 2) + Math.pow(p1.y - p4.y, 2)
  );

  return (verticalDist1 + verticalDist2) / (2.0 * horizontalDist);
}
