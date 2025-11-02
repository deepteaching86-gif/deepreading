/**
 * Fixation Detection Hook
 * =======================
 *
 * Detects when eyes stay still (fixation) vs moving (saccade)
 * - Real-time fixation point detection
 * - Saccade calculation
 * - Reading pattern tracking
 */

import { useState, useRef, useCallback } from 'react';
import type { FixationPoint, Saccade, GazePath } from '@/types/gazeAnalytics';

interface FixationDetectorOptions {
  fixationThreshold: number;    // Distance threshold for fixation (pixels)
  minFixationDuration: number;  // Minimum duration to count as fixation (ms)
  onFixation?: (fixation: FixationPoint) => void;
  onSaccade?: (saccade: Saccade) => void;
}

interface GazeInput {
  x: number;                    // Normalized 0-1
  y: number;                    // Normalized 0-1
  timestamp: number;
  pupilDiameter?: number;
  confidence?: number;
}

export function useFixationDetector(options: FixationDetectorOptions) {
  const {
    fixationThreshold = 0.03,   // 3% of screen
    minFixationDuration = 100,  // 100ms
    onFixation,
    onSaccade
  } = options;

  const [currentFixation, setCurrentFixation] = useState<FixationPoint | null>(null);
  const [fixations, setFixations] = useState<FixationPoint[]>([]);
  const [saccades, setSaccades] = useState<Saccade[]>([]);

  const lastGazeRef = useRef<GazeInput | null>(null);
  const fixationStartRef = useRef<GazeInput | null>(null);
  const fixationAccumulatorRef = useRef<{ x: number; y: number; count: number }>({ x: 0, y: 0, count: 0 });

  const processGazePoint = useCallback((gaze: GazeInput) => {
    const { x, y, timestamp, pupilDiameter = 10, confidence = 1.0 } = gaze;

    // First gaze point
    if (!lastGazeRef.current) {
      lastGazeRef.current = gaze;
      fixationStartRef.current = gaze;
      fixationAccumulatorRef.current = { x, y, count: 1 };
      return;
    }

    // Calculate distance from last gaze point
    const dx = x - lastGazeRef.current.x;
    const dy = y - lastGazeRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < fixationThreshold) {
      // Still fixating - accumulate position
      if (!fixationStartRef.current) {
        fixationStartRef.current = gaze;
        fixationAccumulatorRef.current = { x, y, count: 1 };
      } else {
        // Update accumulated position
        fixationAccumulatorRef.current.x += x;
        fixationAccumulatorRef.current.y += y;
        fixationAccumulatorRef.current.count += 1;

        // Check if fixation duration exceeds minimum
        const duration = timestamp - fixationStartRef.current.timestamp;

        if (duration >= minFixationDuration) {
          // Calculate average fixation position
          const avgX = fixationAccumulatorRef.current.x / fixationAccumulatorRef.current.count;
          const avgY = fixationAccumulatorRef.current.y / fixationAccumulatorRef.current.count;

          const fixation: FixationPoint = {
            x: avgX,
            y: avgY,
            timestamp: fixationStartRef.current.timestamp,
            duration,
            pupilDiameter,
            confidence
          };

          // Update current fixation (for real-time display)
          setCurrentFixation(fixation);
        }
      }
    } else {
      // Saccade detected (eye movement)
      if (fixationStartRef.current) {
        const fixationDuration = timestamp - fixationStartRef.current.timestamp;

        // Only create fixation if duration exceeds minimum
        if (fixationDuration >= minFixationDuration) {
          const avgX = fixationAccumulatorRef.current.x / fixationAccumulatorRef.current.count;
          const avgY = fixationAccumulatorRef.current.y / fixationAccumulatorRef.current.count;

          const completedFixation: FixationPoint = {
            x: avgX,
            y: avgY,
            timestamp: fixationStartRef.current.timestamp,
            duration: fixationDuration,
            pupilDiameter,
            confidence
          };

          // Add to fixations list
          setFixations(prev => {
            const updated = [...prev, completedFixation];
            // Keep only last 100 fixations
            return updated.slice(-100);
          });

          // Notify callback
          if (onFixation) {
            onFixation(completedFixation);
          }

          // Calculate saccade if there was a previous fixation
          if (fixations.length > 0) {
            const prevFixation = fixations[fixations.length - 1];
            const saccadeDx = avgX - prevFixation.x;
            const saccadeDy = avgY - prevFixation.y;
            const amplitude = Math.sqrt(saccadeDx * saccadeDx + saccadeDy * saccadeDy);
            const saccadeDuration = completedFixation.timestamp - prevFixation.timestamp;
            const velocity = saccadeDuration > 0 ? amplitude / saccadeDuration : 0;

            const saccade: Saccade = {
              from: prevFixation,
              to: completedFixation,
              duration: saccadeDuration,
              velocity,
              amplitude
            };

            setSaccades(prev => {
              const updated = [...prev, saccade];
              // Keep only last 100 saccades
              return updated.slice(-100);
            });

            if (onSaccade) {
              onSaccade(saccade);
            }
          }
        }

        // Reset fixation tracking
        fixationStartRef.current = null;
        setCurrentFixation(null);
      }

      // Start new potential fixation
      fixationStartRef.current = gaze;
      fixationAccumulatorRef.current = { x, y, count: 1 };
    }

    lastGazeRef.current = gaze;
  }, [fixationThreshold, minFixationDuration, onFixation, onSaccade, fixations]);

  const getGazePath = useCallback((): GazePath => {
    const now = Date.now();
    const startTime = fixations.length > 0 ? fixations[0].timestamp : now;

    return {
      fixations,
      saccades,
      lineTransitions: [], // Will be calculated separately with text layout
      totalDuration: now - startTime,
      startTime,
      endTime: now
    };
  }, [fixations, saccades]);

  const reset = useCallback(() => {
    setFixations([]);
    setSaccades([]);
    setCurrentFixation(null);
    lastGazeRef.current = null;
    fixationStartRef.current = null;
    fixationAccumulatorRef.current = { x: 0, y: 0, count: 0 };
  }, []);

  return {
    processGazePoint,
    currentFixation,
    fixations,
    saccades,
    getGazePath,
    reset
  };
}
