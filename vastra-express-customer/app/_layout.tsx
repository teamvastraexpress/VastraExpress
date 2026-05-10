import '../global.css';
import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { COLORS } from '@/constants';

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { user, loadProfile } = useAuthStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    loadProfile().finally(() => setInitializing(false));
  }, []);

  useEffect(() => {
    if (initializing) return;
    const inAuth = segments[0] === '(auth)';

    if (!user && !inAuth) {
      // Not logged in and not on auth screens → send to login
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      // Logged-in user landed on auth screen → send to home
      router.replace('/(tabs)/home');
    }
  }, [user, initializing, segments]);

  if (initializing) {
    return (
      <View 
        className="flex-1 items-center justify-center bg-white"
        style={{ backgroundColor: COLORS.brandHero }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Typography variant="heading-md" className="mt-4 text-brand-blue">Vastra Express</Typography>
        <Typography variant="caption" className="mt-1">Laundry Service reimagined</Typography>
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}
