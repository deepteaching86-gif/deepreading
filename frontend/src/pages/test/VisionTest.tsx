/**
 * Vision Test Page
 *
 * Main page for Vision tracking test with calibration and real-time visualization
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VisionCalibration from '../../components/vision/VisionCalibration';
import { VisionWebSocketClient, VisionAPI, GazeData } from '../../services/visionWebSocket';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://literacy-english-test-backend.onrender.com';

type TestPhase = 'intro' | 'calibration' | 'testing' | 'complete';

const VisionTest: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<TestPhase>('intro');
  const [wsClient] = useState(() => new VisionWebSocketClient(BACKEND_URL));
  const [visionAPI] = useState(() => new VisionAPI(BACKEND_URL));
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentGaze, setCurrentGaze] = useState<{ x: number; y: number } | null>(null);
  const [calibrationAccuracy, setCalibrationAccuracy] = useState<number | null>(null);

  useEffect(() => {
    // Check Vision API availability
    checkAPIAvailability();

    return () => {
      wsClient.disconnect();
    };
  }, []);

  const checkAPIAvailability = async () => {
    const available = await visionAPI.testConnection();
    if (!available) {
      alert('Vision API에 연결할 수 없습니다. 관리자에게 문의하세요.');
    }
  };

  const handleStart = async () => {
    try {
      // Start Vision session
      const newSessionId = await visionAPI.startSession('test-student', 'vision-test-v1');
      setSessionId(newSessionId);

      // Connect WebSocket
      await wsClient.connect(newSessionId);
      setIsConnected(true);

      // Register gaze callback
      wsClient.onGaze((data: GazeData) => {
        setCurrentGaze({ x: data.x, y: data.y });
      });

      // Start calibration
      setPhase('calibration');
    } catch (error) {
      console.error('Failed to start Vision test:', error);
      alert('Vision 테스트 시작에 실패했습니다.');
    }
  };

  const handleCalibrationComplete = async (accuracy: number) => {
    setCalibrationAccuracy(accuracy);

    // Save calibration to backend
    if (sessionId) {
      try {
        await visionAPI.saveCalibration(sessionId, [], accuracy);
      } catch (error) {
        console.error('Failed to save calibration:', error);
      }
    }

    // Move to testing phase
    setPhase('testing');
  };

  const handleCalibrationCancel = () => {
    wsClient.disconnect();
    setPhase('intro');
  };

  const handleTestComplete = () => {
    wsClient.disconnect();
    setPhase('complete');
  };

  const handleExit = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {phase === 'intro' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-4">Vision 테스트</h1>
            <p className="text-gray-600 mb-6">
              이 테스트는 시선 추적 기술을 사용하여 독서 패턴과 시각적 주의력을 측정합니다.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">준비사항:</h3>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>웹캠이 작동하는지 확인해주세요</li>
                <li>밝은 환경에서 테스트해주세요</li>
                <li>화면에서 약 50-70cm 떨어져 앉아주세요</li>
                <li>안정적인 자세를 유지해주세요</li>
                <li>안경을 착용하셔도 괜찮습니다</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-900 mb-2">테스트 진행:</h3>
              <ol className="list-decimal list-inside text-yellow-800 space-y-1">
                <li>9-point 캘리브레이션 (약 2분)</li>
                <li>Vision 독서 테스트 (약 5분)</li>
                <li>결과 확인</li>
              </ol>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleStart}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                시작하기
              </button>
              <button
                onClick={handleExit}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              <p>• WebSocket 연결: {isConnected ? '✅ 연결됨' : '⚪ 대기 중'}</p>
            </div>
          </div>
        </div>
      )}

      {phase === 'calibration' && sessionId && (
        <VisionCalibration
          wsClient={wsClient}
          sessionId={sessionId}
          backendUrl={BACKEND_URL}
          onCalibrationComplete={handleCalibrationComplete}
          onCancel={handleCalibrationCancel}
        />
      )}

      {phase === 'testing' && (
        <div className="fixed inset-0 bg-white">
          {/* Gaze visualization */}
          {currentGaze && (
            <div
              className="fixed w-4 h-4 bg-red-500 rounded-full pointer-events-none transition-all duration-100"
              style={{
                left: `${currentGaze.x}px`,
                top: `${currentGaze.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )}

          {/* Test content */}
          <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <div className="max-w-3xl w-full">
              <h1 className="text-2xl font-bold mb-6">Vision 독서 테스트</h1>

              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
                <p className="text-lg leading-relaxed">
                  다음 글을 자연스럽게 읽어주세요. 빨간 점이 당신의 시선 위치를 나타냅니다.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
                <p className="text-base leading-loose mb-4">
                  독서는 단순히 글자를 읽는 것 이상의 의미를 가집니다. 독서를 통해 우리는
                  새로운 지식을 습득하고, 다양한 관점을 이해하며, 상상력을 키울 수 있습니다.
                </p>
                <p className="text-base leading-loose mb-4">
                  효과적인 독서를 위해서는 집중력과 이해력이 필요합니다. 시선 추적 기술은
                  독자가 어떻게 텍스트를 처리하는지 분석하여, 독서 능력을 향상시키는 데
                  도움을 줄 수 있습니다.
                </p>
                <p className="text-base leading-loose">
                  현대의 독서 교육은 개인화된 학습 경험을 제공하는 것을 목표로 합니다.
                  Vision 테스트는 학습자의 독서 패턴을 파악하여 맞춤형 학습 자료를
                  제공하는 데 활용될 수 있습니다.
                </p>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  캘리브레이션 정확도: {calibrationAccuracy ? `${(calibrationAccuracy * 100).toFixed(0)}%` : 'N/A'}
                </div>
                <button
                  onClick={handleTestComplete}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  테스트 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === 'complete' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">테스트 완료!</h1>
            <p className="text-gray-600 mb-6">
              Vision 테스트가 성공적으로 완료되었습니다.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-green-900 mb-2">결과 요약:</h3>
              <div className="text-green-800">
                <p>캘리브레이션 정확도: {calibrationAccuracy ? `${(calibrationAccuracy * 100).toFixed(0)}%` : 'N/A'}</p>
                <p>세션 ID: {sessionId}</p>
              </div>
            </div>

            <button
              onClick={handleExit}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              대시보드로 돌아가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisionTest;
