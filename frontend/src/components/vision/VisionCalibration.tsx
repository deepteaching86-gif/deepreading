/**
 * Vision Calibration Component
 *
 * 9-point calibration for accurate eye tracking
 */

import React, { useState, useRef, useEffect } from 'react';
import { VisionWebSocketClient, CalibrationPoint, GazeData } from '../../services/visionWebSocket';

interface VisionCalibrationProps {
  wsClient: VisionWebSocketClient;
  onCalibrationComplete: (accuracy: number) => void;
  onCancel: () => void;
}

const CALIBRATION_POINTS = [
  { x: 0.1, y: 0.1 }, // Top-left
  { x: 0.5, y: 0.1 }, // Top-center
  { x: 0.9, y: 0.1 }, // Top-right
  { x: 0.1, y: 0.5 }, // Middle-left
  { x: 0.5, y: 0.5 }, // Center
  { x: 0.9, y: 0.5 }, // Middle-right
  { x: 0.1, y: 0.9 }, // Bottom-left
  { x: 0.5, y: 0.9 }, // Bottom-center
  { x: 0.9, y: 0.9 }, // Bottom-right
];

const VisionCalibration: React.FC<VisionCalibrationProps> = ({
  wsClient,
  onCalibrationComplete,
  onCancel,
}) => {
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectedPoints, setCollectedPoints] = useState<CalibrationPoint[]>([]);
  const [gazePoints, setGazePoints] = useState<{ x: number; y: number }[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Initialize webcam
    initializeWebcam();

    // Register gaze data callback
    wsClient.onGaze((data: GazeData) => {
      if (isCollecting) {
        setGazePoints((prev) => [...prev, { x: data.x, y: data.y }]);
      }
    });

    return () => {
      stopWebcam();
    };
  }, [wsClient, isCollecting]);

  const initializeWebcam = async () => {
    try {
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
        console.log(`📹 Camera resolution: ${settings.width}x${settings.height} (adaptive)`);

        // Start sending frames to backend
        captureAndSendFrames();
      }
    } catch (error) {
      console.error('Failed to access webcam:', error);
      alert('웹캠 접근에 실패했습니다. 브라우저 설정을 확인해주세요.');
    }
  };

  const captureAndSendFrames = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    // ✅ FIX: Don't break the loop on early return
    if (!canvas || !video) {
      setTimeout(captureAndSendFrames, 33);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setTimeout(captureAndSendFrames, 33);
      return;
    }

    const sendFrame = () => {
      // ✅ FIX: Keep loop alive even when disconnected
      if (!wsClient.isConnected()) {
        setTimeout(sendFrame, 33);
        return;
      }

      // Update canvas size to match video dimensions
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      // Send frame WITH frame dimensions for resolution-independent tracking
      wsClient.sendFrame(
        imageData,
        window.innerWidth,
        window.innerHeight,
        video.videoWidth,
        video.videoHeight
      );

      // ✅ PERFORMANCE: 33ms = ~30 FPS (improved from requestAnimationFrame)
      setTimeout(sendFrame, 33);
    };

    sendFrame();
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handlePointClick = async () => {
    if (isCollecting) return;

    setIsCollecting(true);
    setGazePoints([]);

    // Collect gaze data for 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsCollecting(false);

    // Calculate average gaze position
    if (gazePoints.length > 0) {
      const avgX = gazePoints.reduce((sum, p) => sum + p.x, 0) / gazePoints.length;
      const avgY = gazePoints.reduce((sum, p) => sum + p.y, 0) / gazePoints.length;

      const currentPoint = CALIBRATION_POINTS[currentPointIndex];
      const calibrationPoint: CalibrationPoint = {
        screen_x: currentPoint.x * window.innerWidth,
        screen_y: currentPoint.y * window.innerHeight,
        gaze_x: avgX,
        gaze_y: avgY,
        timestamp: Date.now(),
      };

      setCollectedPoints((prev) => [...prev, calibrationPoint]);

      // Move to next point
      if (currentPointIndex < CALIBRATION_POINTS.length - 1) {
        setCurrentPointIndex(currentPointIndex + 1);
      } else {
        // Calibration complete
        const accuracy = calculateAccuracy([...collectedPoints, calibrationPoint]);
        onCalibrationComplete(accuracy);
      }
    }
  };

  const calculateAccuracy = (points: CalibrationPoint[]): number => {
    const errors = points.map((p) => {
      const dx = p.screen_x - p.gaze_x;
      const dy = p.screen_y - p.gaze_y;
      return Math.sqrt(dx * dx + dy * dy);
    });

    const avgError = errors.reduce((sum, e) => sum + e, 0) / errors.length;

    // Accuracy: 1.0 (perfect) to 0.0 (worst)
    // Assume 50px error = 0.95 accuracy, 100px = 0.5 accuracy
    const accuracy = Math.max(0, 1 - avgError / 200);

    return parseFloat(accuracy.toFixed(2));
  };

  const currentPoint = CALIBRATION_POINTS[currentPointIndex];

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center">
      {/* Hidden video and canvas for frame capture */}
      <video
        ref={videoRef}
        className="hidden"
        width={640}
        height={480}
        autoPlay
        playsInline
        muted
      />
      <canvas ref={canvasRef} width={640} height={480} className="hidden" />

      {/* Calibration instructions */}
      <div className="absolute top-8 left-0 right-0 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">시선 추적 캘리브레이션</h1>
        <p className="text-gray-300">
          화면에 나타나는 점을 클릭하고 2초간 응시해주세요
        </p>
        <p className="text-gray-400 mt-2">
          진행: {currentPointIndex + 1} / {CALIBRATION_POINTS.length}
        </p>
      </div>

      {/* Calibration point */}
      <button
        onClick={handlePointClick}
        disabled={isCollecting}
        className={`absolute w-12 h-12 rounded-full transition-all duration-200 ${
          isCollecting
            ? 'bg-red-500 scale-150 animate-pulse'
            : 'bg-blue-500 hover:bg-blue-400 hover:scale-110'
        }`}
        style={{
          left: `${currentPoint.x * 100}%`,
          top: `${currentPoint.y * 100}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="w-2 h-2 bg-white rounded-full mx-auto" />
      </button>

      {/* Cancel button */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          취소
        </button>
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-2">
        {CALIBRATION_POINTS.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full ${
              index < currentPointIndex
                ? 'bg-green-500'
                : index === currentPointIndex
                ? 'bg-blue-500 animate-pulse'
                : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default VisionCalibration;
