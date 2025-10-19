/**
 * Debug Camera Overlay - 우측 하단 토글 가능한 카메라 피드
 * FaceMesh 추적 오버레이 포함
 */

import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react';

interface DebugCameraOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isTracking: boolean;
}

export const DebugCameraOverlay: React.FC<DebugCameraOverlayProps> = ({
  videoRef,
  canvasRef,
  isTracking
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 }); // 우측 하단 기준
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      isDragging.current = true;
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
    }
  };

  // 드래그 중
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        setPosition({
          x: e.clientX - dragStart.current.x,
          y: e.clientY - dragStart.current.y
        });
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!isVisible) {
    // 토글 버튼만 표시
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-all z-50"
        title="카메라 디버그 보기"
      >
        <Eye className="w-5 h-5" />
      </button>
    );
  }

  const size = isExpanded ? 'w-[640px] h-[480px]' : 'w-[320px] h-[240px]';

  return (
    <div
      className={`fixed ${size} bg-gray-900 rounded-lg shadow-2xl border-2 border-indigo-500 overflow-hidden transition-all duration-300 z-50`}
      style={{
        right: `${position.x}px`,
        bottom: `${position.y}px`,
        cursor: isDragging.current ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* 헤더 - 드래그 핸들 */}
      <div className="drag-handle bg-indigo-600 px-3 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-white text-sm font-medium">
            {isTracking ? '추적 중' : '추적 대기'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 확대/축소 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-white hover:bg-indigo-700 p-1 rounded transition-colors"
            title={isExpanded ? '축소' : '확대'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* 닫기 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
            }}
            className="text-white hover:bg-indigo-700 p-1 rounded transition-colors"
            title="닫기"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 카메라 피드 + FaceMesh 오버레이 */}
      <div className="relative w-full h-full bg-black">
        {/* 비디오 피드 */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }} // 거울 모드
          playsInline
          muted
        />

        {/* FaceMesh 캔버스 오버레이 */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ transform: 'scaleX(-1)' }} // 거울 모드
        />

        {/* 추적 상태 오버레이 */}
        {!isTracking && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center">
              <div className="text-white text-lg font-medium mb-2">카메라 대기 중</div>
              <div className="text-gray-300 text-sm">얼굴을 화면 중앙에 위치시켜주세요</div>
            </div>
          </div>
        )}
      </div>

      {/* 디버그 정보 (하단) */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 px-3 py-2 text-xs text-white">
        <div className="flex justify-between items-center">
          <span>카메라: {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0}</span>
          <span className="text-green-400">FaceMesh 활성</span>
        </div>
      </div>
    </div>
  );
};
