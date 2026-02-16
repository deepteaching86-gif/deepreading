import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 180000, // 3 minutes default timeout for AI grading operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Cold start retry config ---
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 2000; // 2s, 4s, 8s

interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

function isColdStartError(error: AxiosError): boolean {
  // Network timeout or connection refused
  if (!error.response && (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK')) {
    return true;
  }
  // 500/502/503 from Render during cold start
  const status = error.response?.status;
  if (status === 500 || status === 502 || status === 503) {
    return true;
  }
  return false;
}

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with cold start retry
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig;
    if (!config) return Promise.reject(error);

    // Handle 401 — token expired
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Retry on cold start errors
    const retryCount = config._retryCount || 0;
    if (isColdStartError(error) && retryCount < MAX_RETRIES) {
      config._retryCount = retryCount + 1;
      const delay = RETRY_BASE_DELAY * Math.pow(2, retryCount); // 2s, 4s, 8s
      console.log(`🔄 서버 연결 재시도 (${config._retryCount}/${MAX_RETRIES}) — ${delay / 1000}초 후...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return axiosInstance(config);
    }

    return Promise.reject(error);
  }
);

// --- Server warm-up utility ---
let _serverReady = false;
let _warmupPromise: Promise<boolean> | null = null;

export function warmUpServer(): Promise<boolean> {
  if (_serverReady) return Promise.resolve(true);
  if (_warmupPromise) return _warmupPromise;

  _warmupPromise = (async () => {
    for (let i = 0; i < MAX_RETRIES + 1; i++) {
      try {
        await axios.get(`${API_BASE}/health`, { timeout: 15000 });
        _serverReady = true;
        console.log('✅ 서버 연결 완료');
        return true;
      } catch {
        if (i < MAX_RETRIES) {
          const delay = RETRY_BASE_DELAY * Math.pow(2, i);
          console.log(`⏳ 서버 준비 대기 중 (${i + 1}/${MAX_RETRIES + 1})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    console.warn('⚠️ 서버 응답 없음 — 계속 진행');
    return false;
  })();

  return _warmupPromise;
}

export function isServerReady() {
  return _serverReady;
}

export default axiosInstance;
