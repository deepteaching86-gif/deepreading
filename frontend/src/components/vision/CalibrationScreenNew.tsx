/**
 * New Calibration Screen - Hybrid Quick + Adaptive System
 * 5-Stage Calibration Process
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useGazeTracking } from '../../hooks/useGazeTracking';
import {
  Point,
  GazeData,
  CornerData,
  SensitivityMatrix,
  CalibrationStage,
  CalibrationProfile
} from '../../types/calibration';
import {
  createEmptyCalibrationProfile,
  saveCalibrationProfile,
  calculateCalibratedGaze
} from '../../utils/calibrationUtils';

// Stage components
import { Stage1CameraMarking } from './calibration/Stage1CameraMarking';
import { Stage2NaturalCenter } from './calibration/Stage2NaturalCenter';
import { Stage3CornerCalibration } from './calibration/Stage3CornerCalibration';
import { Stage4Calculate } from './calibration/Stage4Calculate';
import { Stage5Verification } from './calibration/Stage5Verification';

interface CalibrationScreenNewProps {
  userId: string;
  onCalibrationComplete: (profile: CalibrationProfile) => void;
  onCancel: () => void;
}

export const CalibrationScreenNew: React.FC<CalibrationScreenNewProps> = ({
  userId,
  onCalibrationComplete,
  onCancel
}) => {
  const [stage, setStage] = useState<CalibrationStage>(CalibrationStage.CAMERA_MARKING);
  const [profile, setProfile] = useState<CalibrationProfile>(() =>
    createEmptyCalibrationProfile(userId)
  );

  // Current raw gaze data from MediaPipe
  const [currentRawGaze, setCurrentRawGaze] = useState<{
    irisOffset: Point;
    headPose: { yaw: number; pitch: number };
  } | null>(null);

  // Current calibrated gaze (after Stage 4)
  const [currentCalibratedGaze, setCurrentCalibratedGaze] = useState<Point | null>(null);

  // Camera overlay toggle
  const [showCameraOverlay, setShowCameraOverlay] = useState(true);

  // Ref for overlay video element
  const overlayVideoRef = React.useRef<HTMLVideoElement>(null);

  // Gaze tracking hook
  const {
    isTracking,
    currentGaze,
    videoRef,
    canvasRef,
    startTracking
  } = useGazeTracking({
    enabled: stage !== CalibrationStage.CAMERA_MARKING,
    onGazePoint: useCallback((_point: { x: number; y: number; confidence: number }) => {
      // This is the calculated gaze (for Stage 5 verification)
      // Stage 2 & 3 use raw data from onRawGazeData callback
    }, []),
    onRawGazeData: useCallback((data: {
      irisOffset: { x: number; y: number };
      headPose: { yaw: number; pitch: number };
      timestamp: number;
    }) => {
      // Receive raw iris offset and head pose data
      setCurrentRawGaze({
        irisOffset: data.irisOffset,
        headPose: data.headPose
      });
    }, []),
    targetFPS: 30
  });

  // Start tracking when needed
  useEffect(() => {
    if (stage === CalibrationStage.NATURAL_CENTER ||
        stage === CalibrationStage.CORNER_CALIBRATION ||
        stage === CalibrationStage.VERIFICATION) {
      if (!isTracking) {
        startTracking();
      }
    }
  }, [stage, isTracking, startTracking]);

  // ==================== STAGE HANDLERS ====================

  // Stage 1: Camera Position
  const handleCameraPositionComplete = useCallback((cameraPosition: Point) => {
    console.log('✅ Stage 1 Complete - Camera Position:', cameraPosition);

    setProfile(prev => ({
      ...prev,
      quickCalibration: {
        ...prev.quickCalibration,
        cameraPosition
      }
    }));

    setStage(CalibrationStage.NATURAL_CENTER);
  }, []);

  // Stage 2: Natural Center
  const handleNaturalCenterComplete = useCallback((naturalCenter: GazeData) => {
    console.log('✅ Stage 2 Complete - Natural Center:', naturalCenter);

    setProfile(prev => ({
      ...prev,
      quickCalibration: {
        ...prev.quickCalibration,
        naturalCenter
      }
    }));

    setStage(CalibrationStage.CORNER_CALIBRATION);
  }, []);

  // Stage 3: Corner Calibration
  const handleCornerCalibrationComplete = useCallback((corners: CornerData[]) => {
    console.log('✅ Stage 3 Complete - Corners:', corners);

    setProfile(prev => ({
      ...prev,
      quickCalibration: {
        ...prev.quickCalibration,
        corners
      }
    }));

    setStage(CalibrationStage.AUTO_CALCULATE);
  }, []);

  // Stage 4: Auto Calculate
  const handleSensitivityCalculated = useCallback((sensitivity: SensitivityMatrix) => {
    console.log('✅ Stage 4 Complete - Sensitivity:', sensitivity);

    setProfile(prev => ({
      ...prev,
      quickCalibration: {
        ...prev.quickCalibration,
        sensitivity
      }
    }));

    setStage(CalibrationStage.VERIFICATION);
  }, []);

  // Stage 5: Verification
  const handleVerificationComplete = useCallback((score: number) => {
    console.log('✅ Stage 5 Complete - Score:', score);

    const finalProfile: CalibrationProfile = {
      ...profile,
      quickCalibration: {
        ...profile.quickCalibration,
        verificationScore: score
      },
      lastUpdated: new Date()
    };

    if (score >= 0.66) { // 3개 중 2개 = 66.7%
      // Success!
      console.log('🎉 Calibration successful!');
      saveCalibrationProfile(finalProfile);
      setStage(CalibrationStage.COMPLETED);

      setTimeout(() => {
        onCalibrationComplete(finalProfile);
      }, 2000);
    } else {
      // Failed - need recalibration
      console.log('❌ Calibration failed, restarting...');
      alert('캘리브레이션 검증에 실패했습니다. 처음부터 다시 시도합니다.');

      // Reset
      setProfile(createEmptyCalibrationProfile(userId));
      setStage(CalibrationStage.CAMERA_MARKING);
    }
  }, [profile, userId, onCalibrationComplete]);

  // ==================== GAZE DATA CALCULATION ====================

  // Update calibrated gaze for Stage 5
  useEffect(() => {
    if (stage === CalibrationStage.VERIFICATION && currentRawGaze) {
      const calibrated = calculateCalibratedGaze(
        currentRawGaze.irisOffset,
        currentRawGaze.headPose,
        profile
      );
      setCurrentCalibratedGaze(calibrated);
    }
  }, [currentRawGaze, stage, profile]);

  // Setup overlay video srcObject (prevent AbortError)
  useEffect(() => {
    if (overlayVideoRef.current && videoRef.current?.srcObject) {
      overlayVideoRef.current.srcObject = videoRef.current.srcObject;
      overlayVideoRef.current.play().catch(console.error);
    }
  }, [isTracking, showCameraOverlay]);

  // ==================== RENDER ====================

  return (
    <div className="fixed inset-0 bg-black">
      {/* Hidden video and canvas for gaze tracking */}
      <div className="hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
        />
        <canvas ref={canvasRef} />
      </div>

      {/* Stage routing */}
      {stage === CalibrationStage.CAMERA_MARKING && (
        <Stage1CameraMarking onComplete={handleCameraPositionComplete} />
      )}

      {stage === CalibrationStage.NATURAL_CENTER && (
        <Stage2NaturalCenter
          currentRawGaze={currentRawGaze}
          onComplete={handleNaturalCenterComplete}
        />
      )}

      {stage === CalibrationStage.CORNER_CALIBRATION && (
        <Stage3CornerCalibration
          currentGaze={currentGaze ? { x: currentGaze.x, y: currentGaze.y } : null}
          currentRawGaze={currentRawGaze}
          onComplete={handleCornerCalibrationComplete}
        />
      )}

      {stage === CalibrationStage.AUTO_CALCULATE && (
        <Stage4Calculate
          naturalCenter={profile.quickCalibration.naturalCenter}
          corners={profile.quickCalibration.corners}
          onComplete={handleSensitivityCalculated}
        />
      )}

      {stage === CalibrationStage.VERIFICATION && (
        <Stage5Verification
          currentGaze={currentCalibratedGaze}
          onComplete={handleVerificationComplete}
        />
      )}

      {stage === CalibrationStage.COMPLETED && (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-8xl mb-6 animate-bounce">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              캘리브레이션 완료!
            </h2>
            <p className="text-gray-400 text-lg">
              읽기 활동을 시작할 준비가 되었습니다
            </p>
            <div className="mt-8">
              <div className="inline-block w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel button */}
      {stage !== CalibrationStage.COMPLETED && (
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm transition-colors z-50"
        >
          취소
        </button>
      )}

      {/* Debug info */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 px-3 py-2 rounded text-white text-xs space-y-1 z-50">
        <div>Stage: {stage}</div>
        <div>Tracking: {isTracking ? '✓' : '✗'}</div>
        {currentGaze && (
          <div>
            Gaze: ({currentGaze.x.toFixed(2)}, {currentGaze.y.toFixed(2)})
          </div>
        )}
      </div>

      {/* Camera Overlay UI - Bottom Right */}
      {isTracking && showCameraOverlay && stage !== CalibrationStage.CAMERA_MARKING && (
        <div className="fixed bottom-4 right-4 z-50 w-64">
          <div className="relative bg-card/95 backdrop-blur-md rounded-xl shadow-2xl border border-border overflow-hidden">
            {/* Toggle button */}
            <button
              onClick={() => setShowCameraOverlay(false)}
              className="absolute top-2 right-2 w-6 h-6 bg-card/90 border border-border rounded-full flex items-center justify-center hover:bg-accent transition-colors z-10"
              title="카메라 숨기기"
            >
              <span className="text-xs">✕</span>
            </button>

            {/* Video and Canvas container */}
            <div className="relative w-full h-48 rounded-t-xl overflow-hidden bg-black">
              {/* Mirror video feed from webcam */}
              <video
                ref={overlayVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute top-0 left-0 w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* FaceMesh overlay canvas - needs continuous update */}
              <canvas
                ref={(el) => {
                  if (el && canvasRef.current) {
                    el.width = 256;
                    el.height = 192;
                    const ctx = el.getContext('2d');

                    const drawFrame = () => {
                      if (ctx && canvasRef.current && el) {
                        ctx.clearRect(0, 0, 256, 192);
                        ctx.save();
                        ctx.scale(-1, 1);
                        ctx.drawImage(canvasRef.current, -256, 0, 256, 192);
                        ctx.restore();
                        requestAnimationFrame(drawFrame);
                      }
                    };
                    drawFrame();
                  }
                }}
                className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
              />

              {/* Removed gaze indicator - now shown on main calibration screen */}

              {/* Face tracking indicator */}
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-white text-xs flex items-center gap-1 z-10">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>Live</span>
              </div>
            </div>

            {/* Info panel */}
            <div className="bg-card/80 px-3 py-2 text-xs space-y-1">
              <div className="text-card-foreground/70">
                상태: {isTracking ? '✓ 추적 중' : '✗ 대기'}
              </div>
              {currentGaze && (
                <div className="text-card-foreground/70">
                  시선: ({(currentGaze.x * 100).toFixed(0)}%, {(currentGaze.y * 100).toFixed(0)}%)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Show Camera Button (when hidden) */}
      {isTracking && !showCameraOverlay && stage !== CalibrationStage.CAMERA_MARKING && (
        <button
          onClick={() => setShowCameraOverlay(true)}
          className="fixed bottom-4 right-4 z-50 px-3 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2"
          title="카메라 표시"
        >
          <span className="text-sm">📹</span>
          <span className="text-sm font-medium">카메라</span>
        </button>
      )}
    </div>
  );
};
