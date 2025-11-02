/**
 * Gaze Path Visualizer Component
 * ===============================
 *
 * Displays gaze path with fixation points overlaid on text content
 * Similar to the image example with turquoise circles
 */

import React, { useRef, useEffect } from 'react';
import type { FixationPoint, Saccade } from '../../types/gazeAnalytics';

interface GazePathVisualizerProps {
  fixations: FixationPoint[];
  saccades?: Saccade[];
  textContent: string;
  width: number;
  height: number;
  colorScheme?: 'default' | 'heatmap' | 'concentration';
}

export const GazePathVisualizer: React.FC<GazePathVisualizerProps> = ({
  fixations,
  saccades = [],
  textContent,
  width,
  height,
  colorScheme = 'default'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw saccades (lines between fixations)
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
    ctx.lineWidth = 2;

    saccades.forEach(saccade => {
      ctx.beginPath();
      ctx.moveTo(saccade.from.x * width, saccade.from.y * height);
      ctx.lineTo(saccade.to.x * width, saccade.to.y * height);
      ctx.stroke();
    });

    // Draw fixation points
    fixations.forEach(fixation => {
      const x = fixation.x * width;
      const y = fixation.y * height;

      // Circle size based on duration
      const radius = Math.min(30, 10 + fixation.duration / 50);

      // Color based on concentration
      let color = 'rgba(64, 224, 208, 0.7)'; // Turquoise (default)

      if (colorScheme === 'heatmap') {
        // Red = low concentration, Green = high concentration
        const heat = fixation.pupilDiameter / 10; // Normalize
        color = `rgba(${255 * (1 - heat)}, ${255 * heat}, 0, 0.7)`;
      } else if (colorScheme === 'concentration') {
        // Size and opacity based on concentration
        const alpha = 0.4 + (fixation.confidence * 0.5);
        color = `rgba(64, 224, 208, ${alpha})`;
      }

      // Draw outer circle (semi-transparent)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw inner circle (solid)
      ctx.fillStyle = 'rgba(64, 224, 208, 0.9)';
      ctx.beginPath();
      ctx.arc(x, y, radius / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw duration label
      ctx.fillStyle = '#000';
      ctx.font = '10px Arial';
      ctx.fillText(`${fixation.duration}ms`, x + radius + 5, y);
    });

  }, [fixations, saccades, width, height, colorScheme]);

  return (
    <div style={{ position: 'relative', width, height }}>
      {/* Text content layer */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        padding: '20px',
        fontSize: '18px',
        lineHeight: '1.6',
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        {textContent}
      </div>

      {/* Gaze path overlay */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};
