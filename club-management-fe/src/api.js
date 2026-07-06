import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 Unauthorized globally with automatic silent refresh
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          const payload = res.data?.data || res.data;
          const newAccessToken = payload.accessToken;
          const newRefreshToken = payload.refreshToken;
          if (newAccessToken) {
            localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          console.error('[API] Refresh token expired or invalid:', refreshErr);
        }
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
