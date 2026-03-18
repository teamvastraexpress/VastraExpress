'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingBag,
  CalendarPlus,
  MapPin,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'My Orders', icon: ShoppingBag },
  { href: '/book', label: 'Book Pickup', icon: CalendarPlus },
  { href: '/addresses', label: 'Addresses', icon: MapPin },
  { href: '/profile', label: 'Profile', icon: User },
];

export function PortalNav() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 bg-white border-b shadow-sm"
      style={{ borderColor: '#A8D8F0' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-6">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: '#1A6FC4' }}
            >
              <span className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>VE</span>
            </div>
            <span
              className="font-bold hidden sm:block"
              style={{ fontFamily: 'var(--font-display)', color: '#1B2A3B', fontSize: '15px' }}
            >
              Vastra <span style={{ color: '#1A6FC4' }}>Express</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-[#1A6FC4]'
                      : 'hover:bg-[#E8F4FB] hover:text-[#1A6FC4]',
                  )}
                  style={{
                    background: isActive ? '#E8F4FB' : undefined,
                    color: isActive ? '#1A6FC4' : '#4A5A6B',
                    fontFamily: 'var(--font-ui)',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right: user info + logout */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            <div className="text-right">
              <p
                className="text-sm font-semibold"
                style={{ color: '#1B2A3B', fontFamily: 'var(--font-heading)' }}
              >
                {user?.name ?? 'Customer'}
              </p>
              <p className="text-xs" style={{ color: '#8FA3B1' }}>{user?.mobileNumber}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg transition-colors hover:bg-red-50"
              title="Logout"
              style={{ color: '#dc2626' }}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors hover:bg-[#E8F4FB] ml-auto"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen
              ? <X className="w-5 h-5" style={{ color: '#1A6FC4' }} />
              : <Menu className="w-5 h-5" style={{ color: '#4A5A6B' }} />
            }
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t bg-white px-4 py-3 space-y-1"
          style={{ borderColor: '#A8D8F0' }}
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: isActive ? '#E8F4FB' : undefined,
                  color: isActive ? '#1A6FC4' : '#4A5A6B',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}

          <div className="border-t pt-2 mt-1" style={{ borderColor: '#A8D8F0' }}>
            <button
              onClick={() => { logout(); setMobileOpen(false); }}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium w-full rounded-lg hover:bg-red-50 transition-colors"
              style={{ color: '#dc2626', fontFamily: 'var(--font-ui)' }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
