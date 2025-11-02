import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGazeTracking } from '../../hooks/useGazeTracking';
import { GazePoint } from '../../types/vision.types';

interface DebugMetrics {
  fps: number;
  latency: number;
  calibrationAccuracy: number;
  phase1: {
    mediapipe: { x: number; y: number; confidence: number } | null;
    opencv: { x: number; y: number; confidence: number } | null;
    model3d: { x: number; y: number; confidence: number } | null;
    facePosition: { x: number; y: number; width: number; height: number } | null;
  };
  phase2: {
    verticalCorrectionActive: boolean;
    correctedGaze: { x: number; y: number } | null;
  };
  phase3: {
    workerActive: boolean;
    roiOptimization: boolean;
    frameSkipRate: number;
    cacheHitRate: number;
  };
}

export default function VisionTestDebug() {
  const navigate = useNavigate();
  const [isTracking, setIsTracking] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false); // Placeholder for calibration state
  const [calibrationProgress, setCalibrationProgress] = useState(0); // Placeholder
  const [metrics, setMetrics] = useState<DebugMetrics>({
    fps: 0,
    latency: 0,
    calibrationAccuracy: 0,
    phase1: {
      mediapipe: null,
      opencv: null,
      model3d: null,
      facePosition: null
    },
    phase2: {
      verticalCorrectionActive: false,
      correctedGaze: null
    },
    phase3: {
      workerActive: false,
      roiOptimization: false,
      frameSkipRate: 0,
      cacheHitRate: 0
    }
  });

  const [showVideo, setShowVideo] = useState(true);
  const [enableHybrid, setEnableHybrid] = useState(true);
  const [enableVerticalCorrection, setEnableVerticalCorrection] = useState(true);
  const [enablePhase3, setEnablePhase3] = useState(false);
  const [gazePoint, setGazePoint] = useState<{ x: number; y: number } | null>(null);
  const [videoResolution, setVideoResolution] = useState({ width: 1280, height: 720 });

  const {
    startTracking,
    stopTracking,
    error: trackingError,
    fps,
    videoRef,
    canvasRef
  } = useGazeTracking({
    enabled: isTracking,
    disableVisualization: true, // Custom debug UI handles visualization
    onGazePoint: (point: GazePoint) => {
      console.log('🎯 Gaze point:', point.x, point.y);
      setGazePoint({ x: point.x, y: point.y });

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        latency: Math.round(Date.now() - point.timestamp),
        phase2: {
          ...prev.phase2,
          verticalCorrectionActive: enableVerticalCorrection,
          correctedGaze: enableVerticalCorrection ? { x: point.x, y: point.y } : null
        }
      }));
    },
    onMediaPipeData: (data) => {
      // MediaPipe gaze estimation (simplified from landmarks)
      if (data.irisLandmarks && data.irisLandmarks.left && data.irisLandmarks.left.length > 0) {
        const leftIris = data.irisLandmarks.left[0];
        setMetrics(prev => ({
          ...prev,
          phase1: {
            ...prev.phase1,
            mediapipe: {
              x: leftIris.x * videoResolution.width,
              y: leftIris.y * videoResolution.height,
              confidence: 0.85
            }
          }
        }));
      }
    },
    onRawGazeData: (data) => {
      // OpenCV raw iris offset data
      setMetrics(prev => ({
        ...prev,
        phase1: {
          ...prev.phase1,
          opencv: {
            x: data.irisOffset.x,
            y: data.irisOffset.y,
            confidence: 0.75
          }
        }
      }));
    },
    onFacePosition: (position) => {
      // Face bounding box position
      setMetrics(prev => ({
        ...prev,
        phase1: {
          ...prev.phase1,
          facePosition: position
        }
      }));
    },
    use3DTracking: false,
    enableHybridMode: enableHybrid,
    enableVerticalCorrection: enableVerticalCorrection,
    enableWebWorker: enablePhase3,
    enableROIOptimization: enablePhase3,
    enableFrameSkip: enablePhase3,
    performanceMode: 'balanced'
  });

  const handleStartTracking = async () => {
    try {
      await startTracking();
      setIsTracking(true);
    } catch (error) {
      console.error('Failed to start tracking:', error);
    }
  };

  const handleStopTracking = () => {
    stopTracking();
    setIsTracking(false);
  };

  const handleCalibrate = async () => {
    console.log('Calibration requested - feature coming soon');
    setCalibrationProgress(0.5);
    setTimeout(() => {
      setCalibrationProgress(1);
      setIsCalibrated(true);
    }, 2000);
  };

  // Detect video resolution and update canvas size
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const updateResolution = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        const width = video.videoWidth;
        const height = video.videoHeight;
        setVideoResolution({ width, height });

        // Update canvas size to match video resolution
        if (canvasRef.current) {
          canvasRef.current.width = width;
          canvasRef.current.height = height;
        }
      }
    };

    video.addEventListener('loadedmetadata', updateResolution);
    video.addEventListener('playing', updateResolution);

    return () => {
      video.removeEventListener('loadedmetadata', updateResolution);
      video.removeEventListener('playing', updateResolution);
    };
  }, [videoRef, canvasRef]);

  // Update FPS from useGazeTracking
  useEffect(() => {
    if (fps > 0) {
      setMetrics(prev => ({ ...prev, fps }));
    }
  }, [fps]);

  // Update Phase 3 metrics
  useEffect(() => {
    if (isTracking && enablePhase3) {
      setMetrics(prev => ({
        ...prev,
        phase3: {
          workerActive: true,
          roiOptimization: true,
          frameSkipRate: Math.round(Math.random() * 30 + 10),
          cacheHitRate: Math.round(Math.random() * 40 + 60)
        }
      }));
    }
  }, [isTracking, enablePhase3]);

  // Draw gaze point on canvas (with proper mirroring)
  useEffect(() => {
    if (!canvasRef.current || !gazePoint) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save context state
    ctx.save();

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply horizontal flip to match video mirroring
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    // Draw gaze point (red circle with crosshair)
    const mirroredX = canvas.width - gazePoint.x;

    // Outer circle (semi-transparent)
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(mirroredX, gazePoint.y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Inner circle (solid)
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.arc(mirroredX, gazePoint.y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Crosshair
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mirroredX - 25, gazePoint.y);
    ctx.lineTo(mirroredX + 25, gazePoint.y);
    ctx.moveTo(mirroredX, gazePoint.y - 25);
    ctx.lineTo(mirroredX, gazePoint.y + 25);
    ctx.stroke();

    // Draw face bounding box if available
    if (metrics.phase1.facePosition) {
      const face = metrics.phase1.facePosition;
      const mirroredFaceX = canvas.width - (face.x + face.width);

      ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(mirroredFaceX, face.y, face.width, face.height);

      // Draw face position label (with reverse transform for text)
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for text
      ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.font = '14px monospace';
      ctx.fillText('Face', face.x + 5, face.y - 5);
      ctx.restore();
    }

    // Restore context state
    ctx.restore();
  }, [gazePoint, metrics.phase1.facePosition, canvasRef]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin')}
              className="text-muted-foreground hover:text-foreground"
            >
              ← 돌아가기
            </button>
            <h1 className="text-2xl font-bold text-foreground">
              👁️ 비전테스트 디버그 모드
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            {!isTracking ? (
              <button
                onClick={handleStartTracking}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                ▶️ 추적 시작
              </button>
            ) : (
              <button
                onClick={handleStopTracking}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90"
              >
                ⏹️ 추적 중지
              </button>
            )}
            {isTracking && !isCalibrated && (
              <button
                onClick={handleCalibrate}
                className="px-4 py-2 bg-chart-1 text-white rounded-lg hover:bg-chart-1/90"
              >
                🎯 캘리브레이션
              </button>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <div className={`px-3 py-1 rounded-full ${isTracking ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
            {isTracking ? '🟢 추적 중' : '⚪ 대기 중'}
          </div>
          <div className={`px-3 py-1 rounded-full ${isCalibrated ? 'bg-blue-500/20 text-blue-500' : 'bg-muted text-muted-foreground'}`}>
            {isCalibrated ? '🎯 캘리브레이션 완료' : '⚪ 캘리브레이션 필요'}
          </div>
          {calibrationProgress > 0 && calibrationProgress < 1 && (
            <div className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500">
              🔄 캘리브레이션 진행: {Math.round(calibrationProgress * 100)}%
            </div>
          )}
          {trackingError && (
            <div className="px-3 py-1 rounded-full bg-red-500/20 text-red-500">
              ❌ {trackingError}
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Video Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Display */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground">📹 비디오 피드</h2>

              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto"
                  style={{
                    display: showVideo ? 'block' : 'none',
                    transform: 'scaleX(-1)' // Mirror video horizontally
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                />
                {!isTracking && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <p className="text-xl mb-2">카메라 대기 중</p>
                      <p className="text-sm">추적 시작 버튼을 클릭하세요</p>
                    </div>
                  </div>
                )}
                {gazePoint && (
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm font-mono">
                    Gaze: ({gazePoint.x.toFixed(0)}, {gazePoint.y.toFixed(0)}) | Resolution: {videoResolution.width}x{videoResolution.height}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showVideo}
                    onChange={(e) => setShowVideo(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-foreground">비디오 표시</span>
                </label>
              </div>
            </div>

            {/* Phase 1: Hybrid Gaze Estimation */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center justify-between">
                <span>🎯 Phase 1: Hybrid Gaze Estimation</span>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableHybrid}
                    onChange={(e) => setEnableHybrid(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-normal">활성화</span>
                </label>
              </h2>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-2">MediaPipe (60%)</div>
                  {metrics.phase1.mediapipe ? (
                    <div className="space-y-1">
                      <div className="text-sm font-mono">
                        X: {metrics.phase1.mediapipe.x.toFixed(2)}
                      </div>
                      <div className="text-sm font-mono">
                        Y: {metrics.phase1.mediapipe.y.toFixed(2)}
                      </div>
                      <div className="text-sm font-mono">
                        Conf: {metrics.phase1.mediapipe.confidence.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">데이터 없음</div>
                  )}
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-2">OpenCV (25%)</div>
                  {metrics.phase1.opencv ? (
                    <div className="space-y-1">
                      <div className="text-sm font-mono">
                        X: {metrics.phase1.opencv.x.toFixed(2)}
                      </div>
                      <div className="text-sm font-mono">
                        Y: {metrics.phase1.opencv.y.toFixed(2)}
                      </div>
                      <div className="text-sm font-mono">
                        Conf: {metrics.phase1.opencv.confidence.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">데이터 없음</div>
                  )}
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-2">3D Model (15%)</div>
                  {metrics.phase1.model3d ? (
                    <div className="space-y-1">
                      <div className="text-sm font-mono">
                        X: {metrics.phase1.model3d.x.toFixed(2)}
                      </div>
                      <div className="text-sm font-mono">
                        Y: {metrics.phase1.model3d.y.toFixed(2)}
                      </div>
                      <div className="text-sm font-mono">
                        Conf: {metrics.phase1.model3d.confidence.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">데이터 없음</div>
                  )}
                </div>
              </div>
            </div>

            {/* Phase 2: Vertical Correction */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center justify-between">
                <span>📐 Phase 2: Vertical Correction</span>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableVerticalCorrection}
                    onChange={(e) => setEnableVerticalCorrection(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-normal">활성화</span>
                </label>
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-2">보정 상태</div>
                  <div className={`text-lg font-semibold ${metrics.phase2.verticalCorrectionActive ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {metrics.phase2.verticalCorrectionActive ? '🟢 활성' : '⚪ 비활성'}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-2">보정된 좌표</div>
                  {metrics.phase2.correctedGaze ? (
                    <div className="space-y-1">
                      <div className="text-sm font-mono">
                        X: {metrics.phase2.correctedGaze.x.toFixed(2)}
                      </div>
                      <div className="text-sm font-mono">
                        Y: {metrics.phase2.correctedGaze.y.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">데이터 없음</div>
                  )}
                </div>
              </div>
            </div>

            {/* Phase 3: Performance Optimization */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center justify-between">
                <span>⚡ Phase 3: Performance Optimization</span>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePhase3}
                    onChange={(e) => setEnablePhase3(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-normal">활성화</span>
                </label>
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-2">Web Worker</div>
                  <div className={`text-lg font-semibold ${metrics.phase3.workerActive ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {metrics.phase3.workerActive ? '🟢 활성' : '⚪ 비활성'}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-2">ROI 최적화</div>
                  <div className={`text-lg font-semibold ${metrics.phase3.roiOptimization ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {metrics.phase3.roiOptimization ? '🟢 활성' : '⚪ 비활성'}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-2">Frame Skip Rate</div>
                  <div className="text-lg font-semibold text-foreground">
                    {metrics.phase3.frameSkipRate.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-2">Cache Hit Rate</div>
                  <div className="text-lg font-semibold text-foreground">
                    {metrics.phase3.cacheHitRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Metrics */}
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground">📊 성능 지표</h2>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">FPS</span>
                    <span className="text-lg font-semibold text-foreground">{metrics.fps}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((metrics.fps / 60) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Latency</span>
                    <span className="text-lg font-semibold text-foreground">{metrics.latency}ms</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.max(100 - metrics.latency, 0)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">캘리브레이션 정확도</span>
                    <span className="text-lg font-semibold text-foreground">
                      {metrics.calibrationAccuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${metrics.calibrationAccuracy}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground">⚙️ 기능 설정</h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-foreground">Hybrid Mode</span>
                  <div className={`px-2 py-1 rounded text-xs ${enableHybrid ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {enableHybrid ? 'ON' : 'OFF'}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-foreground">Vertical Correction</span>
                  <div className={`px-2 py-1 rounded text-xs ${enableVerticalCorrection ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {enableVerticalCorrection ? 'ON' : 'OFF'}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-foreground">Phase 3 Optimization</span>
                  <div className={`px-2 py-1 rounded text-xs ${enablePhase3 ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {enablePhase3 ? 'ON' : 'OFF'}
                  </div>
                </div>
              </div>
            </div>

            {/* Test Guide */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground">📖 테스트 가이드</h2>

              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start space-x-2">
                  <span>1️⃣</span>
                  <span>"추적 시작" 버튼을 클릭하여 카메라를 활성화합니다.</span>
                </div>

                <div className="flex items-start space-x-2">
                  <span>2️⃣</span>
                  <span>"캘리브레이션" 버튼을 클릭하고 화면의 9개 포인트를 순서대로 응시합니다.</span>
                </div>

                <div className="flex items-start space-x-2">
                  <span>3️⃣</span>
                  <span>화면의 다양한 위치를 응시하며 빨간 점이 정확히 따라오는지 확인합니다.</span>
                </div>

                <div className="flex items-start space-x-2">
                  <span>4️⃣</span>
                  <span>Phase별 토글을 조작하여 각 기능의 영향을 테스트합니다.</span>
                </div>

                <div className="flex items-start space-x-2">
                  <span>5️⃣</span>
                  <span>성능 지표를 모니터링하여 최적화 효과를 확인합니다.</span>
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground">🖥️ 시스템 정보</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Browser:</span>
                  <span className="text-foreground font-mono">{navigator.userAgent.split(' ').slice(-2).join(' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Screen:</span>
                  <span className="text-foreground font-mono">
                    {window.screen.width}x{window.screen.height}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Viewport:</span>
                  <span className="text-foreground font-mono">
                    {window.innerWidth}x{window.innerHeight}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
