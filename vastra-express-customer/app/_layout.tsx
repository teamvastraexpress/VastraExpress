import '../global.css';
import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { user, loadProfile, isNewUser } = useAuthStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    loadProfile().finally(() => setInitializing(false));
  }, []);

  useEffect(() => {
    if (initializing) return;
    const inAuth = segments[0] === '(auth)';
    const onRegister = segments[1] === 'register';

    if (!user && !inAuth) {
      // Not logged in and not on auth screens → send to login
      router.replace('/(auth)/login');
    } else if (user && inAuth && !onRegister && !isNewUser) {
      // Logged-in existing user landed on auth screen → send to home
      router.replace('/(tabs)/home');
    }
    // New users on register screen: stay there
  }, [user, initializing, segments, isNewUser]);

  if (initializing) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}
