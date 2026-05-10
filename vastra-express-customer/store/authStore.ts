import { create } from 'zustand';
import api from '@/lib/api';
import { saveToken, deleteToken } from '@/lib/tokenStorage';
import type { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user } = res.data;

      // Ensure user is a customer
      const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name ?? '';
      if (roleName !== 'CUSTOMER') {
        throw new Error('This account is not registered as a customer.');
      }

      await saveToken(accessToken);
      set({ user, isLoading: false, error: null });

      // Load full profile
      try {
        const profileRes = await api.get('/auth/profile');
        set({ user: profileRes.data });
      } catch {
        // non-fatal
      }
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  loadProfile: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/auth/profile');
      set({ user: res.data, isLoading: false });
    } catch (e: any) {
      const status = e?.status;
      if (status === 401 || status === 403) {
        await deleteToken().catch(() => {});
        set({ user: null });
      }
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.put('/users/profile', data);
      set({ user: res.data, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  logout: async () => {
    await deleteToken();
    set({ user: null, error: null });
    api.post('/auth/logout').catch(() => {});
  },

  clearError: () => set({ error: null }),
}));
