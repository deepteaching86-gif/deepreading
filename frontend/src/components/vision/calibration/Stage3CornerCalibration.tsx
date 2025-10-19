/**
 * Stage 3: 4-Corner Range Calibration
 * User gazes at 4 corner points sequentially
 */

import React, { useState, useEffect } from 'react';
import {
  GazeData,
  CornerData,
  CORNER_POINTS,
  CALIBRATION_CONSTANTS,
  Point
} from '../../../types/calibration';
import { calculateDistance } from '../../../utils/calibrationUtils';

interface Stage3CornerCalibrationProps {
  currentGaze: Point | null; // Real-time CALCULATED gaze position (for fixation detection)
  currentRawGaze: {
    irisOffset: { x: number; y: number };
    headPose: { yaw: number; pitch: number };
  } | null; // Real-time RAW gaze data (for calibration)
  onComplete: (corners: CornerData[]) => void;
}

export const Stage3CornerCalibration: React.FC<Stage3CornerCalibrationProps> = ({
  currentGaze,
  currentRawGaze,
  onComplete
}) => {
  const [currentCornerIndex, setCurrentCornerIndex] = useState(0);
  const [cornerData, setCornerData] = useState<CornerData[]>([]);
  const [samples, setSamples] = useState<GazeData[]>([]);
  const [isFixating, setIsFixating] = useState(false);
  const [fixationProgress, setFixationProgress] = useState(0); // 0-100
  const [fixationStartTime, setFixationStartTime] = useState<number | null>(null);

  const DURATION = CALIBRATION_CONSTANTS.CORNER_FIXATION_DURATION;
  const THRESHOLD = CALIBRATION_CONSTANTS.CORNER_DISTANCE_THRESHOLD;

  const currentPoint = CORNER_POINTS[currentCornerIndex];

  // Check fixation on current corner
  useEffect(() => {
    if (!currentGaze || !currentPoint) return;

    const distance = calculateDistance(currentGaze, {
      x: currentPoint.x,
      y: currentPoint.y
    });

    if (distance < THRESHOLD) {
      // User is fixating
      if (!fixationStartTime) {
        console.log(`👀 Fixation started on ${currentPoint.label}`);
        setIsFixating(true);
        setFixationStartTime(Date.now());
      } else {
        // Update progress
        const elapsed = Date.now() - fixationStartTime;
        const progress = Math.min((elapsed / DURATION) * 100, 100);
        setFixationProgress(progress);

        // Check if duration reached
        if (elapsed >= DURATION) {
          completeCorner();
        }
      }
    } else {
      // User looked away
      if (fixationStartTime) {
        console.log(`👋 User looked away from ${currentPoint.label}`);
      }
      setIsFixating(false);
      setFixationStartTime(null);
      setFixationProgress(0);
    }
  }, [currentGaze, currentPoint, fixationStartTime]);

  // Collect samples while fixating
  useEffect(() => {
    if (isFixating && currentRawGaze) {
      const sample: GazeData = {
        irisOffsetX: currentRawGaze.irisOffset.x,
        irisOffsetY: currentRawGaze.irisOffset.y,
        headYaw: currentRawGaze.headPose.yaw,
        headPitch: currentRawGaze.headPose.pitch,
        timestamp: Date.now()
      };
      setSamples(prev => [...prev, sample]);
    }
  }, [isFixating, currentRawGaze]);

  const completeCorner = () => {
    if (samples.length === 0) {
      console.warn(`⚠️ No samples collected for ${currentPoint.label}`);
      return;
    }

    // Calculate median values
    const medianIrisX = median(samples.map(s => s.irisOffsetX));
    const medianIrisY = median(samples.map(s => s.irisOffsetY));
    const medianYaw = median(samples.map(s => s.headYaw));
    const medianPitch = median(samples.map(s => s.headPitch));

    const corner: CornerData = {
      target: { x: currentPoint.x, y: currentPoint.y },
      measuredSamples: samples,
      avgMeasured: {
        irisX: medianIrisX,
        irisY: medianIrisY,
        headYaw: medianYaw,
        headPitch: medianPitch
      }
    };

    console.log(`✅ ${currentPoint.label} completed:`, {
      samples: samples.length,
      irisX: medianIrisX.toFixed(4),
      irisY: medianIrisY.toFixed(4)
    });

    setCornerData(prev => [...prev, corner]);

    // Move to next corner or complete
    if (currentCornerIndex < CORNER_POINTS.length - 1) {
      setCurrentCornerIndex(prev => prev + 1);
      setSamples([]);
      setIsFixating(false);
      setFixationStartTime(null);
      setFixationProgress(0);
    } else {
      // All corners completed
      onComplete([...cornerData, corner]);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900">
      {/* Instructions */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-20">
        <h2 className="text-2xl font-bold text-white mb-2">
          📍 4-코너 캘리브레이션
        </h2>
        <p className="text-gray-300 text-lg">
          {currentPoint.label}의 점을 바라봐주세요
        </p>
        <p className="text-gray-400 text-sm mt-1">
          ({currentCornerIndex + 1} / {CORNER_POINTS.length})
        </p>
      </div>

      {/* Calibration Point */}
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
        style={{
          left: `${currentPoint.x * 100}%`,
          top: `${currentPoint.y * 100}%`
        }}
      >
        {/* Target marker */}
        <div className={`relative flex items-center justify-center ${isFixating ? 'scale-110' : 'scale-100'} transition-transform`}>
          {/* Outer ring */}
          <div className={`absolute w-24 h-24 rounded-full border-4 ${isFixating ? 'border-green-500' : 'border-blue-500'} opacity-30 ${!isFixating && 'animate-pulse'}`}></div>

          {/* Middle ring */}
          <div className={`absolute w-16 h-16 rounded-full border-4 ${isFixating ? 'border-green-400' : 'border-blue-400'} opacity-50`}></div>

          {/* Inner dot */}
          <div className={`w-6 h-6 rounded-full ${isFixating ? 'bg-green-500' : 'bg-blue-500'}`}></div>

          {/* Progress ring */}
          {isFixating && (
            <svg className="absolute w-24 h-24" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="48"
                cy="48"
                r="44"
                stroke="rgb(34, 197, 94)"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - fixationProgress / 100)}`}
                className="transition-all duration-100"
              />
            </svg>
          )}
        </div>

        {/* Label */}
        <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 text-white text-sm whitespace-nowrap bg-black bg-opacity-75 px-3 py-1 rounded">
          {currentPoint.label}
        </div>
      </div>

      {/* Completed corners indicators */}
      <div className="absolute top-20 right-8 space-y-2">
        {CORNER_POINTS.map((point, index) => (
          <div
            key={point.id}
            className={`flex items-center gap-2 px-3 py-1 rounded ${
              index < currentCornerIndex
                ? 'bg-green-900 text-green-300'
                : index === currentCornerIndex
                ? 'bg-blue-900 text-blue-300'
                : 'bg-gray-800 text-gray-500'
            }`}
          >
            {index < currentCornerIndex && <span>✓</span>}
            {index === currentCornerIndex && <span>⏵</span>}
            <span className="text-sm">{point.label}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {isFixating && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-96">
          <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all duration-100"
              style={{ width: `${fixationProgress}%` }}
            ></div>
          </div>
          <div className="text-center text-white mt-2 text-sm">
            {Math.round(fixationProgress)}% ({samples.length} 샘플)
          </div>
        </div>
      )}

      {/* Current gaze indicator (debug) */}
      {currentGaze && (
        <div
          className="absolute w-4 h-4 bg-red-500 rounded-full opacity-50 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${currentGaze.x * 100}%`,
            top: `${currentGaze.y * 100}%`
          }}
        ></div>
      )}
    </div>
  );
};

// Helper function
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}
