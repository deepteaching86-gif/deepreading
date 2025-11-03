/**
 * Vision Tracking WebSocket Client
 *
 * Real-time eye tracking communication with backend Vision API
 */

export interface GazeData {
  x: number;
  y: number;
  timestamp: number;
  pupil_left?: {
    center: [number, number];
    radius: number;
  };
  pupil_right?: {
    center: [number, number];
    radius: number;
  };
  head_pose?: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  confidence: number;
  debugImage?: string;  // Base64 디버그 시각화 이미지
}

export interface CalibrationPoint {
  screen_x: number;
  screen_y: number;
  gaze_x: number;
  gaze_y: number;
  timestamp: number;
}

export class VisionWebSocketClient {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private onGazeCallback: ((data: GazeData) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  constructor(private backendUrl: string) {}

  /**
   * Connect to Vision tracking WebSocket
   */
  async connect(sessionId: string): Promise<void> {
    this.sessionId = sessionId;
    const wsUrl = this.backendUrl.replace('http', 'ws') + `/api/vision/ws/${sessionId}`;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ Vision WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            // Handle different message types
            if (message.type === 'gaze_data') {
              const data: GazeData = {
                x: message.x,
                y: message.y,
                timestamp: message.timestamp,
                pupil_left: message.pupilLeft || message.pupil_left,
                pupil_right: message.pupilRight || message.pupil_right,
                head_pose: message.headPose || message.head_pose,
                confidence: message.confidence,
                debugImage: message.debugImage
              };
              if (this.onGazeCallback) {
                this.onGazeCallback(data);
              }
            } else if (message.type === 'error') {
              console.error('Vision tracking error:', message.message);
              if (this.onErrorCallback) {
                this.onErrorCallback(message.message);
              }
            } else if (message.type === 'warning') {
              console.warn('Vision tracking warning:', message.message);
              if (this.onErrorCallback) {
                this.onErrorCallback(`Warning: ${message.message}`);
              }
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (this.onErrorCallback) {
            this.onErrorCallback('WebSocket connection error');
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.onErrorCallback) {
        this.onErrorCallback('Max reconnection attempts reached');
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.sessionId) {
        this.connect(this.sessionId);
      }
    }, delay);
  }

  /**
   * Send video frame to backend for tracking
   */
  sendFrame(imageData: string, screenWidth: number, screenHeight: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }

    const frameData = {
      image: imageData,
      timestamp: Date.now(),
      screenWidth,
      screenHeight,
    };

    this.ws.send(JSON.stringify(frameData));
  }

  /**
   * Register callback for gaze data
   */
  onGaze(callback: (data: GazeData) => void): void {
    this.onGazeCallback = callback;
  }

  /**
   * Register callback for errors
   */
  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.sessionId = null;
    this.onGazeCallback = null;
    this.onErrorCallback = null;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * Vision API REST endpoints
 */
export class VisionAPI {
  constructor(private backendUrl: string) {}

  /**
   * Start a new Vision tracking session
   */
  async startSession(studentId: string, templateId: string): Promise<string> {
    const response = await fetch(`${this.backendUrl}/api/vision/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_id: studentId,
        template_id: templateId,
        device_info: {
          userAgent: navigator.userAgent,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to start Vision session');
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Save calibration data
   */
  async saveCalibration(
    sessionId: string,
    calibrationPoints: CalibrationPoint[],
    accuracy: number
  ): Promise<void> {
    const response = await fetch(`${this.backendUrl}/api/vision/sessions/${sessionId}/calibration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        points: calibrationPoints,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        accuracy,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save calibration');
    }
  }

  /**
   * Test Vision API health
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/api/vision/test`);
      const data = await response.json();
      return data.status === 'ok';
    } catch (error) {
      console.error('Vision API connection test failed:', error);
      return false;
    }
  }
}
