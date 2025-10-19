/**
 * Stage 5: Verification Test
 * Test calibration with 3 random points
 */

import React, { useState, useEffect } from 'react';
import {
  CalibrationPoint,
  Point,
  CALIBRATION_CONSTANTS,
  generateVerificationPoints
} from '../../../types/calibration';
import { calculateDistance } from '../../../utils/calibrationUtils';

interface Stage5VerificationProps {
  currentGaze: Point | null; // Real-time calibrated gaze
  onComplete: (score: number) => void; // Score: 0.0 ~ 1.0
}

export const Stage5Verification: React.FC<Stage5VerificationProps> = ({
  currentGaze,
  onComplete
}) => {
  const [verificationPoints] = useState<CalibrationPoint[]>(() => generateVerificationPoints(3));
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [isFixating, setIsFixating] = useState(false);
  const [fixationProgress, setFixationProgress] = useState(0);
  const [fixationStartTime, setFixationStartTime] = useState<number | null>(null);

  const DURATION = CALIBRATION_CONSTANTS.VERIFICATION_FIXATION_DURATION;
  const THRESHOLD = CALIBRATION_CONSTANTS.VERIFICATION_DISTANCE_THRESHOLD;
  const REQUIRED_SUCCESSES = CALIBRATION_CONSTANTS.VERIFICATION_REQUIRED_SUCCESSES;

  const currentPoint = verificationPoints[currentPointIndex];
  const isCompleted = currentPointIndex >= verificationPoints.length;

  // Check fixation
  useEffect(() => {
    if (isCompleted || !currentGaze || !currentPoint) return;

    const distance = calculateDistance(currentGaze, {
      x: currentPoint.x,
      y: currentPoint.y
    });

    if (distance < THRESHOLD) {
      // Fixating
      if (!fixationStartTime) {
        setIsFixating(true);
        setFixationStartTime(Date.now());
      } else {
        const elapsed = Date.now() - fixationStartTime;
        const progress = Math.min((elapsed / DURATION) * 100, 100);
        setFixationProgress(progress);

        if (elapsed >= DURATION) {
          completePoint(true); // Success
        }
      }
    } else {
      // Not fixating
      if (fixationStartTime) {
        setIsFixating(false);
        setFixationStartTime(null);
        setFixationProgress(0);
      }
    }
  }, [currentGaze, currentPoint, fixationStartTime, isCompleted]);

  // Auto-fail after timeout
  useEffect(() => {
    if (isCompleted) return;

    const timeout = setTimeout(() => {
      if (currentPointIndex < verificationPoints.length && !isFixating) {
        console.log(`⏱️ Timeout for ${currentPoint.label}, moving to next`);
        completePoint(false); // Fail
      }
    }, 5000); // 5 second timeout per point

    return () => clearTimeout(timeout);
  }, [currentPointIndex, isFixating, isCompleted]);

  const completePoint = (success: boolean) => {
    console.log(`${success ? '✅' : '❌'} ${currentPoint.label}: ${success ? 'Success' : 'Failed'}`);

    setResults(prev => [...prev, success]);
    setIsFixating(false);
    setFixationStartTime(null);
    setFixationProgress(0);

    // Move to next or finish
    if (currentPointIndex < verificationPoints.length - 1) {
      setCurrentPointIndex(prev => prev + 1);
    } else {
      // All points tested
      finishVerification([...results, success]);
    }
  };

  const finishVerification = (allResults: boolean[]) => {
    const successCount = allResults.filter(r => r).length;
    const score = successCount / verificationPoints.length;

    console.log('🎯 Verification complete:', {
      total: verificationPoints.length,
      successes: successCount,
      score: score.toFixed(2)
    });

    setTimeout(() => {
      if (successCount >= REQUIRED_SUCCESSES) {
        onComplete(score); // Pass
      } else {
        onComplete(0); // Fail - need recalibration
      }
    }, 1000);
  };

  if (isCompleted) {
    const successCount = results.filter(r => r).length;
    const passed = successCount >= REQUIRED_SUCCESSES;

    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">{passed ? '✅' : '❌'}</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            {passed ? '검증 완료!' : '검증 실패'}
          </h2>
          <p className="text-gray-400">
            {successCount} / {verificationPoints.length} 성공
            {passed ? '' : ' (최소 2개 필요)'}
          </p>

          {/* Results */}
          <div className="mt-8 flex gap-4 justify-center">
            {results.map((success, i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                  success ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                }`}
              >
                {success ? '✓' : '✗'}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900">
      {/* Instructions */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-20">
        <h2 className="text-2xl font-bold text-white mb-2">
          ✓ 캘리브레이션 검증
        </h2>
        <p className="text-gray-300 text-lg">
          표시되는 점을 바라봐주세요
        </p>
        <p className="text-gray-400 text-sm mt-1">
          ({currentPointIndex + 1} / {verificationPoints.length})
        </p>
      </div>

      {/* Verification Point */}
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
        style={{
          left: `${currentPoint.x * 100}%`,
          top: `${currentPoint.y * 100}%`
        }}
      >
        <div className={`relative flex items-center justify-center ${isFixating ? 'scale-110' : 'scale-100'} transition-transform`}>
          {/* Rings */}
          <div className={`absolute w-20 h-20 rounded-full border-4 ${isFixating ? 'border-green-500' : 'border-purple-500'} opacity-30 ${!isFixating && 'animate-pulse'}`}></div>
          <div className={`absolute w-12 h-12 rounded-full border-4 ${isFixating ? 'border-green-400' : 'border-purple-400'} opacity-50`}></div>
          <div className={`w-5 h-5 rounded-full ${isFixating ? 'bg-green-500' : 'bg-purple-500'}`}></div>

          {/* Progress ring */}
          {isFixating && (
            <svg className="absolute w-20 h-20" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="rgb(34, 197, 94)"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 36}`}
                strokeDashoffset={`${2 * Math.PI * 36 * (1 - fixationProgress / 100)}`}
                className="transition-all duration-100"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Results so far */}
      <div className="absolute top-20 right-8 flex gap-2">
        {results.map((success, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              success ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
            }`}
          >
            {success ? '✓' : '✗'}
          </div>
        ))}
        {Array.from({ length: verificationPoints.length - results.length }).map((_, i) => (
          <div key={`pending-${i}`} className="w-8 h-8 rounded-full bg-gray-700"></div>
        ))}
      </div>

      {/* Current gaze indicator */}
      {currentGaze && (
        <div
          className="absolute w-3 h-3 bg-red-500 rounded-full opacity-50 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${currentGaze.x * 100}%`,
            top: `${(1.0 - currentGaze.y) * 100}%` // INVERT Y: 0.0 → bottom, 1.0 → top
          }}
        ></div>
      )}

      {/* Progress */}
      {isFixating && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-96">
          <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all duration-100"
              style={{ width: `${fixationProgress}%` }}
            ></div>
          </div>
          <div className="text-center text-white mt-2 text-sm">
            {Math.round(fixationProgress)}%
          </div>
        </div>
      )}
    </div>
  );
};
