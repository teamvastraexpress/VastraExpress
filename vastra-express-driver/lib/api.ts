import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_BASE_URL } from '@/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use(async (config) => {
  try {
    let token: string | null = null;
    if (Platform.OS === 'web') {
      token = typeof localStorage !== 'undefined' ? localStorage.getItem('driver_token') : null;
    } else {
      token = await SecureStore.getItemAsync('driver_token');
    }
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // silently ignore token read errors
  }
  return config;
});

// Global error handler
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';
    return Promise.reject(new Error(Array.isArray(message) ? message[0] : message));
  },
);

export default api;
