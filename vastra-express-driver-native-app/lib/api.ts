import axios from 'axios';
import { getToken, removeToken } from './tokenStorage';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Platform } from 'react-native';

const STORE_KEY = 've-driver-auth';

function getHostFromUri(uri?: string) {
  if (!uri) {
    return '';
  }

  try {
    const parsed = new URL(uri.includes('://') ? uri : `http://${uri}`);
    return parsed.hostname;
  } catch {
    return '';
  }
}

function getDefaultApiBaseUrl() {
  const configuredUrl =
    Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  if (Platform.OS !== 'web') {
    const hostUri =
      Constants.expoConfig?.hostUri ??
      Constants.expoConfig?.debuggerHost ??
      process.env.EXPO_PACKAGER_HOSTNAME;
    const hostname = getHostFromUri(hostUri);

    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:3000/api`;
    }
  }

  return 'http://localhost:3000/api';
}

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: getDefaultApiBaseUrl(),
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
