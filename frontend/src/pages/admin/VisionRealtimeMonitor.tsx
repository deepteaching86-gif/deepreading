/**
 * Vision Realtime Monitor (Admin)
 *
 * Admin page to verify eye tracking functionality in real-time
 * Shows live gaze tracking, connection status, and quality metrics
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { VisionWebSocketClient, GazeData } from '../../services/visionWebSocket';
import VisionCalibration from '../../components/vision/VisionCalibration';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://literacy-english-test-backend.onrender.com';

type MonitorPhase = 'intro' | 'calibration' | 'monitoring';

const VisionRealtimeMonitor: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<MonitorPhase>('intro');
  const [wsClient] = useState(() => new VisionWebSocketClient(BACKEND_URL));
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentGaze, setCurrentGaze] = useState<{ x: number; y: number } | null>(null);
  const [gazeHistory, setGazeHistory] = useState<{ x: number; y: number }[]>([]);
  const [trackingQuality, setTrackingQuality] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugImage, setDebugImage] = useState<string | null>(null);
  const gazeCountRef = useRef(0);

  useEffect(() => {
    return () => {
      wsClient.disconnect();
    };
  }, []);

  const handleStartMonitoring = async () => {
    try {
      // Start session with admin test ID
      const response = await fetch(`${BACKEND_URL}/api/vision/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: 'admin-monitor',
          template_id: 'realtime-monitor',
          device_info: {
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start monitoring session');
      }

      const data = await response.json();
      const newSessionId = data.id;
      setSessionId(newSessionId);

      // Connect WebSocket
      await wsClient.connect(newSessionId);
      setIsConnected(true);

      // Register gaze callback
      wsClient.onGaze((data: GazeData) => {
        setCurrentGaze({ x: data.x, y: data.y });

        // Update tracking quality based on confidence
        setTrackingQuality(data.confidence * 100);

        // Store debug image if available
        if (data.debugImage) {
          setDebugImage(data.debugImage);
        }

        // Keep history of last 50 points for trail effect
        setGazeHistory(prev => {
          const newHistory = [...prev, { x: data.x, y: data.y }];
          return newHistory.slice(-50);
        });

        gazeCountRef.current++;
      });

      // Register error callback
      wsClient.onError((error: string) => {
        setErrorMessage(error);
      });

      // Start calibration
      setPhase('calibration');
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      alert('모니터링 시작에 실패했습니다.');
    }
  };

  const handleCalibrationComplete = async (accuracy: number) => {
    // Move to monitoring phase
    setPhase('monitoring');
  };

  const handleCalibrationCancel = () => {
    wsClient.disconnect();
    setPhase('intro');
    setIsConnected(false);
  };

  const handleStopMonitoring = () => {
    wsClient.disconnect();
    setPhase('intro');
    setIsConnected(false);
    setCurrentGaze(null);
    setGazeHistory([]);
    setDebugImage(null);
  };

  const handleExit = () => {
    wsClient.disconnect();
    navigate('/admin/dashboard');
  };

  // Calculate tracking statistics
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
              MediaPipe 60fps 로컬 처리 - 시지각 트래커 작동 확인
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-2">모니터링 기능:</h3>
              <ul className="list-disc list-inside text-green-800 space-y-1">
                <li>실시간 시선 위치 추적 (빨간 점)</li>
                <li>시선 이동 궤적 표시 (50개 포인트)</li>
                <li>추적 품질 실시간 표시</li>
                <li>WebSocket 연결 상태 모니터링</li>
                <li>디버그 시각화 (활성화 시)</li>
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

            <div className="flex gap-4">
              <button
                onClick={handleStartMonitoring}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
              >
                모니터링 시작
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
      {phase === 'calibration' && sessionId && (
        <VisionCalibration
          wsClient={wsClient}
          sessionId={sessionId}
          backendUrl={BACKEND_URL}
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
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-semibold">{isConnected ? 'WebSocket 연결됨' : 'WebSocket 연결 끊김'}</span>
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

          {/* Error Message */}
          {errorMessage && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-6 py-3 rounded-lg shadow-lg">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Debug Image (if available) */}
          {debugImage && (
            <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 p-2 rounded-lg">
              <div className="text-white text-xs mb-1">Debug View:</div>
              <img
                src={`data:image/jpeg;base64,${debugImage}`}
                alt="Debug"
                className="w-64 h-auto rounded"
              />
            </div>
          )}

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
