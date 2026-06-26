'use client';

import { useAuthStore } from '@/store/authStore';
import { LogOut } from 'lucide-react';

export function MobileHeader() {
  const { logout } = useAuthStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 pt-[env(safe-area-inset-top)] flex items-center justify-between h-[calc(3.5rem+env(safe-area-inset-top))] md:hidden">
      <div className="flex items-center gap-2">
        <img src="/vastra-logo.png" alt="Vastra Express" className="w-8 h-8 object-contain" />
        <div>
          <p className="font-bold text-gray-900 text-sm leading-tight">Vastra Express</p>
          <p className="text-[10px] text-gray-400 font-medium">Driver Portal</p>
        </div>
      </div>
      <button
        onClick={logout}
        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        title="Logout"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </header>
  );
}
