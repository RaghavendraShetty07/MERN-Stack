import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getUsers: () => api.get('/auth/users'),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
};

export const serviceAPI = {
  getAll: (all = false) => api.get(`/services${all ? '?all=true' : ''}`),
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
};

export const queueAPI = {
  book: (data) => api.post('/queue/book', data),
  getMyTokens: () => api.get('/queue/my-tokens'),
  getServiceStatus: (serviceId) => api.get(`/queue/${serviceId}/status`),
  callNext: (serviceId) => api.post(`/queue/services/${serviceId}/call-next`),
  startService: (tokenId) => api.post(`/queue/${tokenId}/start`),
  completeService: (tokenId) => api.post(`/queue/${tokenId}/complete`),
  skipToken: (tokenId) => api.post(`/queue/${tokenId}/skip`),
  recallToken: (tokenId) => api.post(`/queue/${tokenId}/recall`),
  cancelToken: (tokenId, reason) => api.post(`/queue/${tokenId}/cancel`, { reason }),
  getAnalytics: () => api.get('/queue/admin/analytics'),
};

export default api;
