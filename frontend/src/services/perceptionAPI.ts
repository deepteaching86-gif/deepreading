/**
 * Perception Test API Service
 *
 * Handles all HTTP requests to the Visual Perception Test backend API
 */

import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://literacy-english-test-backend.onrender.com';

// Types
export interface PerceptionSession {
  id: string;
  session_code: string;
  student_id: string;
  grade: number;
  current_phase: 'introduction' | 'calibration' | 'reading' | 'questions' | 'completed';
  status: 'in_progress' | 'completed' | 'abandoned';
  passage?: PerceptionPassage;
  questions?: PerceptionQuestion[];
  calibration_accuracy?: number;
}

export interface PerceptionPassage {
  id: string;
  title: string;
  content: string;
  word_count: number;
  sentence_count: number;
}

export interface PerceptionQuestion {
  id: string;
  question_number: number;
  question_text: string;
  options: Array<{ id: string; text: string }>;
}

export interface GazeData {
  phase: 'introduction' | 'calibration' | 'reading' | 'questions' | 'completed';
  gaze_x: number;
  gaze_y: number;
  confidence: number;
  head_pitch?: number;
  head_yaw?: number;
  head_roll?: number;
  left_pupil_diameter?: number;
  right_pupil_diameter?: number;
  timestamp: Date;
}

export interface ConcentrationMetrics {
  fixation_stability: number;
  reading_pattern_regularity: number;
  regression_frequency: number;
  focus_retention_rate: number;
  reading_speed_consistency: number;
  blink_frequency_score: number;
  fixation_duration_score: number;
  vertical_drift_score: number;
  horizontal_regression_score: number;
  sustained_attention_score: number;
}

export interface GazeAnalysis {
  avg_reading_speed_wpm: number;
  total_fixation_count: number;
  avg_fixation_duration: number;
  saccade_count: number;
  avg_saccade_length: number;
  in_text_gaze_ratio: number;
  regression_count: number;
  line_drift_count: number;
  max_sustained_attention: number;
  distraction_index: number;
  regression_accuracy_corr: number | null;
  fixation_accuracy_corr: number | null;
  speed_accuracy_corr: number | null;
  option_gaze_distribution: { [key: string]: number };
  revisit_frequency: number;
}

export interface PerceptionTestResult {
  id: string;
  session_id: string;
  comprehension_score: number;
  concentration_score: number;
  overall_grade: string;
  concentration_metrics: ConcentrationMetrics;
  gaze_analysis: GazeAnalysis;
  strengths: Array<{ metric: string; value: string; description: string }>;
  improvements: Array<{ metric: string; value: string; description: string }>;
  recommendations: string[];
  created_at: string;
}

export class PerceptionAPI {
  private baseURL: string;

  constructor(backendURL: string = BACKEND_URL) {
    this.baseURL = `${backendURL}/api/perception`;
  }

  /**
   * Test connection to Perception API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('Perception API connection failed:', error);
      return false;
    }
  }

  /**
   * Start a new perception test session
   */
  async startSession(studentId: string, grade: number): Promise<PerceptionSession> {
    try {
      const response = await axios.post(`${this.baseURL}/sessions/start`, {
        student_id: studentId,
        grade: grade
      });
      return response.data;
    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  }

  /**
   * Get session information
   */
  async getSession(sessionId: string): Promise<PerceptionSession> {
    try {
      const response = await axios.get(`${this.baseURL}/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get session:', error);
      throw error;
    }
  }

  /**
   * Save calibration data
   */
  async saveCalibration(
    sessionId: string,
    calibrationPoints: any[],
    calibrationAccuracy: number
  ): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/sessions/${sessionId}/calibration`, {
        calibration_points: calibrationPoints,
        calibration_accuracy: calibrationAccuracy
      });
    } catch (error) {
      console.error('Failed to save calibration:', error);
      throw error;
    }
  }

  /**
   * Save gaze data point
   */
  async saveGazeData(sessionId: string, gazeData: GazeData): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/sessions/${sessionId}/gaze`, gazeData);
    } catch (error) {
      console.error('Failed to save gaze data:', error);
      // Don't throw - gaze data failures shouldn't break the test
    }
  }

  /**
   * Mark reading phase as complete
   */
  async completeReading(sessionId: string): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/sessions/${sessionId}/reading-complete`);
    } catch (error) {
      console.error('Failed to complete reading:', error);
      throw error;
    }
  }

  /**
   * Submit an answer to a question
   */
  async submitAnswer(
    sessionId: string,
    questionId: string,
    selectedAnswer: string,
    responseTime?: number
  ): Promise<{ success: boolean; is_correct: boolean }> {
    try {
      const response = await axios.post(`${this.baseURL}/sessions/${sessionId}/answers`, {
        question_id: questionId,
        selected_answer: selectedAnswer,
        response_time: responseTime
      });
      return response.data;
    } catch (error) {
      console.error('Failed to submit answer:', error);
      throw error;
    }
  }

  /**
   * Complete the test session and get results
   */
  async completeSession(sessionId: string): Promise<PerceptionTestResult> {
    try {
      const response = await axios.post(`${this.baseURL}/sessions/${sessionId}/complete`, {});
      return response.data;
    } catch (error) {
      console.error('Failed to complete session:', error);
      throw error;
    }
  }

  /**
   * Get test result for a session
   */
  async getResult(sessionId: string): Promise<PerceptionTestResult> {
    try {
      const response = await axios.get(`${this.baseURL}/sessions/${sessionId}/result`);
      return response.data;
    } catch (error) {
      console.error('Failed to get result:', error);
      throw error;
    }
  }
}

export default PerceptionAPI;
