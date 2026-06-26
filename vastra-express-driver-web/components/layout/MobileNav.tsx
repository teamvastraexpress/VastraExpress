'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, PackageSearch, Truck, User } from 'lucide-react';

const tabs = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pickups', label: 'Pickups', icon: PackageSearch },
  { href: '/deliveries', label: 'Deliveries', icon: Truck },
  { href: '/profile', label: 'Profile', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-2 pb-[env(safe-area-inset-bottom)] flex justify-around items-center h-[calc(3.75rem+env(safe-area-inset-bottom))] md:hidden">
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors gap-0.5',
              isActive
                ? 'text-violet-700'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <Icon className={cn('w-5 h-5 transition-transform duration-200', isActive && 'scale-105')} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
