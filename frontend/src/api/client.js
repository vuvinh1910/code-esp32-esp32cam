import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const hasValue = (value) => value !== null && value !== undefined && value !== '';
const compactParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => hasValue(value)));

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== Auth API =====
export const authAPI = {
  login: (username, password) => apiClient.post('/api/auth/login', { username, password }),
  register: (username, password, email) => apiClient.post('/api/auth/register', { username, password, email }),
};

// ===== Dashboard Summary API =====
export const dashboardAPI = {
  getSummary: (deviceId) => apiClient.get('/api/status', { params: compactParams({ deviceId }) }),
};

// ===== Sensor API =====
export const sensorAPI = {
  create: (data) => apiClient.post('/api/sensors', data),
  getReadings: (deviceId, params = {}) => {
    const requestParams = compactParams({ deviceId, ...params });
    const path = hasValue(deviceId) ? '/api/sensors' : '/api/readings';
    return apiClient.get(path, { params: requestParams });
  },
};

// ===== Pump API =====
export const pumpAPI = {
  control: (deviceId, action) => apiClient.post('/api/pump', { deviceId, action }),
  getHistory: (deviceId) => {
    if (hasValue(deviceId)) {
      return apiClient.get(`/api/pump/history/${deviceId}`);
    }
    return apiClient.get('/api/pump-history');
  },
};

// ===== Config API =====
export const configAPI = {
  get: (deviceId) => {
    if (!hasValue(deviceId)) {
      return Promise.reject(new Error('deviceId is required to fetch watering config'));
    }
    return apiClient.get(`/api/configs/${deviceId}`);
  },
  upsert: (data) => apiClient.post('/api/configs', data),
};

// ===== Firmware API =====
export const firmwareAPI = {
  getAll: () => apiClient.get('/api/firmware'),
  latest: (deviceType) => apiClient.get('/api/firmware/latest', { params: { deviceType } }),
  byVersion: (version) => apiClient.get(`/api/firmware/${version}`),
  create: (data) => apiClient.post('/api/firmware', data),
  rollback: (version) => apiClient.post(`/api/firmware/${version}/rollback`),
};

// ===== User API =====
export const userAPI = {
  getAll: () => apiClient.get('/api/admin/users'),
  delete: (id) => apiClient.delete(`/api/admin/users/${id}`),
};

// ===== Device API =====
export const deviceAPI = {
  getAll: () => apiClient.get('/api/devices'),
  getOne: (id) => apiClient.get(`/api/devices/${id}`),
  create: (data) => apiClient.post('/api/devices', data),
  update: (id, data) => apiClient.put(`/api/devices/${id}`, data),
  delete: (id) => apiClient.delete(`/api/devices/${id}`),
};

export default apiClient;
