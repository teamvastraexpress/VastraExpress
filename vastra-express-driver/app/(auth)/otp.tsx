import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function OtpScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(auth)/login');
  }, [router]);

  return null;
}
