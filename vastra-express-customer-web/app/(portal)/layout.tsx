'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getToken } from '@/lib/api';
import { Loading } from '@/components/ui/Loading';
import { PortalNav } from '@/components/layout/PortalNav';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;
    const token = getToken();
    if (!isAuthenticated || !token) {
      const path = window.location.pathname;
      router.replace(`/login?from=${encodeURIComponent(path)}`);
      return;
    }

    if (!user?.mobileNumber && window.location.pathname !== '/complete-profile') {
      router.replace('/complete-profile');
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  if (!_hasHydrated) return <Loading fullPage />;

  const token = getToken();
  if (!isAuthenticated || !token) return <Loading fullPage />;
  if (!user?.mobileNumber && window.location.pathname !== '/complete-profile') return <Loading fullPage />;

  return (
    <div className="min-h-screen" style={{ background: '#F7FBFF' }}>
      <PortalNav />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
