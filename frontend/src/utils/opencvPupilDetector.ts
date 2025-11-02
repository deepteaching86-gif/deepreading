// OpenCV.js Pupil Detector
// Traditional computer vision approach for pupil detection using Hough Circle Transform

import { getOpenCV, loadOpenCV } from './opencvLoader';

export interface PupilDetectionResult {
  left: {
    x: number;      // Normalized 0-1
    y: number;      // Normalized 0-1
    radius: number; // Pixels
  } | null;
  right: {
    x: number;      // Normalized 0-1
    y: number;      // Normalized 0-1
    radius: number; // Pixels
  } | null;
  confidence: number; // 0-1, based on circle detection quality
}

export interface EyeROI {
  left: { x: number; y: number; width: number; height: number };
  right: { x: number; y: number; width: number; height: number };
}

export class OpenCVPupilDetector {
  private cv: any = null;
  private initialized = false;
  private lastErrorLog = 0;
  private errorLogThrottle = 5000; // Log errors at most once per 5 seconds
  private errorCount = 0;

  constructor() {
    // Constructor does nothing - must call initialize() first
  }

  /**
   * Initialize OpenCV.js (async)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('✅ OpenCVPupilDetector already initialized');
      return;
    }

    try {
      await loadOpenCV();
      this.cv = getOpenCV();
      this.initialized = true;
      console.log('✅ OpenCVPupilDetector initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OpenCVPupilDetector:', error);
      throw error;
    }
  }

  /**
   * Detect pupils using Hough Circle Transform
   * @param videoElement - Video element containing the face
   * @param eyeROIs - Region of interest for left and right eyes (optional, improves performance)
   * @returns Pupil detection result with normalized coordinates
   */
  detectPupils(
    videoElement: HTMLVideoElement,
    eyeROIs?: EyeROI
  ): PupilDetectionResult | null {
    if (!this.initialized || !this.cv) {
      console.warn('⚠️ OpenCVPupilDetector not initialized');
      return null;
    }

    try {
      const cv = this.cv;

      // Capture video frame
      const src = new cv.Mat(videoElement.videoHeight, videoElement.videoWidth, cv.CV_8UC4);
      const cap = new cv.VideoCapture(videoElement);
      cap.read(src);

      // Convert to grayscale
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // Apply Gaussian blur to reduce noise
      const blurred = new cv.Mat();
      const ksize = new cv.Size(5, 5);
      cv.GaussianBlur(gray, blurred, ksize, 0);

      // Detect pupils in left and right eye regions
      const leftPupil = eyeROIs
        ? this.detectPupilInROI(blurred, eyeROIs.left)
        : null;
      const rightPupil = eyeROIs
        ? this.detectPupilInROI(blurred, eyeROIs.right)
        : null;

      // Calculate overall confidence
      const leftConf = leftPupil ? this.calculateConfidence(leftPupil.radius) : 0;
      const rightConf = rightPupil ? this.calculateConfidence(rightPupil.radius) : 0;
      const confidence = (leftConf + rightConf) / 2;

      // Normalize coordinates
      const result: PupilDetectionResult = {
        left: leftPupil
          ? {
              x: leftPupil.x / videoElement.videoWidth,
              y: leftPupil.y / videoElement.videoHeight,
              radius: leftPupil.radius
            }
          : null,
        right: rightPupil
          ? {
              x: rightPupil.x / videoElement.videoWidth,
              y: rightPupil.y / videoElement.videoHeight,
              radius: rightPupil.radius
            }
          : null,
        confidence
      };

      // Cleanup
      src.delete();
      gray.delete();
      blurred.delete();

      return result;
    } catch (error) {
      // Throttle error logging to prevent console spam
      this.errorCount++;
      const now = Date.now();
      if (now - this.lastErrorLog > this.errorLogThrottle) {
        console.warn(`⚠️ Pupil detection failed (${this.errorCount} errors in last ${this.errorLogThrottle / 1000}s):`, error);
        this.lastErrorLog = now;
        this.errorCount = 0;
      }
      return null;
    }
  }

  /**
   * Detect pupil in a specific ROI using Hough Circle Transform
   */
  private detectPupilInROI(
    grayImage: any,
    roi: { x: number; y: number; width: number; height: number }
  ): { x: number; y: number; radius: number } | null {
    try {
      const cv = this.cv;

      // Extract ROI
      const rect = new cv.Rect(
        Math.floor(roi.x),
        Math.floor(roi.y),
        Math.floor(roi.width),
        Math.floor(roi.height)
      );
      const eyeRegion = grayImage.roi(rect);

      // Apply adaptive threshold to enhance pupil
      const thresh = new cv.Mat();
      cv.adaptiveThreshold(
        eyeRegion,
        thresh,
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY_INV,
        11, // Block size
        2   // Constant
      );

      // Detect circles using Hough Circle Transform
      const circles = new cv.Mat();
      cv.HoughCircles(
        thresh,
        circles,
        cv.HOUGH_GRADIENT,
        1,              // dp: Inverse ratio of accumulator resolution
        eyeRegion.rows / 8, // minDist: Minimum distance between circle centers
        100,            // param1: Canny edge detector threshold
        30,             // param2: Accumulator threshold (lower = more false positives)
        Math.floor(roi.width * 0.1),  // minRadius: 10% of ROI width
        Math.floor(roi.width * 0.4)   // maxRadius: 40% of ROI width
      );

      // Get the best circle (first detected)
      let pupil: { x: number; y: number; radius: number } | null = null;

      if (circles.cols > 0) {
        // Take the first circle (usually the most prominent)
        const x = circles.data32F[0] + roi.x; // Add ROI offset
        const y = circles.data32F[1] + roi.y; // Add ROI offset
        const radius = circles.data32F[2];

        pupil = { x, y, radius };

        // Log detection (throttled)
        if (Math.random() < 0.01) { // 1% sampling
          console.log('🎯 Pupil detected:', {
            x: x.toFixed(1),
            y: y.toFixed(1),
            radius: radius.toFixed(1)
          });
        }
      }

      // Cleanup
      eyeRegion.delete();
      thresh.delete();
      circles.delete();

      return pupil;
    } catch (error) {
      console.error('❌ ROI pupil detection failed:', error);
      return null;
    }
  }

  /**
   * Calculate confidence score based on pupil radius
   * Typical pupil radius: 15-40 pixels
   */
  private calculateConfidence(radius: number): number {
    // Ideal radius range: 20-35 pixels
    if (radius >= 20 && radius <= 35) {
      return 1.0; // Perfect
    } else if (radius >= 15 && radius <= 45) {
      return 0.7; // Good
    } else if (radius >= 10 && radius <= 50) {
      return 0.4; // Acceptable
    }
    return 0.1; // Poor
  }

  /**
   * Extract eye ROIs from MediaPipe face landmarks
   * @param landmarks - MediaPipe face landmarks (478 points)
   * @param videoWidth - Video width in pixels
   * @param videoHeight - Video height in pixels
   */
  static extractEyeROIs(
    landmarks: Array<{ x: number; y: number; z?: number }>,
    videoWidth: number,
    videoHeight: number
  ): EyeROI {
    // MediaPipe eye landmark indices
    // Left eye: 33 (outer), 133 (inner), 160 (top), 144 (bottom)
    // Right eye: 263 (inner), 362 (outer), 385 (top), 380 (bottom)

    // Left eye ROI
    const leftOuter = landmarks[33];
    const leftInner = landmarks[133];
    const leftTop = landmarks[160];
    const leftBottom = landmarks[144];

    const leftX = Math.min(leftOuter.x, leftInner.x) * videoWidth;
    const leftY = Math.min(leftTop.y, leftBottom.y) * videoHeight;
    const leftWidth = Math.abs(leftInner.x - leftOuter.x) * videoWidth;
    const leftHeight = Math.abs(leftBottom.y - leftTop.y) * videoHeight;

    // Right eye ROI
    const rightInner = landmarks[263];
    const rightOuter = landmarks[362];
    const rightTop = landmarks[385];
    const rightBottom = landmarks[380];

    const rightX = Math.min(rightInner.x, rightOuter.x) * videoWidth;
    const rightY = Math.min(rightTop.y, rightBottom.y) * videoHeight;
    const rightWidth = Math.abs(rightOuter.x - rightInner.x) * videoWidth;
    const rightHeight = Math.abs(rightBottom.y - rightTop.y) * videoHeight;

    // Add 20% padding for better detection
    const padding = 1.2;

    return {
      left: {
        x: leftX - (leftWidth * (padding - 1)) / 2,
        y: leftY - (leftHeight * (padding - 1)) / 2,
        width: leftWidth * padding,
        height: leftHeight * padding
      },
      right: {
        x: rightX - (rightWidth * (padding - 1)) / 2,
        y: rightY - (rightHeight * (padding - 1)) / 2,
        width: rightWidth * padding,
        height: rightHeight * padding
      }
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.initialized = false;
    this.cv = null;
    console.log('🗑️ OpenCVPupilDetector destroyed');
  }
}
