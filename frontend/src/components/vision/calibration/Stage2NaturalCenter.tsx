/**
 * Stage 2: Natural Center Point Detection
 * User gazes at center marker for 2 seconds to establish baseline
 */

import React, { useState, useEffect, useRef } from 'react';
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
  const [hasStarted, setHasStarted] = useState(false); // Track if collection has started

  // Use ref to accumulate samples without causing re-renders
  const samplesRef = useRef<GazeData[]>([]);
  const collectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const DURATION = CALIBRATION_CONSTANTS.NATURAL_CENTER_DURATION;

  // Start collection when component mounts or remounts
  useEffect(() => {
    if (!hasStarted) {
      const timer = setTimeout(() => {
        console.log('🎯 Starting natural center collection...');
        setIsCollecting(true);
        setStartTime(Date.now());
        setHasStarted(true);
        samplesRef.current = []; // Reset samples ref
      }, 1000); // 1 second delay to let user position themselves

      return () => clearTimeout(timer);
    }
  }, [hasStarted]);

  // Collect samples using ref to avoid recreating interval on every currentRawGaze update
  const currentRawGazeRef = useRef(currentRawGaze);

  // Update ref without triggering re-renders
  useEffect(() => {
    currentRawGazeRef.current = currentRawGaze;
  }, [currentRawGaze]);

  // Collect samples using interval (fixed - no dependency on currentRawGaze)
  useEffect(() => {
    if (isCollecting) {
      // Sample collection at 30Hz (every ~33ms)
      collectionIntervalRef.current = setInterval(() => {
        const gaze = currentRawGazeRef.current;
        if (gaze) {
          const sample: GazeData = {
            irisOffsetX: gaze.irisOffset.x,
            irisOffsetY: gaze.irisOffset.y,
            headYaw: gaze.headPose.yaw,
            headPitch: gaze.headPose.pitch,
            timestamp: Date.now()
          };

          samplesRef.current.push(sample);

          // Update state periodically for UI (every 10 samples)
          if (samplesRef.current.length % 10 === 0) {
            setSamples([...samplesRef.current]);
            console.log(`📊 Collected ${samplesRef.current.length} samples`);
          }
        }
      }, 33); // ~30Hz sampling rate

      return () => {
        if (collectionIntervalRef.current) {
          clearInterval(collectionIntervalRef.current);
        }
      };
    }
  }, [isCollecting]);

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

    // Clear interval
    if (collectionIntervalRef.current) {
      clearInterval(collectionIntervalRef.current);
    }

    // Use ref samples for final calculation
    const finalSamples = samplesRef.current;

    if (finalSamples.length === 0) {
      console.warn('⚠️ No samples collected for natural center');

      // Reset states to allow restart
      setHasStarted(false);
      setSamples([]);
      setProgress(0);
      setStartTime(null);
      samplesRef.current = [];

      console.log('🔄 Restarting collection...');
      return;
    }

    // Calculate median values
    const medianIrisX = median(finalSamples.map(s => s.irisOffsetX));
    const medianIrisY = median(finalSamples.map(s => s.irisOffsetY));
    const medianYaw = median(finalSamples.map(s => s.headYaw));
    const medianPitch = median(finalSamples.map(s => s.headPitch));

    const naturalCenter: GazeData = {
      irisOffsetX: medianIrisX,
      irisOffsetY: medianIrisY,
      headYaw: medianYaw,
      headPitch: medianPitch,
      timestamp: Date.now()
    };

    console.log('🎯 Natural center established:', {
      samples: finalSamples.length,
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
          <div className="absolute w-32 h-32 rounded-full border-4 border-purple-500 opacity-30"></div>

          {/* Middle ring */}
          <div className="absolute w-20 h-20 rounded-full border-4 border-purple-400 opacity-50"></div>

          {/* Inner dot */}
          <div className="w-8 h-8 rounded-full bg-purple-500"></div>
        </div>

        {/* Progress ring */}
        {isCollecting && (
          <svg className="absolute inset-0 w-32 h-32 transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="64"
              cy="64"
              r="60"
              stroke="rgb(168, 85, 247)"
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
              className="bg-purple-500 h-full transition-all duration-100"
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
