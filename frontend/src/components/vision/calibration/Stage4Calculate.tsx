/**
 * Stage 4: Auto Calculate Sensitivity
 * Automatically calculates optimal sensitivity from calibration data
 */

import React, { useEffect } from 'react';
import { GazeData, CornerData, SensitivityMatrix } from '../../../types/calibration';
import { calculateOptimalSensitivity } from '../../../utils/calibrationUtils';

interface Stage4CalculateProps {
  naturalCenter: GazeData;
  corners: CornerData[];
  onComplete: (sensitivity: SensitivityMatrix) => void;
}

export const Stage4Calculate: React.FC<Stage4CalculateProps> = ({
  naturalCenter,
  corners,
  onComplete
}) => {
  useEffect(() => {
    // Show calculation animation for 1 second, then calculate
    const timer = setTimeout(() => {
      const sensitivity = calculateOptimalSensitivity(naturalCenter, corners);
      onComplete(sensitivity);
    }, 1000);

    return () => clearTimeout(timer);
  }, [naturalCenter, corners, onComplete]);

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-6 animate-bounce">⚙️</div>
        <h2 className="text-2xl font-bold text-white mb-4">
          민감도 자동 계산 중...
        </h2>
        <p className="text-gray-400">
          수집된 데이터로 최적 설정을 계산하고 있습니다
        </p>

        {/* Progress spinner */}
        <div className="mt-8">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="bg-gray-800 p-4 rounded">
            <div className="text-gray-400 text-sm">수집된 코너</div>
            <div className="text-white text-2xl font-bold">{corners.length} / 4</div>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <div className="text-gray-400 text-sm">총 샘플</div>
            <div className="text-white text-2xl font-bold">
              {corners.reduce((sum, c) => sum + c.measuredSamples.length, 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
