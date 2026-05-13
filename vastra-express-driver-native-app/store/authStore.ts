import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import api from '@/lib/api';
import { setToken, removeToken } from '@/lib/tokenStorage';
import type { AuthUser } from '@/types';

const AUTH_STORAGE_KEY = 've-driver-auth';

type PersistedAuthState = Pick<AuthState, 'user' | 'token' | 'isAuthenticated'>;

async function readAuthState(): Promise<PersistedAuthState | null> {
  try {
    const raw =
      Platform.OS === 'web'
        ? localStorage.getItem(AUTH_STORAGE_KEY)
        : await AsyncStorage.getItem(AUTH_STORAGE_KEY);

    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedAuthState>;
    return {
      user: parsed.user ?? null,
      token: parsed.token ?? null,
      isAuthenticated: Boolean(parsed.isAuthenticated && parsed.user && parsed.token),
    };
  } catch {
    return null;
  }
}

async function writeAuthState(state: PersistedAuthState): Promise<void> {
  try {
    const serialized = JSON.stringify(state);
    if (Platform.OS === 'web') {
      localStorage.setItem(AUTH_STORAGE_KEY, serialized);
      return;
    }
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, serialized);
  } catch {
    // ignore – storage may be unavailable
  }
}

async function clearAuthState(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore – storage may be unavailable
  }
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<{
    mustChangePassword?: boolean;
    tempToken?: string;
    userName?: string;
  } | void>;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  clearError: () => void;
  setHasHydrated: (v: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  (set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    _hasHydrated: false,
    isLoading: false,
    error: null,

    login: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        const res = await api.post('/auth/login', { email, password });
        const { accessToken, user, mustChangePassword, tempToken } = res.data;

        const roleName =
          typeof user?.role === 'string' ? user.role : user?.role?.name ?? '';
        if (roleName !== 'DRIVER') {
          throw new Error('This account is not registered as a driver.');
        }

        // First-time login — return info for password change
        if (mustChangePassword && tempToken) {
          set({ isLoading: false });
          return { mustChangePassword: true, tempToken, userName: user.name };
        }

        await setToken(accessToken);

        let fullUser = user;
        try {
          const profileRes = await api.get('/auth/profile');
          fullUser = profileRes.data;
          if (fullUser.isActive === false) {
            await removeToken();
            await clearAuthState();
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Your account is pending admin approval.',
            });
            throw new Error('Account not approved');
          }
        } catch (profileErr: unknown) {
          const msg = profileErr instanceof Error ? profileErr.message : '';
          if (msg === 'Account not approved') throw profileErr;
        }

        const nextState = {
          user: fullUser,
          token: accessToken,
          isAuthenticated: true,
        };
        set({ ...nextState, isLoading: false });
        void writeAuthState(nextState);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Login failed';
        set({ isLoading: false, error: msg });
        throw e;
      }
    },

    setAuth: (user, token) => {
      const nextState = { user, token, isAuthenticated: true };
      setToken(token);
      set(nextState);
      void writeAuthState(nextState);
    },

    logout: () => {
      removeToken();
      void clearAuthState();
      set({ user: null, token: null, isAuthenticated: false });
    },

    clearError: () => set({ error: null }),

    setHasHydrated: (v) => set({ _hasHydrated: v }),

    hydrate: async () => {
      const persisted = await readAuthState();
      if (persisted) {
        set({
          user: persisted.user,
          token: persisted.token,
          isAuthenticated: persisted.isAuthenticated,
        });
      }
      set({ _hasHydrated: true });
    },
  })
);
