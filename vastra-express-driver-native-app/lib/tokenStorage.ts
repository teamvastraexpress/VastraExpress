import { Platform } from 'react-native';

const TOKEN_KEY = 've_driver_token';

async function getSecureStore() {
  const module = await import('expo-secure-store');
  return module;
}

export async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    }
    const SecureStore = await getSecureStore();
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
      return;
    }
    const SecureStore = await getSecureStore();
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    // ignore – storage may be unavailable
  }
}

export async function removeToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    const SecureStore = await getSecureStore();
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // ignore
  }
}
