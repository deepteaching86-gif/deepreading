/**
 * Visual Perception Test Page
 *
 * 5-phase test flow:
 * 1. Introduction - Test overview
 * 2. Calibration - 9-point gaze calibration
 * 3. Reading - Read passage with gaze tracking
 * 4. Questions - Answer comprehension questions with gaze tracking
 * 5. Results - Display comprehensive test results
 *
 * Uses client-side MediaPipe FaceMesh for gaze tracking (no server-side dependency).
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';
import VisionCalibration from '../../components/vision/VisionCalibration';
import CameraPreview from '../../components/vision/CameraPreview';
import { FaceMeshGazeService } from '../../services/faceMeshGazeService';
import PerceptionAPI, {
  PerceptionSession,
  PerceptionQuestion,
  PerceptionTestResult
} from '../../services/perceptionAPI';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_ENGLISH_TEST_API_URL || 'http://localhost:8000';
const NODE_BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type TestPhase = 'intro' | 'calibration' | 'reading' | 'questions' | 'results';

const VisualPerceptionTest: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [phase, setPhase] = useState<TestPhase>('intro');

  // API clients
  const [perceptionAPI] = useState(() => new PerceptionAPI(BACKEND_URL));
  const gazeServiceRef = useRef<FaceMeshGazeService | null>(null);

  // Session data
  const [_session, setSession] = useState<PerceptionSession | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Reading phase
  const [passageContent, setPassageContent] = useState<string>('');
  const [passageTitle, setPassageTitle] = useState<string>('');
  const [_readingStartTime, setReadingStartTime] = useState<number>(0);
  const [showPassage, setShowPassage] = useState(true);

  // Questions phase
  const [questions, setQuestions] = useState<PerceptionQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [_answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);

  // Results
  const [testResult, setTestResult] = useState<PerceptionTestResult | null>(null);

  // Gaze tracking
  const [currentGaze, setCurrentGaze] = useState<{ x: number; y: number } | null>(null);
  const [visionAvailable, setVisionAvailable] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const gazeBufferRef = useRef<any[]>([]);
  const phaseRef = useRef<TestPhase>('intro');

  // Keep phaseRef in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    checkAPIAvailability();

    return () => {
      gazeServiceRef.current?.stopTracking();
    };
  }, []);

  const checkAPIAvailability = async () => {
    const available = await perceptionAPI.testConnection();
    if (!available) {
      alert('Vision Perception API에 연결할 수 없습니다. 관리자에게 문의하세요.');
    }
  };

  const handleStart = async () => {
    try {
      if (!user || !user.id) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      setIsInitializing(true);

      // Get student profile from Node.js backend
      const profileRes = await axios.get(`${NODE_BACKEND_URL}/api/v1/students/me/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const studentProfile = profileRes.data.data;

      // Start session with actual student data
      const newSession = await perceptionAPI.startSession(user.id, studentProfile.grade);
      setSession(newSession);
      setSessionId(newSession.id);

      // Set passage and questions
      if (newSession.passage) {
        setPassageTitle(newSession.passage.title);
        setPassageContent(newSession.passage.content);
      }
      if (newSession.questions) {
        setQuestions(newSession.questions);
      }

      // Initialize FaceMesh gaze tracking (optional - test proceeds without it)
      try {
        const service = new FaceMeshGazeService();
        gazeServiceRef.current = service;
        const initialized = await service.initialize();

        if (initialized) {
          await service.startTracking();
          setVisionAvailable(true);

          // Register gaze callback
          service.onGaze((prediction) => {
            if (prediction.confidence > 0.1) {
              setCurrentGaze({ x: prediction.x, y: prediction.y });
            }

            // Buffer gaze data for backend
            gazeBufferRef.current.push({
              phase: phaseRef.current === 'reading' ? 'reading' : 'questions',
              gaze_x: prediction.x,
              gaze_y: prediction.y,
              confidence: prediction.confidence,
              head_pitch: prediction.headPose?.pitch,
              head_yaw: prediction.headPose?.yaw,
              head_roll: prediction.headPose?.roll,
              timestamp: new Date()
            });

            if (gazeBufferRef.current.length >= 10) {
              sendBufferedGazeData();
            }
          });

          setIsInitializing(false);
          setPhase('calibration');
        } else {
          throw new Error('MediaPipe initialization failed');
        }
      } catch (gazeError) {
        console.warn('Vision tracking unavailable, proceeding without gaze tracking:', gazeError);
        setVisionAvailable(false);
        setIsInitializing(false);
        // Skip calibration and go directly to reading
        setPhase('reading');
        setReadingStartTime(Date.now());
      }
    } catch (error) {
      console.error('Failed to start test:', error);
      setIsInitializing(false);
      alert('테스트 시작에 실패했습니다.');
    }
  };

  const sendBufferedGazeData = async () => {
    if (!sessionId || gazeBufferRef.current.length === 0) return;

    const buffer = [...gazeBufferRef.current];
    gazeBufferRef.current = [];

    for (const gazeData of buffer) {
      await perceptionAPI.saveGazeData(sessionId, gazeData);
    }
  };

  const handleCalibrationComplete = async (accuracy: number) => {
    if (!sessionId) return;

    try {
      // Save calibration
      await perceptionAPI.saveCalibration(sessionId, [], accuracy);

      // Re-register gaze listener for reading/questions phases
      if (gazeServiceRef.current) {
        gazeServiceRef.current.onGaze((prediction) => {
          if (prediction.confidence > 0.1) {
            setCurrentGaze({ x: prediction.x, y: prediction.y });
          }

          gazeBufferRef.current.push({
            phase: phaseRef.current === 'reading' ? 'reading' : 'questions',
            gaze_x: prediction.x,
            gaze_y: prediction.y,
            confidence: prediction.confidence,
            head_pitch: prediction.headPose?.pitch,
            head_yaw: prediction.headPose?.yaw,
            head_roll: prediction.headPose?.roll,
            timestamp: new Date()
          });

          if (gazeBufferRef.current.length >= 10) {
            sendBufferedGazeData();
          }
        });
      }

      // Move to reading phase
      setPhase('reading');
      setReadingStartTime(Date.now());
    } catch (error) {
      console.error('Failed to save calibration:', error);
    }
  };

  const handleCalibrationCancel = () => {
    gazeServiceRef.current?.stopTracking();
    gazeServiceRef.current = null;
    setVisionAvailable(false);
    setPhase('intro');
  };

  const handleReadingComplete = async () => {
    if (!sessionId) return;

    try {
      await sendBufferedGazeData();
      await perceptionAPI.completeReading(sessionId);

      setShowPassage(false);
      setTimeout(() => {
        setPhase('questions');
        setQuestionStartTime(Date.now());
      }, 1000);
    } catch (error) {
      console.error('Failed to complete reading:', error);
      alert('읽기 완료 처리에 실패했습니다.');
    }
  };

  const handleAnswerSelect = async (answer: string) => {
    if (!sessionId || !questions[currentQuestionIndex]) return;

    const question = questions[currentQuestionIndex];
    const responseTime = Date.now() - questionStartTime;

    try {
      await perceptionAPI.submitAnswer(
        sessionId,
        question.id,
        answer,
        responseTime
      );

      setAnswers(prev => ({ ...prev, [question.id]: answer }));

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setQuestionStartTime(Date.now());
      } else {
        await completeTest();
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('답변 제출에 실패했습니다.');
    }
  };

  const completeTest = async () => {
    if (!sessionId) return;

    try {
      await sendBufferedGazeData();
      const result = await perceptionAPI.completeSession(sessionId);
      setTestResult(result);

      // Stop gaze tracking
      gazeServiceRef.current?.stopTracking();
      gazeServiceRef.current = null;

      setPhase('results');
    } catch (error) {
      console.error('Failed to complete test:', error);
      alert('테스트 완료 처리에 실패했습니다.');
    }
  };

  const handleExit = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Introduction Phase */}
      {phase === 'intro' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-4">시지각 집중력 평가</h1>
            <p className="text-gray-600 mb-6">
              이 테스트는 시선추적 시스템을 사용하여 독서 패턴과 집중력을 정밀하게 측정합니다.
            </p>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-purple-900 mb-2">준비사항:</h3>
              <ul className="list-disc list-inside text-purple-800 space-y-1">
                <li>웹캠이 작동하는지 확인해주세요</li>
                <li>밝은 환경에서 테스트해주세요</li>
                <li>화면에서 약 50-70cm 떨어져 앉아주세요</li>
                <li>안정적인 자세를 유지해주세요</li>
              </ul>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-indigo-900 mb-2">테스트 진행:</h3>
              <ol className="list-decimal list-inside text-indigo-800 space-y-1">
                <li>9-point 캘리브레이션 (약 2분)</li>
                <li>지문 읽기 (시선 추적)</li>
                <li>이해도 문제 풀이 (4문제)</li>
                <li>결과 확인</li>
              </ol>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleStart}
                disabled={isInitializing}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold shadow-md transition-colors ${
                  isInitializing
                    ? 'bg-purple-400 text-white cursor-wait'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {isInitializing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    카메라 초기화 중...
                  </span>
                ) : (
                  '시작하기'
                )}
              </button>
              <button
                onClick={handleExit}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calibration Phase */}
      {phase === 'calibration' && sessionId && gazeServiceRef.current && (
        <VisionCalibration
          gazeService={gazeServiceRef.current}
          sessionId={sessionId}
          onCalibrationComplete={handleCalibrationComplete}
          onCancel={handleCalibrationCancel}
        />
      )}

      {/* Reading Phase */}
      {phase === 'reading' && (
        <div className="fixed inset-0 bg-white">
          {/* Gaze visualization */}
          {currentGaze && visionAvailable && (
            <div
              className="fixed w-3 h-3 bg-red-500 rounded-full pointer-events-none transition-all duration-100 opacity-50"
              style={{
                left: `${currentGaze.x}px`,
                top: `${currentGaze.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )}

          {/* Passage content */}
          <div
            className={`flex flex-col items-center justify-center min-h-screen p-8 transition-opacity duration-1000 ${
              showPassage ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="max-w-3xl w-full">
              <h1 className="text-2xl font-bold mb-6 text-center">{passageTitle}</h1>

              <div className="bg-white border-2 border-gray-300 rounded-lg p-10 mb-6 shadow-lg">
                <p className="text-2xl leading-[2.5] whitespace-pre-line tracking-wide">
                  {passageContent}
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleReadingComplete}
                  className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-md"
                >
                  읽기 완료 (다음)
                </button>
              </div>

              <div className="mt-4 text-center text-sm text-gray-500">
                {visionAvailable
                  ? '빨간 점이 당신의 시선 위치를 나타냅니다. 자연스럽게 읽어주세요.'
                  : '지문을 자연스럽게 읽은 후 "읽기 완료" 버튼을 눌러주세요.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Questions Phase */}
      {phase === 'questions' && questions.length > 0 && (
        <div className="fixed inset-0 bg-white">
          {/* Gaze visualization */}
          {currentGaze && visionAvailable && (
            <div
              className="fixed w-3 h-3 bg-blue-500 rounded-full pointer-events-none transition-all duration-100 opacity-50"
              style={{
                left: `${currentGaze.x}px`,
                top: `${currentGaze.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )}

          {/* Question content */}
          <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <div className="max-w-3xl w-full">
              <div className="mb-6 text-center">
                <span className="text-sm text-gray-500">
                  문제 {currentQuestionIndex + 1} / {questions.length}
                </span>
              </div>

              <div className="bg-white border-2 border-gray-300 rounded-lg p-8 mb-6 shadow-lg">
                <h2 className="text-xl font-bold mb-6">
                  {questions[currentQuestionIndex].question_text}
                </h2>

                <div className="space-y-4">
                  {questions[currentQuestionIndex].options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleAnswerSelect(option.id)}
                      className="w-full text-left px-6 py-4 border-2 border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
                    >
                      <span className="font-semibold mr-3">{option.id}.</span>
                      {option.text}
                    </button>
                  ))}
                </div>
              </div>

              {visionAvailable && (
                <div className="text-center text-sm text-gray-500">
                  파란 점이 당신의 시선 위치를 나타냅니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Phase */}
      {phase === 'results' && testResult && (
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <h1 className="text-3xl font-bold mb-2">테스트 완료!</h1>
              <p className="text-gray-600 mb-6">
                시지각 집중력 평가가 성공적으로 완료되었습니다.
              </p>

              {/* Overall Scores */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center shadow-sm">
                  <div className="text-sm text-purple-600 mb-2">종합 등급</div>
                  <div className="text-4xl font-bold text-purple-900">
                    {testResult.overall_grade}
                  </div>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 text-center shadow-sm">
                  <div className="text-sm text-indigo-600 mb-2">이해도 점수</div>
                  <div className="text-4xl font-bold text-indigo-900">
                    {testResult.comprehension_score}
                  </div>
                </div>
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-6 text-center shadow-sm">
                  <div className="text-sm text-violet-600 mb-2">집중력 점수</div>
                  <div className="text-4xl font-bold text-violet-900">
                    {testResult.concentration_score}
                  </div>
                </div>
              </div>

              {/* Concentration Metrics */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">집중력 분석 (10가지 지표)</h2>
                <div className="space-y-3">
                  {Object.entries(testResult.concentration_metrics).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-4">
                      <div className="w-48 text-sm font-medium text-gray-700">
                        {getMetricName(key)}
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-6 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${value}%` }}
                        >
                          <span className="text-xs text-white font-semibold">
                            {value.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {testResult.strengths.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="font-semibold text-green-900 mb-3">강점</h3>
                    <ul className="space-y-2">
                      {testResult.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-green-800">
                          &bull; {strength.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {testResult.improvements.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                    <h3 className="font-semibold text-orange-900 mb-3">개선 필요</h3>
                    <ul className="space-y-2">
                      {testResult.improvements.map((improvement, index) => (
                        <li key={index} className="text-sm text-orange-800">
                          &bull; {improvement.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              {testResult.recommendations.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-purple-900 mb-3">학습 권장사항</h3>
                  <ul className="space-y-2">
                    {testResult.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-purple-800">
                        {index + 1}. {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={handleExit}
                  className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-md"
                >
                  대시보드로 돌아가기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Preview PiP during reading & questions */}
      {(phase === 'reading' || phase === 'questions') && visionAvailable && gazeServiceRef.current && (
        <CameraPreview
          gazeService={gazeServiceRef.current}
          visible={true}
          position="top-right"
          showIris={true}
          showEyeContours={true}
          width={240}
        />
      )}
    </div>
  );
};

function getMetricName(key: string): string {
  const names: { [key: string]: string } = {
    fixation_stability: '시선 고정 안정성',
    reading_pattern_regularity: '읽기 패턴 규칙성',
    regression_frequency: '역행 빈도',
    focus_retention_rate: '화면 집중 유지율',
    reading_speed_consistency: '읽기 속도 일관성',
    blink_frequency_score: '눈 깜빡임 빈도',
    fixation_duration_score: '고정 시간 분포',
    vertical_drift_score: '수직 이탈 빈도',
    horizontal_regression_score: '수평 역행 패턴',
    sustained_attention_score: '주의력 지속 시간'
  };
  return names[key] || key;
}

export default VisualPerceptionTest;
