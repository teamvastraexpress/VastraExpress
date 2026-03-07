import axios from 'axios';
import Cookies from 'js-cookie';

const TOKEN_KEY = 've_driver_token';
const STORE_KEY = 've-driver-auth';

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getToken = (): string | undefined => Cookies.get(TOKEN_KEY);

export const setToken = (token: string): void => {
  Cookies.set(TOKEN_KEY, token, {
    expires: 7,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
};

export const removeToken = (): void => {
  Cookies.remove(TOKEN_KEY);
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORE_KEY);
    } catch {
      // ignore – storage may be unavailable
    }
  }
};

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 → clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
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
