/**
 * English Adaptive Test API Client
 * =================================
 *
 * API endpoints for MST-based English proficiency testing.
 *
 * CHANGELOG:
 * - 2025-01-15 (16:20): Fixed 500 Internal Server Error on response submission
 *   Added backward compatibility for old responses without stage field (r.get('stage', 1))
 *   Ensures seamless operation with pre-existing response records
 *
 * - 2025-01-15 (14:30): Fixed stage tracking bug (Question 14 stop issue)
 *   Backend now properly tracks stage-specific item counts for accurate MST transitions
 */

import axios, { AxiosInstance } from 'axios';

// API Base URL - Use dedicated English Test backend (Python)
const API_BASE_URL = import.meta.env.VITE_ENGLISH_TEST_API_URL || 'http://localhost:8000';

// 🔍 DEBUG: Log the actual API URL being used
console.log('🌐 English Test API Base URL:', API_BASE_URL);
console.log('📦 VITE_ENGLISH_TEST_API_URL env var:', import.meta.env.VITE_ENGLISH_TEST_API_URL);

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000, // 90 seconds - accommodate Render Free Tier cold starts
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
  source?: 'manual' | 'ai_generated'; // Item source for visual distinction
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

export interface LexileDetails {
  score: number;
  confidence_low: number;
  confidence_high: number;
  grade_context: string;
  is_estimated: boolean;
}

export interface DomainScore {
  correct: number;
  total: number;
  percentage: number;
}

export interface DomainScores {
  grammar: DomainScore;
  vocabulary: DomainScore;
  reading: DomainScore;
}

export interface FinalResults {
  session_id: number;
  final_theta: number;
  standard_error: number;
  proficiency_level: number;
  lexile_score: number | null;
  lexile_details: LexileDetails | null;
  ar_level: number | null;
  vocabulary_size: number | null;
  vocabulary_bands: {
    bands: Record<string, { correct: number; total: number; percentage: number }>;
    pseudowords: { correct: number; total: number; accuracy: number };
    confidence: string;
  } | null;
  domain_scores: DomainScores | null;
  total_items: number;
  correct_count: number;
  accuracy_percentage: number;
  completed_at: string;
  score_disclaimer: string | null;
}

// ===== Growth Tracking Types =====

export interface GrowthSession {
  id: number;
  final_theta: number | null;
  standard_error: number | null;
  grammar_score: number | null;
  vocabulary_score: number | null;
  reading_score: number | null;
  items_completed: number;
  started_at: string | null;
  completed_at: string | null;
}

export interface GrowthData {
  sessions: GrowthSession[];
  theta_trend: number;
  domain_trends: { grammar: number; vocabulary: number; reading: number };
  total_tests: number;
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

/**
 * Get growth tracking data for a student
 */
export const getGrowthData = async (userId: string): Promise<GrowthData> => {
  try {
    const response = await apiClient.get<GrowthData>(`/api/english-test/growth/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get growth data:', error);
    throw error;
  }
};

export default {
  startEnglishTest,
  submitResponse,
  getSessionStatus,
  finalizeTest,
  checkHealth,
  getGrowthData,
};
