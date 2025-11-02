// OpenCV.js Dynamic Loader
// Loads OpenCV.js from CDN only when needed to reduce initial bundle size

// Declare global cv namespace
declare global {
  interface Window {
    cv: any;
  }
}

let opencvLoaded = false;
let opencvLoadPromise: Promise<void> | null = null;

/**
 * Dynamically load OpenCV.js from CDN
 * Returns a promise that resolves when OpenCV is ready
 */
export async function loadOpenCV(): Promise<void> {
  // If already loaded, return immediately
  if (opencvLoaded && window.cv) {
    console.log('✅ OpenCV.js already loaded');
    return Promise.resolve();
  }

  // If currently loading, return existing promise
  if (opencvLoadPromise) {
    console.log('⏳ OpenCV.js loading in progress...');
    return opencvLoadPromise;
  }

  // Start loading
  console.log('🔧 Loading OpenCV.js from CDN...');

  opencvLoadPromise = new Promise((resolve, reject) => {
    // Create script element
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://docs.opencv.org/4.x/opencv.js';

    // Success handler
    script.onload = () => {
      // Wait for cv to be ready
      const checkInterval = setInterval(() => {
        if (window.cv && window.cv.Mat) {
          clearInterval(checkInterval);
          opencvLoaded = true;
          console.log('✅ OpenCV.js loaded successfully');
          console.log('📊 OpenCV version:', window.cv.getBuildInformation());
          resolve();
        }
      }, 100);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!opencvLoaded) {
          reject(new Error('OpenCV.js initialization timeout'));
        }
      }, 30000);
    };

    // Error handler
    script.onerror = () => {
      opencvLoadPromise = null;
      reject(new Error('Failed to load OpenCV.js from CDN'));
    };

    // Append to document
    document.head.appendChild(script);
  });

  return opencvLoadPromise;
}

/**
 * Check if OpenCV is loaded
 */
export function isOpenCVLoaded(): boolean {
  return opencvLoaded && !!window.cv;
}

/**
 * Get OpenCV instance (assumes already loaded)
 */
export function getOpenCV(): any {
  if (!isOpenCVLoaded()) {
    throw new Error('OpenCV.js not loaded. Call loadOpenCV() first.');
  }
  return window.cv;
}
