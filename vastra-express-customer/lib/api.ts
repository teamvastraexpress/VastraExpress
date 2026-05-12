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

// Normalize error messages but keep the original error structure for status checks
api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Extract the most descriptive message possible
    const data = error.response?.data;
    const message = data?.message || error.message || 'An unexpected error occurred';
    
    // Create a readable message (handle arrays from class-validator)
    const displayMessage = Array.isArray(message) ? message[0] : message;
    
    // Attach the display message to the error object so screens can use err.message
    error.message = displayMessage;
    
    return Promise.reject(error);
  },
);

export default api;
