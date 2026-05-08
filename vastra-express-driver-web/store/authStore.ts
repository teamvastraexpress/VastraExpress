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

  login: (email: string, password: string) => Promise<void>;
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

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post('/auth/login', {
            email,
            password,
          });
          const { accessToken, user } = res.data;

          const roleName =
            typeof user?.role === 'string' ? user.role : user?.role?.name ?? '';
          if (roleName !== 'DRIVER') {
            throw new Error('This account is not registered as a driver.');
          }

          setToken(accessToken);

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
          const msg = e instanceof Error ? e.message : 'Login failed';
          set({ isLoading: false, error: msg });
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
