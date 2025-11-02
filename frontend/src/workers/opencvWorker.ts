// OpenCV Web Worker
// Runs OpenCV pupil detection in background thread to avoid blocking main thread

import { loadOpenCV, getOpenCV } from '../utils/opencvLoader';

// Worker 메시지 타입 정의
interface WorkerInput {
  type: 'INIT' | 'DETECT_PUPILS' | 'TERMINATE';
  imageData?: ImageData;
  eyeROIs?: {
    left: { x: number; y: number; width: number; height: number };
    right: { x: number; y: number; width: number; height: number };
  };
}

interface PupilResult {
  left: { x: number; y: number; radius: number } | null;
  right: { x: number; y: number; radius: number } | null;
  confidence: number;
}

interface WorkerOutput {
  type: 'INITIALIZED' | 'PUPILS_DETECTED' | 'ERROR' | 'TERMINATED';
  result?: PupilResult | null;
  processingTime?: number;
  error?: string;
}

// OpenCV 초기화 상태
let cv: any = null;
let initialized = false;

/**
 * Initialize OpenCV in worker
 */
async function initializeOpenCV(): Promise<void> {
  try {
    console.log('[Worker] 🔧 Initializing OpenCV...');
    await loadOpenCV();
    cv = getOpenCV();
    initialized = true;
    console.log('[Worker] ✅ OpenCV initialized successfully');

    postMessage({
      type: 'INITIALIZED'
    } as WorkerOutput);
  } catch (error) {
    console.error('[Worker] ❌ Failed to initialize OpenCV:', error);
    postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'OpenCV initialization failed'
    } as WorkerOutput);
  }
}

/**
 * Detect pupils in eye ROIs using OpenCV
 */
function detectPupils(
  imageData: ImageData,
  eyeROIs: {
    left: { x: number; y: number; width: number; height: number };
    right: { x: number; y: number; width: number; height: number };
  }
): PupilResult | null {
  if (!initialized || !cv) {
    console.warn('[Worker] ⚠️ OpenCV not initialized');
    return null;
  }

  try {
    // Convert ImageData to cv.Mat
    const src = cv.matFromImageData(imageData);
    const gray = new cv.Mat();

    // Convert to grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // Apply Gaussian blur for noise reduction
    const blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

    // Detect pupils in both eyes
    const leftPupil = detectPupilInROI(blurred, eyeROIs.left);
    const rightPupil = detectPupilInROI(blurred, eyeROIs.right);

    // Calculate confidence based on detection success
    let confidence = 0;
    if (leftPupil && rightPupil) {
      confidence = 0.9;
    } else if (leftPupil || rightPupil) {
      confidence = 0.6;
    }

    // Cleanup
    src.delete();
    gray.delete();
    blurred.delete();

    return {
      left: leftPupil,
      right: rightPupil,
      confidence
    };
  } catch (error) {
    console.error('[Worker] ❌ Pupil detection failed:', error);
    return null;
  }
}

/**
 * Detect pupil in single eye ROI
 */
function detectPupilInROI(
  grayImage: any,
  roi: { x: number; y: number; width: number; height: number }
): { x: number; y: number; radius: number } | null {
  if (!cv) return null;

  try {
    // Extract eye region
    const rect = new cv.Rect(roi.x, roi.y, roi.width, roi.height);
    const eyeRegion = grayImage.roi(rect);

    // Apply adaptive threshold to enhance pupil
    const thresh = new cv.Mat();
    cv.adaptiveThreshold(
      eyeRegion,
      thresh,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY_INV,
      11,
      2
    );

    // Detect circles using Hough Circle Transform
    const circles = new cv.Mat();
    const minRadius = Math.floor(roi.height / 8);
    const maxRadius = Math.floor(roi.height / 3);

    cv.HoughCircles(
      thresh,
      circles,
      cv.HOUGH_GRADIENT,
      1,
      eyeRegion.rows / 8,
      100,
      30,
      minRadius,
      maxRadius
    );

    // Get best circle (if any)
    let bestCircle: { x: number; y: number; radius: number } | null = null;

    if (circles.cols > 0) {
      // Use first circle (strongest detection)
      const x = circles.data32F[0] + roi.x;
      const y = circles.data32F[1] + roi.y;
      const radius = circles.data32F[2];

      bestCircle = { x, y, radius };
    }

    // Cleanup
    eyeRegion.delete();
    thresh.delete();
    circles.delete();

    return bestCircle;
  } catch (error) {
    console.error('[Worker] ⚠️ ROI detection failed:', error);
    return null;
  }
}

/**
 * Worker message handler
 */
self.onmessage = async (event: MessageEvent<WorkerInput>) => {
  const { type, imageData, eyeROIs } = event.data;

  switch (type) {
    case 'INIT':
      await initializeOpenCV();
      break;

    case 'DETECT_PUPILS':
      if (!imageData || !eyeROIs) {
        postMessage({
          type: 'ERROR',
          error: 'Missing imageData or eyeROIs'
        } as WorkerOutput);
        return;
      }

      const startTime = performance.now();
      const result = detectPupils(imageData, eyeROIs);
      const processingTime = performance.now() - startTime;

      postMessage({
        type: 'PUPILS_DETECTED',
        result,
        processingTime
      } as WorkerOutput);
      break;

    case 'TERMINATE':
      console.log('[Worker] 🛑 Terminating worker...');
      postMessage({
        type: 'TERMINATED'
      } as WorkerOutput);
      self.close();
      break;

    default:
      postMessage({
        type: 'ERROR',
        error: `Unknown message type: ${type}`
      } as WorkerOutput);
  }
};

// Export types for main thread
export type { WorkerInput, WorkerOutput, PupilResult };
