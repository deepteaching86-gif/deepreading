/**
 * Face Position Guide Component
 *
 * Real-time visual feedback for optimal face positioning
 * - Transparent guide boundaries
 * - Color-coded feedback (green=good, red=adjust)
 * - Distance and centering indicators
 */

import React from 'react';

interface FacePositionGuideProps {
  headPose?: {
    pitch: number;
    yaw: number;
    roll: number;
    translation: number[];
  };
  confidence: number;
  show: boolean;
}

const FacePositionGuide: React.FC<FacePositionGuideProps> = ({
  headPose,
  confidence,
  show,
}) => {
  if (!show) return null;

  // Calculate face position status
  const isPositionGood = headPose ? checkFacePosition(headPose, confidence) : false;
  const guideColor = isPositionGood ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10';
  const textColor = isPositionGood ? 'text-green-500' : 'text-red-500';

  // Position feedback
  const feedback = headPose ? getFeedbackMessage(headPose, confidence) : [];

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Guide Frame - Optimal face position area */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`relative border-4 rounded-3xl transition-all duration-300 ${guideColor}`}
          style={{
            width: '40%',
            height: '60%',
            minWidth: '300px',
            minHeight: '400px',
          }}
        >
          {/* Corner markers */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-current rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-current rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-current rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-current rounded-br-lg" />

          {/* Center crosshair */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className={`w-6 h-px ${isPositionGood ? 'bg-green-500' : 'bg-red-500'}`} />
            <div
              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-px h-6 ${
                isPositionGood ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Feedback Panel */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-lg shadow-lg pointer-events-auto">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isPositionGood ? 'bg-green-500' : 'bg-red-500'
            } animate-pulse`}
          />
          <span className={`font-semibold ${textColor}`}>
            {isPositionGood ? '좋은 위치입니다' : '위치를 조정해주세요'}
          </span>
        </div>

        {/* Feedback messages */}
        {feedback.length > 0 && (
          <div className="text-sm space-y-1">
            {feedback.map((msg, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-gray-400">•</span>
                <span className="text-gray-300">{msg}</span>
              </div>
            ))}
          </div>
        )}

        {/* Confidence indicator */}
        <div className="mt-2 text-xs text-gray-400">
          신뢰도: {(confidence * 100).toFixed(0)}%
        </div>
      </div>

      {/* Distance indicator */}
      {headPose && (
        <DistanceIndicator
          distance={headPose.translation[2]}
          isGood={isDistanceGood(headPose.translation[2])}
        />
      )}
    </div>
  );
};

/**
 * Distance indicator component
 */
const DistanceIndicator: React.FC<{ distance: number; isGood: boolean }> = ({
  distance,
}) => {
  // Convert from mm to cm
  const distanceCm = Math.abs(distance) / 10;
  const optimalRange = distanceCm >= 50 && distanceCm <= 70;

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 px-4 py-2 rounded-lg shadow-lg">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">카메라 거리:</span>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              optimalRange ? 'bg-green-500' : 'bg-yellow-500'
            }`}
          />
          <span className={`font-mono ${optimalRange ? 'text-green-400' : 'text-yellow-400'}`}>
            {distanceCm.toFixed(0)}cm
          </span>
        </div>
        <span className="text-xs text-gray-500">(권장: 50-70cm)</span>
      </div>
    </div>
  );
};

/**
 * Check if face position is good
 */
function checkFacePosition(headPose: any, confidence: number): boolean {
  const { pitch, yaw, roll, translation } = headPose;
  const [tx, ty, tz] = translation;

  // Confidence threshold
  if (confidence < 0.7) return false;

  // Head orientation thresholds (degrees)
  const isOrientationGood =
    Math.abs(pitch) < 20 && Math.abs(yaw) < 25 && Math.abs(roll) < 15;

  // Distance threshold (50-70cm optimal)
  const distanceCm = Math.abs(tz) / 10;
  const isDistanceGood = distanceCm >= 50 && distanceCm <= 70;

  // Face centering (within ±15% of center)
  const isCentered = Math.abs(tx) < 100 && Math.abs(ty) < 100;

  return isOrientationGood && isDistanceGood && isCentered;
}

/**
 * Check if distance is good
 */
function isDistanceGood(tz: number): boolean {
  const distanceCm = Math.abs(tz) / 10;
  return distanceCm >= 50 && distanceCm <= 70;
}

/**
 * Generate feedback messages
 */
function getFeedbackMessage(headPose: any, confidence: number): string[] {
  const messages: string[] = [];
  const { pitch, yaw, roll, translation } = headPose;
  const [tx, ty, tz] = translation;

  // Confidence feedback
  if (confidence < 0.7) {
    messages.push('얼굴이 잘 감지되지 않습니다');
    return messages;
  }

  // Distance feedback
  const distanceCm = Math.abs(tz) / 10;
  if (distanceCm < 50) {
    messages.push('카메라에서 조금 더 멀리 떨어져주세요');
  } else if (distanceCm > 70) {
    messages.push('카메라에 조금 더 가까이 와주세요');
  }

  // Orientation feedback
  if (Math.abs(pitch) >= 20) {
    messages.push(pitch > 0 ? '고개를 조금 더 들어주세요' : '고개를 조금 더 숙여주세요');
  }
  if (Math.abs(yaw) >= 25) {
    messages.push(yaw > 0 ? '얼굴을 왼쪽으로 돌려주세요' : '얼굴을 오른쪽으로 돌려주세요');
  }
  if (Math.abs(roll) >= 15) {
    messages.push('머리를 똑바로 세워주세요');
  }

  // Centering feedback
  if (Math.abs(tx) >= 100) {
    messages.push(tx > 0 ? '왼쪽으로 이동해주세요' : '오른쪽으로 이동해주세요');
  }
  if (Math.abs(ty) >= 100) {
    messages.push(ty > 0 ? '아래로 이동해주세요' : '위로 이동해주세요');
  }

  // All good
  if (messages.length === 0) {
    messages.push('완벽한 위치입니다!');
  }

  return messages;
}

export default FacePositionGuide;
