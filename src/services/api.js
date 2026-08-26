import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')
});

const apiOrigin = new URL(api.defaults.baseURL, window.location.origin).origin;

export function mediaUrl(value) {
  if (!value) return '';

  if (value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }

  if (value.startsWith('/uploads/')) {
    return `${apiOrigin}${value}`;
  }

  try {
    const parsed = new URL(value);
    if (['localhost', '127.0.0.1'].includes(parsed.hostname) && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      return `${apiOrigin}${parsed.pathname}`;
    }
  } catch {
    return value;
  }

  return value;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('judge');
    }
    return Promise.reject(error);
  }
);
