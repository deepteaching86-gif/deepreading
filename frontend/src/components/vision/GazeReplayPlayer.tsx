// Gaze Replay Player Component - Admin visualization of eye tracking data
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GazePoint, GazeType } from '../../types/vision.types';

interface GazeReplayPlayerProps {
  gazeData: GazePoint[];
  passageText: string;
  width?: number;
  height?: number;
  onPlaybackComplete?: () => void;
}

export const GazeReplayPlayer: React.FC<GazeReplayPlayerProps> = ({
  gazeData,
  passageText,
  width = 1280,
  height = 720,
  onPlaybackComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 4x, 0.5x
  const [showFixations, setShowFixations] = useState(true);
  const [showSaccades, setShowSaccades] = useState(true);
  const [showPath, setShowPath] = useState(true);

  const totalFrames = gazeData.length;

  // Draw passage text background
  const drawPassageBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw passage text (simplified - real implementation would need proper text layout)
    ctx.fillStyle = '#1f2937';
    ctx.font = '16px "Plus Jakarta Sans", sans-serif';

    const lines = passageText.split('\n');
    const lineHeight = 24;
    const padding = 40;

    lines.forEach((line, idx) => {
      ctx.fillText(line, padding, padding + idx * lineHeight, width - padding * 2);
    });
  }, [passageText, width, height]);

  // Draw single gaze point
  const drawGazePoint = useCallback((
    ctx: CanvasRenderingContext2D,
    point: GazePoint,
    opacity: number = 1
  ) => {
    const x = point.x * width;
    const y = point.y * height;

    // Different colors for different gaze types
    let color = '';
    let radius = 0;

    switch (point.type) {
      case GazeType.FIXATION:
        color = `rgba(147, 51, 234, ${opacity})`; // Primary purple
        radius = 12;
        break;
      case GazeType.SACCADE:
        color = `rgba(59, 130, 246, ${opacity})`; // Blue
        radius = 6;
        break;
      case GazeType.OFF_PAGE:
        color = `rgba(239, 68, 68, ${opacity})`; // Red
        radius = 8;
        break;
      case GazeType.BLINK:
        color = `rgba(156, 163, 175, ${opacity})`; // Gray
        radius = 4;
        break;
    }

    // Draw circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // Draw outline for fixations
    if (point.type === GazeType.FIXATION) {
      ctx.strokeStyle = `rgba(147, 51, 234, ${opacity * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [width, height]);

  // Draw gaze path (lines connecting points)
  const drawGazePath = useCallback((
    ctx: CanvasRenderingContext2D,
    points: GazePoint[],
    endIndex: number
  ) => {
    if (points.length < 2 || endIndex < 1) return;

    ctx.lineWidth = 2;

    for (let i = 1; i <= endIndex; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];

      const x1 = prevPoint.x * width;
      const y1 = prevPoint.y * height;
      const x2 = currentPoint.x * width;
      const y2 = currentPoint.y * height;

      // Calculate if this is a regression (backward movement)
      const isRegression = y2 < y1 - 20 || (Math.abs(y2 - y1) < 20 && x2 < x1);

      // Color based on movement type
      let color = '';
      if (currentPoint.type === GazeType.OFF_PAGE) {
        color = 'rgba(239, 68, 68, 0.3)'; // Red for off-page
      } else if (isRegression) {
        color = 'rgba(251, 146, 60, 0.5)'; // Orange for regressions
      } else {
        color = 'rgba(147, 51, 234, 0.3)'; // Purple for normal
      }

      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }, [width, height]);

  // Draw fixation duration (larger circle for longer fixations)
  const drawFixationDuration = useCallback((
    ctx: CanvasRenderingContext2D,
    points: GazePoint[],
    endIndex: number
  ) => {
    // Group consecutive fixations
    const fixationGroups: Array<{ points: GazePoint[]; x: number; y: number; duration: number }> = [];

    let currentGroup: GazePoint[] = [];
    for (let i = 0; i <= endIndex; i++) {
      const point = points[i];
      if (point.type === GazeType.FIXATION) {
        currentGroup.push(point);
      } else if (currentGroup.length > 0) {
        // Calculate average position and total duration
        const avgX = currentGroup.reduce((sum, p) => sum + p.x, 0) / currentGroup.length;
        const avgY = currentGroup.reduce((sum, p) => sum + p.y, 0) / currentGroup.length;
        const duration = currentGroup[currentGroup.length - 1].timestamp - currentGroup[0].timestamp;

        fixationGroups.push({
          points: [...currentGroup],
          x: avgX,
          y: avgY,
          duration
        });
        currentGroup = [];
      }
    }

    // Draw fixation circles (size based on duration)
    fixationGroups.forEach(group => {
      const x = group.x * width;
      const y = group.y * height;

      // Radius based on duration (50ms to 1000ms -> 15px to 50px)
      const minDuration = 50;
      const maxDuration = 1000;
      const minRadius = 15;
      const maxRadius = 50;

      const normalizedDuration = Math.max(minDuration, Math.min(maxDuration, group.duration));
      const radius = minRadius + ((normalizedDuration - minDuration) / (maxDuration - minDuration)) * (maxRadius - minRadius);

      // Draw transparent circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(147, 51, 234, 0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(147, 51, 234, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw duration text
      ctx.fillStyle = 'rgba(147, 51, 234, 0.8)';
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${group.duration}ms`, x, y);
    });
  }, [width, height]);

  // Main render function
  const renderFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw background
    drawPassageBackground(ctx);

    // Draw gaze path up to current frame
    if (showPath) {
      drawGazePath(ctx, gazeData, frameIndex);
    }

    // Draw fixation durations
    if (showFixations) {
      drawFixationDuration(ctx, gazeData, frameIndex);
    }

    // Draw individual gaze points
    const startIdx = Math.max(0, frameIndex - 30); // Show last 30 points with fade
    for (let i = startIdx; i <= frameIndex; i++) {
      const point = gazeData[i];

      // Skip based on filters
      if (!showFixations && point.type === GazeType.FIXATION) continue;
      if (!showSaccades && point.type === GazeType.SACCADE) continue;

      // Fade older points
      const age = frameIndex - i;
      const opacity = Math.max(0.2, 1 - (age / 30));

      drawGazePoint(ctx, point, opacity);
    }

    // Draw current point highlight
    if (frameIndex < gazeData.length) {
      const currentPoint = gazeData[frameIndex];
      const x = currentPoint.x * width;
      const y = currentPoint.y * height;

      ctx.beginPath();
      ctx.arc(x, y, 20, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)'; // Yellow highlight
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Draw frame info
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Frame: ${frameIndex + 1} / ${totalFrames}`, 20, 30);
    ctx.fillText(`Time: ${(gazeData[frameIndex]?.timestamp || 0).toFixed(0)}ms`, 20, 50);
  }, [
    gazeData,
    totalFrames,
    width,
    height,
    showPath,
    showFixations,
    showSaccades,
    drawPassageBackground,
    drawGazePath,
    drawFixationDuration,
    drawGazePoint
  ]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) return;

    const frameDelay = 33 / playbackSpeed; // ~30 FPS adjusted by speed
    let lastTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - lastTime;

      if (elapsed >= frameDelay) {
        setCurrentFrame(prev => {
          const next = prev + 1;
          if (next >= totalFrames) {
            setIsPlaying(false);
            if (onPlaybackComplete) onPlaybackComplete();
            return prev;
          }
          return next;
        });
        lastTime = now;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, totalFrames, onPlaybackComplete]);

  // Render current frame
  useEffect(() => {
    renderFrame(currentFrame);
  }, [currentFrame, renderFrame]);

  // Control handlers
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentFrame(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const frame = parseInt(e.target.value, 10);
    setCurrentFrame(frame);
    setIsPlaying(false);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  const handleStepForward = () => {
    setCurrentFrame(prev => Math.min(prev + 1, totalFrames - 1));
    setIsPlaying(false);
  };

  const handleStepBackward = () => {
    setCurrentFrame(prev => Math.max(prev - 1, 0));
    setIsPlaying(false);
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-foreground mb-4">시선 재생</h3>

      {/* Canvas */}
      <div className="mb-4 border border-border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-auto"
        />
      </div>

      {/* Timeline Slider */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={totalFrames - 1}
          value={currentFrame}
          onChange={handleSeek}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{(gazeData[0]?.timestamp || 0).toFixed(0)}ms</span>
          <span>{(gazeData[currentFrame]?.timestamp || 0).toFixed(0)}ms</span>
          <span>{(gazeData[totalFrames - 1]?.timestamp || 0).toFixed(0)}ms</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            {isPlaying ? '⏸ 일시정지' : '▶ 재생'}
          </button>

          {/* Stop */}
          <button
            onClick={handleStop}
            className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            ⏹ 정지
          </button>

          {/* Step Backward */}
          <button
            onClick={handleStepBackward}
            disabled={currentFrame === 0}
            className="px-3 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⏮ 이전
          </button>

          {/* Step Forward */}
          <button
            onClick={handleStepForward}
            disabled={currentFrame >= totalFrames - 1}
            className="px-3 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⏭ 다음
          </button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">속도:</span>
          {[0.5, 1, 2, 4].map(speed => (
            <button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                playbackSpeed === speed
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
        <span className="text-sm text-muted-foreground">표시:</span>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showPath}
            onChange={(e) => setShowPath(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-sm text-foreground">경로</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showFixations}
            onChange={(e) => setShowFixations(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-sm text-foreground">응시점</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showSaccades}
            onChange={(e) => setShowSaccades(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-sm text-foreground">도약</span>
        </label>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-sm font-semibold text-foreground mb-2">범례:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary" />
            <span className="text-muted-foreground">응시 (Fixation)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">도약 (Saccade)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span className="text-muted-foreground">화면 밖 (Off-page)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">역행 (Regression)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
