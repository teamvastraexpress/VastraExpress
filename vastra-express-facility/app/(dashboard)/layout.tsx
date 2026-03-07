'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/authStore';
import { getToken } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loading } from '@/components/ui/Loading';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, _hasHydrated, logout, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated) return;

    // If Zustand says authenticated but JWT cookie is gone, force logout
    if (isAuthenticated && !getToken()) {
      logout();
      router.replace('/login');
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Only FACILITY_STAFF should access this portal
    // role can be a plain string from verifyOtp or an object from getProfile
    const roleName = user ? (typeof user.role === 'string' ? user.role : user.role?.name) : null;
    if (user && roleName !== 'FACILITY_STAFF') {
      logout();
      router.replace('/login?error=unauthorized');
    }
  }, [isAuthenticated, _hasHydrated, logout, router, user]);

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
