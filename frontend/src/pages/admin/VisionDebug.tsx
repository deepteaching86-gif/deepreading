import React, { useState, useEffect, useRef } from 'react';
import { VisionWebSocketClient, GazeData } from '../../services/visionWebSocket';

// Python Vision Backend URL (Render.com)
const BACKEND_URL = 'https://literacy-english-test-backend.onrender.com';

interface VisionSession {
  id: string;
  student_id: string;
  template_id: string;
  status: 'active' | 'completed' | 'failed';
  created_at: string;
  calibration_accuracy?: number;
  total_frames?: number;
}

interface LogEntry {
  timestamp: number;
  level: 'info' | 'warning' | 'error';
  message: string;
}

const VisionDebug: React.FC = () => {
  const [sessions, setSessions] = useState<VisionSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentGaze, setCurrentGaze] = useState<GazeData | null>(null);
  const [gazeHistory, setGazeHistory] = useState<GazeData[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [wsClient] = useState(() => new VisionWebSocketClient(BACKEND_URL));
  const [debugImage, setDebugImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const addLog = (level: 'info' | 'warning' | 'error', message: string) => {
    setLogs((prev) => [
      { timestamp: Date.now(), level, message },
      ...prev.slice(0, 99), // Keep last 100 logs
    ]);
  };

  useEffect(() => {
    loadSessions();
    return () => {
      wsClient.disconnect();
    };
  }, []);

  const loadSessions = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/vision/sessions`);
      const data = await response.json();
      setSessions(data.sessions || []);
      addLog('info', `Loaded ${data.sessions?.length || 0} sessions`);
    } catch (error) {
      addLog('error', `Failed to load sessions: ${error}`);
    }
  };

  const startDebugSession = async () => {
    try {
      addLog('info', '🚀 Starting Vision Debug session...');

      // Generate unique session ID for debug mode
      const sessionId = `debug-${Date.now()}`;
      setSelectedSession(sessionId);
      addLog('info', `📝 Session ID: ${sessionId}`);

      // Connect to WebSocket
      addLog('info', '🔌 Connecting to Vision WebSocket...');
      await wsClient.connect(sessionId);
      setIsConnected(true);
      addLog('info', '✅ WebSocket connected successfully');

      // Register gaze data callback
      wsClient.onGaze((data: GazeData) => {
        setCurrentGaze(data);
        setGazeHistory((prev) => [...prev.slice(-99), data]); // Keep last 100 points

        // Update debug image if available
        if (data.debugImage) {
          setDebugImage(data.debugImage);
        }
      });

      // Register error callback
      // ⚠️ WARNING: Do NOT call addLog for warnings - it triggers React re-render
      // which makes videoRef/canvasRef temporarily null, breaking frame capture!
      wsClient.onError((error: string) => {
        // Only add to log if it's a critical error (not a warning)
        if (!error.startsWith('Warning:')) {
          addLog('error', error);
        } else {
          // For warnings, just console.warn to avoid re-render
          console.warn('Vision tracking:', error);
        }
      });

      // Start camera with adaptive resolution
      addLog('info', '📸 Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Log detected camera resolution
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        addLog('info', `📹 Camera resolution: ${settings.width}x${settings.height} (adaptive)`);

        // Start frame capture loop
        addLog('info', '🎬 Starting frame capture at ~30 FPS');
        startFrameCapture();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog('error', `❌ Failed to start debug session: ${errorMessage}`);
      console.error('Vision Debug session error:', error);

      // User-friendly error messages
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        addLog('error', '🚫 Camera permission denied. Please allow camera access and try again.');
      } else if (errorMessage.includes('NotFoundError')) {
        addLog('error', '📷 No camera found. Please connect a webcam and try again.');
      }
    }
  };

  const startFrameCapture = () => {
    let retryCount = 0;
    const MAX_RETRIES = 900; // 30 seconds at 33ms intervals

    const captureFrame = () => {
      // Check if refs exist
      if (!videoRef.current || !canvasRef.current) {
        retryCount++;
        if (retryCount > MAX_RETRIES) {
          console.error('❌ Video/canvas refs not ready after 30 seconds - stopping capture');
          addLog('error', '❌ Camera stream lost - please restart debug session');
          return; // Stop the loop
        }
        console.log('⚠️ Video or canvas ref not ready, retrying...', retryCount);
        setTimeout(captureFrame, 33);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Check if video stream is active
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        const videoTrack = stream.getVideoTracks()[0];

        if (!videoTrack || videoTrack.readyState !== 'live') {
          retryCount++;
          if (retryCount > MAX_RETRIES) {
            console.error('❌ Camera stream ended - stopping capture');
            addLog('error', '❌ Camera stream disconnected - please restart');
            return; // Stop the loop
          }
          console.log('⚠️ Camera stream not live, retrying...', videoTrack?.readyState);
          setTimeout(captureFrame, 33);
          return;
        }
      }

      // Check if video is loaded and ready
      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        retryCount++;
        if (retryCount > MAX_RETRIES) {
          console.error('❌ Video not ready after 30 seconds - stopping capture');
          addLog('error', '❌ Video loading failed - please restart');
          return; // Stop the loop
        }
        console.log('⚠️ Video not ready, retrying...', {
          readyState: video.readyState,
          width: video.videoWidth,
          height: video.videoHeight
        });
        setTimeout(captureFrame, 33);
        return;
      }

      // Reset retry count on success
      retryCount = 0;

      // WebSocket check
      if (!wsClient.isConnected()) {
        console.log('⚠️ WebSocket not connected, skipping frame');
        setTimeout(captureFrame, 33);
        return;
      }

      // Capture and send frame
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        wsClient.sendFrame(
          imageData,
          window.innerWidth,
          window.innerHeight,
          video.videoWidth,
          video.videoHeight
        );
        console.log('📤 Frame sent to backend');
      }

      // ✅ PERFORMANCE: 33ms = ~30 FPS
      setTimeout(captureFrame, 33);
    };

    console.log('🎬 Starting frame capture loop at ~30 FPS');
    captureFrame();
  };

  const stopDebugSession = () => {
    wsClient.disconnect();
    setIsConnected(false);
    setCurrentGaze(null);
    setGazeHistory([]);
    addLog('info', 'Debug session stopped');

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const timeString = date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${timeString}.${ms}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Vision Tracking Debug Console</h1>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Debug Controls</h2>
              <p className="text-sm text-gray-500 mt-1">
                Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                {selectedSession && ` | Session: ${selectedSession}`}
              </p>
            </div>
            <div className="flex gap-3">
              {!isConnected ? (
                <button
                  onClick={startDebugSession}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Start Debug Session
                </button>
              ) : (
                <button
                  onClick={stopDebugSession}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Stop Session
                </button>
              )}
              <button
                onClick={loadSessions}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Refresh Sessions
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gaze Visualization */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Gaze Visualization</h2>
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '400px' }}>
              {/* Gaze point overlay */}
              {currentGaze && (
                <>
                  {/* Current gaze point */}
                  <div
                    className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg"
                    style={{
                      left: `${(currentGaze.x / window.innerWidth) * 100}%`,
                      top: `${(currentGaze.y / window.innerHeight) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      transition: 'left 0.1s, top 0.1s',
                    }}
                  />
                  {/* Gaze trail */}
                  {gazeHistory.slice(-20).map((point, idx) => (
                    <div
                      key={idx}
                      className="absolute w-2 h-2 bg-blue-400 rounded-full"
                      style={{
                        left: `${(point.x / window.innerWidth) * 100}%`,
                        top: `${(point.y / window.innerHeight) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        opacity: 0.3 + (idx / 20) * 0.7,
                      }}
                    />
                  ))}
                </>
              )}
              {!isConnected && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  Start a debug session to visualize gaze tracking
                </div>
              )}
            </div>

            {/* Gaze Data Display */}
            {currentGaze && (
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Gaze Position</p>
                  <p className="font-mono text-gray-800">
                    X: {currentGaze.x.toFixed(1)}px, Y: {currentGaze.y.toFixed(1)}px
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Confidence</p>
                  <p className="font-mono text-gray-800">{(currentGaze.confidence * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Head Pose</p>
                  <p className="font-mono text-gray-800">
                    {currentGaze.head_pose ? (
                      <>
                        P: {currentGaze.head_pose.pitch.toFixed(1)}°, Y: {currentGaze.head_pose.yaw.toFixed(1)}°, R:{' '}
                        {currentGaze.head_pose.roll.toFixed(1)}°
                      </>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Timestamp</p>
                  <p className="font-mono text-gray-800">{formatTimestamp(currentGaze.timestamp)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Video Feed with Debug Visualization */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Camera Feed - Debug Visualization</h2>
            <div className="bg-gray-900 rounded-lg overflow-hidden" style={{ height: '400px' }}>
              {debugImage ? (
                <img
                  src={debugImage}
                  className="w-full h-full object-contain"
                  alt="Debug visualization with face landmarks, pupils, and head pose"
                />
              ) : (
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                  muted
                />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
            {isConnected && (
              <div className="mt-4 text-sm text-gray-600">
                <p>📹 Capturing at 10 FPS</p>
                <p>📊 Total frames captured: {gazeHistory.length}</p>
                {debugImage && (
                  <div className="mt-2 p-2 bg-blue-50 rounded">
                    <p className="text-blue-700 font-semibold">✅ Debug Visualization Active</p>
                    <p className="text-xs text-blue-600">Green: MediaPipe landmarks | Red: Pupils | White: Head pose info</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Session List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Vision Sessions</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sessions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No sessions found</p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg border ${
                      selectedSession === session.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } cursor-pointer transition`}
                    onClick={() => setSelectedSession(session.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm text-gray-800">{session.id.substring(0, 8)}</p>
                        <p className="text-xs text-gray-500">Student: {session.student_id}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            session.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : session.status === 'completed'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {session.status}
                        </span>
                        {session.calibration_accuracy !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            Accuracy: {(session.calibration_accuracy * 100).toFixed(1)}%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Console Logs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Console Logs</h2>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet</p>
              ) : (
                logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`mb-1 ${
                      log.level === 'error'
                        ? 'text-red-400'
                        : log.level === 'warning'
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}
                  >
                    <span className="text-gray-500">[{formatTimestamp(log.timestamp)}]</span>{' '}
                    <span className="uppercase font-bold">[{log.level}]</span> {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisionDebug;
