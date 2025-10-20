/**
 * Enhanced 9-Point Calibration Screen
 * Uses polynomial regression for accurate gaze tracking
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useGazeTracking } from '../../hooks/useGazeTracking';
import {
  generate9PointGrid,
  trainCalibrationModel,
  saveCalibration,
  evaluateCalibrationAccuracy,
  updateUserProfile,
  CalibrationPoint
} from '../../utils/gazeCalibration';

interface CalibrationScreenSimpleProps {
  userId: string;
  onCalibrationComplete: () => void;
  onCancel: () => void;
}

export const CalibrationScreenSimple: React.FC<CalibrationScreenSimpleProps> = ({
  userId,
  onCalibrationComplete,
  onCancel
}) => {
  const [stage, setStage] = useState<'instructions' | 'camera_check' | 'calibration' | 'completed'>('instructions');
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCentered, setFaceCentered] = useState(false);
  const [countdown, setCountdown] = useState(3);
  
  // 3D Mode toggle (stored in localStorage for persistence)
  const [use3DMode, setUse3DMode] = useState(() => {
    const stored = localStorage.getItem('gaze-tracking-3d-mode');
    return stored === 'true';
  });

  // Calibration state
  const [calibrationPoints] = useState(generate9PointGrid(0.1));
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [pointCountdown, setPointCountdown] = useState(0);
  const [collectedData, setCollectedData] = useState<CalibrationPoint[]>([]);
  const rawGazeDataRef = useRef<Array<{ irisOffset: { x: number; y: number }; headPose: { yaw: number; pitch: number } }>>([]);

  // Track current gaze position for real-time marker
  const [currentGaze, setCurrentGaze] = useState<{ x: number; y: number } | null>(null);

  // Use refs to prevent callback recreation on stage/pointCountdown changes
  const stageRef = useRef(stage);
  const pointCountdownRef = useRef(pointCountdown);
  
  // Update refs when state changes
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);
  
  useEffect(() => {
    pointCountdownRef.current = pointCountdown;
  }, [pointCountdown]);

  // Stable callbacks that use refs instead of state directly
  const handleFacePosition = useCallback((position: { x: number; y: number; width: number; height: number }) => {
    setFaceDetected(true);

    // Check if face is centered (within 15% of center)
    const centered = Math.abs(position.x - 0.5) < 0.15 && Math.abs(position.y - 0.5) < 0.15;
    setFaceCentered(centered);
  }, []); // No dependencies - stable callback

  const handleRawGazeData = useCallback((data: {
    irisOffset: { x: number; y: number };
    headPose: { yaw: number; pitch: number };
    timestamp: number;
  }) => {
    // Use refs to access current values without recreating callback
    if (stageRef.current === 'calibration' && pointCountdownRef.current > 0) {
      rawGazeDataRef.current.push({
        irisOffset: data.irisOffset,
        headPose: data.headPose
      });
    }
  }, []); // No dependencies - stable callback

  const handleGazePoint = useCallback((point: { x: number; y: number }) => {
    // Use ref to access current stage without recreating callback
    if (stageRef.current === 'calibration') {
      setCurrentGaze(point);
    }
  }, []); // No dependencies - stable callback

  // Gaze tracking hook for face detection and calibration
  // CRITICAL: Always keep enabled=true after initial start to maintain video stream
  const [trackingStarted, setTrackingStarted] = useState(false);
  const {
    isTracking,
    videoRef,
    canvasRef,
    startTracking,
    currentGaze: hookGaze
  } = useGazeTracking({
    enabled: trackingStarted, // Once started, never disable to keep stream alive
    onFacePosition: handleFacePosition,
    onRawGazeData: handleRawGazeData,
    onGazePoint: handleGazePoint,
    targetFPS: 30,
    use3DTracking: use3DMode // Enable 3D mode based on toggle
  });
  
  // Toggle 3D mode
  const toggle3DMode = useCallback(() => {
    const newMode = !use3DMode;
    setUse3DMode(newMode);
    localStorage.setItem('gaze-tracking-3d-mode', String(newMode));
    console.log(newMode ? '🎯 3D Mode Enabled' : '📐 2D Mode Enabled');
  }, [use3DMode]);

  // Update gaze from hook
  useEffect(() => {
    if (hookGaze && stage === 'calibration') {
      setCurrentGaze(hookGaze);
    }
  }, [hookGaze, stage]);

  // Start camera check
  const handleStartCheck = useCallback(async () => {
    setStage('camera_check');
    setTrackingStarted(true); // Enable tracking hook
    await startTracking();
  }, [startTracking]);

  // Auto-proceed to calibration when face is centered for 3 seconds
  useEffect(() => {
    if (stage === 'camera_check' && faceCentered && faceDetected) {
      setCountdown(3);

      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            // Start calibration instead of completing
            setStage('calibration');
            setPointCountdown(3);  // Start first point countdown
            // Make sure tracking continues when moving to calibration
            if (!isTracking) {
              startTracking();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCountdown(3);
    }
  }, [stage, faceCentered, faceDetected, isTracking, startTracking]);

  // Calibration point fixation countdown
  useEffect(() => {
    if (stage === 'calibration' && pointCountdown > 0) {
      const timeout = setTimeout(() => {
        setPointCountdown(prev => prev - 1);
        if (pointCountdown === 1) {
          // Countdown finished - collect calibration data
          handleCalibrationPointComplete();
        }
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [stage, pointCountdown]);

  // Handle completion of a single calibration point
  const handleCalibrationPointComplete = useCallback(() => {
    const currentPoint = calibrationPoints[currentPointIndex];
    
    console.log(`🔵 Processing calibration point ${currentPointIndex + 1}/9 at position (${currentPoint.x.toFixed(2)}, ${currentPoint.y.toFixed(2)})`);
    console.log(`📊 Collected ${rawGazeDataRef.current.length} gaze samples`);

    // Average collected raw gaze data
    if (rawGazeDataRef.current.length > 0) {
      const avgData = rawGazeDataRef.current.reduce(
        (acc, d) => ({
          irisOffsetX: acc.irisOffsetX + d.irisOffset.x,
          irisOffsetY: acc.irisOffsetY + d.irisOffset.y,
          headYaw: acc.headYaw + d.headPose.yaw,
          headPitch: acc.headPitch + d.headPose.pitch
        }),
        { irisOffsetX: 0, irisOffsetY: 0, headYaw: 0, headPitch: 0 }
      );

      const count = rawGazeDataRef.current.length;
      const calibrationPoint: CalibrationPoint = {
        screenX: currentPoint.x,
        screenY: currentPoint.y,
        rawGazeX: currentPoint.x,  // Placeholder
        rawGazeY: currentPoint.y,  // Placeholder
        irisOffsetX: avgData.irisOffsetX / count,
        irisOffsetY: avgData.irisOffsetY / count,
        headYaw: avgData.headYaw / count,
        headPitch: avgData.headPitch / count
      };

      setCollectedData(prev => [...prev, calibrationPoint]);
      console.log(`✅ Collected calibration point ${currentPointIndex + 1}/9:`, calibrationPoint);
    }

    // Clear raw data for next point
    rawGazeDataRef.current = [];

    // Move to next point
    if (currentPointIndex < calibrationPoints.length - 1) {
      setCurrentPointIndex(prev => prev + 1);
      setPointCountdown(3);  // Start next point countdown
    } else {
      // All points collected - train model
      handleCalibrationComplete();
    }
  }, [currentPointIndex, calibrationPoints, collectedData]);

  // Handle calibration completion and model training
  const handleCalibrationComplete = useCallback(() => {
    console.log('🎓 Training calibration model...');
    console.log('📊 Collected calibration points:', collectedData.length);

    // Check if we have enough data points
    if (collectedData.length < 3) {
      console.error('❌ Not enough calibration points:', collectedData.length);
      console.error('⚠️ Need at least 3 points, retrying calibration...');
      // Reset and restart calibration
      setCurrentPointIndex(0);
      setPointCountdown(3);
      setCollectedData([]);
      rawGazeDataRef.current = [];
      return;
    }

    // Train polynomial regression model
    const model = trainCalibrationModel(collectedData, 2, 0.01);

    // Evaluate accuracy
    const accuracy = evaluateCalibrationAccuracy(model, collectedData);
    console.log(`✅ Calibration accuracy: ${(accuracy * 100).toFixed(2)}% error`);

    // Create calibration result
    const calibrationResult = {
      points: collectedData,
      model,
      accuracy,
      timestamp: Date.now()
    };

    // Save to localStorage
    saveCalibration(calibrationResult);

    // Update user profile with calibration history
    updateUserProfile(userId, calibrationResult);

    // Move to completed stage
    setStage('completed');

    // Complete after 1 second
    setTimeout(() => {
      onCalibrationComplete();
    }, 1000);
  }, [collectedData, userId, onCalibrationComplete]);

  // Instructions
  if (stage === 'instructions') {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="max-w-2xl mx-auto p-8 bg-card rounded-2xl shadow-2xl">
          <h2 className="text-3xl font-bold text-foreground mb-6">시선 추적 시작</h2>

          <div className="space-y-4 text-muted-foreground mb-8">
            <p className="text-lg">
              정확한 시선 추적을 위해 9개 지점 보정을 진행합니다.
            </p>

            <div className="bg-secondary/10 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">준비사항:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>밝은 조명이 있는 환경에서 진행하세요</li>
                <li>화면을 편안한 위치에 고정하세요</li>
                <li>얼굴이 화면 중앙에 오도록 위치하세요</li>
                <li>화면으로부터 30-50cm 거리를 유지하세요</li>
                <li>보정 중에는 고개와 자세를 유지하세요</li>
              </ul>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">향상된 보정 시스템:</h3>
              <p className="text-sm">
                9개 지점 보정과 다항 회귀 모델을 사용하여 화면 구석까지 정확한 시선 추적을 제공합니다.
                보정은 약 30초 소요되며, 24시간 동안 유효합니다.
              </p>
            </div>

            {/* 3D Mode Toggle - Improved Design */}
            <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    🎯 3D 추적 모드 (실험적)
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    JEOresearch 기반 3D ray projection으로 더 정확한 수직 추적
                  </p>
                </div>
                <button
                  onClick={toggle3DMode}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${
                    use3DMode 
                      ? 'bg-primary shadow-lg shadow-primary/25' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  aria-label="Toggle 3D tracking mode"
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full transition-all duration-300 ${
                      use3DMode 
                        ? 'translate-x-7 bg-primary-foreground' 
                        : 'translate-x-1 bg-background'
                    }`}
                  />
                </button>
              </div>
              <div className="mt-3 px-3 py-2 bg-muted/50 rounded text-xs">
                <span className={`font-medium ${
                  use3DMode ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {use3DMode ? 
                    "✅ 3D Mode: Nose-based coordinate system 사용 중" : 
                    "📐 2D Mode: 기존 iris offset 방식 사용 중"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleStartCheck}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              시작하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render video and canvas in ALL stages to keep stream active
  // CRITICAL: Keep elements mounted and only toggle visibility with opacity/pointer-events
  const renderVideoCanvas = () => {
    // Always show video/canvas when 3D mode is enabled, or in camera_check stage
    const isVisible = use3DMode || stage === 'camera_check';
    
    return (
      <>
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ 
            transform: 'scaleX(-1)',
            opacity: isVisible ? 1 : 0,
            pointerEvents: isVisible ? 'auto' : 'none',
            zIndex: isVisible ? 10 : -1 // Ensure visibility when needed
          }}
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ 
            transform: 'scaleX(-1)',
            opacity: isVisible ? 1 : 0,
            pointerEvents: isVisible ? 'auto' : 'none',
            zIndex: isVisible ? 11 : -1 // Canvas on top of video
          }}
        />
      </>
    );
  };

  // Camera check
  if (stage === 'camera_check') {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center">
        {/* Instructions */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-20">
          <h2 className="text-2xl font-bold text-white mb-2">
            📹 카메라 위치 확인
          </h2>
          <p className="text-gray-300 text-lg">
            얼굴을 가이드 영역 중앙에 위치시켜주세요
          </p>
        </div>

        {/* Camera feed with face guide overlay */}
        <div className="relative">
          {/* Video container - maintain aspect ratio with object-contain */}
          <div className="relative w-[640px] h-[480px] rounded-2xl overflow-hidden bg-black">
            {/* Live camera feed and canvas - always rendered */}
            {renderVideoCanvas()}

            {/* Face guide overlay - centered oval */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-64 h-80 border-4 border-dashed rounded-[50%] transition-all duration-300"
                style={{
                  borderColor: faceCentered ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.6)',
                  boxShadow: faceCentered
                    ? '0 0 40px rgba(34, 197, 94, 0.6), inset 0 0 40px rgba(34, 197, 94, 0.1)'
                    : '0 0 40px rgba(239, 68, 68, 0.4), inset 0 0 40px rgba(239, 68, 68, 0.1)'
                }}
              />
            </div>

            {/* Center crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-8 h-8">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/50 transform -translate-y-1/2"></div>
                <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white/50 transform -translate-x-1/2"></div>
              </div>
            </div>
          </div>

          {/* Status text below camera */}
          <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 text-center w-full">
            {!faceDetected && (
              <p className="text-red-400 font-semibold text-lg">❌ 얼굴이 감지되지 않습니다</p>
            )}
            {faceDetected && !faceCentered && (
              <p className="text-yellow-400 font-semibold text-lg">⚠️ 가이드 영역 안으로 위치를 조정해주세요</p>
            )}
            {faceCentered && (
              <div>
                <p className="text-green-400 font-bold text-2xl mb-2">
                  ✅ 완벽합니다!
                </p>
                <p className="text-white text-4xl font-bold animate-pulse">
                  {countdown}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/70 px-6 py-3 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-white text-sm">
              {isTracking ? '카메라 연결됨' : '카메라 연결 중...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Calibration - 9-point gaze calibration
  if (stage === 'calibration') {
    const progress = ((currentPointIndex + 1) / calibrationPoints.length) * 100;

    return (
      <div className="fixed inset-0 bg-gray-900 z-50">
        {/* Video and canvas - keep mounted, visible in 3D mode */}
        <div className={`fixed inset-0 ${use3DMode ? 'z-20' : 'opacity-0 pointer-events-none z-0'}`}>
          {renderVideoCanvas()}
        </div>

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gray-800 z-10">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Instructions */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-30">
          <h2 className="text-2xl font-bold text-white mb-2">
            시선 보정 ({currentPointIndex + 1}/9)
          </h2>
          <p className="text-gray-300">
            {pointCountdown > 0
              ? `점을 ${pointCountdown}초간 응시하세요`
              : '다음 점으로 이동 중...'}
          </p>
          <p className="text-blue-400 text-sm mt-2">
            📍 파란색 점이 현재 시선 위치입니다
          </p>
        </div>

        {/* Calibration points overlay - HIGH Z-INDEX for visibility */}
        <div className="absolute inset-0 flex items-center justify-center z-40">
          {calibrationPoints.map((point, index) => {
            const isActive = index === currentPointIndex;
            const isCompleted = index < currentPointIndex;

            return (
              <div
                key={point.id}
                className="absolute transition-all duration-300 z-50"
                style={{
                  left: `${point.x * 100}%`,
                  top: `${point.y * 100}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Calibration point */}
                <div
                  className={`rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-12 h-12 bg-yellow-400 animate-pulse'
                      : isCompleted
                      ? 'w-6 h-6 bg-green-500'
                      : 'w-6 h-6 bg-gray-500'
                  }`}
                  style={{
                    boxShadow: isActive ? '0 0 40px rgba(250, 204, 21, 0.9)' : 'none'
                  }}
                />

                {/* Countdown number */}
                {isActive && pointCountdown > 0 && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-3xl z-50">
                    {pointCountdown}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Real-time Gaze Marker - BLUE DOT */}
        {currentGaze && (
          <div
            className="absolute z-60 pointer-events-none transition-all duration-75"
            style={{
              left: `${currentGaze.x * 100}%`,
              top: `${currentGaze.y * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Outer pulsing ring */}
            <div className="absolute inset-0 w-10 h-10 bg-blue-400/30 rounded-full animate-ping" />
            {/* Inner solid dot */}
            <div className="relative w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
          </div>
        )}

        {/* Data collection indicator */}
        <div className="absolute bottom-4 left-4 bg-black/70 px-4 py-2 rounded-lg z-30">
          <div className="flex items-center gap-2">
            {rawGazeDataRef.current.length > 0 && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-white text-xs">
                  데이터 수집 중: {rawGazeDataRef.current.length} 샘플
                </span>
              </>
            )}
            {rawGazeDataRef.current.length === 0 && (
              <>
                <div className="w-2 h-2 bg-gray-500 rounded-full" />
                <span className="text-gray-400 text-xs">대기 중...</span>
              </>
            )}
          </div>
        </div>

        {/* Face detection status */}
        <div className="absolute bottom-4 right-4 bg-black/70 px-4 py-2 rounded-lg z-30">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-white text-xs">
              {faceDetected ? '얼굴 인식' : '얼굴 없음'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Completed
  if (stage === 'completed') {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-bounce">✅</div>
          <h2 className="text-3xl font-bold text-white mb-4">
            보정 완료!
          </h2>
          <p className="text-gray-400 text-lg">
            정확한 시선 추적 준비 완료
          </p>
          <div className="mt-4 text-green-400 text-sm">
            {collectedData.length}개 포인트 수집 완료
          </div>
          <div className="mt-8">
            <div className="inline-block w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
