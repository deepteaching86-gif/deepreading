// Gaze Replay Viewer Component
// Displays recorded gaze paths with playback controls for vision test review

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

interface GazePoint {
  timestamp: number;
  x: number;
  y: number;
  type: 'fixation' | 'saccade' | 'blink';
  confidence: number;
  passageId?: string;
}

interface GazeChunk {
  passageId: string;
  gazePoints: GazePoint[];
  startTime: Date;
  endTime: Date;
  totalPoints: number;
  savedAt?: string;
}

interface PassageData {
  id: string;
  text: string;
  fontSize: number;
  lineHeight: number;
}

interface GazeReplayViewerProps {
  visionSessionId: string;
  passages: PassageData[];
}

export const GazeReplayViewer: React.FC<GazeReplayViewerProps> = ({
  visionSessionId,
  passages
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [gazeData, setGazeData] = useState<Map<string, GazeChunk[]>>(new Map());
  const [allPoints, setAllPoints] = useState<GazePoint[]>([]);
  const [progress, setProgress] = useState(0);

  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);

  // Load gaze data from localStorage
  useEffect(() => {
    const loadedData = new Map<string, GazeChunk[]>();

    passages.forEach(passage => {
      const sessionKey = `gaze-data-${visionSessionId}-${passage.id}`;
      const storedData = localStorage.getItem(sessionKey);

      if (storedData) {
        try {
          const chunks: GazeChunk[] = JSON.parse(storedData);
          loadedData.set(passage.id, chunks);
          console.log(`✅ Loaded ${chunks.length} chunks for passage ${passage.id}`);
        } catch (error) {
          console.error(`❌ Failed to parse gaze data for ${passage.id}:`, error);
        }
      }
    });

    setGazeData(loadedData);

    // Flatten all gaze points from current passage
    const currentPassage = passages[currentPassageIndex];
    if (currentPassage) {
      const chunks = loadedData.get(currentPassage.id) || [];
      const points: GazePoint[] = [];

      chunks.forEach(chunk => {
        points.push(...chunk.gazePoints);
      });

      // Sort by timestamp
      points.sort((a, b) => a.timestamp - b.timestamp);
      setAllPoints(points);
      console.log(`📊 Total gaze points for current passage: ${points.length}`);
    }
  }, [visionSessionId, passages, currentPassageIndex]);

  // Playback animation loop
  useEffect(() => {
    if (!isPlaying || allPoints.length === 0) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (lastTimestampRef.current === 0) {
        lastTimestampRef.current = timestamp;
      }

      const deltaTime = timestamp - lastTimestampRef.current;
      const frameRate = 16.67; // ~60fps

      if (deltaTime >= frameRate / playbackSpeed) {
        setCurrentPointIndex(prev => {
          const next = prev + 1;
          if (next >= allPoints.length) {
            setIsPlaying(false);
            return prev;
          }
          return next;
        });

        lastTimestampRef.current = timestamp;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, allPoints.length, playbackSpeed]);

  // Update progress
  useEffect(() => {
    if (allPoints.length > 0) {
      setProgress((currentPointIndex / allPoints.length) * 100);
    }
  }, [currentPointIndex, allPoints.length]);

  const handlePlayPause = () => {
    if (currentPointIndex >= allPoints.length - 1) {
      setCurrentPointIndex(0);
      lastTimestampRef.current = 0;
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentPointIndex(0);
    lastTimestampRef.current = 0;
  };

  const handlePreviousPassage = () => {
    if (currentPassageIndex > 0) {
      setCurrentPassageIndex(currentPassageIndex - 1);
      handleReset();
    }
  };

  const handleNextPassage = () => {
    if (currentPassageIndex < passages.length - 1) {
      setCurrentPassageIndex(currentPassageIndex + 1);
      handleReset();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newIndex = Math.floor(percentage * allPoints.length);
    setCurrentPointIndex(Math.min(newIndex, allPoints.length - 1));
  };

  const currentPassage = passages[currentPassageIndex];
  const currentPoint = allPoints[currentPointIndex];
  const chunks = gazeData.get(currentPassage?.id || '') || [];
  const totalPoints = chunks.reduce((sum, chunk) => sum + chunk.totalPoints, 0);

  // Render gaze trail (last 30 points for trail effect)
  const getGazeTrail = () => {
    const trailLength = 30;
    const startIndex = Math.max(0, currentPointIndex - trailLength);
    return allPoints.slice(startIndex, currentPointIndex + 1);
  };

  if (!currentPassage) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-lg">
        <p className="text-muted-foreground">지문 데이터를 찾을 수 없습니다.</p>
      </div>
    );
  }

  if (totalPoints === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-foreground mb-4">시선 추적 재생</h3>
        <p className="text-muted-foreground">
          이 세션에 대한 시선 추적 데이터가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-foreground mb-4">시선 추적 재생</h3>

      {/* Passage Selector */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <button
          onClick={handlePreviousPassage}
          disabled={currentPassageIndex === 0}
          className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            지문 {currentPassageIndex + 1}
          </p>
          <p className="text-xs text-muted-foreground">
            {passages.length}개 중 {currentPassageIndex + 1}번째 | {totalPoints}개 포인트
          </p>
        </div>

        <button
          onClick={handleNextPassage}
          disabled={currentPassageIndex === passages.length - 1}
          className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Passage Preview with Gaze Overlay */}
      <div className="relative mb-6 bg-background rounded-lg p-8 border border-border overflow-hidden">
        <div
          className="text-foreground whitespace-pre-wrap relative z-0"
          style={{
            fontSize: `${currentPassage.fontSize}px`,
            lineHeight: currentPassage.lineHeight,
            letterSpacing: '0.01em'
          }}
        >
          {currentPassage.text}
        </div>

        {/* Gaze Trail */}
        {getGazeTrail().map((point, index) => {
          const opacity = 0.2 + (index / 30) * 0.5; // Fade from 0.2 to 0.7
          const size = 8 + (index / 30) * 12; // Size from 8px to 20px

          return (
            <div
              key={`${point.timestamp}-${index}`}
              className="absolute pointer-events-none rounded-full"
              style={{
                left: `${point.x * 100}%`,
                top: `${point.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: point.type === 'fixation' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(239, 68, 68, 0.4)',
                opacity,
                transition: 'all 0.1s ease-out'
              }}
            />
          );
        })}

        {/* Current Gaze Point */}
        {currentPoint && (
          <div
            className="absolute pointer-events-none z-10"
            style={{
              left: `${currentPoint.x * 100}%`,
              top: `${currentPoint.y * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Pulsing outer ring */}
            <div className="absolute w-8 h-8 bg-primary rounded-full animate-ping opacity-75" />
            {/* Solid inner dot */}
            <div
              className="absolute w-6 h-6 bg-primary border-2 border-white rounded-full"
              style={{
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)'
              }}
            />
            {/* Type indicator */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary text-white text-xs rounded whitespace-nowrap">
              {currentPoint.type === 'fixation' ? '응시' : '도약'}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div
          onClick={handleProgressClick}
          className="h-2 bg-muted rounded-full cursor-pointer relative overflow-hidden"
        >
          <div
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          {/* Current position indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary border-2 border-white rounded-full shadow-lg"
            style={{ left: `calc(${progress}% - 8px)` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{currentPointIndex} / {allPoints.length} 포인트</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={handlePlayPause}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          {isPlaying ? (
            <>
              <Pause className="w-5 h-5" />
              일시정지
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              재생
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          처음부터
        </button>

        {/* Playback Speed */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">재생 속도:</span>
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="px-3 py-1 bg-muted text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={0.25}>0.25x</option>
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-6 pt-6 border-t border-border grid grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{totalPoints}</p>
          <p className="text-xs text-muted-foreground">총 포인트</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{chunks.length}</p>
          <p className="text-xs text-muted-foreground">저장된 청크</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">
            {allPoints.filter(p => p.type === 'fixation').length}
          </p>
          <p className="text-xs text-muted-foreground">응시 횟수</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">
            {allPoints.filter(p => p.type === 'saccade').length}
          </p>
          <p className="text-xs text-muted-foreground">도약 횟수</p>
        </div>
      </div>
    </div>
  );
};
