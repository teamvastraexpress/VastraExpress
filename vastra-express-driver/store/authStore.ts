import { create } from 'zustand';
import api from '@/lib/api';
import { saveToken, deleteToken } from '@/lib/tokenStorage';
import type { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  debugOtp: string | null;

  // Actions
  sendOtp: (mobile: string) => Promise<{ isNewUser: boolean; debugOtp?: string }>;
  verifyOtp: (mobile: string, otp: string) => Promise<void>;
  loadProfile: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  clearDebugOtp: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  debugOtp: null,

  sendOtp: async (mobile) => {
    set({ isLoading: true, error: null, debugOtp: null });
    try {
      const res = await api.post('/auth/send-otp', { mobileNumber: mobile });
      const result = { isNewUser: res.data.isNewUser };
      if (res.data.debugOtp) {
        set({ debugOtp: res.data.debugOtp });
        result.debugOtp = res.data.debugOtp;
      }
      set({ isLoading: false });
      return result;
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  verifyOtp: async (mobile, otp) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/verify-otp', { mobileNumber: mobile, otp });
      const { accessToken, user } = res.data;

      // Gate 1: only DRIVER accounts may log in here
      if (!user || user?.role !== 'DRIVER') {
        set({
          isLoading: false,
          error: 'This number is not registered as a driver. Please contact your admin.',
        });
        throw new Error('Not a driver account');
      }

      // Save token so profile fetch can use it
      await saveToken(accessToken);
      set({ token: accessToken, user, isLoading: false, error: null });

      // Fetch full profile to get isActive, email, etc.
      try {
        const profileRes = await api.get('/auth/profile');
        const fullProfile = profileRes.data;

        // Gate 2: driver must be approved (isActive) by admin
        if (fullProfile.isActive === false) {
          await deleteToken();
          set({
            user: null,
            token: null,
            isLoading: false,
            error: 'Your account is pending admin approval. Please contact your manager.',
          });
          throw new Error('Account not yet approved');
        }

        set({ user: fullProfile });
      } catch (profileErr: any) {
        // Re-throw if it's our approval error, otherwise non-fatal
        if (profileErr.message === 'Account not yet approved') throw profileErr;
      }
    } catch (e: any) {
      set((s) => ({
        isLoading: false,
        error: s.error ?? e.message,
      }));
      throw e;
    }
  },

  loadProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/auth/profile');
      set({ user: res.data, isLoading: false });
    } catch (e: any) {
      // Token invalid or expired
      set({ user: null, token: null, isLoading: false });
    }
  },

  logout: async () => {
    await deleteToken();
    set({ user: null, token: null, error: null });
    // Best-effort server-side logout (non-blocking)
    api.post('/auth/logout').catch(() => {});
  },

  clearError: () => set({ error: null }),
}));
