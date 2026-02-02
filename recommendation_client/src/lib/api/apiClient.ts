import axios, { AxiosRequestConfig, AxiosError } from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const AUTH_STORAGE_KEYS = {
  accessToken: 'technova_access_token',
  refreshToken: 'technova_refresh_token',
  user: 'technova_user',
  legacyAccessToken: 'accessToken',
  legacyRefreshToken: 'refreshToken',
  legacyUser: 'user',
};

const getStoredAccessToken = (): string | null => {
  return (
    localStorage.getItem(AUTH_STORAGE_KEYS.accessToken) ||
    localStorage.getItem(AUTH_STORAGE_KEYS.legacyAccessToken)
  );
};

const clearStoredAuth = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.user);
  localStorage.removeItem(AUTH_STORAGE_KEYS.legacyAccessToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.legacyRefreshToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.legacyUser);
};

axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window === 'undefined') {
      return config;
    }
    const token = getStoredAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

type ApiErrorPayload = {
  message?: string;
  error?: string;
  details?: string;
};

const extractErrorMessage = (error: AxiosError<ApiErrorPayload>): string => {
  const fallbackMessage = 'An unexpected error occurred. Please try again.';
  
  if (error.response?.data) {
    return (
      error.response.data.message || 
      error.response.data.error || 
      error.response.data.details ||
      fallbackMessage
    );
  }
  
  return error.message || fallbackMessage;
};

const handleUnauthorizedError = () => {
  if (typeof window === 'undefined') return;
  
  const currentPath = window.location.pathname;
  const isAuthRoute = currentPath.startsWith('/account');
  
  if (!isAuthRoute) {
    clearStoredAuth();
    window.location.href = '/account/login';
  }
};

const createEnhancedError = (message: string, originalError: AxiosError<ApiErrorPayload>): Error => {
  const enhancedError = new Error(message);
  Object.assign(enhancedError, {
    response: originalError.response,
    status: originalError.response?.status,
    statusText: originalError.response?.statusText,
  });
  return enhancedError;
};

axiosInstance.interceptors.response.use(
  (response) => {
    return response.data.data;
  },
  (error) => {
    const errorMessage = extractErrorMessage(error);
    
    if (error.response?.status === 401) {
      handleUnauthorizedError();
    }
    
    return Promise.reject(createEnhancedError(errorMessage, error));
  }
);

const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.get(url, config);
  },
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.post(url, data, config);
  },
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.put(url, data, config);
  },
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.delete(url, config);
  },
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.patch(url, data, config);
  },
};

export default apiClient;
