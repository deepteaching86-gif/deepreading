/**
 * Vision Calibration Component
 *
 * Click-based 9-point calibration for client-side FaceMesh gaze tracking.
 * - 9 calibration points (click + 1.5s sample collection)
 * - 4-point verification step
 * - Child-friendly UI with animations
 * - Distance guide using iris-based estimation
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaceMeshGazeService, GazePrediction } from '../../services/faceMeshGazeService';
import CameraPreview from './CameraPreview';

interface VisionCalibrationProps {
  gazeService: FaceMeshGazeService;
  sessionId: string;
  onCalibrationComplete: (accuracy: number) => void;
  onCancel: () => void;
}

const CALIBRATION_POINTS = [
  { x: 0.1, y: 0.1 },
  { x: 0.5, y: 0.1 },
  { x: 0.9, y: 0.1 },
  { x: 0.1, y: 0.5 },
  { x: 0.5, y: 0.5 },
  { x: 0.9, y: 0.5 },
  { x: 0.1, y: 0.9 },
  { x: 0.5, y: 0.9 },
  { x: 0.9, y: 0.9 },
];

const VERIFICATION_POINTS = [
  { x: 0.3, y: 0.3 },
  { x: 0.7, y: 0.3 },
  { x: 0.3, y: 0.7 },
  { x: 0.7, y: 0.7 },
];

type CalibrationPhase = 'guide' | 'collecting' | 'training' | 'verifying' | 'done';

const VisionCalibration: React.FC<VisionCalibrationProps> = ({
  gazeService,
  sessionId: _sessionId,
  onCalibrationComplete,
  onCancel,
}) => {
  const [phase, setPhase] = useState<CalibrationPhase>('guide');
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [isCollecting, setIsCollecting] = useState(false);
  const [completedPoints, setCompletedPoints] = useState<number[]>([]);
  const [distanceCm, setDistanceCm] = useState<number | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [verificationIndex, setVerificationIndex] = useState(0);
  const [, setVerificationErrors] = useState<number[]>([]);
  const [accuracy, setAccuracy] = useState(0);
  const [showPopAnimation, setShowPopAnimation] = useState(false);

  const collectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const verificationGazeRef = useRef<Array<{ x: number; y: number }>>([]);
  const verificationErrorsRef = useRef<number[]>([]);
  const verificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Monitor face detection and distance during guide phase
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const dist = gazeService.getDistanceCm();
      setDistanceCm(dist);
      setFaceDetected(dist !== null);
    }, 500);

    return () => clearInterval(checkInterval);
  }, [gazeService]);

  // Cleanup intervals and timers on unmount
  useEffect(() => {
    return () => {
      if (collectIntervalRef.current) {
        clearInterval(collectIntervalRef.current);
      }
      if (verificationTimerRef.current) {
        clearTimeout(verificationTimerRef.current);
      }
    };
  }, []);

  const handleStartCalibration = () => {
    gazeService.clearCalibration();
    setPhase('collecting');
    setCurrentPointIndex(0);
    setCompletedPoints([]);
  };

  const handlePointClick = useCallback(async () => {
    if (isCollecting) return;

    setIsCollecting(true);

    const currentPoint = CALIBRATION_POINTS[currentPointIndex];
    const screenX = currentPoint.x * window.innerWidth;
    const screenY = currentPoint.y * window.innerHeight;

    // Collect samples every 100ms for 1.5 seconds
    let sampleCount = 0;
    const maxSamples = 15;

    collectIntervalRef.current = setInterval(() => {
      gazeService.collectCalibrationSample(screenX, screenY);
      sampleCount++;

      if (sampleCount >= maxSamples) {
        if (collectIntervalRef.current) {
          clearInterval(collectIntervalRef.current);
          collectIntervalRef.current = null;
        }

        // Pop animation
        setShowPopAnimation(true);
        setTimeout(() => setShowPopAnimation(false), 400);

        setIsCollecting(false);
        setCompletedPoints(prev => [...prev, currentPointIndex]);

        // Move to next point or start training
        if (currentPointIndex < CALIBRATION_POINTS.length - 1) {
          setCurrentPointIndex(prev => prev + 1);
        } else {
          // All 9 points collected - train
          startTraining();
        }
      }
    }, 100);
  }, [currentPointIndex, isCollecting, gazeService]);

  const startTraining = () => {
    setPhase('training');

    // Small delay to show training UI
    setTimeout(() => {
      const result = gazeService.trainCalibration();

      if (result.accuracy >= 0 && result.meanError !== undefined) {
        // Always proceed to verification - verification phase measures real accuracy
        setPhase('verifying');
        setVerificationIndex(0);
        setVerificationErrors([]);
        verificationErrorsRef.current = [];
        startVerificationPoint(0);
      } else {
        // Training actually failed (exception) - allow retry
        setPhase('guide');
      }
    }, 500);
  };

  const finishVerification = (errors: number[]) => {
    const screenDiag = Math.sqrt(
      Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2)
    );
    const errorRef = screenDiag * 0.15;
    const meanError = errors.reduce((s, e) => s + e, 0) / errors.length;
    const finalAccuracy = Math.max(0, 1 - meanError / errorRef);
    console.log(`📊 Verification: meanError=${meanError.toFixed(0)}px, accuracy=${(finalAccuracy * 100).toFixed(0)}%, errors=[${errors.map(e => e.toFixed(0)).join(',')}]px`);
    setAccuracy(finalAccuracy);
    setPhase('done');
    gazeService.removeGazeListener();
  };

  const startVerificationPoint = (index: number) => {
    // Reset filter so it doesn't carry residual from previous point/training
    gazeService.resetSmoothFilter();
    verificationGazeRef.current = [];

    // Register gaze listener for verification
    gazeService.onGaze((prediction: GazePrediction) => {
      if (prediction.confidence > 0.1) {
        verificationGazeRef.current.push({ x: prediction.x, y: prediction.y });
      }
    });

    // Phase 1: 500ms settling delay for user to fixate on point + filter convergence
    verificationTimerRef.current = setTimeout(() => {
      // Discard settling period gaze data
      verificationGazeRef.current = [];

      // Phase 2: 1 second of actual gaze collection
      verificationTimerRef.current = setTimeout(() => {
        const gazePoints = verificationGazeRef.current;
        const verifyPoint = VERIFICATION_POINTS[index];
        const targetX = verifyPoint.x * window.innerWidth;
        const targetY = verifyPoint.y * window.innerHeight;

        const screenDiag = Math.sqrt(
          Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2)
        );
        const errorRef = screenDiag * 0.15;

        let error: number;
        if (gazePoints.length > 0) {
          const avgX = gazePoints.reduce((s, p) => s + p.x, 0) / gazePoints.length;
          const avgY = gazePoints.reduce((s, p) => s + p.y, 0) / gazePoints.length;
          error = Math.sqrt(Math.pow(avgX - targetX, 2) + Math.pow(avgY - targetY, 2));
          console.log(`  🔵 Verify[${index}]: target=(${targetX.toFixed(0)},${targetY.toFixed(0)}), gaze=(${avgX.toFixed(0)},${avgY.toFixed(0)}), error=${error.toFixed(0)}px, samples=${gazePoints.length}`);
        } else {
          error = errorRef;
          console.log(`  🔵 Verify[${index}]: NO GAZE DATA - using default error=${errorRef.toFixed(0)}px`);
        }

        // Accumulate via ref (not state updater) to avoid React double-invocation
        verificationErrorsRef.current.push(error);
        setVerificationErrors([...verificationErrorsRef.current]);

        if (index >= VERIFICATION_POINTS.length - 1) {
          finishVerification(verificationErrorsRef.current);
        } else {
          setVerificationIndex(index + 1);
          startVerificationPoint(index + 1);
        }
      }, 1000);
    }, 500);
  };

  const handleAcceptCalibration = () => {
    onCalibrationComplete(parseFloat(accuracy.toFixed(2)));
  };

  const handleRetryCalibration = () => {
    gazeService.clearCalibration();
    setPhase('guide');
    setCurrentPointIndex(0);
    setCompletedPoints([]);
    setVerificationIndex(0);
    setVerificationErrors([]);
    verificationErrorsRef.current = [];
    setAccuracy(0);
    if (verificationTimerRef.current) {
      clearTimeout(verificationTimerRef.current);
      verificationTimerRef.current = null;
    }
  };

  // Distance status (40-70cm optimal range for gaze tracking)
  const distanceStatus = distanceCm
    ? distanceCm >= 40 && distanceCm <= 70
      ? 'good'
      : distanceCm < 40
      ? 'close'
      : 'far'
    : 'unknown';

  // Show head movement hint after 5th calibration point
  const showHeadMovementHint = phase === 'collecting' && currentPointIndex >= 5 && !isCollecting;

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center">
      {/* Guide Phase */}
      {phase === 'guide' && (
        <>
          <div className="absolute top-8 left-0 right-0 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              시선 추적 캘리브레이션
            </h1>
            <p className="text-gray-300 mb-4">
              화면의 점을 클릭하면 1.5초간 시선을 측정합니다
            </p>
          </div>

          {/* Face detection & distance guide */}
          <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4">
            <div className="space-y-4">
              {/* Face detection status */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full ${
                    faceDetected ? 'bg-green-500' : 'bg-red-500'
                  } animate-pulse`}
                />
                <span className="text-white">
                  {faceDetected ? '얼굴이 감지되었습니다' : '얼굴을 카메라에 보여주세요'}
                </span>
              </div>

              {/* Distance indicator */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full ${
                    distanceStatus === 'good'
                      ? 'bg-green-500'
                      : distanceStatus === 'unknown'
                      ? 'bg-gray-500'
                      : 'bg-yellow-500'
                  }`}
                />
                <span className="text-white">
                  {distanceCm
                    ? `거리: ${distanceCm.toFixed(0)}cm`
                    : '거리 측정 중...'}
                  {distanceStatus === 'close' && ' (조금 더 뒤로)'}
                  {distanceStatus === 'far' && ' (조금 더 가까이)'}
                  {distanceStatus === 'good' && ' (적절한 거리)'}
                </span>
              </div>

              {/* Distance bar (30-90cm range, 40-70cm green zone) */}
              <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-green-500/30 rounded-full"
                  style={{ left: '16.7%', width: '50%' }}
                />
                {distanceCm && (
                  <div
                    className={`absolute h-full w-2 rounded-full transition-all ${
                      distanceStatus === 'good' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                    style={{
                      left: `${Math.max(0, Math.min(100, ((distanceCm - 30) / 60) * 100))}%`,
                    }}
                  />
                )}
                <div className="absolute top-0 left-0 w-full flex justify-between px-1 text-[10px] text-gray-500">
                  <span>30cm</span>
                  <span>60cm</span>
                  <span>90cm</span>
                </div>
              </div>

              <p className="text-gray-400 text-sm text-center mt-2">
                40-70cm 거리에서 정면을 바라봐주세요 (권장 범위)
              </p>
            </div>

            <button
              onClick={handleStartCalibration}
              disabled={!faceDetected}
              className={`w-full mt-6 px-6 py-3 rounded-lg font-semibold transition-colors ${
                faceDetected
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {faceDetected ? '캘리브레이션 시작' : '얼굴 감지 대기 중...'}
            </button>
          </div>

          <div className="absolute bottom-8 text-center">
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              취소
            </button>
          </div>
        </>
      )}

      {/* Collecting Phase - 9-point calibration */}
      {phase === 'collecting' && (
        <>
          <div className="absolute top-8 left-0 right-0 text-center z-10">
            <h1 className="text-2xl font-bold text-white mb-2">
              점을 클릭하고 응시해주세요
            </h1>
            <p className="text-gray-400">
              {currentPointIndex + 1} / {CALIBRATION_POINTS.length}
            </p>
            {showHeadMovementHint && (
              <p className="text-yellow-300 text-sm mt-2 animate-pulse">
                자연스럽게 머리를 약간 돌려가며 점을 봐주세요
              </p>
            )}
          </div>

          {/* Calibration point */}
          <button
            onClick={handlePointClick}
            disabled={isCollecting}
            className={`absolute transition-all duration-300 ${
              isCollecting
                ? 'scale-150'
                : 'hover:scale-110'
            }`}
            style={{
              left: `${CALIBRATION_POINTS[currentPointIndex].x * 100}%`,
              top: `${CALIBRATION_POINTS[currentPointIndex].y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isCollecting
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-blue-500 hover:bg-blue-400 shadow-lg shadow-blue-500/50'
              }`}
            >
              {isCollecting ? (
                <div className="w-3 h-3 bg-white rounded-full animate-ping" />
              ) : (
                <div className="w-3 h-3 bg-white rounded-full" />
              )}
            </div>
          </button>

          {/* Pop animation on completion */}
          {showPopAnimation && completedPoints.length > 0 && (
            <div
              className="absolute text-3xl animate-bounce pointer-events-none"
              style={{
                left: `${CALIBRATION_POINTS[completedPoints[completedPoints.length - 1]].x * 100}%`,
                top: `${CALIBRATION_POINTS[completedPoints[completedPoints.length - 1]].y * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              &#11088;
            </div>
          )}

          {/* Progress indicator */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3">
            {CALIBRATION_POINTS.map((_, index) => (
              <div key={index} className="flex flex-col items-center gap-1">
                <div
                  className={`w-4 h-4 rounded-full transition-all ${
                    completedPoints.includes(index)
                      ? 'bg-green-500 scale-110'
                      : index === currentPointIndex
                      ? 'bg-blue-500 animate-pulse'
                      : 'bg-gray-600'
                  }`}
                />
                {completedPoints.includes(index) && (
                  <span className="text-xs text-green-400">&#10003;</span>
                )}
              </div>
            ))}
          </div>

          {/* Cancel */}
          <div className="absolute bottom-24 text-center w-full">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-500 hover:text-white transition-colors text-sm"
            >
              취소
            </button>
          </div>
        </>
      )}

      {/* Training Phase */}
      {phase === 'training' && (
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Ridge Regression 학습 중...
          </h2>
          <p className="text-gray-300">
            머리 자세 + 거리 + 시선 데이터로 보정 모델을 학습합니다
          </p>
        </div>
      )}

      {/* Verification Phase */}
      {phase === 'verifying' && (
        <>
          <div className="absolute top-8 left-0 right-0 text-center z-10">
            <h1 className="text-2xl font-bold text-white mb-2">
              정확도 검증 중
            </h1>
            <p className="text-gray-400">
              점을 응시해주세요 ({verificationIndex + 1} / {VERIFICATION_POINTS.length})
            </p>
          </div>

          {/* Verification point */}
          <div
            className="absolute"
            style={{
              left: `${VERIFICATION_POINTS[verificationIndex].x * 100}%`,
              top: `${VERIFICATION_POINTS[verificationIndex].y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="w-10 h-10 rounded-full bg-yellow-500 animate-pulse flex items-center justify-center shadow-lg shadow-yellow-500/50">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>

          {/* Verification progress */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3">
            {VERIFICATION_POINTS.map((_, index) => (
              <div
                key={index}
                className={`w-4 h-4 rounded-full ${
                  index < verificationIndex
                    ? 'bg-green-500'
                    : index === verificationIndex
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Done Phase - Show Results */}
      {phase === 'done' && (
        <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="text-5xl mb-4">
            {accuracy >= 0.6 ? '&#127881;' : accuracy >= 0.4 ? '&#128077;' : '&#128533;'}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            캘리브레이션 완료
          </h2>
          <div className="text-lg text-gray-300 mb-4">
            정확도:{' '}
            <span
              className={`font-bold ${
                accuracy >= 0.6
                  ? 'text-green-400'
                  : accuracy >= 0.4
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`}
            >
              {(accuracy * 100).toFixed(0)}%
            </span>
          </div>

          {accuracy < 0.4 && (
            <p className="text-yellow-400 text-sm mb-4">
              정확도가 낮습니다. 재캘리브레이션을 권장합니다.
            </p>
          )}

          <div className="flex gap-4">
            {accuracy < 0.4 ? (
              <>
                <button
                  onClick={handleRetryCalibration}
                  className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
                >
                  다시 하기
                </button>
                <button
                  onClick={handleAcceptCalibration}
                  className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  그냥 진행
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleAcceptCalibration}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                >
                  시작하기
                </button>
                <button
                  onClick={handleRetryCalibration}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  다시 하기
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Camera Preview PiP - dynamically repositioned to avoid current calibration point */}
      {(phase === 'guide' || phase === 'collecting' || phase === 'verifying') && (
        <CameraPreview
          gazeService={gazeService}
          visible={true}
          position={
            phase === 'collecting'
              ? (CALIBRATION_POINTS[currentPointIndex].y >= 0.5
                  ? (CALIBRATION_POINTS[currentPointIndex].x >= 0.5 ? 'top-left' : 'top-right')
                  : (CALIBRATION_POINTS[currentPointIndex].x >= 0.5 ? 'bottom-left' : 'bottom-right'))
              : 'bottom-right'
          }
          showIris={true}
          showEyeContours={true}
          width={280}
        />
      )}
    </div>
  );
};

export default VisionCalibration;
