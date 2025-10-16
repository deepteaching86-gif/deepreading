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

      // Create MediaPipe Face Landmarks detector
      // Use tfjs runtime (recommended for browser, version 1.0.6)
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;

      console.log('🔧 Creating face detector with tfjs runtime...');
      const tfjsConfig: faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig = {
        runtime: 'tfjs',
        refineLandmarks: true, // Enable iris tracking
        maxFaces: 1
      };

      const detector = await faceLandmarksDetection.createDetector(model, tfjsConfig);
      detectorRef.current = detector;
      console.log('✅ TFJS Face Mesh detector loaded successfully');
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

    // Detect face landmarks with visualization for debugging
    let faces;
    try {
      // Use dynamic mode (staticImageMode: false) for video streams
      // This enables tracking which is more efficient and accurate for continuous video
      faces = await detectorRef.current.estimateFaces(video, {
        flipHorizontal: false,
        staticImageMode: false  // Dynamic mode for video tracking (better for real-time)
      });

      // Draw faces on canvas for debugging (update every frame for smooth visualization)
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
          const guideWidth = canvas.width * 0.4;  // 40% of canvas width
          const guideHeight = canvas.height * 0.6; // 60% of canvas height
          const guideX = (canvas.width - guideWidth) / 2;
          const guideY = (canvas.height - guideHeight) / 2;

          // Draw guide box with dashed border
          ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 5]);
          ctx.strokeRect(guideX, guideY, guideWidth, guideHeight);
          ctx.setLineDash([]); // Reset dash

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

          // Draw detection status in top-left
          ctx.font = 'bold 20px Arial';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.fillStyle = faces.length > 0 ? '#22c55e' : '#ef4444';
          const statusText = faces.length > 0 ? `✅ Face: ${faces.length}` : '❌ No Face';
          ctx.strokeText(statusText, 10, 30);
          ctx.fillText(statusText, 10, 30);

          // If face detected, draw landmarks
          if (faces.length > 0) {
            const face = faces[0];
            const keypoints = face.keypoints;

            // Draw all face landmarks as small dots
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            keypoints.forEach((point) => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
              ctx.fill();
            });

            // Draw face mesh outline (face contour)
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Face oval keypoints: 10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
            const faceOvalIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
            faceOvalIndices.forEach((idx, i) => {
              if (keypoints[idx]) {
                if (i === 0) {
                  ctx.moveTo(keypoints[idx].x, keypoints[idx].y);
                } else {
                  ctx.lineTo(keypoints[idx].x, keypoints[idx].y);
                }
              }
            });
            ctx.closePath();
            ctx.stroke();

            // Draw left eye (green)
            ctx.strokeStyle = '#22c55e';
            ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const leftEyeIndices = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
            leftEyeIndices.forEach((idx, i) => {
              if (keypoints[idx]) {
                if (i === 0) {
                  ctx.moveTo(keypoints[idx].x, keypoints[idx].y);
                } else {
                  ctx.lineTo(keypoints[idx].x, keypoints[idx].y);
                }
              }
            });
            ctx.closePath();
            ctx.stroke();
            ctx.fill();

            // Draw right eye (green)
            ctx.beginPath();
            const rightEyeIndices = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466];
            rightEyeIndices.forEach((idx, i) => {
              if (keypoints[idx]) {
                if (i === 0) {
                  ctx.moveTo(keypoints[idx].x, keypoints[idx].y);
                } else {
                  ctx.lineTo(keypoints[idx].x, keypoints[idx].y);
                }
              }
            });
            ctx.closePath();
            ctx.stroke();
            ctx.fill();

            // Draw iris landmarks if available (bright cyan for visibility)
            if (keypoints.length >= 478) {
              ctx.fillStyle = '#00ffff';
              // Left iris: 468-472
              for (let i = 468; i <= 472; i++) {
                if (keypoints[i]) {
                  ctx.beginPath();
                  ctx.arc(keypoints[i].x, keypoints[i].y, 3, 0, 2 * Math.PI);
                  ctx.fill();
                }
              }
              // Right iris: 473-477
              for (let i = 473; i <= 477; i++) {
                if (keypoints[i]) {
                  ctx.beginPath();
                  ctx.arc(keypoints[i].x, keypoints[i].y, 3, 0, 2 * Math.PI);
                  ctx.fill();
                }
              }

              // Draw iris center (larger, bright yellow)
              ctx.fillStyle = '#ffff00';
              if (keypoints[468]) {
                ctx.beginPath();
                ctx.arc(keypoints[468].x, keypoints[468].y, 5, 0, 2 * Math.PI);
                ctx.fill();
              }
              if (keypoints[473]) {
                ctx.beginPath();
                ctx.arc(keypoints[473].x, keypoints[473].y, 5, 0, 2 * Math.PI);
                ctx.fill();
              }
            }

            // Draw nose tip (red)
            if (keypoints[1]) {
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.arc(keypoints[1].x, keypoints[1].y, 5, 0, 2 * Math.PI);
              ctx.fill();
            }

            // Draw info text
            ctx.font = 'bold 16px Arial';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.fillStyle = '#22c55e';
            const infoText = `Keypoints: ${keypoints.length}`;
            ctx.strokeText(infoText, 10, 60);
            ctx.fillText(infoText, 10, 60);

            // Draw face box with position feedback
            if (face.box) {
              // Check if face is within guide box
              const faceCenterX = face.box.xMin + face.box.width / 2;
              const faceCenterY = face.box.yMin + face.box.height / 2;
              const isInGuideX = faceCenterX >= guideX && faceCenterX <= guideX + guideWidth;
              const isInGuideY = faceCenterY >= guideY && faceCenterY <= guideY + guideHeight;
              const isWellPositioned = isInGuideX && isInGuideY;

              // Draw face box (green if well positioned, red if not)
              ctx.strokeStyle = isWellPositioned ? '#22c55e' : '#ef4444';
              ctx.lineWidth = 3;
              ctx.strokeRect(face.box.xMin, face.box.yMin, face.box.width, face.box.height);

              // Draw position feedback text
              ctx.font = 'bold 18px Arial';
              ctx.fillStyle = isWellPositioned ? '#22c55e' : '#ef4444';
              ctx.strokeStyle = 'black';
              ctx.lineWidth = 3;
              const feedbackText = isWellPositioned ? '✅ 완벽한 위치!' : '⚠️ 가이드 박스 안으로';
              const feedbackMetrics = ctx.measureText(feedbackText);
              const feedbackX = (canvas.width - feedbackMetrics.width) / 2;
              ctx.strokeText(feedbackText, feedbackX, canvas.height - 20);
              ctx.fillText(feedbackText, feedbackX, canvas.height - 20);

              // Draw arrows if face is outside guide
              if (!isInGuideX) {
                ctx.font = 'bold 30px Arial';
                ctx.fillStyle = '#ef4444';
                if (faceCenterX < guideX) {
                  // Face is on left, show right arrow
                  ctx.fillText('👉', canvas.width - 50, canvas.height / 2);
                } else {
                  // Face is on right, show left arrow
                  ctx.fillText('👈', 20, canvas.height / 2);
                }
              }
              if (!isInGuideY) {
                ctx.font = 'bold 30px Arial';
                ctx.fillStyle = '#ef4444';
                if (faceCenterY < guideY) {
                  // Face is above, show down arrow
                  ctx.fillText('👇', canvas.width / 2, canvas.height - 50);
                } else {
                  // Face is below, show up arrow
                  ctx.fillText('👆', canvas.width / 2, 50);
                }
              }
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

    if (faces.length === 0) {
      // No face detected - analyze brightness and provide detailed debugging info
      let brightness = 0;
      let analysisText = 'unknown';

      // Analyze video brightness using canvas
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          try {
            // Sample center 100x100 region for brightness analysis
            const sampleSize = 100;
            const sampleX = (canvas.width - sampleSize) / 2;
            const sampleY = (canvas.height - sampleSize) / 2;
            const imageData = ctx.getImageData(sampleX, sampleY, sampleSize, sampleSize);
            const data = imageData.data;

            // Calculate average brightness (0-255)
            let sum = 0;
            for (let i = 0; i < data.length; i += 4) {
              // Weighted average for human perception: 0.299*R + 0.587*G + 0.114*B
              sum += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            }
            brightness = sum / (data.length / 4);

            // Categorize brightness
            if (brightness < 50) {
              analysisText = '🌑 TOO DARK - increase lighting';
            } else if (brightness < 100) {
              analysisText = '🌘 Dim - may affect detection';
            } else if (brightness < 200) {
              analysisText = '✅ Good lighting';
            } else {
              analysisText = '☀️ Bright - may be overexposed';
            }
          } catch (brightnessError) {
            analysisText = 'Failed to analyze';
          }
        }
      }

      const debugInfo = {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        paused: video.paused,
        currentTime: video.currentTime,
        hasVideoData: video.readyState >= 2,
        brightness: Math.round(brightness),
        brightnessAnalysis: analysisText
      };

      // Only log every 60 frames (~2 seconds) to reduce spam
      if (fpsCounterRef.current.frames % 60 === 0) {
        console.log('👤 No face detected - Video state:', debugInfo);
        console.log('💡 Troubleshooting tips:');
        console.log('  1. Check if Canvas shows your face clearly');
        console.log(`  2. Lighting: ${analysisText} (brightness: ${Math.round(brightness)}/255)`);
        console.log('  3. Face should be clearly visible and frontal');
        console.log('  4. Try moving closer to or further from camera');
        console.log('  5. Remove any obstructions (hands, masks, etc.)');
        console.log('  6. Ensure camera is focused (tap on mobile)');
      }

      setCurrentGaze(null);
      // Schedule next frame
      animationFrameRef.current = window.requestAnimationFrame(detectAndEstimateGaze);
      return;
    }

    console.log('✅ Face detected! Total faces:', faces.length);

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
    // MediaPipe Face Mesh indices (comprehensive for EAR and iris tracking):
    // Left eye: outer=33, inner=133, top=159, bottom=145, upper_mid=157, lower_mid=144
    // Right eye: outer=263, inner=362, top=386, bottom=374, upper_mid=387, lower_mid=373
    // With refineLandmarks, iris points are at the end (468-477 for tfjs runtime)

    // Eye contour points for Eye Aspect Ratio (EAR) calculation
    const leftEyeOuter = keypoints[33];
    const leftEyeInner = keypoints[133];
    const leftEyeTop = keypoints[159];
    const leftEyeBottom = keypoints[145];
    const leftEyeTopMid = keypoints[157];
    const leftEyeBottomMid = keypoints[144];

    const rightEyeOuter = keypoints[263];
    const rightEyeInner = keypoints[362];
    const rightEyeTop = keypoints[386];
    const rightEyeBottom = keypoints[374];
    const rightEyeTopMid = keypoints[387];
    const rightEyeBottomMid = keypoints[373];

    const noseTip = keypoints[1];

    // Calculate Eye Aspect Ratio (EAR) for blink/occlusion detection
    // EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
    // Research shows: EAR > 0.21 = open, EAR < 0.21 = closed (adjusted for Asian eyes)
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
      status: avgEAR > 0.18 ? 'OPEN' : 'CLOSED/OCCLUDED'
    });

    // Modified EAR threshold for diverse populations (glasses, small eyes, Asian eyes)
    // Research-based thresholds: 0.18-0.25 depending on individual characteristics
    const EAR_THRESHOLD = 0.18; // Lower threshold for better detection with glasses/small eyes

    if (avgEAR < EAR_THRESHOLD) {
      console.warn('👓 Eyes closed or occluded (glasses/blink), skipping gaze estimation');
      setCurrentGaze(null);
      // Schedule next frame
      animationFrameRef.current = window.requestAnimationFrame(detectAndEstimateGaze);
      return;
    }

    // For iris, check if we have refined landmarks (478+ keypoints)
    // Initialize with geometric eye centers as fallback
    let leftIris: { x: number; y: number; z: number } = {
      x: (leftEyeOuter.x + leftEyeInner.x) / 2,
      y: (leftEyeTop.y + leftEyeBottom.y) / 2,
      z: leftEyeOuter.z || 0
    };
    let rightIris: { x: number; y: number; z: number } = {
      x: (rightEyeOuter.x + rightEyeInner.x) / 2,
      y: (rightEyeTop.y + rightEyeBottom.y) / 2,
      z: rightEyeOuter.z || 0
    };
    let usingIrisLandmarks = false;

    if (keypoints.length >= 478) {
      // Refined landmarks available - iris at indices 468-477
      const potentialLeftIris = keypoints[468]; // Left iris center
      const potentialRightIris = keypoints[473]; // Right iris center

      // Validate iris landmarks (check if they're within reasonable eye bounds)
      if (potentialLeftIris && potentialRightIris) {
        const leftEyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x);
        const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x);

        // Check if iris is within eye boundaries (with some margin)
        const leftIrisValid =
          Math.abs(potentialLeftIris.x - (leftEyeOuter.x + leftEyeInner.x) / 2) < leftEyeWidth * 0.8;
        const rightIrisValid =
          Math.abs(potentialRightIris.x - (rightEyeOuter.x + rightEyeInner.x) / 2) < rightEyeWidth * 0.8;

        if (leftIrisValid && rightIrisValid) {
          leftIris = {
            x: potentialLeftIris.x,
            y: potentialLeftIris.y,
            z: potentialLeftIris.z || 0
          };
          rightIris = {
            x: potentialRightIris.x,
            y: potentialRightIris.y,
            z: potentialRightIris.z || 0
          };
          usingIrisLandmarks = true;
          console.log('✅ Using validated iris landmarks');
        }
      }
    }

    // Log fallback status
    if (!usingIrisLandmarks) {
      console.log('⚠️ Iris landmarks unavailable or invalid, using eye center fallback');
    }

    // Calculate eye centers for landmarks structure
    const leftEyeCenter = {
      x: (leftEyeOuter.x + leftEyeInner.x) / 2,
      y: (leftEyeTop.y + leftEyeBottom.y) / 2
    };
    const rightEyeCenter = {
      x: (rightEyeOuter.x + rightEyeInner.x) / 2,
      y: (rightEyeTop.y + rightEyeBottom.y) / 2
    };

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

// Helper: Estimate gaze from face landmarks with improved algorithm
function estimateGazeFromLandmarks(
  landmarks: FaceLandmarks,
  videoWidth: number,
  videoHeight: number
): { x: number; y: number; confidence: number } {
  console.log('🔬 Analyzing gaze with advanced algorithm...');

  // 1. Calculate iris-to-eye ratio for each eye independently
  // This accounts for different eye shapes and angles
  const leftEyeWidth = Math.abs(landmarks.leftEye.x - landmarks.leftIris.x);
  const rightEyeWidth = Math.abs(landmarks.rightEye.x - landmarks.rightIris.x);

  // Calculate relative iris position within each eye (0 = left, 0.5 = center, 1 = right)
  const leftIrisRatio = leftEyeWidth / (videoWidth * 0.05); // Normalize by eye width estimate
  const rightIrisRatio = rightEyeWidth / (videoWidth * 0.05);

  console.log('👁️ Iris ratios:', {
    left: leftIrisRatio.toFixed(3),
    right: rightIrisRatio.toFixed(3)
  });

  // 2. Calculate eye-to-nose distance to estimate head rotation (yaw)
  const eyesCenterX = (landmarks.leftEye.x + landmarks.rightEye.x) / 2;
  const noseTipX = landmarks.noseTip.x;
  const headYaw = (noseTipX - eyesCenterX) / videoWidth; // -0.5 to 0.5 range

  // 3. Calculate vertical head tilt (pitch) using nose and eye positions
  const eyesCenterY = (landmarks.leftEye.y + landmarks.rightEye.y) / 2;
  const noseTipY = landmarks.noseTip.y;
  const headPitch = (noseTipY - eyesCenterY) / videoHeight; // Positive = looking down

  console.log('🎭 Head pose:', {
    yaw: (headYaw * 100).toFixed(1) + '%',
    pitch: (headPitch * 100).toFixed(1) + '%'
  });

  // 4. Combine iris position with head pose for improved gaze estimation
  // Average both eyes' iris positions
  const avgIrisRatio = (leftIrisRatio + rightIrisRatio) / 2;

  // Compensate for head rotation
  // When head turns left (negative yaw), eyes relatively shift right
  const headCompensatedX = avgIrisRatio - (headYaw * 2.0);

  // Use iris Y position with head pitch compensation
  const avgIrisY = (landmarks.leftIris.y + landmarks.rightIris.y) / 2;
  const baseY = avgIrisY / videoHeight;
  const headCompensatedY = baseY + (headPitch * 0.5);

  // 5. Map to screen coordinates with sensitivity adjustment
  // Increase sensitivity for more responsive gaze tracking
  const x = 0.5 + (headCompensatedX * 0.4); // Center around 0.5 with 40% sensitivity
  const y = headCompensatedY;

  // 6. Calculate confidence based on:
  // - Symmetry between left and right eye
  // - Head pose (frontal = higher confidence)
  const eyeSymmetry = 1 - Math.abs(leftIrisRatio - rightIrisRatio);
  const frontalFactor = 1 - (Math.abs(headYaw) * 2 + Math.abs(headPitch));
  const confidence = Math.max(0.3, Math.min(1.0, (eyeSymmetry + frontalFactor) / 2));

  console.log('🎯 Gaze result:', {
    x: x.toFixed(3),
    y: y.toFixed(3),
    confidence: confidence.toFixed(2),
    symmetry: eyeSymmetry.toFixed(2),
    frontal: frontalFactor.toFixed(2)
  });

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

// Helper: Calculate Eye Aspect Ratio (EAR) for blink/occlusion detection
// Based on research: Soukupová & Čech (2016) "Real-Time Eye Blink Detection using Facial Landmarks"
// EAR formula: (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
// where p1-p6 are eye landmark points
function calculateEAR(
  p2: { x: number; y: number },  // Top mid vertical point
  p6: { x: number; y: number },  // Bottom mid vertical point
  p3: { x: number; y: number },  // Top vertical point
  p5: { x: number; y: number },  // Bottom vertical point
  p1: { x: number; y: number },  // Outer horizontal point
  p4: { x: number; y: number }   // Inner horizontal point
): number {
  // Calculate vertical distances (numerator)
  const verticalDist1 = Math.sqrt(
    Math.pow(p2.x - p6.x, 2) + Math.pow(p2.y - p6.y, 2)
  );
  const verticalDist2 = Math.sqrt(
    Math.pow(p3.x - p5.x, 2) + Math.pow(p3.y - p5.y, 2)
  );

  // Calculate horizontal distance (denominator)
  const horizontalDist = Math.sqrt(
    Math.pow(p1.x - p4.x, 2) + Math.pow(p1.y - p4.y, 2)
  );

  // EAR formula: (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
  // Typical values: EAR > 0.21 = open eyes, EAR < 0.21 = closed/occluded
  // Modified for diverse populations (glasses, small eyes, Asian eyes): 0.18-0.25
  return (verticalDist1 + verticalDist2) / (2.0 * horizontalDist);
}
