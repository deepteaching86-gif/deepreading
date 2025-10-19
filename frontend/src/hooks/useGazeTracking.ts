// useGazeTracking Hook v2 - MediaPipe Tasks Vision
// Real-time gaze tracking using @mediapipe/tasks-vision (official MediaPipe package)

import { useState, useEffect, useRef, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { GazePoint, GazeType, GazeEstimation, FaceLandmarks } from '../types/vision.types';
import { ConcentrationRawData } from '../types/concentration.types';

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
  const { enabled, onGazePoint, calibrationMatrix, onFacePosition, onRawGazeData, onConcentrationData } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentGaze, setCurrentGaze] = useState<GazeEstimation | null>(null);
  const [fps, setFps] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fpsCounterRef = useRef({ frames: 0, lastTime: Date.now() });
  const lastGazeRef = useRef<{ x: number; y: number; timestamp: number } | null>(null);

  // Temporal smoothing filter - Exponential Moving Average (EMA)
  // Reduces single-frame noise while maintaining responsiveness
  const smoothedGazeRef = useRef<{ x: number; y: number } | null>(null);

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
      faceLandmarker.setOptions({
        runningMode: 'VIDEO',                // REQUIRED: Set video mode for video streams
        numFaces: 1,                         // Track single face
        minFaceDetectionConfidence: 0.5,     // Lower = more sensitive detection
        minFacePresenceConfidence: 0.5,      // Lower = better tracking
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
    if (!faceLandmarkerRef.current) {
      console.log('🔧 Face Landmarker not initialized, initializing...');
      await initialize();
    }

    if (!faceLandmarkerRef.current) {
      console.error('❌ Face Landmarker not initialized after initialization attempt');
      setError('Face Landmarker not initialized');
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
    if (!faceLandmarkerRef.current || !videoRef.current || !isTracking) {
      console.log('⏭️ Skipping detection:', {
        hasFaceLandmarker: !!faceLandmarkerRef.current,
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

      // Draw visualization on canvas
      if (canvasRef.current) {
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

          // Draw guide text
          ctx.font = 'bold 16px Arial';
          ctx.fillStyle = '#22c55e';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          const guideText = '👤 여기에 얼굴 위치';
          const textMetrics = ctx.measureText(guideText);
          const textX = (canvas.width - textMetrics.width) / 2;
          ctx.strokeText(guideText, textX, guideY - 10);
          ctx.fillText(guideText, textX, guideY - 10);

          // Draw detection status
          ctx.font = 'bold 20px Arial';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.fillStyle = result.faceLandmarks.length > 0 ? '#22c55e' : '#ef4444';
          const statusText = result.faceLandmarks.length > 0
            ? `✅ Face: ${result.faceLandmarks.length}`
            : '❌ No Face';
          ctx.strokeText(statusText, 10, 30);
          ctx.fillText(statusText, 10, 30);

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

            // Draw iris landmarks (468-477)
            if (landmarks.length >= 478) {
              ctx.fillStyle = '#00ffff';
              // Left iris: 468-472
              for (let i = 468; i <= 472; i++) {
                if (landmarks[i]) {
                  const point = toCanvasCoords(landmarks[i]);
                  ctx.beginPath();
                  ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
                  ctx.fill();
                }
              }
              // Right iris: 473-477
              for (let i = 473; i <= 477; i++) {
                if (landmarks[i]) {
                  const point = toCanvasCoords(landmarks[i]);
                  ctx.beginPath();
                  ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
                  ctx.fill();
                }
              }

              // Draw iris centers (larger, bright yellow)
              ctx.fillStyle = '#ffff00';
              if (landmarks[468]) {
                const point = toCanvasCoords(landmarks[468]);
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
                ctx.fill();
              }
              if (landmarks[473]) {
                const point = toCanvasCoords(landmarks[473]);
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
                ctx.fill();
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

            // Draw landmark count
            ctx.font = 'bold 16px Arial';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.fillStyle = '#22c55e';
            const infoText = `Landmarks: ${landmarks.length}`;
            ctx.strokeText(infoText, 10, 60);
            ctx.fillText(infoText, 10, 60);
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

      // Log every 60 frames
      if (fpsCounterRef.current.frames % 60 === 0) {
        console.log('👤 No face detected');
        console.log('💡 Lighting:', analysisText, `(${Math.round(brightness)}/255)`);
      }

      setCurrentGaze(null);
      animationFrameRef.current = window.requestAnimationFrame(detectAndEstimateGaze);
      return;
    }

    console.log('✅ Face detected with', result.faceLandmarks[0].length, 'landmarks');

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

    // Convert normalized coordinates to pixel coordinates for our calculations
    const toPixelCoords = (landmark: { x: number; y: number; z: number }) => ({
      x: landmark.x * video.videoWidth,
      y: landmark.y * video.videoHeight,
      z: landmark.z
    });

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

    console.log('👁️ Eye Aspect Ratio (EAR):', {
      left: leftEAR.toFixed(3),
      right: rightEAR.toFixed(3),
      average: avgEAR.toFixed(3),
      status: avgEAR > 0.12 ? 'OPEN' : 'CLOSED'
    });

    // Lowered threshold from 0.18 to 0.12 to allow tracking when looking up
    // When eyes look up, upper eyelid covers more iris, reducing EAR
    const EAR_THRESHOLD = 0.12;

    if (avgEAR < EAR_THRESHOLD) {
      console.warn('👓 Eyes closed or occluded');
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

    if (landmarks.length >= 478) {
      const potentialLeftIris = toPixelCoords(landmarks[468]);
      const potentialRightIris = toPixelCoords(landmarks[473]);

      if (potentialLeftIris && potentialRightIris) {
        const leftEyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x);
        const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x);

        const leftIrisValid =
          Math.abs(potentialLeftIris.x - (leftEyeOuter.x + leftEyeInner.x) / 2) < leftEyeWidth * 0.8;
        const rightIrisValid =
          Math.abs(potentialRightIris.x - (rightEyeOuter.x + rightEyeInner.x) / 2) < rightEyeWidth * 0.8;

        if (leftIrisValid && rightIrisValid) {
          leftIris = potentialLeftIris;
          rightIris = potentialRightIris;
          usingIrisLandmarks = true;
          console.log('✅ Using validated iris landmarks');
        }
      }
    }

    if (!usingIrisLandmarks) {
      console.log('⚠️ Using eye center fallback');
    }

    // Calculate eye centers
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

    // Estimate gaze
    const gaze = estimateGazeFromLandmarks(
      faceLandmarks,
      video.videoWidth,
      video.videoHeight,
      onRawGazeData
    );

    // Clamp gaze values to valid screen range (0.0 ~ 1.0) BEFORE smoothing
    // This prevents temporal filter from creating invalid values
    const clampedGaze = {
      x: Math.max(0.0, Math.min(1.0, gaze.x)),
      y: Math.max(0.0, Math.min(1.0, gaze.y))
    };

    // Apply temporal smoothing (EMA filter) to reduce single-frame noise
    // Alpha = 0.3 means 30% new value, 70% previous value
    // Higher alpha = more responsive but noisier
    // Lower alpha = smoother but less responsive
    const SMOOTHING_ALPHA = 0.3;

    if (!smoothedGazeRef.current) {
      // First frame - initialize with current gaze
      smoothedGazeRef.current = { x: clampedGaze.x, y: clampedGaze.y };
    } else {
      // Apply EMA: smoothed = alpha * new + (1 - alpha) * previous
      smoothedGazeRef.current = {
        x: SMOOTHING_ALPHA * clampedGaze.x + (1 - SMOOTHING_ALPHA) * smoothedGazeRef.current.x,
        y: SMOOTHING_ALPHA * clampedGaze.y + (1 - SMOOTHING_ALPHA) * smoothedGazeRef.current.y
      };
    }

    // Use smoothed values for final gaze
    const smoothedX = smoothedGazeRef.current.x;
    const smoothedY = smoothedGazeRef.current.y;

    // Apply calibration
    let calibratedX = smoothedX;
    let calibratedY = smoothedY;

    if (calibrationMatrix) {
      const transformed = applyAffineTransform(smoothedX, smoothedY, calibrationMatrix);
      calibratedX = transformed.x;
      calibratedY = transformed.y;
    }

    const gazeEstimation: GazeEstimation = {
      x: calibratedX,
      y: calibratedY,
      confidence: gaze.confidence,
      landmarks: faceLandmarks
    };

    setCurrentGaze(gazeEstimation);
    console.log('🎯 Gaze updated:', {
      x: calibratedX.toFixed(2),
      y: calibratedY.toFixed(2),
      confidence: gaze.confidence
    });

    // Classify gaze type
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

    if (onGazePoint) {
      onGazePoint(gazePoint);
    }

    // === 집중력 분석용 데이터 생성 ===
    if (onConcentrationData) {
      // 동공 크기 추정 (홍채 크기 기반)
      const leftEyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x);
      const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x);
      // const avgEyeWidth = (leftEyeWidth + rightEyeWidth) / 2; // Reserved for future use

      // 홍채 중심과 눈 모서리 사이 거리로 동공 크기 근사
      const leftIrisToOuter = Math.abs(leftIris.x - leftEyeOuter.x);
      const leftIrisToInner = Math.abs(leftIris.x - leftEyeInner.x);
      const rightIrisToOuter = Math.abs(rightIris.x - rightEyeOuter.x);
      const rightIrisToInner = Math.abs(rightIris.x - rightEyeInner.x);

      const leftPupilRatio = Math.min(leftIrisToOuter, leftIrisToInner) / leftEyeWidth;
      const rightPupilRatio = Math.min(rightIrisToOuter, rightIrisToInner) / rightEyeWidth;
      const avgPupilSize = (leftPupilRatio + rightPupilRatio) / 2;

      // 눈 움직임 속도 계산
      let eyeMovementVelocity = 0;
      if (lastGazeRef.current) {
        const dx = calibratedX - lastGazeRef.current.x;
        const dy = calibratedY - lastGazeRef.current.y;
        const dt = (timestamp - lastGazeRef.current.timestamp) / 1000; // 초 단위
        const distance = Math.sqrt(dx * dx + dy * dy);
        eyeMovementVelocity = dt > 0 ? distance / dt : 0;
      }

      // Head pose 계산 (이미 estimateGazeFromLandmarks에서 계산됨)
      const eyesCenterX = (leftEyeCenter.x + leftEyeCenter.x) / 2;
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
        gazeVector: { x: calibratedX, y: calibratedY },
        eyeMovementVelocity,
        headPose: {
          yaw: headYaw,
          pitch: headPitch,
          roll: headRoll
        },
        fixationPoint: gazeType === GazeType.FIXATION ? { x: calibratedX, y: calibratedY } : null,
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
  }, [isTracking, onGazePoint, calibrationMatrix, onFacePosition, onRawGazeData, onConcentrationData]);

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
  const screenSizeFactor = Math.max(0.5, Math.min(2.0, screenDiagonalInches / 24.0));

  // Viewing distance factor: closer viewing = lower sensitivity
  // Normalize so 0.12 (50cm) = 1.0x
  const viewingDistanceFactor = Math.max(0.5, Math.min(2.0, 0.12 / eyeDistanceRatio));

  // Aspect ratio factor: wider screens need more horizontal sensitivity
  const aspectRatio = screenWidth / screenHeight;
  const aspectRatioFactorX = Math.max(1.0, aspectRatio / 1.6); // 16:10 as baseline

  // Final adaptive multipliers
  const adaptiveMultiplierX = screenSizeFactor * viewingDistanceFactor * aspectRatioFactorX;
  const adaptiveMultiplierY = screenSizeFactor * viewingDistanceFactor;

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
  const baseSensitivityX = 35; // Reduced from 80 for more stable tracking
  const headCompensatedX = (avgIrisRatioX * baseSensitivityX) - (headYaw * 8.0); // Reduced head influence

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
  const depthCorrectedY = avgIrisRatioY + (headPitch * pitchInfluence);

  // DEBUG: Log if Y value is getting too large before final multipliers
  if (import.meta.env.DEV && Math.abs(depthCorrectedY) > 0.05) {
    console.warn('⚠️ Large depthCorrectedY:', {
      avgIrisRatioY: avgIrisRatioY.toFixed(4),
      headPitch: headPitch.toFixed(4),
      pitchInfluence: pitchInfluence.toFixed(4),
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
  // Y-AXIS ROOT CAUSE FIX:
  // Issue: headPitch calculation was NEGATED (line 955), but subtraction assumes POSITIVE pitch
  // When user looks DOWN: headPitch is NEGATIVE (due to negation)
  // rawY = 0.5 - (negative_value * sensitivity) = 0.5 - (-X) = 0.5 + X → INCREASES (goes DOWN) ✓ CORRECT
  //
  // When user looks UP: headPitch is POSITIVE (due to negation)
  // rawY = 0.5 - (positive_value * sensitivity) = 0.5 - X → DECREASES (goes UP) ✓ CORRECT
  //
  // ACTUAL PROBLEM: Sensitivity was TOO HIGH (6.0), causing overflow
  // With headPitch=0.18, baseSensitivity=6.0, yMultiplier=1.5:
  //   rawY = 0.5 - (0.18 * 6.0 * 1.5) = 0.5 - 1.62 = -1.12 → clamped to 0.0, then smoothed to 1.0
  //
  // SOLUTION: Use original balanced sensitivity (2.0) with adaptive multiplier for screen size
  const baseSensitivityY = 2.0; // RESET to original 2.0 - previous 6.0 caused overflow
  const headCompensatedY = (headPitch * baseSensitivityY); // Use headPitch directly

  // === FINAL GAZE COORDINATES ===
  // Horizontal: Center at 0.5, FLIP for correct left-right mapping
  const rawX = 0.5 + (headCompensatedX * 2.5);  // Increased to 2.5 for corner coverage
  const x = 1.0 - rawX;  // FLIP: Mirror horizontally (left ↔ right)

  // Vertical: With baseSensitivityY=2.0, headPitch ~±0.2 typical range:
  //   - Looking UP (headPitch=+0.2): rawY = 0.5 - (0.2*2.0) = 0.5 - 0.4 = 0.1 (top)
  //   - Looking CENTER (headPitch=0): rawY = 0.5 - 0 = 0.5 (middle)
  //   - Looking DOWN (headPitch=-0.2): rawY = 0.5 - (-0.4) = 0.9 (bottom)
  const yMultiplier = 1.0; // Reset to 1.0 - no additional multiplication needed
  const rawY = 0.5 - (headCompensatedY * yMultiplier); // SUBTRACT for correct direction mapping
  const y = rawY; // No clamping here - let smoothing handle it

  // === DEBUG: X & Y CALCULATION CHAIN ===
  console.log('🔍 X & Y Calculation:', {
    // X-axis
    avgIrisRatioX: avgIrisRatioX.toFixed(4),
    headYaw: headYaw.toFixed(4),
    headCompensatedX: headCompensatedX.toFixed(4),
    rawX: rawX.toFixed(4),
    finalX: x.toFixed(4),
    // Y-axis
    avgIrisRatioY: avgIrisRatioY.toFixed(4),
    headPitch: headPitch.toFixed(4),
    headCompensatedY: headCompensatedY.toFixed(4),
    rawY: rawY.toFixed(4),
    finalY: y.toFixed(4)
  });

  // Calculate confidence
  const eyeSymmetryX = 1 - Math.abs(leftIrisRatioX - rightIrisRatioX) * 20;
  const frontalFactor = 1 - (Math.abs(headYaw) * 2 + Math.abs(headPitch));
  const confidence = Math.max(0.3, Math.min(1.0, (eyeSymmetryX + frontalFactor) / 2));

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
