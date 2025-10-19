/**
 * Stage 1: Camera Position Marking
 * User clicks on screen to indicate camera position
 */

import React, { useState } from 'react';
import { Point } from '../../../types/calibration';

interface Stage1CameraMarkingProps {
  onComplete: (cameraPosition: Point) => void;
}

export const Stage1CameraMarking: React.FC<Stage1CameraMarkingProps> = ({ onComplete }) => {
  const [markedPosition, setMarkedPosition] = useState<Point | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setMarkedPosition({ x, y });
    setIsConfirming(true);

    console.log('📷 Camera position marked:', { x: x.toFixed(3), y: y.toFixed(3) });
  };

  const handleConfirm = () => {
    if (markedPosition) {
      onComplete(markedPosition);
    }
  };

  const handleReset = () => {
    setMarkedPosition(null);
    setIsConfirming(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
      {/* Instructions */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-20">
        <h2 className="text-2xl font-bold text-white mb-4">
          📷 카메라 위치 표시
        </h2>
        <p className="text-gray-300 text-lg">
          {isConfirming
            ? '이 위치가 맞나요?'
            : '화면에서 카메라가 있는 위치를 클릭해주세요'}
        </p>
        <p className="text-gray-400 text-sm mt-2">
          {isConfirming
            ? '확인을 누르면 다음 단계로 진행됩니다'
            : '(보통 노트북은 화면 상단 중앙, 외장 웹캠은 설치 위치)'}
        </p>
      </div>

      {/* Clickable Area */}
      <div
        className="relative w-full h-full cursor-crosshair"
        onClick={!isConfirming ? handleScreenClick : undefined}
      >
        {/* Grid overlay for reference */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 w-px h-full bg-gray-700 opacity-30"></div>
          <div className="absolute top-1/2 left-0 w-full h-px bg-gray-700 opacity-30"></div>
        </div>

        {/* Marked Position */}
        {markedPosition && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              left: `${markedPosition.x * 100}%`,
              top: `${markedPosition.y * 100}%`
            }}
          >
            {/* Camera Icon */}
            <div className="relative">
              <div className="text-6xl animate-pulse">📷</div>
              {/* Ripple effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-blue-500 rounded-full opacity-20 animate-ping"></div>
              </div>
            </div>

            {/* Coordinates display */}
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 px-3 py-1 rounded text-white text-sm whitespace-nowrap">
              X: {(markedPosition.x * 100).toFixed(1)}%, Y: {(markedPosition.y * 100).toFixed(1)}%
            </div>
          </div>
        )}

        {/* Help text when no position marked */}
        {!markedPosition && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-gray-600 text-xl">
              클릭하여 카메라 위치 표시
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Buttons */}
      {isConfirming && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
          >
            다시 표시
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            확인 →
          </button>
        </div>
      )}

      {/* Skip option (default to center-top) */}
      {!isConfirming && (
        <button
          onClick={() => onComplete({ x: 0.5, y: 0.05 })}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
        >
          건너뛰기 (기본값: 중앙 상단)
        </button>
      )}
    </div>
  );
};
