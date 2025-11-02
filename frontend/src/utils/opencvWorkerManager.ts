// OpenCV Worker Manager
// Manages Web Worker lifecycle and communication

import type { WorkerInput, WorkerOutput, PupilResult } from '../workers/opencvWorker';

export interface EyeROI {
  left: { x: number; y: number; width: number; height: number };
  right: { x: number; y: number; width: number; height: number };
}

export class OpenCVWorkerManager {
  private worker: Worker | null = null;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private pendingRequests: Map<number, {
    resolve: (result: PupilResult | null) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = new Map();
  private requestId: number = 0;
  private timeout: number = 5000; // 5초 타임아웃

  /**
   * Initialize worker and OpenCV
   */
  async initialize(): Promise<void> {
    if (this.initialized && this.worker) {
      return Promise.resolve();
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      try {
        console.log('🚀 Starting OpenCV Worker...');

        // Create worker
        this.worker = new Worker(
          new URL('../workers/opencvWorker.ts', import.meta.url),
          { type: 'module' }
        );

        // Set up message handler
        this.worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
          this.handleWorkerMessage(event.data);

          if (event.data.type === 'INITIALIZED') {
            this.initialized = true;
            console.log('✅ OpenCV Worker initialized');
            resolve();
          }
        };

        // Set up error handler
        this.worker.onerror = (error) => {
          console.error('❌ Worker error:', error);
          this.initialized = false;
          reject(new Error(`Worker error: ${error.message}`));
        };

        // Send init message
        this.worker.postMessage({ type: 'INIT' } as WorkerInput);

        // Timeout safety
        setTimeout(() => {
          if (!this.initialized) {
            reject(new Error('Worker initialization timeout'));
          }
        }, 10000); // 10초 타임아웃
      } catch (error) {
        console.error('❌ Failed to create worker:', error);
        reject(error);
      }
    });

    return this.initPromise;
  }

  /**
   * Detect pupils using worker
   */
  async detectPupils(
    videoElement: HTMLVideoElement,
    eyeROIs: EyeROI
  ): Promise<PupilResult | null> {
    if (!this.initialized || !this.worker) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        // Create canvas to extract image data
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw video frame to canvas
        ctx.drawImage(videoElement, 0, 0);

        // Extract image data
        const imageData = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Generate unique request ID
        const reqId = this.requestId++;

        // Store request handlers
        this.pendingRequests.set(reqId, {
          resolve,
          reject,
          timestamp: Date.now()
        });

        // Send detection request to worker
        this.worker!.postMessage({
          type: 'DETECT_PUPILS',
          imageData,
          eyeROIs
        } as WorkerInput);

        // Timeout handling
        setTimeout(() => {
          const pending = this.pendingRequests.get(reqId);
          if (pending) {
            this.pendingRequests.delete(reqId);
            reject(new Error('Worker request timeout'));
          }
        }, this.timeout);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle worker message
   */
  private handleWorkerMessage(message: WorkerOutput): void {
    switch (message.type) {
      case 'INITIALIZED':
        // Handled in initialize()
        break;

      case 'PUPILS_DETECTED':
        // Resolve oldest pending request (FIFO)
        const oldestReqId = Array.from(this.pendingRequests.keys())[0];
        if (oldestReqId !== undefined) {
          const pending = this.pendingRequests.get(oldestReqId);
          if (pending) {
            this.pendingRequests.delete(oldestReqId);
            pending.resolve(message.result || null);

            // Log processing time
            if (message.processingTime) {
              console.log(
                `[Worker] ⚡ Processed in ${message.processingTime.toFixed(1)}ms`
              );
            }
          }
        }
        break;

      case 'ERROR':
        // Reject all pending requests
        this.pendingRequests.forEach((pending) => {
          pending.reject(new Error(message.error || 'Worker error'));
        });
        this.pendingRequests.clear();
        console.error('[Worker] ❌ Error:', message.error);
        break;

      case 'TERMINATED':
        console.log('[Worker] 🛑 Worker terminated');
        this.cleanup();
        break;

      default:
        console.warn('[Worker] ⚠️ Unknown message type:', message.type);
    }
  }

  /**
   * Terminate worker
   */
  terminate(): void {
    if (this.worker) {
      console.log('🛑 Terminating OpenCV Worker...');
      this.worker.postMessage({ type: 'TERMINATE' } as WorkerInput);
      this.cleanup();
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Reject all pending requests
    this.pendingRequests.forEach((pending) => {
      pending.reject(new Error('Worker terminated'));
    });
    this.pendingRequests.clear();

    // Terminate worker
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.initialized = false;
    this.initPromise = null;
  }

  /**
   * Check if worker is ready
   */
  isReady(): boolean {
    return this.initialized && this.worker !== null;
  }

  /**
   * Get pending request count
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

// Singleton instance
let workerManagerInstance: OpenCVWorkerManager | null = null;

/**
 * Get shared worker manager instance
 */
export function getWorkerManager(): OpenCVWorkerManager {
  if (!workerManagerInstance) {
    workerManagerInstance = new OpenCVWorkerManager();
  }
  return workerManagerInstance;
}

/**
 * Cleanup worker manager
 */
export function cleanupWorkerManager(): void {
  if (workerManagerInstance) {
    workerManagerInstance.terminate();
    workerManagerInstance = null;
  }
}
