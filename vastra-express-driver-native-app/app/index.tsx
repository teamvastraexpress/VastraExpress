import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { Loading } from '@/components/Loading';

export default function IndexRedirect() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  if (!_hasHydrated) return <Loading fullPage />;

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
