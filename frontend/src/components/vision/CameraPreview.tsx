import React, { useRef, useEffect, useCallback } from 'react';
import { DrawingUtils, FaceLandmarker } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { FaceMeshGazeService } from '../../services/faceMeshGazeService';

interface CameraPreviewProps {
  gazeService: FaceMeshGazeService;
  visible: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showIris?: boolean;
  showEyeContours?: boolean;
  showFaceMesh?: boolean;
  width?: number;
}

const POSITION_STYLES: Record<string, React.CSSProperties> = {
  'top-right': { top: 16, right: 16 },
  'top-left': { top: 16, left: 16 },
  'bottom-right': { bottom: 16, right: 16 },
  'bottom-left': { bottom: 16, left: 16 },
};

export default function CameraPreview({
  gazeService,
  visible,
  position = 'top-right',
  showIris = true,
  showEyeContours = true,
  showFaceMesh = false,
  width = 320,
}: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null);

  // Sync video srcObject from the service's video element
  useEffect(() => {
    if (!visible) return;
    const srcVideo = gazeService.getVideoElement();
    if (!srcVideo || !videoRef.current) return;

    const syncStream = () => {
      if (srcVideo.srcObject && videoRef.current) {
        videoRef.current.srcObject = srcVideo.srcObject;
        videoRef.current.play().catch(() => {});
      }
    };

    // If stream is already available, set immediately
    if (srcVideo.srcObject) {
      syncStream();
    }

    // Also listen for future stream changes
    srcVideo.addEventListener('loadedmetadata', syncStream);
    return () => {
      srcVideo.removeEventListener('loadedmetadata', syncStream);
    };
  }, [gazeService, visible]);

  // Initialize DrawingUtils when canvas is ready
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      drawingUtilsRef.current = new DrawingUtils(ctx);
    }
  }, []);

  const drawLandmarks = useCallback(
    (landmarks: NormalizedLandmark[]) => {
      const canvas = canvasRef.current;
      const du = drawingUtilsRef.current;
      if (!canvas || !du) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (landmarks.length === 0) return;

      // Face mesh (optional, low opacity)
      if (showFaceMesh) {
        du.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_CONTOURS, {
          color: 'rgba(200,200,200,0.3)',
          lineWidth: 1,
        });
      }

      // Eye contours
      if (showEyeContours) {
        du.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, {
          color: '#30FF30',
          lineWidth: 2,
        });
        du.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, {
          color: '#30FF30',
          lineWidth: 2,
        });

        // Eye corner landmarks
        const cornerIndices = [33, 133, 263, 362];
        const corners = cornerIndices
          .filter((i) => i < landmarks.length)
          .map((i) => landmarks[i]);
        if (corners.length > 0) {
          du.drawLandmarks(corners, {
            color: '#FFFF00',
            fillColor: '#FFFF00',
            lineWidth: 0,
            radius: 2,
          });
        }
      }

      // Iris landmarks
      if (showIris) {
        du.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, {
          color: '#FF3030',
          lineWidth: 2,
        });
        du.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, {
          color: '#FF3030',
          lineWidth: 2,
        });

        // Iris center points (468 = left, 473 = right)
        const irisCenters = [468, 473]
          .filter((i) => i < landmarks.length)
          .map((i) => landmarks[i]);
        if (irisCenters.length > 0) {
          du.drawLandmarks(irisCenters, {
            color: '#FF0000',
            fillColor: '#FF0000',
            lineWidth: 0,
            radius: 3,
          });
        }
      }
    },
    [showIris, showEyeContours, showFaceMesh]
  );

  // Register landmark listener
  useEffect(() => {
    if (!visible) return;

    gazeService.onLandmarks((landmarks: NormalizedLandmark[], _videoEl: HTMLVideoElement) => {
      // Sync canvas size to video
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }
      }
      drawLandmarks(landmarks);
    });

    return () => {
      gazeService.removeLandmarkListener();
    };
  }, [gazeService, visible, drawLandmarks]);

  if (!visible) return null;

  const height = Math.round((width * 3) / 4); // 4:3 aspect ratio

  return (
    <div
      style={{
        position: 'fixed',
        ...POSITION_STYLES[position],
        zIndex: 9999,
        width,
        height,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        border: '2px solid rgba(255,255,255,0.2)',
        backgroundColor: '#000',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: 'scaleX(-1)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
