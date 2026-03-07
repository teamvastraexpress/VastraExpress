import '../global.css';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { getToken } from '@/lib/tokenStorage';
import { useAuthStore } from '@/store/authStore';

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { user, loadProfile } = useAuthStore();
  // Local flag — only true during the initial startup token check.
  // We intentionally do NOT use the store's isLoading here so that
  // in-flight actions (sendOtp, resendOtp, etc.) don't unmount the Stack.
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const check = async () => {
      const token = await getToken();
      if (token) {
        await loadProfile();
      } else {
        const inAuth = segments[0] === '(auth)';
        if (!inAuth) router.replace('/(auth)/login');
      }
      setInitializing(false);
    };
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initializing) return;
    const inAuth = segments[0] === '(auth)';
    const atIndex = segments.length === 0 || segments[0] === 'index';

    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && (inAuth || atIndex)) {
      router.replace('/(tabs)/home');
    }
  }, [user, initializing, segments]);

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthGate>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="task/[id]"
          options={{ headerShown: true, title: 'Task Details', headerBackTitle: 'Back' }}
        />
      </Stack>
    </AuthGate>
  );
}
