import React, { useState, useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

/**
 * 🎯 JEO-Style Real-Time Eye Tracking using MediaPipe Face Mesh
 *
 * Architecture (JEO Algorithm):
 * 1. 3D Eye Model: Eye ball center + radius (mm units)
 * 2. Eye Center Calculation: Using eye contour landmarks
 * 3. Gaze Vector: Iris center - Eye center = gaze direction (3D)
 * 4. Ray-Plane Intersection: Project 3D gaze to 2D screen coordinates
 * 5. Depth Compensation: Use MediaPipe z-depth for distance correction
 * 6. Head Pose Approximation: Face orientation for rotation matrix
 *
 * References:
 * - backend/app/vision/tracker.py (JEO implementation)
 * - MediaPipe Face Mesh 468 landmarks + 10 iris landmarks
 */

interface GazePoint {
  x: number;
  y: number;
  confidence: number;
  timestamp: number;
}

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

// JEO 3D Eye Model (mm units, face-center coordinate system)
const EYE_MODEL = {
  // Eye ball centers in face coordinate system
  leftEyeCenter: { x: -29.0, y: 0.0, z: -42.0 },  // mm
  rightEyeCenter: { x: 29.0, y: 0.0, z: -42.0 },
  eyeBallRadius: 12.0,  // mm

  // Screen estimation
  screenDistance: 600.0,  // mm (~60cm typical viewing distance)
  screenWidthMM: 400.0,   // mm (typical 15-17" monitor)
  screenHeightMM: 300.0,
};

// MediaPipe Face Mesh landmark indices
const LANDMARKS = {
  // Left eye contour (8 points for precise center calculation)
  leftEyeContour: [33, 133, 160, 159, 158, 157, 173, 246],
  // Right eye contour
  rightEyeContour: [362, 263, 387, 386, 385, 384, 398, 466],
  // Iris landmarks (5 points each, MediaPipe refine_landmarks=true)
  leftIris: [468, 469, 470, 471, 472],
  rightIris: [473, 474, 475, 476, 477],
  // Face orientation reference points
  noseTip: 1,
  chinBottom: 152,
  leftEyeCorner: 33,
  rightEyeCorner: 263,
};

const VisionDebugRealtime: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [fps, setFps] = useState(0);
  const [gazeHistory, setGazeHistory] = useState<GazePoint[]>([]);
  const [currentGaze, setCurrentGaze] = useState<GazePoint | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  /**
   * Calculate 3D eye center from eye contour landmarks
   * JEO: Uses all eye contour points for accurate center
   */
  const calculateEyeCenter3D = (landmarks: any[], indices: number[]): Vector3D | null => {
    if (!landmarks || landmarks.length === 0) return null;

    let sumX = 0, sumY = 0, sumZ = 0;
    let count = 0;

    for (const idx of indices) {
      if (idx < landmarks.length && landmarks[idx]) {
        sumX += landmarks[idx].x;
        sumY += landmarks[idx].y;
        sumZ += landmarks[idx].z || 0;
        count++;
      }
    }

    if (count === 0) return null;

    return {
      x: sumX / count,
      y: sumY / count,
      z: sumZ / count,
    };
  };

  /**
   * Calculate iris center from 5-point iris landmarks
   * JEO: MediaPipe provides precise iris tracking
   */
  const calculateIrisCenter3D = (landmarks: any[], indices: number[]): Vector3D | null => {
    if (!landmarks || landmarks.length === 0) return null;

    let sumX = 0, sumY = 0, sumZ = 0;
    let count = 0;

    for (const idx of indices) {
      if (idx < landmarks.length && landmarks[idx]) {
        sumX += landmarks[idx].x;
        sumY += landmarks[idx].y;
        sumZ += landmarks[idx].z || 0;
        count++;
      }
    }

    if (count === 0) return null;

    return {
      x: sumX / count,
      y: sumY / count,
      z: sumZ / count,
    };
  };

  /**
   * Calculate 3D gaze direction vector
   * JEO: Gaze vector = Iris center - Eye center (normalized)
   */
  const calculateGazeVector3D = (irisCenter: Vector3D, eyeCenter: Vector3D): Vector3D => {
    const dx = irisCenter.x - eyeCenter.x;
    const dy = irisCenter.y - eyeCenter.y;
    const dz = irisCenter.z - eyeCenter.z;

    // Normalize
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (length === 0) return { x: 0, y: 0, z: -1 };

    return {
      x: dx / length,
      y: dy / length,
      z: dz / length,
    };
  };

  /**
   * Approximate head pose from face landmarks
   * JEO: Estimates pitch, yaw, roll from face orientation
   */
  const estimateHeadPose = (landmarks: any[]): { pitch: number; yaw: number; roll: number } | null => {
    if (!landmarks || landmarks.length < 468) return null;

    const nose = landmarks[LANDMARKS.noseTip];
    const chin = landmarks[LANDMARKS.chinBottom];
    const leftEye = landmarks[LANDMARKS.leftEyeCorner];
    const rightEye = landmarks[LANDMARKS.rightEyeCorner];

    if (!nose || !chin || !leftEye || !rightEye) return null;

    // Yaw: Left-right head rotation (nose position relative to eye line)
    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const yaw = (nose.x - eyeCenterX) * 50; // Empirical scaling

    // Pitch: Up-down head rotation (nose-chin vertical distance)
    const pitchRatio = Math.abs(nose.y - chin.y);
    const pitch = (0.15 - pitchRatio) * 100; // Inverted: looking down increases pitch

    // Roll: Head tilt (eye line angle)
    const eyeLineAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
    const roll = eyeLineAngle * (180 / Math.PI);

    return { pitch, yaw, roll };
  };

  /**
   * JEO Ray-Plane Intersection: Project 3D gaze vector to 2D screen coordinates
   *
   * Algorithm:
   * 1. Define screen plane at distance D from face
   * 2. Cast ray from eye center along gaze vector
   * 3. Find intersection point with screen plane
   * 4. Convert mm coordinates to pixel coordinates
   * 5. Apply depth compensation based on z-distance
   */
  const projectGazeToScreen = (
    gazeVector: Vector3D,
    eyeCenter3D: Vector3D,
    avgDepth: number,
    screenWidth: number,
    screenHeight: number
  ): { x: number; y: number } | null => {
    // Screen plane is at fixed distance from face (60cm typical)
    const screenZ = EYE_MODEL.screenDistance;

    // Ray equation: P(t) = eyeCenter + t * gazeVector
    // Screen plane: Z = screenZ
    // Solve for t: eyeCenter.z + t * gazeVector.z = screenZ

    if (Math.abs(gazeVector.z) < 0.001) {
      // Gaze is nearly parallel to screen - default to center
      return { x: screenWidth / 2, y: screenHeight / 2 };
    }

    // MediaPipe z is in normalized coords, need to scale to mm
    // Empirical: z typically ranges -0.1 to 0.1, represents ~50mm depth variation
    const depthScaleMM = 500.0;
    const eyeZ = eyeCenter3D.z * depthScaleMM;

    // Calculate ray parameter t for screen intersection
    const t = (screenZ - eyeZ) / gazeVector.z;

    if (t < 0) {
      // Intersection behind eye (shouldn't happen normally)
      return { x: screenWidth / 2, y: screenHeight / 2 };
    }

    // Intersection point in 3D (mm units, MediaPipe normalized for x,y)
    const intersectX = eyeCenter3D.x + t * gazeVector.x;
    const intersectY = eyeCenter3D.y + t * gazeVector.y;

    // Convert from normalized MediaPipe coords to mm
    // MediaPipe x,y range: 0 to 1 (normalized by video dimensions)
    // Need to scale to screen physical dimensions
    const xMM = (intersectX - 0.5) * EYE_MODEL.screenWidthMM;
    const yMM = (intersectY - 0.5) * EYE_MODEL.screenHeightMM;

    // Depth compensation: closer face = larger movement scale
    const depthFactor = 1.0 + avgDepth * 2.0; // Empirical adjustment

    // Convert mm to pixels
    const mmToPixelX = screenWidth / EYE_MODEL.screenWidthMM;
    const mmToPixelY = screenHeight / EYE_MODEL.screenHeightMM;

    const screenX = screenWidth / 2 + xMM * mmToPixelX * depthFactor;
    const screenY = screenHeight / 2 - yMM * mmToPixelY * depthFactor; // Y inverted

    // Clamp to screen bounds
    return {
      x: Math.max(0, Math.min(screenWidth - 1, screenX)),
      y: Math.max(0, Math.min(screenHeight - 1, screenY)),
    };
  };

  /**
   * Main JEO gaze estimation pipeline
   */
  const calculateJEOGaze = (landmarks: any[]): GazePoint | null => {
    if (!landmarks || landmarks.length < 478) return null;

    // 1. Calculate eye centers (from contour landmarks)
    const leftEyeCenter = calculateEyeCenter3D(landmarks, LANDMARKS.leftEyeContour);
    const rightEyeCenter = calculateEyeCenter3D(landmarks, LANDMARKS.rightEyeContour);

    if (!leftEyeCenter || !rightEyeCenter) return null;

    // 2. Calculate iris centers (from iris landmarks)
    const leftIrisCenter = calculateIrisCenter3D(landmarks, LANDMARKS.leftIris);
    const rightIrisCenter = calculateIrisCenter3D(landmarks, LANDMARKS.rightIris);

    if (!leftIrisCenter || !rightIrisCenter) return null;

    // 3. Calculate gaze vectors for each eye
    const leftGazeVec = calculateGazeVector3D(leftIrisCenter, leftEyeCenter);
    const rightGazeVec = calculateGazeVector3D(rightIrisCenter, rightEyeCenter);

    // 4. Average gaze vector (binocular)
    const avgGazeVec: Vector3D = {
      x: (leftGazeVec.x + rightGazeVec.x) / 2,
      y: (leftGazeVec.y + rightGazeVec.y) / 2,
      z: (leftGazeVec.z + rightGazeVec.z) / 2,
    };

    // Normalize
    const length = Math.sqrt(avgGazeVec.x ** 2 + avgGazeVec.y ** 2 + avgGazeVec.z ** 2);
    if (length > 0) {
      avgGazeVec.x /= length;
      avgGazeVec.y /= length;
      avgGazeVec.z /= length;
    }

    // 5. Average eye center for ray origin
    const avgEyeCenter: Vector3D = {
      x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
      y: (leftEyeCenter.y + rightEyeCenter.y) / 2,
      z: (leftEyeCenter.z + rightEyeCenter.z) / 2,
    };

    // 6. Get average depth (for compensation)
    const avgDepth = avgEyeCenter.z;

    // 7. Project to screen using ray-plane intersection
    const screenPoint = projectGazeToScreen(
      avgGazeVec,
      avgEyeCenter,
      avgDepth,
      window.innerWidth,
      window.innerHeight
    );

    if (!screenPoint) return null;

    // 8. Estimate head pose for additional context
    const headPose = estimateHeadPose(landmarks);

    // Debug info
    const debugText = `Gaze Vec: (${avgGazeVec.x.toFixed(2)}, ${avgGazeVec.y.toFixed(2)}, ${avgGazeVec.z.toFixed(2)})
Eye Depth: ${avgDepth.toFixed(3)}
Head: P=${headPose?.pitch.toFixed(1)}° Y=${headPose?.yaw.toFixed(1)}° R=${headPose?.roll.toFixed(1)}°`;
    setDebugInfo(debugText);

    return {
      x: screenPoint.x,
      y: screenPoint.y,
      confidence: 0.9, // High confidence with JEO method
      timestamp: Date.now(),
    };
  };

  // Gaze smoothing with exponential moving average
  const smoothedGazeRef = useRef<{ x: number; y: number } | null>(null);
  const SMOOTHING_FACTOR = 0.3; // Lower = more smoothing (0.1-0.5 recommended)

  const smoothGazePoint = (newPoint: { x: number; y: number }): { x: number; y: number } => {
    if (!smoothedGazeRef.current) {
      smoothedGazeRef.current = newPoint;
      return newPoint;
    }

    // Exponential moving average for smooth gaze tracking
    const smoothed = {
      x: smoothedGazeRef.current.x * (1 - SMOOTHING_FACTOR) + newPoint.x * SMOOTHING_FACTOR,
      y: smoothedGazeRef.current.y * (1 - SMOOTHING_FACTOR) + newPoint.y * SMOOTHING_FACTOR,
    };

    smoothedGazeRef.current = smoothed;
    return smoothed;
  };

  // Process results and update visualization
  const processResults = (results: any) => {
    if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
      setFaceDetected(false);
      return;
    }

    setFaceDetected(true);
    const landmarks = results.faceLandmarks[0];

    // Calculate JEO gaze
    const rawGazePoint = calculateJEOGaze(landmarks);
    if (rawGazePoint) {
      // Apply smoothing to reduce jitter
      const smoothedPoint = smoothGazePoint({ x: rawGazePoint.x, y: rawGazePoint.y });
      const finalGaze = {
        ...rawGazePoint,
        x: smoothedPoint.x,
        y: smoothedPoint.y,
      };

      setCurrentGaze(finalGaze);
      setGazeHistory((prev) => [...prev.slice(-29), finalGaze]);
    }

    // ✅ FIX 1: Draw VIDEO FRAME on main canvas
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        // Draw the actual video frame
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      }
    }

    // ✅ FIX 2: Draw JEO landmarks on overlay canvas
    if (overlayCanvasRef.current && videoRef.current) {
      const overlayCanvas = overlayCanvasRef.current;
      const overlayCtx = overlayCanvas.getContext('2d');
      if (!overlayCtx) return;

      overlayCanvas.width = videoRef.current.videoWidth;
      overlayCanvas.height = videoRef.current.videoHeight;
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      // Draw eye contours (blue)
      overlayCtx.strokeStyle = '#0000ff';
      overlayCtx.lineWidth = 2;

      // Left eye
      overlayCtx.beginPath();
      LANDMARKS.leftEyeContour.forEach((idx, i) => {
        const point = landmarks[idx];
        const x = point.x * overlayCanvas.width;
        const y = point.y * overlayCanvas.height;
        if (i === 0) overlayCtx.moveTo(x, y);
        else overlayCtx.lineTo(x, y);
      });
      overlayCtx.closePath();
      overlayCtx.stroke();

      // Right eye
      overlayCtx.beginPath();
      LANDMARKS.rightEyeContour.forEach((idx, i) => {
        const point = landmarks[idx];
        const x = point.x * overlayCanvas.width;
        const y = point.y * overlayCanvas.height;
        if (i === 0) overlayCtx.moveTo(x, y);
        else overlayCtx.lineTo(x, y);
      });
      overlayCtx.closePath();
      overlayCtx.stroke();

      // Draw iris landmarks (red)
      overlayCtx.fillStyle = '#ff0000';
      [...LANDMARKS.leftIris, ...LANDMARKS.rightIris].forEach((idx) => {
        const point = landmarks[idx];
        const x = point.x * overlayCanvas.width;
        const y = point.y * overlayCanvas.height;
        overlayCtx.beginPath();
        overlayCtx.arc(x, y, 3, 0, 2 * Math.PI);
        overlayCtx.fill();
      });

      // Draw eye centers (green)
      const leftEyeCenter = calculateEyeCenter3D(landmarks, LANDMARKS.leftEyeContour);
      const rightEyeCenter = calculateEyeCenter3D(landmarks, LANDMARKS.rightEyeContour);

      if (leftEyeCenter && rightEyeCenter) {
        overlayCtx.fillStyle = '#00ff00';
        [leftEyeCenter, rightEyeCenter].forEach((center) => {
          const x = center.x * overlayCanvas.width;
          const y = center.y * overlayCanvas.height;
          overlayCtx.beginPath();
          overlayCtx.arc(x, y, 5, 0, 2 * Math.PI);
          overlayCtx.fill();
        });
      }
    }

    // Update FPS
    const now = performance.now();
    frameCountRef.current++;
    if (now - lastFrameTimeRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
    }
  };

  // Main prediction loop
  const predict = async () => {
    if (!faceLandmarkerRef.current || !videoRef.current) return;

    try {
      const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, Date.now());
      processResults(results);
    } catch (error) {
      console.error('❌ Prediction error:', error);
    }

    animationFrameRef.current = requestAnimationFrame(predict);
  };

  const startTracking = async () => {
    try {
      console.log('🔧 Initializing MediaPipe Vision...');

      // Initialize MediaPipe Vision Tasks with LOCAL WASM files
      const vision = await FilesetResolver.forVisionTasks('/wasm');

      console.log('🔧 Creating Face Landmarker...');

      // Create Face Landmarker with NEW API
      // NOTE: face_landmarker model includes 478 landmarks (468 face + 10 iris) by default
      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });

      faceLandmarkerRef.current = faceLandmarker;

      console.log('📹 Requesting camera access...');

      // Get camera stream using modern getUserMedia
      if (!videoRef.current) {
        throw new Error('Video element not ready');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      await videoRef.current.play();

      setIsRunning(true);

      console.log('✅ JEO real-time eye tracking started with LOCAL WASM files');

      // Start prediction loop
      animationFrameRef.current = requestAnimationFrame(predict);
    } catch (error: any) {
      console.error('❌ Failed to start tracking:', error);

      // Better error messages based on error type
      let errorMessage = 'JEO 시선 추적을 시작할 수 없습니다.\n\n';

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage +=
          '원인: 카메라 접근 권한이 거부되었습니다.\n해결: 브라우저 설정에서 카메라를 허용해주세요.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += '원인: 카메라를 찾을 수 없습니다.\n해결: 카메라가 연결되어 있는지 확인해주세요.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage +=
          '원인: 카메라가 다른 프로그램에서 사용 중입니다.\n해결: 다른 프로그램을 종료하고 다시 시도해주세요.';
      } else if (error.message && error.message.includes('WASM')) {
        errorMessage +=
          '원인: MediaPipe WASM 파일 로딩 실패\n해결: 페이지를 새로고침(F5)해주세요.\n\n기술 정보: ' +
          error.message;
      } else if (error.message && error.message.includes('model')) {
        errorMessage +=
          '원인: AI 모델 로딩 실패\n해결: 인터넷 연결을 확인하고 다시 시도해주세요.\n\n기술 정보: ' +
          error.message;
      } else {
        errorMessage += `원인: ${error.message || '알 수 없는 오류'}\n해결: 페이지를 새로고침하고 다시 시도해주세요.`;
      }

      alert(errorMessage);
    }
  };

  const stopTracking = () => {
    // Cancel animation frame loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clean up video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Reset state
    setIsRunning(false);
    setFaceDetected(false);
    setCurrentGaze(null);
    setGazeHistory([]);
    setDebugInfo('');

    console.log('⏹️ Tracking stopped');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎯 JEO Real-Time Eye Tracking
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          3D Eye Model + Ray-Plane Intersection for precise gaze mapping
        </p>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Controls</h2>
              <p className="text-sm text-gray-500 mt-1">
                Status: {isRunning ? '🟢 Running' : '🔴 Stopped'} | FPS: {fps} | Face:{' '}
                {faceDetected ? '✅ Detected' : '❌ Not Detected'}
              </p>
            </div>
            <div className="flex gap-3">
              {!isRunning ? (
                <button
                  onClick={startTracking}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Start JEO Tracking
                </button>
              ) : (
                <button
                  onClick={stopTracking}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Stop Tracking
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ✅ NEW LAYOUT: Large Heatmap + Small Camera Popup */}
        <div className="relative">
          {/* MAIN: Full-Width Gaze Heatmap (BIG) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              🎯 Gaze Heatmap (JEO Algorithm - Smoothed)
            </h2>
            <div
              className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden"
              style={{ height: '70vh', minHeight: '600px' }}
            >
              {currentGaze && (
                <>
                  {/* Current gaze point - RED CROSSHAIR for precision */}
                  <div
                    className="absolute pointer-events-none z-20"
                    style={{
                      left: `${(currentGaze.x / window.innerWidth) * 100}%`,
                      top: `${(currentGaze.y / window.innerHeight) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      transition: 'left 0.1s ease-out, top 0.1s ease-out',
                    }}
                  >
                    {/* Crosshair */}
                    <div className="relative w-12 h-12">
                      <div className="absolute left-1/2 top-0 w-0.5 h-full bg-red-500 transform -translate-x-1/2" />
                      <div className="absolute top-1/2 left-0 h-0.5 w-full bg-red-500 transform -translate-y-1/2" />
                      <div className="absolute left-1/2 top-1/2 w-4 h-4 border-2 border-red-500 rounded-full bg-white transform -translate-x-1/2 -translate-y-1/2 shadow-lg" />
                    </div>
                  </div>
                  {/* Gaze trail */}
                  {gazeHistory.slice(-30).map((point, idx) => (
                    <div
                      key={idx}
                      className="absolute w-2 h-2 bg-blue-400 rounded-full"
                      style={{
                        left: `${(point.x / window.innerWidth) * 100}%`,
                        top: `${(point.y / window.innerHeight) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        opacity: 0.2 + (idx / 30) * 0.8,
                      }}
                    />
                  ))}
                </>
              )}
              {!isRunning && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-lg">
                  🎯 Click "Start JEO Tracking" to begin eye tracking
                </div>
              )}

              {/* ✅ SMALL CAMERA POPUP (Top-Right) */}
              {isRunning && (
                <div className="absolute top-4 right-4 z-30 bg-black rounded-lg shadow-2xl border-4 border-blue-500 overflow-hidden">
                  <div className="bg-blue-600 px-3 py-1 text-xs text-white font-semibold">
                    📹 Live Camera + JEO Overlay
                  </div>
                  <div className="relative" style={{ width: '320px', height: '240px' }}>
                    {/* Hidden video element for MediaPipe */}
                    <video
                      ref={videoRef}
                      className="hidden"
                      autoPlay
                      playsInline
                      muted
                    />

                    {/* Canvas for video rendering */}
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full object-contain"
                    />

                    {/* Canvas for tracking overlay */}
                    <canvas
                      ref={overlayCanvasRef}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />

                    {/* FPS indicator */}
                    <div className="absolute top-2 left-2 bg-black bg-opacity-70 px-2 py-1 rounded text-xs text-white font-mono">
                      {fps} FPS | {faceDetected ? '✅ Face' : '❌ No Face'}
                    </div>
                  </div>
                  <div className="bg-gray-900 px-3 py-1 text-xs text-white space-y-0.5">
                    <p>🔵 Blue: Eye contours | 🔴 Red: Iris</p>
                    <p>🟢 Green: Eye centers | {gazeHistory.length} points tracked</p>
                  </div>
                </div>
              )}
            </div>

            {/* Gaze Stats Below Heatmap */}
            {currentGaze && (
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 font-semibold">Gaze Position (Smoothed)</p>
                  <p className="font-mono text-gray-800 text-lg">
                    X: {currentGaze.x.toFixed(0)}px, Y: {currentGaze.y.toFixed(0)}px
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 font-semibold">Confidence</p>
                  <p className="font-mono text-gray-800 text-lg">{(currentGaze.confidence * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-500 font-semibold">Performance</p>
                  <p className="font-mono text-gray-800 text-lg">{fps} FPS | {gazeHistory.length}/30 hist</p>
                </div>
              </div>
            )}

            {/* Debug Info */}
            {debugInfo && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">🔬 JEO Debug Info</p>
                <pre className="p-3 bg-gray-100 rounded text-xs font-mono whitespace-pre-wrap text-gray-700">
                  {debugInfo}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Technical Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">🎯 JEO Algorithm Architecture</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ 3D Eye Model: Eye ball center ({EYE_MODEL.leftEyeCenter.x}, {EYE_MODEL.leftEyeCenter.z})mm + radius {EYE_MODEL.eyeBallRadius}mm</li>
            <li>✅ Eye Center Calculation: 8-point contour landmarks for precision</li>
            <li>✅ Iris Center: 5-point iris landmarks (MediaPipe refine_landmarks)</li>
            <li>✅ Gaze Vector: Iris - Eye Center (normalized 3D)</li>
            <li>✅ Ray-Plane Intersection: 3D gaze → 2D screen at {EYE_MODEL.screenDistance}mm</li>
            <li>✅ Depth Compensation: z-coordinate for distance correction</li>
            <li>✅ Head Pose Approximation: Pitch/Yaw/Roll from face orientation</li>
            <li>✅ Screen Physical Model: {EYE_MODEL.screenWidthMM}mm × {EYE_MODEL.screenHeightMM}mm</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VisionDebugRealtime;
