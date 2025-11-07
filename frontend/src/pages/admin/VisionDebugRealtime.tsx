import React, { useState, useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

/**
 * 실시간 시선 추적 디버그
 * Real-Time Eye Tracking Debug Interface
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

interface CalibrationData {
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
  accuracy: number;
}

interface CalibrationPoint {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
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

// 9-Point Calibration Grid (normalized 0-1 coordinates)
// For future enhancement: full 9-point calibration
// @ts-ignore - Reserved for future 9-point calibration implementation
const CALIBRATION_POINTS: CalibrationPoint[] = [
  { x: 0.1, y: 0.1 },   // Top-left
  { x: 0.5, y: 0.1 },   // Top-center
  { x: 0.9, y: 0.1 },   // Top-right
  { x: 0.1, y: 0.5 },   // Middle-left
  { x: 0.5, y: 0.5 },   // Center
  { x: 0.9, y: 0.5 },   // Middle-right
  { x: 0.1, y: 0.9 },   // Bottom-left
  { x: 0.5, y: 0.9 },   // Bottom-center
  { x: 0.9, y: 0.9 },   // Bottom-right
];

const SAMPLES_PER_POINT = 30; // Collect 30 frames per calibration point (~1 second at 30fps)

// MediaPipe Face Mesh landmark indices
const LANDMARKS = {
  // Left eye contour (8 points for visualization only)
  leftEyeContour: [33, 133, 160, 159, 158, 157, 173, 246],
  // Right eye contour
  rightEyeContour: [362, 263, 387, 386, 385, 384, 398, 466],

  // 🎯 STABLE LANDMARKS for eye sphere center (JEO recommendation)
  // These landmarks are anchored to facial bone structure and remain stable during head rotation
  leftEyeInnerCorner: 133,   // Medial canthus (stable anchor point)
  leftEyeOuterCorner: 33,    // Lateral canthus (stable anchor point)
  leftEyeTop: 159,           // Upper eyelid center
  leftEyeBottom: 145,        // Lower eyelid center

  rightEyeInnerCorner: 362,  // Medial canthus (stable anchor point)
  rightEyeOuterCorner: 263,  // Lateral canthus (stable anchor point)
  rightEyeTop: 386,          // Upper eyelid center
  rightEyeBottom: 374,       // Lower eyelid center

  noseBridge: 168,           // Nose bridge top (reference for depth)

  // Iris landmarks (5 points each, MediaPipe refine_landmarks=true)
  leftIris: [468, 469, 470, 471, 472],
  rightIris: [473, 474, 475, 476, 477],

  // Face orientation reference points
  noseTip: 1,
  chinBottom: 152,
  leftEyeCorner: 33,   // Kept for backward compatibility
  rightEyeCorner: 263,
};

const VisionDebugRealtime: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [fps, setFps] = useState(0);
  const [gazeHistory, setGazeHistory] = useState<GazePoint[]>([]);
  const [currentGaze, setCurrentGaze] = useState<GazePoint | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // 🎯 Calibration State
  const [isCalibrating, setIsCalibrating] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_calibrationSamples, setCalibrationSamples] = useState<{ x: number; y: number }[]>([]);
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);
  const [calibrationMessage, setCalibrationMessage] = useState<string>('');
  const [showVideoOverlay, setShowVideoOverlay] = useState(true);

  // 📹 Camera resolution state
  const [cameraResolution, setCameraResolution] = useState({ width: 640, height: 480 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  useEffect(() => {
    // Load calibration from localStorage on mount
    const savedCalibration = localStorage.getItem('jeo_calibration');
    if (savedCalibration) {
      try {
        const calibData = JSON.parse(savedCalibration);
        setCalibrationData(calibData);
        console.log('✅ Loaded calibration:', calibData);
      } catch (e) {
        console.warn('Failed to load calibration:', e);
      }
    }

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
   * 🎯 START CALIBRATION: Collect gaze samples at screen center
   * JEO Step 6: "calibrate screen center"
   */
  const startCalibration = () => {
    if (!isRunning || !faceDetected) {
      alert('먼저 JEO Tracking을 시작하고 얼굴이 인식된 후 캘리브레이션을 진행하세요.');
      return;
    }

    setIsCalibrating(true);
    setCalibrationSamples([]);
    setCalibrationMessage('화면 중앙의 🎯 를 30초간 응시하세요...');
    console.log('🎯 Starting 1-point screen center calibration...');
  };

  /**
   * 🎯 CALCULATE CALIBRATION: Compute offset from center-point samples
   */
  const calculateCalibration = (samples: { x: number; y: number }[]) => {
    if (samples.length === 0) {
      console.error('No calibration samples collected!');
      return null;
    }

    // Calculate average gaze point from samples
    const avgGazeX = samples.reduce((sum, s) => sum + s.x, 0) / samples.length;
    const avgGazeY = samples.reduce((sum, s) => sum + s.y, 0) / samples.length;

    // Target is screen center
    const targetX = window.innerWidth / 2;
    const targetY = window.innerHeight / 2;

    // Calculate offset: how much to shift gaze to match target
    const offsetX = targetX - avgGazeX;
    const offsetY = targetY - avgGazeY;

    // Calculate accuracy (average error distance)
    const errors = samples.map((s) => {
      const dx = (s.x + offsetX) - targetX;
      const dy = (s.y + offsetY) - targetY;
      return Math.sqrt(dx * dx + dy * dy);
    });
    const accuracy = errors.reduce((sum, e) => sum + e, 0) / errors.length;

    const calibData: CalibrationData = {
      offsetX,
      offsetY,
      scaleX: 1.0, // Not used in 1-point calibration
      scaleY: 1.0,
      accuracy,
    };

    console.log('✅ Calibration complete:', calibData);
    return calibData;
  };

  /**
   * 🎯 APPLY CALIBRATION: Transform raw gaze with offset
   */
  const applyCalibration = (rawX: number, rawY: number): { x: number; y: number } => {
    if (!calibrationData) return { x: rawX, y: rawY };

    return {
      x: rawX + calibrationData.offsetX,
      y: rawY + calibrationData.offsetY,
    };
  };

  /**
   * 🎯 SAVE CALIBRATION: Persist to localStorage
   */
  const saveCalibration = (calibData: CalibrationData) => {
    try {
      localStorage.setItem('jeo_calibration', JSON.stringify(calibData));
      console.log('💾 Calibration saved to localStorage');
    } catch (e) {
      console.error('Failed to save calibration:', e);
    }
  };

  /**
   * 🎯 CLEAR CALIBRATION: Remove calibration data
   */
  const clearCalibration = () => {
    setCalibrationData(null);
    localStorage.removeItem('jeo_calibration');
    setCalibrationMessage('');
    console.log('🗑️ Calibration cleared');
  };

  /**
   * 🎯 JEO STABLE LANDMARKS: Calculate eye sphere center from stable facial anchors
   *
   * Uses bone-anchored landmarks (eye corners, eyelid centers) instead of dynamic eye contour.
   * This provides more stable eye center position during head rotation and eye movements.
   *
   * Reference: "eye spheres will use stable landmarks" (JEO recommendation)
   */
  const calculateStableEyeCenter3D = (
    landmarks: any[],
    innerCorner: number,
    outerCorner: number,
    topLid: number,
    bottomLid: number
  ): Vector3D | null => {
    if (!landmarks || landmarks.length === 0) return null;

    // Get stable anchor points (bone-anchored, minimal movement during expressions)
    const inner = landmarks[innerCorner];   // Medial canthus (inner eye corner)
    const outer = landmarks[outerCorner];   // Lateral canthus (outer eye corner)
    const top = landmarks[topLid];          // Upper eyelid center
    const bottom = landmarks[bottomLid];    // Lower eyelid center

    if (!inner || !outer || !top || !bottom) return null;

    // Horizontal center: midpoint between stable inner and outer corners
    const centerX = (inner.x + outer.x) / 2;

    // Vertical center: midpoint between top and bottom eyelid centers
    const centerY = (top.y + bottom.y) / 2;

    // Depth: average z-coordinate of all four stable anchor points
    const centerZ = (inner.z + outer.z + top.z + bottom.z) / 4;

    return {
      x: centerX,
      y: centerY,
      z: centerZ,
    };
  };

  /**
   * Calculate 3D eye center from eye contour landmarks (LEGACY - for visualization only)
   * JEO: Uses all eye contour points for accurate center
   * NOTE: Now replaced by calculateStableEyeCenter3D for actual gaze calculation
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
   * 🎯 JEO PRECISE IRIS CENTER: Geometric center with visibility weighting
   *
   * MediaPipe iris landmarks (5 points): center + 4 cardinal points (top, bottom, left, right)
   * - Index 0 (center): iris center estimate
   * - Indices 1-4: top, bottom, left, right points on iris boundary
   *
   * JEO Improvement: Use geometric center method that accounts for:
   * - Landmark visibility (eyelid occlusion)
   * - Depth consistency for vertical tracking accuracy
   * - Weighted average prioritizing visible landmarks
   */
  const calculateIrisCenter3D = (landmarks: any[], indices: number[]): Vector3D | null => {
    if (!landmarks || landmarks.length === 0 || indices.length < 5) return null;

    // MediaPipe iris landmarks: [center, top, bottom, left, right]
    const centerLM = landmarks[indices[0]];   // Index 468/473: iris center (most reliable)
    const topLM = landmarks[indices[1]];      // Top iris edge
    const bottomLM = landmarks[indices[2]];   // Bottom iris edge
    const leftLM = landmarks[indices[3]];     // Left iris edge
    const rightLM = landmarks[indices[4]];    // Right iris edge

    if (!centerLM) return null;

    // 🎯 PRIMARY METHOD: Use MediaPipe's built-in iris center (index 0)
    // This is MediaPipe's pre-calculated iris center, most reliable for vertical tracking
    // Secondary geometric validation using visible boundary landmarks

    // Calculate geometric center from visible boundary points (fallback/validation)
    const boundaryPoints: Vector3D[] = [];
    if (topLM) boundaryPoints.push({ x: topLM.x, y: topLM.y, z: topLM.z || 0 });
    if (bottomLM) boundaryPoints.push({ x: bottomLM.x, y: bottomLM.y, z: bottomLM.z || 0 });
    if (leftLM) boundaryPoints.push({ x: leftLM.x, y: leftLM.y, z: leftLM.z || 0 });
    if (rightLM) boundaryPoints.push({ x: rightLM.x, y: rightLM.y, z: rightLM.z || 0 });

    // Weighted average: 70% MediaPipe center, 30% geometric center from boundaries
    // This provides stability while correcting for any MediaPipe estimation errors
    let geometricX = 0, geometricY = 0, geometricZ = 0;
    if (boundaryPoints.length > 0) {
      for (const p of boundaryPoints) {
        geometricX += p.x;
        geometricY += p.y;
        geometricZ += p.z;
      }
      geometricX /= boundaryPoints.length;
      geometricY /= boundaryPoints.length;
      geometricZ /= boundaryPoints.length;

      // Blend: MediaPipe center (primary) + geometric center (correction)
      return {
        x: centerLM.x * 0.7 + geometricX * 0.3,
        y: centerLM.y * 0.7 + geometricY * 0.3,
        z: (centerLM.z || 0) * 0.7 + geometricZ * 0.3,
      };
    }

    // Fallback: Use MediaPipe center only if boundary points unavailable
    return {
      x: centerLM.x,
      y: centerLM.y,
      z: centerLM.z || 0,
    };
  };

  /**
   * Calculate 3D gaze direction vector
   * JEO: Gaze vector = Iris center - Eye center (normalized)
   *
   * ⚠️ MediaPipe Y-axis correction:
   * - MediaPipe Y increases downward (0=top, 1=bottom)
   * - Looking up: iris Y decreases → dy should be positive for upward gaze
   * - Looking down: iris Y increases → dy should be negative for downward gaze
   * - Therefore: INVERT Y component (eyeCenter.y - irisCenter.y)
   */
  const calculateGazeVector3D = (irisCenter: Vector3D, eyeCenter: Vector3D): Vector3D => {
    const dx = irisCenter.x - eyeCenter.x;
    const dy = eyeCenter.y - irisCenter.y; // ✅ INVERTED for MediaPipe Y-axis
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
    const screenY = screenHeight / 2 + yMM * mmToPixelY * depthFactor; // Y coordinate (screen Y increases downward)

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

    // 1. 🎯 Calculate STABLE eye centers (from bone-anchored landmarks)
    // Using stable facial landmarks instead of dynamic eye contour for more robust tracking
    const leftEyeCenter = calculateStableEyeCenter3D(
      landmarks,
      LANDMARKS.leftEyeInnerCorner,
      LANDMARKS.leftEyeOuterCorner,
      LANDMARKS.leftEyeTop,
      LANDMARKS.leftEyeBottom
    );
    const rightEyeCenter = calculateStableEyeCenter3D(
      landmarks,
      LANDMARKS.rightEyeInnerCorner,
      LANDMARKS.rightEyeOuterCorner,
      LANDMARKS.rightEyeTop,
      LANDMARKS.rightEyeBottom
    );

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
      // 🎯 CALIBRATION MODE: Collect samples at screen center
      if (isCalibrating) {
        setCalibrationSamples((prev) => {
          const newSamples = [...prev, { x: rawGazePoint.x, y: rawGazePoint.y }];

          // Check if we have enough samples
          if (newSamples.length >= SAMPLES_PER_POINT) {
            // Calculate calibration from collected samples
            const calibData = calculateCalibration(newSamples);
            if (calibData) {
              setCalibrationData(calibData);
              saveCalibration(calibData);
              setCalibrationMessage(`✅ 캘리브레이션 완료! 정확도: ${calibData.accuracy.toFixed(1)}px`);
            }
            setIsCalibrating(false);
            return [];
          }

          // Update progress message
          setCalibrationMessage(`화면 중앙 응시 중... ${newSamples.length}/${SAMPLES_PER_POINT}`);
          return newSamples;
        });

        // During calibration, don't apply calibration yet - show raw gaze
        const smoothedPoint = smoothGazePoint({ x: rawGazePoint.x, y: rawGazePoint.y });
        const finalGaze = { ...rawGazePoint, x: smoothedPoint.x, y: smoothedPoint.y };
        setCurrentGaze(finalGaze);
        setGazeHistory((prev) => [...prev.slice(-29), finalGaze]);
      } else {
        // 🎯 NORMAL MODE: Apply calibration and smoothing
        const calibratedPoint = applyCalibration(rawGazePoint.x, rawGazePoint.y);
        const smoothedPoint = smoothGazePoint(calibratedPoint);
        const finalGaze = {
          ...rawGazePoint,
          x: smoothedPoint.x,
          y: smoothedPoint.y,
        };

        setCurrentGaze(finalGaze);
        setGazeHistory((prev) => [...prev.slice(-29), finalGaze]);
      }
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

    // ✅ JEO-FAITHFUL VISUALIZATION: Complete landmark overlay matching original research
    if (overlayCanvasRef.current && videoRef.current) {
      const overlayCanvas = overlayCanvasRef.current;
      const overlayCtx = overlayCanvas.getContext('2d');
      if (!overlayCtx) return;

      overlayCanvas.width = videoRef.current.videoWidth;
      overlayCanvas.height = videoRef.current.videoHeight;
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      // 1. Draw ALL 468 face mesh landmarks (JEO: white dots)
      overlayCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      for (let i = 0; i < Math.min(468, landmarks.length); i++) {
        const point = landmarks[i];
        if (point) {
          const x = point.x * overlayCanvas.width;
          const y = point.y * overlayCanvas.height;
          overlayCtx.beginPath();
          overlayCtx.arc(x, y, 1.5, 0, 2 * Math.PI);
          overlayCtx.fill();
        }
      }

      // 2. Draw eye contours (blue - slightly thicker)
      overlayCtx.strokeStyle = '#0066ff';
      overlayCtx.lineWidth = 2.5;

      // Left eye contour
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

      // Right eye contour
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

      // 3. Calculate iris centers and radii
      const leftIrisCenter = calculateIrisCenter3D(landmarks, LANDMARKS.leftIris);
      const rightIrisCenter = calculateIrisCenter3D(landmarks, LANDMARKS.rightIris);

      // 4. Draw CYAN iris circles (JEO signature feature)
      if (leftIrisCenter && rightIrisCenter) {
        overlayCtx.strokeStyle = '#00ffff';
        overlayCtx.lineWidth = 3;

        // Estimate iris radius from landmarks (typical: 12-15px at 640x480)
        const irisRadiusPixels = overlayCanvas.width * 0.025; // ~2.5% of width

        // Left iris circle
        overlayCtx.beginPath();
        overlayCtx.arc(
          leftIrisCenter.x * overlayCanvas.width,
          leftIrisCenter.y * overlayCanvas.height,
          irisRadiusPixels,
          0,
          2 * Math.PI
        );
        overlayCtx.stroke();

        // Right iris circle
        overlayCtx.beginPath();
        overlayCtx.arc(
          rightIrisCenter.x * overlayCanvas.width,
          rightIrisCenter.y * overlayCanvas.height,
          irisRadiusPixels,
          0,
          2 * Math.PI
        );
        overlayCtx.stroke();
      }

      // 5. Draw iris landmarks (red dots - pupil region)
      overlayCtx.fillStyle = '#ff0000';
      [...LANDMARKS.leftIris, ...LANDMARKS.rightIris].forEach((idx) => {
        const point = landmarks[idx];
        const x = point.x * overlayCanvas.width;
        const y = point.y * overlayCanvas.height;
        overlayCtx.beginPath();
        overlayCtx.arc(x, y, 3, 0, 2 * Math.PI);
        overlayCtx.fill();
      });

      // 6. Calculate eye centers and gaze vectors
      const leftEyeCenter = calculateEyeCenter3D(landmarks, LANDMARKS.leftEyeContour);
      const rightEyeCenter = calculateEyeCenter3D(landmarks, LANDMARKS.rightEyeContour);

      if (leftEyeCenter && rightEyeCenter && leftIrisCenter && rightIrisCenter) {
        // 7. Draw GREEN gaze direction vectors (JEO: arrows from eye center through iris)
        overlayCtx.strokeStyle = '#00ff00';
        overlayCtx.lineWidth = 3;
        overlayCtx.setLineDash([]);

        // Calculate gaze vectors
        const leftGazeVec = calculateGazeVector3D(leftIrisCenter, leftEyeCenter);
        const rightGazeVec = calculateGazeVector3D(rightIrisCenter, rightEyeCenter);

        // Vector length in pixels (make visible)
        const vectorLength = overlayCanvas.width * 0.15;

        // Left gaze vector
        const leftStartX = leftEyeCenter.x * overlayCanvas.width;
        const leftStartY = leftEyeCenter.y * overlayCanvas.height;
        const leftEndX = leftStartX + leftGazeVec.x * vectorLength;
        const leftEndY = leftStartY + leftGazeVec.y * vectorLength;

        overlayCtx.beginPath();
        overlayCtx.moveTo(leftStartX, leftStartY);
        overlayCtx.lineTo(leftEndX, leftEndY);
        overlayCtx.stroke();

        // Arrow head for left vector
        const leftAngle = Math.atan2(leftGazeVec.y, leftGazeVec.x);
        const arrowSize = 10;
        overlayCtx.beginPath();
        overlayCtx.moveTo(leftEndX, leftEndY);
        overlayCtx.lineTo(
          leftEndX - arrowSize * Math.cos(leftAngle - Math.PI / 6),
          leftEndY - arrowSize * Math.sin(leftAngle - Math.PI / 6)
        );
        overlayCtx.moveTo(leftEndX, leftEndY);
        overlayCtx.lineTo(
          leftEndX - arrowSize * Math.cos(leftAngle + Math.PI / 6),
          leftEndY - arrowSize * Math.sin(leftAngle + Math.PI / 6)
        );
        overlayCtx.stroke();

        // Right gaze vector
        const rightStartX = rightEyeCenter.x * overlayCanvas.width;
        const rightStartY = rightEyeCenter.y * overlayCanvas.height;
        const rightEndX = rightStartX + rightGazeVec.x * vectorLength;
        const rightEndY = rightStartY + rightGazeVec.y * vectorLength;

        overlayCtx.beginPath();
        overlayCtx.moveTo(rightStartX, rightStartY);
        overlayCtx.lineTo(rightEndX, rightEndY);
        overlayCtx.stroke();

        // Arrow head for right vector
        const rightAngle = Math.atan2(rightGazeVec.y, rightGazeVec.x);
        overlayCtx.beginPath();
        overlayCtx.moveTo(rightEndX, rightEndY);
        overlayCtx.lineTo(
          rightEndX - arrowSize * Math.cos(rightAngle - Math.PI / 6),
          rightEndY - arrowSize * Math.sin(rightAngle - Math.PI / 6)
        );
        overlayCtx.moveTo(rightEndX, rightEndY);
        overlayCtx.lineTo(
          rightEndX - arrowSize * Math.cos(rightAngle + Math.PI / 6),
          rightEndY - arrowSize * Math.sin(rightAngle + Math.PI / 6)
        );
        overlayCtx.stroke();

        // 8. Draw eye centers (bright green circles)
        overlayCtx.fillStyle = '#00ff00';
        overlayCtx.strokeStyle = '#ffffff';
        overlayCtx.lineWidth = 2;

        [leftEyeCenter, rightEyeCenter].forEach((center) => {
          const x = center.x * overlayCanvas.width;
          const y = center.y * overlayCanvas.height;
          overlayCtx.beginPath();
          overlayCtx.arc(x, y, 6, 0, 2 * Math.PI);
          overlayCtx.fill();
          overlayCtx.stroke();
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

      // 📹 Get actual camera resolution from video track
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      if (settings.width && settings.height) {
        setCameraResolution({ width: settings.width, height: settings.height });
        console.log(`✅ Camera resolution: ${settings.width}x${settings.height}`);
      }

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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-6">
          실시간 시선 추적 디버그
        </h1>

        {/* Control Panel */}
        <div className="bg-card rounded-lg shadow-lg p-6 mb-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-card-foreground">Controls</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Status: {isRunning ? '🟢 Running' : '🔴 Stopped'} | FPS: {fps} | Face:{' '}
                {faceDetected ? '✅ Detected' : '❌ Not Detected'}
              </p>
              {calibrationData && (
                <p className="text-xs text-primary mt-1">
                  🎯 Calibrated (Offset: {calibrationData.offsetX.toFixed(0)}px, {calibrationData.offsetY.toFixed(0)}px | Accuracy: {calibrationData.accuracy.toFixed(1)}px)
                </p>
              )}
              {calibrationMessage && (
                <p className="text-sm text-primary mt-1 font-semibold">
                  {calibrationMessage}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {!isRunning ? (
                <button
                  onClick={startTracking}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition shadow-md"
                >
                  시선추적 시작
                </button>
              ) : (
                <>
                  <button
                    onClick={stopTracking}
                    className="px-6 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition shadow-md"
                  >
                    중지
                  </button>
                  <button
                    onClick={startCalibration}
                    disabled={isCalibrating}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:bg-muted disabled:cursor-not-allowed shadow-md"
                  >
                    {isCalibrating ? '🎯 보정 중...' : '🎯 보정'}
                  </button>
                  {calibrationData && (
                    <button
                      onClick={clearCalibration}
                      className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition text-sm shadow-md"
                    >
                      초기화
                    </button>
                  )}
                  <button
                    onClick={() => setShowVideoOverlay(!showVideoOverlay)}
                    className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition text-sm shadow-md"
                  >
                    {showVideoOverlay ? '📹 카메라 숨기기' : '📹 카메라 보기'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ✅ NEW LAYOUT: Large Heatmap + Small Camera Popup */}
        <div className="relative">
          {/* MAIN: Full-Width Gaze Heatmap (BIG) */}
          <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
            <h2 className="text-2xl font-semibold text-card-foreground mb-4">
              시선 히트맵
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

              {/* 🎯 CALIBRATION TARGET: Large pulsing target at screen center */}
              {isCalibrating && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                  <div className="relative">
                    {/* Outer pulsing ring */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-red-500 rounded-full animate-ping opacity-75" />
                    {/* Middle ring */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-4 border-red-600 rounded-full" />
                    {/* Center target */}
                    <div className="relative w-16 h-16">
                      <div className="absolute left-1/2 top-0 w-1 h-full bg-red-600 transform -translate-x-1/2" />
                      <div className="absolute top-1/2 left-0 h-1 w-full bg-red-600 transform -translate-y-1/2" />
                      <div className="absolute left-1/2 top-1/2 w-8 h-8 border-4 border-red-600 rounded-full bg-white transform -translate-x-1/2 -translate-y-1/2 shadow-2xl" />
                    </div>
                    {/* Text instruction */}
                    <div className="absolute left-1/2 top-full mt-8 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl font-bold text-xl whitespace-nowrap">
                      🎯 이 중앙 타겟을 응시하세요
                    </div>
                  </div>
                </div>
              )}

              {/* 🎥 ALWAYS-PRESENT VIDEO ELEMENT (fixes "Video element not ready" bug) */}
              <video
                ref={videoRef}
                className="hidden"
                autoPlay
                playsInline
                muted
              />

              {!isRunning && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-lg">
                  시선 추적 버튼을 눌러 실시간 추적을 시작하세요
                </div>
              )}

              {/* ✅ CAMERA POPUP WITH LANDMARKS (Top-Right) */}
              {isRunning && showVideoOverlay && (
                <div className="absolute top-4 right-4 z-30 bg-black rounded-lg shadow-2xl border-4 border-primary overflow-hidden">
                  <div
                    className="relative"
                    style={{
                      width: `${Math.min(cameraResolution.width * 0.4, 640)}px`,
                      height: `${Math.min(cameraResolution.height * 0.4, 480)}px`
                    }}
                  >

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
                    <p>⚪ White: 468 Face Mesh | 🔵 Blue: Eye Contours</p>
                    <p>🟦 Cyan: Iris Circles | 🔴 Red: Pupil Landmarks</p>
                    <p>🟢 Green: Eye Centers + Gaze Vectors | {gazeHistory.length} tracked</p>
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
                <p className="text-sm font-semibold text-muted-foreground mb-2">🔬 Debug Info</p>
                <pre className="p-3 bg-muted rounded text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                  {debugInfo}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisionDebugRealtime;
