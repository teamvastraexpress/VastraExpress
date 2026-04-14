import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api, { setToken, removeToken } from '@/lib/api';
import type { AuthUser, SendOtpResponse } from '@/types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  isLoading: boolean;
  error: string | null;

  sendOtp: (mobile: string) => Promise<{ isNewUser: boolean; debugOtp?: string }>;
  verifyOtp: (mobile: string, otp: string) => Promise<void>;
  setAuth: (user: AuthUser, token: string) => void;
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
          // Pass expectedRole so the backend blocks the OTP entirely
          // if the number is not pre-registered as a DRIVER.
          const res = await api.post<SendOtpResponse>('/auth/send-otp', {
            mobileNumber: mobile,
            expectedRole: 'DRIVER',
          });
          set({ isLoading: false });
          return {
            isNewUser: res.data.isNewUser ?? false,
            debugOtp: res.data.debugOtp,
          };
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
          const { accessToken, user } = res.data;

          // Role gate: only DRIVER accounts allowed
          const roleName =
            typeof user?.role === 'string' ? user.role : user?.role?.name ?? '';
          if (roleName !== 'DRIVER') {
            set({ isLoading: false, error: 'This number is not registered as a driver.' });
            throw new Error('Not a driver account');
          }

          setToken(accessToken);

          // Fetch full profile
          let fullUser = user;
          try {
            const profileRes = await api.get('/auth/profile');
            fullUser = profileRes.data;
            if (fullUser.isActive === false) {
              removeToken();
              set({
                user: null, token: null, isAuthenticated: false, isLoading: false,
                error: 'Your account is pending admin approval.',
              });
              throw new Error('Account not approved');
            }
          } catch (profileErr: unknown) {
            const msg = profileErr instanceof Error ? profileErr.message : '';
            if (msg === 'Account not approved') throw profileErr;
          }

          set({ user: fullUser, token: accessToken, isAuthenticated: true, isLoading: false });
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

      logout: () => {
        removeToken();
        set({ user: null, token: null, isAuthenticated: false });
      },

      clearError: () => set({ error: null }),

      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 've-driver-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
