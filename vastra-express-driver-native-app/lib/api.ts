import axios from 'axios';
import { getToken, removeToken } from './tokenStorage';
import Constants from 'expo-constants';
import { router } from 'expo-router';

const STORE_KEY = 've-driver-auth';

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL:
    Constants.expoConfig?.extra?.apiUrl ??
    process.env.EXPO_PUBLIC_API_URL ??
    'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT on every request
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 → clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await removeToken();
      try {
        router.replace('/(auth)/login');
      } catch {
        // router may not be ready
      }
    }
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    const err = new Error(
      Array.isArray(message) ? message[0] : message
    ) as Error & { status?: number };
    err.status = error.response?.status;
    return Promise.reject(err);
  }
);

export default api;
