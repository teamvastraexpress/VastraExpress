'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/authStore';
import { getToken } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loading } from '@/components/ui/Loading';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated) return;

    if (isAuthenticated && !getToken()) {
      logout();
      router.replace('/login');
      return;
    }
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, _hasHydrated, logout, router]);

  if (!_hasHydrated || !isAuthenticated) return <Loading fullPage />;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
