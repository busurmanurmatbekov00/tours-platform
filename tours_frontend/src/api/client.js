import axios from 'axios';
import { useAppStore } from '../store/useAppStore';

const API_BASE = 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: API_BASE,
});

// автоматически подставляем токен в каждый запрос
api.interceptors.request.use((config) => {
  const token = useAppStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// если получили 401 — чистим сессию
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAppStore.getState().clearAuth();
    }
    return Promise.reject(error);
  }
);