/**
 * Stage 2: Natural Center Point Detection
 * User gazes at center marker for 2 seconds to establish baseline
 */

import React, { useState, useEffect } from 'react';
import { GazeData, CALIBRATION_CONSTANTS } from '../../../types/calibration';

interface Stage2NaturalCenterProps {
  currentRawGaze: {
    irisOffset: { x: number; y: number };
    headPose: { yaw: number; pitch: number };
  } | null; // Real-time raw gaze data from tracking hook
  onComplete: (naturalCenter: GazeData) => void;
}

export const Stage2NaturalCenter: React.FC<Stage2NaturalCenterProps> = ({
  currentRawGaze,
  onComplete
}) => {
  const [samples, setSamples] = useState<GazeData[]>([]);
  const [progress, setProgress] = useState(0); // 0-100
  const [isCollecting, setIsCollecting] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const DURATION = CALIBRATION_CONSTANTS.NATURAL_CENTER_DURATION;

  // Start collection when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCollecting(true);
      setStartTime(Date.now());
    }, 1000); // 1 second delay to let user position themselves

    return () => clearTimeout(timer);
  }, []);

  // Collect gaze data samples whenever new data arrives
  useEffect(() => {
    if (isCollecting && currentRawGaze) {
      const sample: GazeData = {
        irisOffsetX: currentRawGaze.irisOffset.x,
        irisOffsetY: currentRawGaze.irisOffset.y,
        headYaw: currentRawGaze.headPose.yaw,
        headPitch: currentRawGaze.headPose.pitch,
        timestamp: Date.now()
      };
      setSamples(prev => [...prev, sample]);
    }
  }, [isCollecting, currentRawGaze]);

  // Update progress and check completion
  useEffect(() => {
    if (isCollecting && startTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const currentProgress = Math.min((elapsed / DURATION) * 100, 100);
        setProgress(currentProgress);

        // Check if duration reached
        if (elapsed >= DURATION) {
          completeCollection();
          clearInterval(interval);
        }
      }, 16); // ~60fps

      return () => clearInterval(interval);
    }
  }, [isCollecting, startTime]);

  const completeCollection = () => {
    setIsCollecting(false);

    if (samples.length === 0) {
      console.warn('⚠️ No samples collected for natural center');
      return;
    }

    // Calculate median values
    const medianIrisX = median(samples.map(s => s.irisOffsetX));
    const medianIrisY = median(samples.map(s => s.irisOffsetY));
    const medianYaw = median(samples.map(s => s.headYaw));
    const medianPitch = median(samples.map(s => s.headPitch));

    const naturalCenter: GazeData = {
      irisOffsetX: medianIrisX,
      irisOffsetY: medianIrisY,
      headYaw: medianYaw,
      headPitch: medianPitch,
      timestamp: Date.now()
    };

    console.log('🎯 Natural center established:', {
      samples: samples.length,
      irisX: medianIrisX.toFixed(4),
      irisY: medianIrisY.toFixed(4),
      yaw: medianYaw.toFixed(4),
      pitch: medianPitch.toFixed(4)
    });

    onComplete(naturalCenter);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
      {/* Instructions */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-20">
        <h2 className="text-2xl font-bold text-white mb-4">
          👁️ 자연스러운 중앙점 설정
        </h2>
        <p className="text-gray-300 text-lg">
          {!isCollecting
            ? '편안한 자세를 취해주세요...'
            : '화면 중앙의 점을 편안하게 바라봐주세요'}
        </p>
        <p className="text-gray-400 text-sm mt-2">
          고개를 자연스럽게 두고 눈으로만 바라보세요
        </p>
      </div>

      {/* Center Marker */}
      <div className="relative">
        {/* Pulsing marker */}
        <div className={`relative flex items-center justify-center ${isCollecting ? 'animate-pulse' : ''}`}>
          {/* Outer ring */}
          <div className="absolute w-32 h-32 rounded-full border-4 border-blue-500 opacity-30"></div>

          {/* Middle ring */}
          <div className="absolute w-20 h-20 rounded-full border-4 border-blue-400 opacity-50"></div>

          {/* Inner dot */}
          <div className="w-8 h-8 rounded-full bg-blue-500"></div>
        </div>

        {/* Progress ring */}
        {isCollecting && (
          <svg className="absolute inset-0 w-32 h-32 transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="64"
              cy="64"
              r="60"
              stroke="rgb(59, 130, 246)"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 60}`}
              strokeDashoffset={`${2 * Math.PI * 60 * (1 - progress / 100)}`}
              className="transition-all duration-100"
            />
          </svg>
        )}
      </div>

      {/* Progress Bar */}
      {isCollecting && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-96">
          <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-center text-white mt-2 text-sm">
            {Math.round(progress)}% ({samples.length} 샘플 수집됨)
          </div>
        </div>
      )}

      {/* Sample count debug */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-500 text-xs">
        수집된 샘플: {samples.length}
      </div>
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
