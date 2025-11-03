// Vision TEST API Service
import axios from 'axios';
import {
  CheckEnvironmentRequest,
  CheckEnvironmentResponse,
  StartCalibrationRequest,
  StartCalibrationResponse,
  RecordCalibrationPointRequest,
  ValidateCalibrationResponse,
  StartVisionSessionRequest,
  StartVisionSessionResponse,
  SaveGazeDataRequest,
  SubmitVisionSessionRequest,
  GetVisionReportResponse,
  GetGazeReplayResponse
} from '../types/vision.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_VERSION = 'v1';

// Get auth token from zustand persist storage
const getAuthToken = (): string | null => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) return null;

    const parsed = JSON.parse(authStorage);
    return parsed.state?.token || null;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

// Axios instance with auth
const visionAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}/vision`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
visionAPI.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== Calibration APIs =====

export const checkEnvironment = async (
  request: CheckEnvironmentRequest
): Promise<CheckEnvironmentResponse> => {
  const response = await visionAPI.post('/calibration/check-environment', request);
  return response.data;
};

export const startCalibration = async (
  request: StartCalibrationRequest
): Promise<StartCalibrationResponse> => {
  const response = await visionAPI.post('/calibration/start', request);
  return response.data;
};

export const recordCalibrationPoint = async (
  request: RecordCalibrationPointRequest
): Promise<{ success: boolean; pointId: number; error: number; recordedPoints: number; totalPoints: number }> => {
  const response = await visionAPI.post('/calibration/record-point', request);
  return response.data;
};

export const validateCalibration = async (
  calibrationId: string
): Promise<ValidateCalibrationResponse> => {
  const response = await visionAPI.post('/calibration/validate', { calibrationId });
  return response.data;
};

export const getActiveCalibration = async (
  userId: string
): Promise<{ found: boolean; calibration?: any; message?: string }> => {
  const response = await visionAPI.get(`/calibration/active/${userId}`);
  return response.data;
};

// ===== Session APIs =====

export const startVisionSession = async (
  request: StartVisionSessionRequest
): Promise<StartVisionSessionResponse> => {
  const response = await visionAPI.post('/session/start', request);
  return response.data;
};

export const saveGazeData = async (
  request: SaveGazeDataRequest
): Promise<{ success: boolean; saved: boolean; gazeDataId?: string; totalPoints: number; filteredBlinks?: number }> => {
  const response = await visionAPI.post('/session/save-gaze-data', request);
  return response.data;
};

export const submitVisionSession = async (
  request: SubmitVisionSessionRequest
): Promise<{ success: boolean; metricsCalculated: boolean; aiAnalysisScheduled: boolean }> => {
  const response = await visionAPI.post('/session/submit', request);
  return response.data;
};

export const getVisionSession = async (
  sessionId: string
): Promise<any> => {
  const response = await visionAPI.get(`/session/${sessionId}`);
  return response.data;
};

// ===== Metrics APIs =====

export const calculateMetrics = async (
  visionSessionId: string,
  correctAnswers?: number,
  totalQuestions?: number
): Promise<{ success: boolean; metricsId: string; metrics: any }> => {
  const response = await visionAPI.post('/metrics/calculate', {
    visionSessionId,
    correctAnswers,
    totalQuestions
  });
  return response.data;
};

export const getMetrics = async (
  sessionId: string
): Promise<any> => {
  const response = await visionAPI.get(`/metrics/${sessionId}`);
  return response.data;
};

// ===== Analysis APIs =====

export const aiAnalyze = async (
  visionSessionId: string
): Promise<{ success: boolean; analysis: any }> => {
  const response = await visionAPI.post('/analysis/ai-analyze', { visionSessionId });
  return response.data;
};

export const getVisionReport = async (
  sessionId: string
): Promise<GetVisionReportResponse> => {
  const response = await visionAPI.get(`/analysis/${sessionId}/report`);
  return response.data;
};

// ===== Admin APIs =====

export const listVisionSessions = async (
  params?: {
    grade?: number;
    studentId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ sessions: any[]; total: number; limit: number; offset: number }> => {
  const response = await visionAPI.get('/admin/sessions', { params });
  return response.data;
};

export const getGazeReplay = async (
  sessionId: string
): Promise<GetGazeReplayResponse> => {
  const response = await visionAPI.get(`/admin/session/${sessionId}/gaze-replay`);
  return response.data;
};

export const adjustCalibration = async (
  visionSessionId: string,
  adminId: string,
  adjustments: {
    offsetX: number;
    offsetY: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
  },
  notes?: string
): Promise<any> => {
  const response = await visionAPI.post(`/admin/session/${visionSessionId}/adjust-calibration`, {
    visionSessionId,
    adminId,
    adjustments,
    notes
  });
  return response.data;
};

export const getHeatmapData = async (
  sessionId: string
): Promise<{ visionSessionId: string; heatmapData: any[] }> => {
  const response = await visionAPI.get(`/admin/session/${sessionId}/heatmap`);
  return response.data;
};

export const getVisionSessionGazeData = async (
  sessionId: string
): Promise<{ gazePoints: any[]; passageText: string }> => {
  const response = await visionAPI.get(`/admin/session/${sessionId}/gaze-data`);
  return response.data;
};

// ===== Template APIs =====

export const listVisionTemplates = async (
  params?: { grade?: number; status?: string }
): Promise<{ templates: any[] }> => {
  const response = await visionAPI.get('/templates', { params });
  return response.data;
};

export const getVisionTemplate = async (
  templateId: string
): Promise<any> => {
  const response = await visionAPI.get(`/templates/${templateId}`);
  return response.data;
};

export const createVisionTemplate = async (
  template: {
    grade: number;
    title: string;
    description?: string;
    visionConfig: any;
  }
): Promise<{ success: boolean; template: any }> => {
  const response = await visionAPI.post('/templates', template);
  return response.data;
};

export const updateVisionTemplate = async (
  templateId: string,
  updates: {
    title?: string;
    description?: string;
    visionConfig?: any;
    isActive?: boolean;
  }
): Promise<{ success: boolean; template: any }> => {
  const response = await visionAPI.put(`/templates/${templateId}`, updates);
  return response.data;
};

export const deleteVisionTemplate = async (
  templateId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await visionAPI.delete(`/templates/${templateId}`);
  return response.data;
};
