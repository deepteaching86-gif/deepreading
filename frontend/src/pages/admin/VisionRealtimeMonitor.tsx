/**
 * Vision Realtime Monitor (Admin)
 *
 * Admin page to verify eye tracking functionality in real-time
 * Uses client-side MediaPipe FaceMesh for gaze tracking
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import VisionCalibration from '../../components/vision/VisionCalibration';
import { FaceMeshGazeService, GazePrediction } from '../../services/faceMeshGazeService';

type MonitorPhase = 'intro' | 'calibration' | 'monitoring';

const VisionRealtimeMonitor: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<MonitorPhase>('intro');
  const gazeServiceRef = useRef<FaceMeshGazeService | null>(null);
  const [sessionId] = useState<string>('admin-monitor-' + Date.now());
  const [currentGaze, setCurrentGaze] = useState<{ x: number; y: number } | null>(null);
  const [gazeHistory, setGazeHistory] = useState<{ x: number; y: number }[]>([]);
  const [trackingQuality, setTrackingQuality] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const gazeCountRef = useRef(0);

  const handleStartMonitoring = async () => {
    try {
      setIsInitializing(true);
      setErrorMessage(null);

      const service = new FaceMeshGazeService();
      gazeServiceRef.current = service;

      const initialized = await service.initialize();
      if (!initialized) {
        throw new Error('MediaPipe initialization failed');
      }

      await service.startTracking();

      // Start calibration
      setPhase('calibration');
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      setErrorMessage('MediaPipe 초기화에 실패했습니다. 웹캠 권한을 확인해주세요.');
      gazeServiceRef.current?.stopTracking();
      gazeServiceRef.current = null;
    } finally {
      setIsInitializing(false);
    }
  };

  const registerGazeListener = () => {
    const service = gazeServiceRef.current;
    if (!service) return;

    service.onGaze((prediction: GazePrediction) => {
      setCurrentGaze({ x: prediction.x, y: prediction.y });
      setTrackingQuality(prediction.confidence * 100);

      setGazeHistory(prev => {
        const newHistory = [...prev, { x: prediction.x, y: prediction.y }];
        return newHistory.slice(-50);
      });

      gazeCountRef.current++;
    });
  };

  const handleCalibrationComplete = async (_accuracy: number) => {
    // Re-register gaze listener for monitoring phase
    registerGazeListener();
    setPhase('monitoring');
  };

  const handleCalibrationCancel = () => {
    gazeServiceRef.current?.stopTracking();
    gazeServiceRef.current = null;
    setPhase('intro');
  };

  const handleStopMonitoring = () => {
    gazeServiceRef.current?.stopTracking();
    gazeServiceRef.current = null;
    setPhase('intro');
    setCurrentGaze(null);
    setGazeHistory([]);
  };

  const handleExit = () => {
    gazeServiceRef.current?.stopTracking();
    gazeServiceRef.current = null;
    navigate('/admin/dashboard');
  };

  const gazeCount = gazeCountRef.current;
  const avgQuality = trackingQuality.toFixed(1);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Introduction Phase */}
      {phase === 'intro' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🚀</span>
              <h1 className="text-3xl font-bold">실시간 Eye Tracking (브라우저)</h1>
            </div>
            <p className="text-gray-600 mb-6">
              MediaPipe FaceMesh 브라우저 내 처리 - 시지각 트래커 작동 확인
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-2">모니터링 기능:</h3>
              <ul className="list-disc list-inside text-green-800 space-y-1">
                <li>실시간 시선 위치 추적 (빨간 점)</li>
                <li>시선 이동 궤적 표시 (50개 포인트)</li>
                <li>추적 품질 실시간 표시</li>
                <li>클라이언트 사이드 MediaPipe 처리</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">준비사항:</h3>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>웹캠이 작동하는지 확인해주세요</li>
                <li>밝은 환경에서 테스트해주세요</li>
                <li>화면에서 약 50-70cm 떨어져 앉아주세요</li>
              </ul>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700">{errorMessage}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleStartMonitoring}
                disabled={isInitializing}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInitializing ? '초기화 중...' : '모니터링 시작'}
              </button>
              <button
                onClick={handleExit}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                뒤로 가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calibration Phase */}
      {phase === 'calibration' && gazeServiceRef.current && (
        <VisionCalibration
          gazeService={gazeServiceRef.current}
          sessionId={sessionId}
          onCalibrationComplete={handleCalibrationComplete}
          onCancel={handleCalibrationCancel}
        />
      )}

      {/* Monitoring Phase */}
      {phase === 'monitoring' && (
        <div className="fixed inset-0 bg-gray-900">
          {/* Gaze trail (history) */}
          {gazeHistory.map((point, index) => {
            const opacity = (index + 1) / gazeHistory.length * 0.3;
            const size = 2 + (index / gazeHistory.length) * 2;
            return (
              <div
                key={index}
                className="fixed bg-yellow-400 rounded-full pointer-events-none"
                style={{
                  left: `${point.x}px`,
                  top: `${point.y}px`,
                  width: `${size}px`,
                  height: `${size}px`,
                  transform: 'translate(-50%, -50%)',
                  opacity,
                }}
              />
            );
          })}

          {/* Current gaze position (red dot) */}
          {currentGaze && (
            <div
              className="fixed w-4 h-4 bg-red-500 rounded-full pointer-events-none transition-all duration-100 shadow-lg"
              style={{
                left: `${currentGaze.x}px`,
                top: `${currentGaze.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )}

          {/* Control Panel (Top) */}
          <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-80 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-semibold">MediaPipe 활성</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">추적 품질:</span>
                <span className="ml-2 font-mono text-green-400">{avgQuality}%</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Gaze 포인트:</span>
                <span className="ml-2 font-mono text-blue-400">{gazeCount}</span>
              </div>
            </div>

            <button
              onClick={handleStopMonitoring}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              모니터링 중지
            </button>
          </div>

          {/* Instructions */}
          <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg max-w-md">
            <h3 className="font-semibold mb-2">📊 실시간 모니터링 중</h3>
            <ul className="text-sm space-y-1">
              <li>🔴 빨간 점 = 현재 시선 위치</li>
              <li>🟡 노란 궤적 = 최근 시선 이동 경로</li>
              <li>💚 추적 품질 = 시선 추적 신뢰도</li>
            </ul>
            <p className="text-xs text-gray-400 mt-3">
              자연스럽게 화면을 보면서 시선 추적이 정확한지 확인하세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisionRealtimeMonitor;
