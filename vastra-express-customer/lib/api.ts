import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
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
      token = typeof localStorage !== 'undefined' ? localStorage.getItem('customer_token') : null;
    } else {
      token = await SecureStore.getItemAsync('customer_token');
    }
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // silently ignore – request proceeds without auth header
  }
  return config;
});

// Normalise error messages to a single string but preserve HTTP status
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';
    const err = new Error(Array.isArray(message) ? message[0] : message) as any;
    err.status = error.response?.status; // preserve so callers can check 401, 403, etc.
    return Promise.reject(err);
  },
);

export default api;
