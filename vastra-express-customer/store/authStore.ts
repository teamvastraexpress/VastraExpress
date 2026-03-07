import { create } from 'zustand';
import api from '@/lib/api';
import { saveToken, deleteToken } from '@/lib/tokenStorage';
import type { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  isNewUser: boolean;
  isLoading: boolean;
  error: string | null;

  sendOtp: (mobile: string) => Promise<{ isNewUser: boolean }>;
  verifyOtp: (mobile: string, otp: string) => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isNewUser: false,
  isLoading: false,
  error: null,

  sendOtp: async (mobile) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/send-otp', { mobileNumber: mobile });
      set({ isLoading: false });
      return { isNewUser: res.data.isNewUser ?? true };
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  verifyOtp: async (mobile, otp) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/verify-otp', { mobileNumber: mobile, otp });
      const { accessToken, user, isNewUser: serverIsNew } = res.data;

      // Block accounts that have a non-CUSTOMER role (staff, drivers, etc.)
      if (user?.role && user.role !== 'CUSTOMER') {
        set({ isLoading: false, error: 'This app is for customers only.' });
        throw new Error('This app is for customers only.');
      }

      await saveToken(accessToken);

      // Use server-provided flag; fall back to checking if name is a placeholder
      const isNew = serverIsNew ?? (!user?.name || user.name === 'New Customer');
      set({ user, isLoading: false, error: null, isNewUser: isNew });

      // Load full profile for isActive, email etc.
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
      // e.status is preserved by the api.ts response interceptor
      const status = e?.status;
      if (status === 401 || status === 403) {
        // Token is expired or user is invalid – clear it so re-login is forced
        await deleteToken().catch(() => {});
      }
      set({ user: null, isLoading: false });
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
    set({ user: null, error: null, isNewUser: false });
    api.post('/auth/logout').catch(() => {});
  },

  clearError: () => set({ error: null }),
}));
