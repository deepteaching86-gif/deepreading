// Vision TEST Page - Main testing interface with real-time gaze tracking
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';
import { CalibrationScreenSimple } from '../../components/vision/CalibrationScreenSimple';
import { ConcentrationMonitor, ConcentrationAlertModal } from '../../components/vision/ConcentrationMonitor';
import { DebugCameraOverlay } from '../../components/vision/DebugCameraOverlay';
import { useGazeTracking } from '../../hooks/useGazeTracking';
import {
  startVisionSession,
  saveGazeData,
  submitVisionSession,
  getActiveCalibration
} from '../../services/vision.service';
import {
  VisionTestState,
  CalibrationResult,
  GazePoint,
  GazeChunk,
  VisionPassage
} from '../../types/vision.types';
import { CalibrationProfile, Point } from '../../types/calibration';
import {
  recordUserClick
} from '../../utils/calibrationUtils';
import { ConcentrationRawData, ConcentrationScore, ConcentrationAlert } from '../../types/concentration.types';
import { concentrationAnalyzer } from '../../utils/concentrationAnalysis';
import { concentrationSessionManager } from '../../services/concentrationService';

export const VisionTestPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [state, setState] = useState<VisionTestState>({
    stage: 'calibration',
    currentPassageIndex: 0,
    gazeTracking: false
  });

  const [visionSessionId, setVisionSessionId] = useState<string>('');
  const [calibrationResult, setCalibrationResult] = useState<CalibrationResult | null>(null);
  const [calibrationProfile, setCalibrationProfile] = useState<CalibrationProfile | null>(null);
  const [passages, setPassages] = useState<VisionPassage[]>([]);
  const [currentPassage, setCurrentPassage] = useState<VisionPassage | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [questions, setQuestions] = useState<any[]>([]); // Questions for current passage
  const [currentQuestion, setCurrentQuestion] = useState<any | null>(null);

  // Raw gaze data for adaptive learning
  const [currentRawGaze, setCurrentRawGaze] = useState<{
    irisOffset: Point;
    headPose: { yaw: number; pitch: number };
  } | null>(null);

  // 집중력 모니터링 state
  const [currentConcentrationScore, setCurrentConcentrationScore] = useState<ConcentrationScore | null>(null);
  const [concentrationAlerts, setConcentrationAlerts] = useState<ConcentrationAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<ConcentrationAlert | null>(null);
  const [showConcentrationMonitor, setShowConcentrationMonitor] = useState(true); // 집중력 모니터 표시 여부
  const lastConcentrationUpdateRef = useRef<number>(Date.now());
  const CONCENTRATION_UPDATE_INTERVAL = 1000; // 1초 단위 업데이트

  // Gaze data buffer
  const gazeBufferRef = useRef<GazePoint[]>([]);
  const lastSaveTimeRef = useRef<number>(Date.now());
  const CHUNK_INTERVAL = 5000; // 5 seconds
  const MAX_CHUNK_SIZE = 1000; // 1000 points

  // Get user ID from auth store
  const getUserId = (): string => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (!authStorage) return '';

      const parsed = JSON.parse(authStorage);
      return parsed.state?.user?.id || '';
    } catch (error) {
      console.error('Failed to get user ID:', error);
      return '';
    }
  };

  const userId = getUserId();

  // Gaze tracking hook
  const {
    isTracking,
    currentGaze,
    fps,
    videoRef,
    canvasRef,
    startTracking,
    stopTracking
  } = useGazeTracking({
    enabled: state.stage === 'testing',
    onGazePoint: handleGazePoint,
    onRawGazeData: useCallback((data: {
      irisOffset: { x: number; y: number };
      headPose: { yaw: number; pitch: number };
      timestamp: number;
    }) => {
      setCurrentRawGaze({
        irisOffset: data.irisOffset,
        headPose: data.headPose
      });
    }, []),
    onConcentrationData: useCallback((rawData: ConcentrationRawData) => {
      // 실시간으로 집중력 분석기에 데이터 전달
      const score = concentrationAnalyzer.analyze(rawData);

      // 1초마다 집중력 점수 업데이트
      const now = Date.now();
      if (now - lastConcentrationUpdateRef.current >= CONCENTRATION_UPDATE_INTERVAL) {
        setCurrentConcentrationScore(score);
        lastConcentrationUpdateRef.current = now;

        // 세션 매니저에 점수 추가
        concentrationSessionManager.addScore(score);

        // 새 알림 확인
        const currentSession = concentrationSessionManager.getCurrentSession();
        if (currentSession && currentSession.alerts.length > concentrationAlerts.length) {
          const newAlerts = currentSession.alerts.slice(concentrationAlerts.length);
          setConcentrationAlerts(currentSession.alerts);

          // 첫 번째 새 알림 자동 표시
          if (newAlerts.length > 0) {
            setSelectedAlert(newAlerts[0]);
          }
        }
      }
    }, [concentrationAlerts.length]),
    calibrationMatrix: calibrationResult?.transformMatrix,
    targetFPS: 30
  });

  // Handle gaze point from tracking
  function handleGazePoint(point: GazePoint) {
    gazeBufferRef.current.push(point);

    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTimeRef.current;

    // Save chunk if 5 seconds elapsed or buffer reached 1000 points
    if (timeSinceLastSave >= CHUNK_INTERVAL || gazeBufferRef.current.length >= MAX_CHUNK_SIZE) {
      saveGazeChunk();
    }
  }

  // Save gaze data chunk to backend
  const saveGazeChunk = useCallback(async () => {
    if (gazeBufferRef.current.length === 0 || !visionSessionId || !currentPassage) {
      return;
    }

    const chunk: GazeChunk = {
      passageId: currentPassage.id,
      gazePoints: [...gazeBufferRef.current],
      startTime: new Date(gazeBufferRef.current[0].timestamp),
      endTime: new Date(gazeBufferRef.current[gazeBufferRef.current.length - 1].timestamp),
      totalPoints: gazeBufferRef.current.length
    };

    try {
      await saveGazeData({
        visionSessionId,
        gazeChunk: chunk
      });

      console.log(`✅ Saved gaze chunk: ${chunk.totalPoints} points`);

      // Clear buffer
      gazeBufferRef.current = [];
      lastSaveTimeRef.current = Date.now();
    } catch (error) {
      console.error('Failed to save gaze chunk:', error);
    }
  }, [visionSessionId, currentPassage]);

  // Check for existing calibration on mount
  useEffect(() => {
    const checkCalibration = async () => {
      try {
        const response = await getActiveCalibration(userId);
        if (response.found && response.calibration) {
          // Skip calibration if valid calibration exists
          const result: CalibrationResult = {
            calibrationId: response.calibration.calibrationId,
            overallAccuracy: response.calibration.overallAccuracy,
            points: [],
            transformMatrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], // Identity matrix as fallback
            deviceInfo: {
              userAgent: navigator.userAgent,
              screenWidth: window.screen.width,
              screenHeight: window.screen.height,
              devicePixelRatio: window.devicePixelRatio,
              platform: navigator.platform
            },
            expiresAt: new Date(response.calibration.expiresAt)
          };

          setCalibrationResult(result);
          await handleStartVisionSession(result);
        }
      } catch (error) {
        console.log('No active calibration found, starting new calibration');
      }
    };

    if (userId && sessionId) {
      checkCalibration();
    }
  }, [userId, sessionId]);

  // Handle calibration complete
  const handleCalibrationComplete = async (result: CalibrationResult) => {
    setCalibrationResult(result);
    await handleStartVisionSession(result);
  };

  // Start vision session with backend
  const handleStartVisionSession = async (calibration: CalibrationResult) => {
    if (!sessionId) return;

    try {
      const response = await startVisionSession({
        sessionId,
        calibrationId: calibration.calibrationId
      });

      setVisionSessionId(response.visionSessionId);
      setPassages(response.passages);
      setCurrentPassage(response.passages[0]);

      // Load questions from backend
      await loadQuestionsForSession(sessionId);

      setState({
        stage: 'testing',
        currentPassageIndex: 0,
        gazeTracking: true
      });

      // Start gaze tracking
      await startTracking();

      // Start concentration monitoring session
      concentrationSessionManager.startSession(response.visionSessionId);
      console.log('🎯 Concentration monitoring started');

      console.log('✅ Vision session started:', response.visionSessionId);
    } catch (error: any) {
      console.error('❌ Failed to start vision session:', error);
      console.error('❌ Backend error message:', error.response?.data?.message);
      console.error('❌ Backend error details:', JSON.stringify(error.response?.data, null, 2));
      console.error('❌ HTTP status:', error.response?.status);
      console.error('❌ Request data:', {
        sessionId,
        calibrationId: calibration.calibrationId
      });
      setState(prev => ({
        ...prev,
        error: `Vision 세션 시작 실패: ${error.response?.data?.message || error.message}`
      }));
    }
  };

  // Load questions for test session
  const loadQuestionsForSession = async (sessionId: string) => {
    try {
      // Get session data with template and questions
      const response = await axios.get(`/api/v1/sessions/${sessionId}`);
      const session = response.data.data;

      if (session.template && session.template.questions) {
        setQuestions(session.template.questions);

        // Set first question for first passage
        if (session.template.questions.length > 0) {
          setCurrentQuestion(session.template.questions[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
      setState(prev => ({ ...prev, error: '문제 불러오기 실패' }));
    }
  };

  // Handle passage reading complete
  const handlePassageComplete = useCallback(async () => {
    // Save any remaining gaze data
    await saveGazeChunk();

    // Show questions or move to next passage
    if (currentPassage?.showPassageWithQuestions) {
      // Questions shown with passage - move to next
      handleNextPassage();
    } else {
      // Show questions only (memory test)
      setShowQuestions(true);
      stopTracking(); // Stop tracking during questions
    }
  }, [currentPassage, saveGazeChunk, stopTracking]);

  // Handle next passage
  const handleNextPassage = useCallback(async () => {
    const nextIndex = state.currentPassageIndex + 1;

    if (nextIndex >= passages.length) {
      // All passages complete - submit
      await handleSubmit();
    } else {
      // Move to next passage
      setState(prev => ({ ...prev, currentPassageIndex: nextIndex }));
      setCurrentPassage(passages[nextIndex]);
      setShowQuestions(false);

      // Move to next question (assuming 1 question per passage)
      const nextQuestionIndex = nextIndex;
      if (nextQuestionIndex < questions.length) {
        setCurrentQuestion(questions[nextQuestionIndex]);
      }

      // Restart tracking for next passage
      if (!isTracking) {
        await startTracking();
      }
    }
  }, [state.currentPassageIndex, passages, questions, isTracking, startTracking]);

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  // Submit answer to backend
  const submitAnswer = async (questionId: string, answer: string) => {
    try {
      await axios.post('/api/v1/sessions/submit-answer', {
        sessionId,
        questionId,
        studentAnswer: answer
      });
      console.log('✅ Answer submitted:', questionId);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  // Handle user click for adaptive learning
  const handleUserClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!calibrationProfile || !currentGaze || !currentRawGaze) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickPosition: Point = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height
    };

    console.log('👆 User click detected:', {
      click: clickPosition,
      gaze: currentGaze,
      error: {
        x: clickPosition.x - currentGaze.x,
        y: clickPosition.y - currentGaze.y
      }
    });

    // Record click for adaptive learning
    const updatedProfile = recordUserClick(
      clickPosition,
      { x: currentGaze.x, y: currentGaze.y },
      currentRawGaze,
      calibrationProfile
    );

    setCalibrationProfile(updatedProfile);
  }, [calibrationProfile, currentGaze, currentRawGaze]);

  // Handle test submit
  const handleSubmit = async () => {
    try {
      // Save final gaze data
      await saveGazeChunk();

      // End concentration session and generate report
      const concentrationSession = concentrationSessionManager.endSession();
      if (concentrationSession) {
        console.log('📊 Concentration session ended:', {
          duration: concentrationSession.endTime! - concentrationSession.startTime,
          averageScore: concentrationSession.averageScore,
          alertsCount: concentrationSession.alerts.length
        });
      }

      // Submit vision session
      await submitVisionSession({
        visionSessionId
      });

      // Stop tracking
      stopTracking();

      console.log('✅ Vision test submitted');

      // Navigate to results page
      navigate(`/student/vision/result/${sessionId}`);
    } catch (error) {
      console.error('Failed to submit vision test:', error);
      setState(prev => ({ ...prev, error: '테스트 제출 실패' }));
    }
  };

  // Render calibration stage
  if (state.stage === 'calibration' && !calibrationResult) {
    return (
      <CalibrationScreenSimple
        userId={userId}
        onCalibrationComplete={() => {
          // Simple calibration doesn't need profile - just start the session
          const result: CalibrationResult = {
            calibrationId: userId + '-' + Date.now(),
            overallAccuracy: 1.0, // Adaptive system handles accuracy
            points: [],
            transformMatrix: [
              [1, 0, 0],
              [0, 1, 0],
              [0, 0, 1]
            ], // Identity matrix - no calibration needed
            deviceInfo: {
              userAgent: navigator.userAgent,
              screenWidth: window.screen.width,
              screenHeight: window.screen.height,
              devicePixelRatio: window.devicePixelRatio,
              platform: navigator.platform
            },
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          };
          handleCalibrationComplete(result);
        }}
        onCancel={() => navigate('/student/dashboard')}
      />
    );
  }

  // Render testing stage
  if (state.stage === 'testing' && currentPassage) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hidden video for gaze tracking */}
        <video
          ref={videoRef}
          className="hidden"
          autoPlay
          playsInline
        />

        {/* Status bar */}
        <div className="fixed top-0 left-0 right-0 bg-card/95 backdrop-blur border-b border-border z-40">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                지문 {state.currentPassageIndex + 1} / {passages.length}
              </span>
              <div className="h-4 w-px bg-border"></div>
              <span className={`text-xs ${isTracking ? 'text-green-500' : 'text-red-500'}`}>
                {isTracking ? '● 추적 중' : '○ 추적 안됨'}
              </span>
              <span className="text-xs text-muted-foreground">{fps} FPS</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                Vision TEST
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${((state.currentPassageIndex + 1) / passages.length) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="pt-20 pb-20 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Passage (always visible if showPassageWithQuestions is true) */}
            {(!showQuestions || currentPassage.showPassageWithQuestions) && (
              <div className="bg-card rounded-2xl p-8 shadow-lg mb-6" onClick={handleUserClick}>
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>읽기 지문</span>
                  <span className="px-2 py-0.5 bg-secondary rounded text-xs">
                    난이도 {currentPassage.difficulty}/10
                  </span>
                  {calibrationProfile && calibrationProfile.adaptiveLearning.totalClicks > 0 && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                      학습 중: {calibrationProfile.adaptiveLearning.totalClicks}회 클릭
                    </span>
                  )}
                </div>

                <div
                  className="text-foreground leading-relaxed whitespace-pre-wrap cursor-pointer"
                  style={{
                    fontSize: `${currentPassage.fontSize}px`,
                    lineHeight: currentPassage.lineHeight
                  }}
                >
                  {currentPassage.text}
                </div>

                {!showQuestions && (
                  <button
                    onClick={handlePassageComplete}
                    className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    다 읽었습니다
                  </button>
                )}
              </div>
            )}

            {/* Questions (shown after passage or alongside) */}
            {showQuestions && currentQuestion && (
              <div className="space-y-4">
                <div className="bg-card rounded-2xl p-8 shadow-lg">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    문제 {currentQuestion.questionNumber}
                  </h3>
                  <p className="text-foreground mb-4 whitespace-pre-wrap">
                    {currentQuestion.questionText}
                  </p>

                  {/* Multiple choice questions */}
                  {currentQuestion.questionType === 'choice' && currentQuestion.options && (
                    <div className="space-y-2">
                      {currentQuestion.options.map((option: any) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            handleAnswerSelect(currentQuestion.id, option.text);
                            submitAnswer(currentQuestion.id, option.text);
                          }}
                          className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                            answers[currentQuestion.id] === option.text
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <span className="text-foreground">{option.text}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Short answer questions */}
                  {currentQuestion.questionType === 'short_answer' && (
                    <input
                      type="text"
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                      onBlur={(e) => submitAnswer(currentQuestion.id, e.target.value)}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
                      placeholder="답변을 입력하세요"
                    />
                  )}

                  {/* Essay questions */}
                  {currentQuestion.questionType === 'essay' && (
                    <textarea
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                      onBlur={(e) => submitAnswer(currentQuestion.id, e.target.value)}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground min-h-[120px]"
                      placeholder="답변을 작성하세요"
                    />
                  )}
                </div>

                <button
                  onClick={handleNextPassage}
                  disabled={!answers[currentQuestion.id]}
                  className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {state.currentPassageIndex + 1 >= passages.length ? '테스트 제출' : '다음'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Gaze indicator (for debugging) */}
        {currentGaze && process.env.NODE_ENV === 'development' && (
          <div
            className="fixed w-4 h-4 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
            style={{
              left: `${currentGaze.x * 100}%`,
              top: `${currentGaze.y * 100}%`,
              opacity: currentGaze.confidence * 0.5
            }}
          />
        )}

        {/* Concentration Monitor Overlay - Bottom of Camera View */}
        {showConcentrationMonitor && currentConcentrationScore && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[500px]">
            <div className="bg-card/95 backdrop-blur-md rounded-xl shadow-2xl border border-border p-4">
              {/* Toggle button */}
              <button
                onClick={() => setShowConcentrationMonitor(false)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center hover:bg-accent transition-colors"
                title="집중력 모니터 숨기기"
              >
                <span className="text-xs">✕</span>
              </button>

              <ConcentrationMonitor
                currentScore={currentConcentrationScore}
                recentAlerts={concentrationAlerts}
                compact={false}
                onAlertClick={(alert) => setSelectedAlert(alert)}
              />
            </div>
          </div>
        )}

        {/* Show Concentration Monitor Button (when hidden) */}
        {!showConcentrationMonitor && (
          <button
            onClick={() => setShowConcentrationMonitor(true)}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2"
            title="집중력 모니터 표시"
          >
            <span className="text-sm">🎯</span>
            <span className="text-sm font-medium">집중력 모니터</span>
          </button>
        )}

        {/* Error message */}
        {state.error && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground px-6 py-3 rounded-lg shadow-lg z-50">
            {state.error}
          </div>
        )}

        {/* Concentration Alert Modal */}
        <ConcentrationAlertModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />

        {/* Debug Camera Overlay - Right Bottom */}
        <DebugCameraOverlay
          videoRef={videoRef}
          canvasRef={canvasRef}
          isTracking={isTracking}
        />
      </div>
    );
  }

  // Loading
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-4"></div>
        <p className="text-lg text-foreground">Vision TEST 준비 중...</p>
      </div>
    </div>
  );
};
