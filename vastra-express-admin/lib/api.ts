import axios from 'axios';
import Cookies from 'js-cookie';

const TOKEN_KEY = 've_admin_token';
/** localStorage key used by the Zustand auth store (must match store/authStore.ts) */
const STORE_KEY = 've-admin-auth';

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getToken = (): string | undefined => Cookies.get(TOKEN_KEY);

export const setToken = (token: string): void => {
  Cookies.set(TOKEN_KEY, token, {
    expires: 7,       // 7 days — matches backend JWT expiry
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
};

export const removeToken = (): void => {
  Cookies.remove(TOKEN_KEY);
  // Also wipe the persisted Zustand store so isAuthenticated is reset on next load
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORE_KEY);
    } catch {
      // ignore – storage may be unavailable (private mode, etc.)
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
    return Promise.reject(error);
  }
);

export default api;
