'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  PackageSearch,
  Truck,
  CheckCircle2,
  User,
  LogOut,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pickups', label: 'Pickups', icon: PackageSearch },
  { href: '/deliveries', label: 'Deliveries', icon: Truck },
  { href: '/profile', label: 'Profile', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const roleName =
    typeof user?.role === 'string' ? user.role : user?.role?.name ?? 'Driver';

  return (
    <aside className="hidden md:flex w-64 flex-shrink-0 bg-white border-r border-gray-200 flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <img src="/vastra-logo.png" alt="Vastra Express" className="w-8 h-8 object-contain" />
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">Vastra Express</p>
            <p className="text-xs text-gray-400">Driver Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}

        {/* Separator + Completed Tasks shortcut */}
        <div className="pt-2 mt-2 border-t border-gray-100">
          <Link
            href="/pickups?filter=completed"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Completed Tasks
          </Link>
        </div>
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
            <span className="text-violet-700 font-semibold text-xs">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'D'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name ?? 'Driver'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.mobileNumber ?? ''}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
