import axios, { AxiosRequestConfig } from 'axios';

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

axiosInstance.interceptors.response.use(
  (response) => {
    return response.data.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAuthRoute = currentPath.startsWith('/account');
        clearStoredAuth();
        if (!isAuthRoute) {
          window.location.href = '/account/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.get(url, config);
  },
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.post(url, data, config);
  },
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.put(url, data, config);
  },
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.delete(url, config);
  },
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.patch(url, data, config);
  },
};

export default apiClient;
