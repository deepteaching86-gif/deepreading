// Calibration Screen Component
// 9-point calibration grid with real-time feedback

import React, { useState, useCallback } from 'react';
import { useGazeTracking } from '../../hooks/useGazeTracking';
import {
  startCalibration,
  recordCalibrationPoint,
  validateCalibration
} from '../../services/vision.service';
import {
  CalibrationState,
  DeviceInfo,
  GazePoint,
  CalibrationResult
} from '../../types/vision.types';

interface CalibrationScreenProps {
  userId: string;
  onCalibrationComplete: (result: CalibrationResult) => void;
  onCancel: () => void;
}

export const CalibrationScreen: React.FC<CalibrationScreenProps> = ({
  userId,
  onCalibrationComplete,
  onCancel
}) => {
  const [state, setState] = useState<CalibrationState>({
    stage: 'instructions',
    currentPointIndex: 0,
    recordedPoints: []
  });

  const [calibrationId, setCalibrationId] = useState<string>('');
  const [calibrationPoints, setCalibrationPoints] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [gazeBuffer, setGazeBuffer] = useState<GazePoint[]>([]);
  const [showGazeVisualization, setShowGazeVisualization] = useState(true);
  const [fixationProgress, setFixationProgress] = useState(0); // 0-100%
  const [fixationStartTime, setFixationStartTime] = useState<number | null>(null);
  const [facePosition, setFacePosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [showVideoPreview, setShowVideoPreview] = useState(true); // Debug mode: show video feed

  // Start recording gaze data for current point (will be overridden below with proper dependencies)
  const startRecordingPlaceholder = useCallback(() => {
    console.log('🎬 Starting recording...');
    setGazeBuffer([]);
    setIsRecording(true);
  }, []);

  // Check if user is fixating on current calibration point
  const checkFixation = useCallback((gazePoint: GazePoint) => {
    console.log('🔍 checkFixation called:', { gazePoint, currentPointIndex: state.currentPointIndex, calibrationPointsLength: calibrationPoints.length, isRecording });

    if (state.currentPointIndex >= calibrationPoints.length) {
      console.log('⏭️ All points completed, skipping');
      return;
    }

    const currentPoint = calibrationPoints[state.currentPointIndex];
    console.log('📍 Current calibration point:', currentPoint);

    // Calculate distance from gaze to calibration point
    const dx = gazePoint.x - currentPoint.x;
    const dy = gazePoint.y - currentPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    console.log('📏 Distance to point:', distance);

    // Threshold: 0.1 (10% of screen) - adjust as needed
    const FIXATION_THRESHOLD = 0.1;
    const FIXATION_DURATION = 3000; // 3 seconds

    if (distance < FIXATION_THRESHOLD) {
      // User is looking at the point
      if (fixationStartTime === null) {
        console.log('👀 Fixation started!');
        setFixationStartTime(Date.now());
      } else {
        const elapsed = Date.now() - fixationStartTime;
        const progress = Math.min((elapsed / FIXATION_DURATION) * 100, 100);
        setFixationProgress(progress);
        console.log(`⏱️ Fixation progress: ${progress.toFixed(0)}%`);

        // Auto-start recording when 3 seconds elapsed
        if (elapsed >= FIXATION_DURATION && !isRecording) {
          console.log('✅ Fixation duration reached, starting recording!');
          startRecordingPlaceholder();
          setFixationStartTime(null);
          setFixationProgress(0);
        }
      }
    } else {
      // User looked away, reset
      if (fixationStartTime !== null) {
        console.log('👋 User looked away, resetting fixation');
      }
      setFixationStartTime(null);
      setFixationProgress(0);
    }
  }, [state.currentPointIndex, calibrationPoints, fixationStartTime, isRecording, startRecordingPlaceholder]);

  // Handle gaze point callback
  const handleGazePoint = useCallback((point: GazePoint) => {
    if (isRecording) {
      setGazeBuffer(prev => [...prev, point]);
    }
    // Auto-detect fixation on calibration point
    if (!isRecording && state.stage === 'calibrating') {
      checkFixation(point);
    }
  }, [isRecording, state.stage, checkFixation]);

  // Handle face position callback
  const handleFacePosition = useCallback((position: { x: number; y: number; width: number; height: number }) => {
    setFacePosition(position);
  }, []);

  // Gaze tracking hook
  const {
    isTracking,
    currentGaze,
    fps,
    videoRef,
    canvasRef,
    startTracking,
    stopTracking
  } = useGazeTracking({
    enabled: state.stage === 'calibrating',
    onGazePoint: handleGazePoint,
    onFacePosition: handleFacePosition,
    targetFPS: 30
  });

  // Auto-record after 3 seconds when recording starts
  React.useEffect(() => {
    if (isRecording) {
      console.log('📹 Recording started, will call handleRecordPoint in 3 seconds...');
      const timer = setTimeout(() => {
        console.log('⏰ 3 seconds elapsed, calling handleRecordPoint');
        handleRecordPoint();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isRecording]);

  // Start calibration
  const handleStartCalibration = useCallback(async () => {
    try {
      const deviceInfo: DeviceInfo = {
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        devicePixelRatio: window.devicePixelRatio,
        platform: navigator.platform
      };

      const response = await startCalibration({ userId, deviceInfo });
      setCalibrationId(response.calibrationId);
      setCalibrationPoints(response.points);

      setState({
        stage: 'calibrating',
        currentPointIndex: 0,
        recordedPoints: []
      });

      // Start camera
      await startTracking();
    } catch (error) {
      console.error('Failed to start calibration:', error);
      setState(prev => ({ ...prev, error: '캘리브레이션 시작 실패' }));
    }
  }, [userId, startTracking]);

  // Record current calibration point
  const handleRecordPoint = useCallback(async () => {
    if (gazeBuffer.length === 0) {
      setState(prev => ({ ...prev, error: '시선 데이터가 감지되지 않습니다.' }));
      return;
    }

    // Calculate average gaze position from buffer
    const avgX = gazeBuffer.reduce((sum, p) => sum + p.x, 0) / gazeBuffer.length;
    const avgY = gazeBuffer.reduce((sum, p) => sum + p.y, 0) / gazeBuffer.length;

    const currentCalibPoint = calibrationPoints[state.currentPointIndex];

    try {
      await recordCalibrationPoint({
        calibrationId,
        pointId: currentCalibPoint.id,
        gazeX: avgX,
        gazeY: avgY
      });

      setState(prev => ({
        ...prev,
        recordedPoints: [...prev.recordedPoints, {
          id: currentCalibPoint.id,
          screenX: currentCalibPoint.x,
          screenY: currentCalibPoint.y,
          actualX: avgX,
          actualY: avgY,
          error: 0,
          attempts: 1
        }],
        currentPointIndex: prev.currentPointIndex + 1
      }));

      // Clear buffer for next point
      setGazeBuffer([]);
      setIsRecording(false);

      // Check if all points recorded
      if (state.currentPointIndex + 1 >= calibrationPoints.length) {
        handleValidateCalibration();
      }
    } catch (error) {
      console.error('Failed to record point:', error);
      setState(prev => ({ ...prev, error: '포인트 기록 실패. 다시 시도하세요.' }));
      setIsRecording(false);
    }
  }, [calibrationId, calibrationPoints, state.currentPointIndex, gazeBuffer]);

  // Validate calibration
  const handleValidateCalibration = useCallback(async () => {
    setState(prev => ({ ...prev, stage: 'validating' }));

    try {
      const response = await validateCalibration(calibrationId);

      if (response.valid) {
        setState(prev => ({
          ...prev,
          stage: 'completed',
          accuracy: response.accuracy
        }));

        stopTracking();
        onCalibrationComplete(response.calibrationResult);
      } else {
        setState(prev => ({
          ...prev,
          stage: 'failed',
          error: response.message,
          accuracy: response.accuracy
        }));
      }
    } catch (error) {
      console.error('Calibration validation failed:', error);
      setState(prev => ({
        ...prev,
        stage: 'failed',
        error: '캘리브레이션 검증 실패'
      }));
    }
  }, [calibrationId, stopTracking, onCalibrationComplete]);

  // Render instructions
  if (state.stage === 'instructions') {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="max-w-2xl mx-auto p-8 bg-card rounded-2xl shadow-2xl">
          <h2 className="text-3xl font-bold text-foreground mb-6">시선 추적 캘리브레이션</h2>

          <div className="space-y-4 text-muted-foreground mb-8">
            <p className="text-lg">
              정확한 시선 추적을 위해 캘리브레이션이 필요합니다.
            </p>

            <div className="bg-secondary/10 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">준비사항:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>밝은 조명이 있는 환경에서 진행하세요</li>
                <li>태블릿을 편안한 위치에 고정하세요</li>
                <li>얼굴이 화면 중앙에 오도록 위치하세요</li>
                <li>화면으로부터 30-50cm 거리를 유지하세요</li>
              </ul>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">진행 방법:</h3>
              <ul className="list-decimal list-inside space-y-1">
                <li>화면에 나타나는 9개의 점을 순서대로 응시합니다</li>
                <li>각 점이 나타나면 고개를 움직이지 말고 눈으로만 응시하세요</li>
                <li>각 점을 3초간 응시하면 자동으로 다음 점으로 이동합니다</li>
                <li>모든 점 측정이 완료되면 자동으로 검증됩니다</li>
              </ul>
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
              onClick={handleStartCalibration}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              캘리브레이션 시작
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render calibration screen
  if (state.stage === 'calibrating') {
    return (
      <div className="fixed inset-0 bg-background z-50">
        {/* Video for face detection - hidden, canvas shows detection */}
        <video
          ref={videoRef}
          className="hidden"
          autoPlay
          playsInline
          muted
          webkit-playsinline="true"
        />

        {/* Canvas for face detection visualization - always visible and large */}
        <canvas
          ref={canvasRef}
          className="fixed bottom-4 right-4 w-[480px] h-[360px] border-4 border-primary rounded-lg shadow-2xl z-50 bg-black"
        />

        {/* Status bar */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-card/90 backdrop-blur px-6 py-3 rounded-full shadow-lg">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              포인트: {state.currentPointIndex + 1} / {calibrationPoints.length}
            </span>
            <span className="text-muted-foreground">|</span>
            <span className={`${isTracking ? 'text-green-500' : 'text-red-500'}`}>
              {isTracking ? '✓ 추적 중' : '✗ 추적 안됨'}
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">{fps} FPS</span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setShowVideoPreview(!showVideoPreview)}
            className="bg-card/90 backdrop-blur px-4 py-2 rounded-full shadow-lg hover:bg-card transition-colors"
          >
            <span className="text-sm font-medium">
              {showVideoPreview ? '📹 비디오 숨기기' : '📹 비디오 보기'}
            </span>
          </button>
          <button
            onClick={() => setShowGazeVisualization(!showGazeVisualization)}
            className="bg-card/90 backdrop-blur px-4 py-2 rounded-full shadow-lg hover:bg-card transition-colors"
          >
            <span className="text-sm font-medium">
              {showGazeVisualization ? '👁️ 시선 표시 끄기' : '👁️ 시선 표시 켜기'}
            </span>
          </button>
        </div>

        {/* Face position guide - centered on screen */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-80 border-4 border-dashed border-green-500/40 rounded-2xl pointer-events-none">
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-green-500 text-sm font-semibold whitespace-nowrap bg-black/60 px-4 py-2 rounded-lg shadow-lg">
            👤 여기에 얼굴을 위치시키세요
          </div>
          {/* Corner markers for better visibility */}
          <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-green-500/60 rounded-tl-xl"></div>
          <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-green-500/60 rounded-tr-xl"></div>
          <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-green-500/60 rounded-bl-xl"></div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-green-500/60 rounded-br-xl"></div>
        </div>

        {/* User's face position overlay - absolute on screen */}
        {facePosition && (
          <div
            className="absolute transition-all duration-150 pointer-events-none"
            style={{
              left: `${facePosition.x * 100}vw`,
              top: `${facePosition.y * 100}vh`,
              width: `${facePosition.width * 100}vw`,
              height: `${facePosition.height * 100}vh`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Face detection box with glow effect */}
            <div
              className="absolute inset-0 rounded-2xl border-4 transition-colors duration-300"
              style={{
                borderColor:
                  Math.abs(facePosition.x - 0.5) < 0.15 && Math.abs(facePosition.y - 0.5) < 0.15
                    ? 'rgba(34, 197, 94, 0.9)' // Green if centered
                    : 'rgba(239, 68, 68, 0.9)', // Red if off-center
                boxShadow:
                  Math.abs(facePosition.x - 0.5) < 0.15 && Math.abs(facePosition.y - 0.5) < 0.15
                    ? '0 0 20px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(34, 197, 94, 0.2)'
                    : '0 0 20px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.2)',
              }}
            />

            {/* Corner markers for detected face */}
            <div
              className="absolute -top-3 -left-3 w-12 h-12 border-t-4 border-l-4 rounded-tl-2xl transition-colors duration-300"
              style={{
                borderColor:
                  Math.abs(facePosition.x - 0.5) < 0.15 && Math.abs(facePosition.y - 0.5) < 0.15
                    ? 'rgb(34, 197, 94)'
                    : 'rgb(239, 68, 68)',
              }}
            />
            <div
              className="absolute -top-3 -right-3 w-12 h-12 border-t-4 border-r-4 rounded-tr-2xl transition-colors duration-300"
              style={{
                borderColor:
                  Math.abs(facePosition.x - 0.5) < 0.15 && Math.abs(facePosition.y - 0.5) < 0.15
                    ? 'rgb(34, 197, 94)'
                    : 'rgb(239, 68, 68)',
              }}
            />
            <div
              className="absolute -bottom-3 -left-3 w-12 h-12 border-b-4 border-l-4 rounded-bl-2xl transition-colors duration-300"
              style={{
                borderColor:
                  Math.abs(facePosition.x - 0.5) < 0.15 && Math.abs(facePosition.y - 0.5) < 0.15
                    ? 'rgb(34, 197, 94)'
                    : 'rgb(239, 68, 68)',
              }}
            />
            <div
              className="absolute -bottom-3 -right-3 w-12 h-12 border-b-4 border-r-4 rounded-br-2xl transition-colors duration-300"
              style={{
                borderColor:
                  Math.abs(facePosition.x - 0.5) < 0.15 && Math.abs(facePosition.y - 0.5) < 0.15
                    ? 'rgb(34, 197, 94)'
                    : 'rgb(239, 68, 68)',
              }}
            />

            {/* Status label with icon */}
            <div
              className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-xl whitespace-nowrap transition-colors duration-300"
              style={{
                backgroundColor:
                  Math.abs(facePosition.x - 0.5) < 0.15 && Math.abs(facePosition.y - 0.5) < 0.15
                    ? 'rgba(34, 197, 94, 0.95)'
                    : 'rgba(239, 68, 68, 0.95)',
              }}
            >
              {Math.abs(facePosition.x - 0.5) < 0.15 && Math.abs(facePosition.y - 0.5) < 0.15
                ? '✅ 완벽한 위치!'
                : '⚠️ 위치 조정 필요'}
            </div>

            {/* Position coordinates */}
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs font-mono px-3 py-2 rounded-lg shadow-xl whitespace-nowrap backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span>X: {(facePosition.x * 100).toFixed(0)}%</span>
                <span className="text-gray-400">|</span>
                <span>Y: {(facePosition.y * 100).toFixed(0)}%</span>
                <span className="text-gray-400">|</span>
                <span>크기: {(facePosition.width * 100).toFixed(0)}×{(facePosition.height * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Centering guides - arrows pointing to optimal position */}
            {Math.abs(facePosition.x - 0.5) >= 0.15 && (
              <div
                className="absolute top-1/2 transform -translate-y-1/2 text-4xl"
                style={{
                  left: facePosition.x < 0.5 ? '110%' : 'auto',
                  right: facePosition.x >= 0.5 ? '110%' : 'auto',
                }}
              >
                {facePosition.x < 0.5 ? '👉' : '👈'}
              </div>
            )}
            {Math.abs(facePosition.y - 0.5) >= 0.15 && (
              <div
                className="absolute left-1/2 transform -translate-x-1/2 text-4xl"
                style={{
                  top: facePosition.y < 0.5 ? '110%' : 'auto',
                  bottom: facePosition.y >= 0.5 ? '110%' : 'auto',
                }}
              >
                {facePosition.y < 0.5 ? '👇' : '👆'}
              </div>
            )}
          </div>
        )}

        {/* Calibration points */}
        {calibrationPoints.map((point, index) => {
          const isActive = index === state.currentPointIndex;
          const isCompleted = index < state.currentPointIndex;

          return (
            <div
              key={point.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
              style={{
                left: `${point.x * 100}%`,
                top: `${point.y * 100}%`,
                opacity: isActive ? 1 : isCompleted ? 0.3 : 0.1
              }}
            >
              {/* Calibration point with progress ring */}
              <div className="relative w-16 h-16">
                {/* Progress ring for fixation */}
                {isActive && fixationProgress > 0 && (
                  <svg className="absolute inset-0 w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-primary"
                      strokeDasharray={`${(fixationProgress / 100) * 176} 176`}
                      style={{ transition: 'stroke-dasharray 0.1s linear' }}
                    />
                  </svg>
                )}

                {/* Main calibration point */}
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    isActive
                      ? 'bg-primary animate-pulse'
                      : isCompleted
                      ? 'bg-green-500'
                      : 'bg-muted'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-background"></div>
                </div>
              </div>

              {/* Status text below point */}
              {isActive && !isRecording && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap">
                  <div className="text-primary font-semibold">
                    {fixationProgress > 0 ? `${Math.round(fixationProgress)}%` : '이 점을 응시하세요'}
                  </div>
                </div>
              )}

              {isActive && isRecording && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="text-primary font-semibold">기록 중...</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {gazeBuffer.length} 포인트
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Real-time gaze visualization */}
        {showGazeVisualization && currentGaze && (
          <>
            {/* Gaze point - larger and more visible */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75"
              style={{
                left: `${currentGaze.x * 100}%`,
                top: `${currentGaze.y * 100}%`,
              }}
            >
              {/* Outer glow */}
              <div
                className="absolute w-12 h-12 bg-red-500/30 rounded-full blur-md"
                style={{
                  left: '-24px',
                  top: '-24px',
                  opacity: currentGaze.confidence
                }}
              />
              {/* Main dot */}
              <div
                className="absolute w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg"
                style={{
                  left: '-12px',
                  top: '-12px',
                  opacity: currentGaze.confidence
                }}
              />
              {/* Center dot */}
              <div
                className="absolute w-2 h-2 bg-white rounded-full"
                style={{ left: '-4px', top: '-4px' }}
              />
            </div>

            {/* Gaze info overlay */}
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-3 rounded-lg text-xs font-mono space-y-1">
              <div>시선 X: {(currentGaze.x * 100).toFixed(1)}%</div>
              <div>시선 Y: {(currentGaze.y * 100).toFixed(1)}%</div>
              <div>신뢰도: {(currentGaze.confidence * 100).toFixed(0)}%</div>
            </div>
          </>
        )}

        {/* Error message */}
        {state.error && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground px-6 py-3 rounded-lg">
            {state.error}
          </div>
        )}
      </div>
    );
  }

  // Render validating
  if (state.stage === 'validating') {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-lg text-foreground">캘리브레이션 검증 중...</p>
        </div>
      </div>
    );
  }

  // Render failed
  if (state.stage === 'failed') {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="max-w-md mx-auto p-8 bg-card rounded-2xl shadow-2xl text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-destructive mb-4">캘리브레이션 실패</h2>
          <p className="text-muted-foreground mb-2">{state.error}</p>
          {state.accuracy && (
            <p className="text-sm text-muted-foreground mb-6">
              정확도: {state.accuracy.toFixed(1)}% (필요: 70% 이상)
            </p>
          )}
          <button
            onClick={handleStartCalibration}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return null;
};
