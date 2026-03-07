import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api, { setToken, removeToken } from '@/lib/api';
import type { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  isLoading: boolean;
  error: string | null;

  sendOtp: (mobile: string) => Promise<{ isNewUser: boolean }>;
  verifyOtp: (mobile: string, otp: string) => Promise<{ isNewUser: boolean }>;
  setAuth: (user: AuthUser, token: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  clearError: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,
      isLoading: false,
      error: null,

      sendOtp: async (mobile) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post('/auth/send-otp', { mobileNumber: mobile });
          set({ isLoading: false });
          return { isNewUser: res.data.isNewUser ?? false };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Failed to send OTP';
          set({ isLoading: false, error: msg });
          throw e;
        }
      },

      verifyOtp: async (mobile, otp) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post('/auth/verify-otp', { mobileNumber: mobile, otp });
          const { accessToken, user, isNewUser: newUser } = res.data;

          // Role gate: CUSTOMER only
          const roleName =
            typeof user?.role === 'string' ? user.role : user?.role?.name ?? '';
          if (roleName !== 'CUSTOMER') {
            set({
              isLoading: false,
              error: 'This number is not registered as a customer. Please use the correct app.',
            });
            throw new Error('Not a customer account');
          }

          setToken(accessToken);

          let fullUser = user;
          try {
            const profileRes = await api.get('/auth/profile');
            fullUser = profileRes.data;
          } catch {
            // non-fatal — use token-extracted user
          }

          set({ user: fullUser, token: accessToken, isAuthenticated: true, isLoading: false });
          return { isNewUser: newUser ?? false };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'OTP verification failed';
          set((s) => ({ isLoading: false, error: s.error ?? msg }));
          throw e;
        }
      },

      setAuth: (user, token) => {
        setToken(token);
        set({ user, token, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        removeToken();
        set({ user: null, token: null, isAuthenticated: false });
      },

      clearError: () => set({ error: null }),

      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 've-customer-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
