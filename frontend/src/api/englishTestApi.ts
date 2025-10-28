/**
 * English Adaptive Test API Client
 * =================================
 *
 * API endpoints for MST-based English proficiency testing.
 */

import axios, { AxiosInstance } from 'axios';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Add request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ===== Type Definitions =====

export interface Item {
  id: number;
  stem: string;
  passage?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  domain: 'grammar' | 'vocabulary' | 'reading';
  skillTag?: string;
  difficulty?: number; // IRT difficulty parameter (b)
}

export interface StartTestResponse {
  session_id: number;
  stage: number;
  panel: string;
  item: Item;
  total_items_planned: number;
  message: string;
}

export interface SubmitResponseResponse {
  is_correct: boolean;
  next_item: Item | null;
  current_theta: number;
  standard_error: number;
  items_completed: number;
  total_items: number;
  stage: number;
  panel: string;
  test_completed: boolean;
}

export interface SessionStatus {
  session_id: number;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  items_completed: number;
  current_theta: number | null;
  current_se: number | null;
  stage: number;
  panel: string;
}

export interface FinalResults {
  session_id: number;
  final_theta: number;
  standard_error: number;
  proficiency_level: number;
  lexile_score: number | null;
  ar_level: number | null;
  vocabulary_size: number | null;
  vocabulary_bands: Record<string, number> | null;
  total_items: number;
  correct_count: number;
  accuracy_percentage: number;
  completed_at: string;
}

// ===== API Functions =====

/**
 * Start a new English adaptive test session
 */
export const startEnglishTest = async (userId: string): Promise<StartTestResponse> => {
  try {
    const response = await apiClient.post<StartTestResponse>('/api/english-test/start', {
      user_id: userId,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to start English test:', error);
    throw error;
  }
};

/**
 * Submit item response and get next item
 */
export const submitResponse = async (
  sessionId: number,
  itemId: number,
  selectedAnswer: string,
  responseTime?: number
): Promise<SubmitResponseResponse> => {
  try {
    const response = await apiClient.post<SubmitResponseResponse>(
      '/api/english-test/submit-response',
      {
        session_id: sessionId,
        item_id: itemId,
        selected_answer: selectedAnswer,
        response_time: responseTime,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to submit response:', error);
    throw error;
  }
};

/**
 * Get current session status
 */
export const getSessionStatus = async (sessionId: number): Promise<SessionStatus> => {
  try {
    const response = await apiClient.get<SessionStatus>(
      `/api/english-test/session/${sessionId}`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get session status:', error);
    throw error;
  }
};

/**
 * Finalize test session and get final results
 */
export const finalizeTest = async (sessionId: number): Promise<FinalResults> => {
  try {
    const response = await apiClient.post<FinalResults>('/api/english-test/finalize', {
      session_id: sessionId,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to finalize test:', error);
    throw error;
  }
};

/**
 * Health check
 */
export const checkHealth = async (): Promise<{ status: string; service: string }> => {
  try {
    const response = await apiClient.get('/api/english-test/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export default {
  startEnglishTest,
  submitResponse,
  getSessionStatus,
  finalizeTest,
  checkHealth,
};
