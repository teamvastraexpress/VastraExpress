'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileNav } from '@/components/layout/MobileNav';
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
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto pt-[calc(3.5rem+env(safe-area-inset-top))] pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pt-0 md:pb-0">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
