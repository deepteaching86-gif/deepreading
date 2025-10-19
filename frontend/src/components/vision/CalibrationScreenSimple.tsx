/**
 * Simple Calibration Screen - 카메라 위치만 확인
 * 자동 적응형 시스템으로 캘리브레이션 불필요
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useGazeTracking } from '../../hooks/useGazeTracking';

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
  const [stage, setStage] = useState<'instructions' | 'camera_check' | 'completed'>('instructions');
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCentered, setFaceCentered] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Gaze tracking hook for face detection
  const {
    isTracking,
    videoRef,
    canvasRef,
    startTracking
  } = useGazeTracking({
    enabled: stage === 'camera_check',
    onFacePosition: useCallback((position: { x: number; y: number; width: number; height: number }) => {
      setFaceDetected(true);

      // Check if face is centered (within 15% of center)
      const centered = Math.abs(position.x - 0.5) < 0.15 && Math.abs(position.y - 0.5) < 0.15;
      setFaceCentered(centered);
    }, []),
    targetFPS: 30
  });

  // Start camera check
  const handleStartCheck = useCallback(async () => {
    setStage('camera_check');
    await startTracking();
  }, [startTracking]);

  // Auto-complete when face is centered for 3 seconds
  useEffect(() => {
    if (stage === 'camera_check' && faceCentered && faceDetected) {
      setCountdown(3);

      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setStage('completed');

            // Complete after 1 second
            setTimeout(() => {
              onCalibrationComplete();
            }, 1000);

            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCountdown(3);
    }
  }, [stage, faceCentered, faceDetected, onCalibrationComplete]);

  // Instructions
  if (stage === 'instructions') {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="max-w-2xl mx-auto p-8 bg-card rounded-2xl shadow-2xl">
          <h2 className="text-3xl font-bold text-foreground mb-6">시선 추적 시작</h2>

          <div className="space-y-4 text-muted-foreground mb-8">
            <p className="text-lg">
              정확한 시선 추적을 위해 카메라 위치를 확인합니다.
            </p>

            <div className="bg-secondary/10 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">준비사항:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>밝은 조명이 있는 환경에서 진행하세요</li>
                <li>화면을 편안한 위치에 고정하세요</li>
                <li>얼굴이 화면 중앙에 오도록 위치하세요</li>
                <li>화면으로부터 30-50cm 거리를 유지하세요</li>
              </ul>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">자동 적응 시스템:</h3>
              <p className="text-sm">
                시선 추적 시스템이 화면 크기, 시청 거리, 개인별 특성을 실시간으로 자동 감지하고 최적화합니다.
                별도의 캘리브레이션이 필요하지 않습니다.
              </p>
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

  // Camera check
  if (stage === 'camera_check') {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center">
        {/* Hidden video and canvas */}
        <video
          ref={videoRef}
          className="hidden"
          autoPlay
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Instructions */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-20">
          <h2 className="text-2xl font-bold text-white mb-2">
            📹 카메라 위치 확인
          </h2>
          <p className="text-gray-300 text-lg">
            얼굴을 화면 중앙에 위치시켜주세요
          </p>
        </div>

        {/* Face guide - centered */}
        <div className="relative">
          <div className="w-64 h-80 border-4 border-dashed rounded-2xl pointer-events-none"
            style={{
              borderColor: faceCentered ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)',
              boxShadow: faceCentered
                ? '0 0 30px rgba(34, 197, 94, 0.4)'
                : '0 0 30px rgba(239, 68, 68, 0.4)'
            }}
          >
            {/* Status text */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
              {!faceDetected && (
                <p className="text-red-400 font-semibold">❌ 얼굴이 감지되지 않습니다</p>
              )}
              {faceDetected && !faceCentered && (
                <p className="text-yellow-400 font-semibold">⚠️ 위치를 조정해주세요</p>
              )}
              {faceCentered && (
                <div>
                  <p className="text-green-400 font-bold text-xl mb-2">
                    ✅ 완벽합니다!
                  </p>
                  <p className="text-white text-3xl font-bold">
                    {countdown}
                  </p>
                </div>
              )}
            </div>
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

  // Completed
  if (stage === 'completed') {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-bounce">✅</div>
          <h2 className="text-3xl font-bold text-white mb-4">
            준비 완료!
          </h2>
          <p className="text-gray-400 text-lg">
            읽기 활동을 시작합니다
          </p>
          <div className="mt-8">
            <div className="inline-block w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
