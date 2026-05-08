'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/pricing', label: 'Services' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/#why-us', label: 'Why Us' },
  { href: '/#testimonials', label: 'Reviews' },
];

export function Navbar() {
  const { isAuthenticated } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Track the header's bottom edge so the fixed drawer always starts right below it
  const [headerBottom, setHeaderBottom] = useState(72);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      if (headerRef.current) {
        setHeaderBottom(headerRef.current.getBoundingClientRect().bottom);
      }
    };
    // Set initial value
    if (headerRef.current) {
      setHeaderBottom(headerRef.current.getBoundingClientRect().bottom);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : 'unset';
    // Recalculate header bottom when menu opens
    if (mobileOpen && headerRef.current) {
      setHeaderBottom(headerRef.current.getBoundingClientRect().bottom);
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileOpen]);

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-white/98 backdrop-blur-lg shadow-sm'
            : 'bg-white',
          'border-b border-[#A8D8F0]/50',
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
              <img src="/vastra-logo.png" alt="Vastra Express" className="w-11 h-11 object-contain flex-shrink-0" />
              <div className="hidden sm:flex flex-col leading-tight">
                <span
                  className="font-extrabold text-lg tracking-tight"
                  style={{ fontFamily: 'var(--font-display)', color: '#1B2A3B' }}
                >
                  Vastra
                </span>
                <span
                  className="font-extrabold text-sm tracking-tight"
                  style={{ fontFamily: 'var(--font-display)', color: '#1A6FC4' }}
                >
                  Express
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map((l) => (
                <a
                  key={`${l.label}-${l.href}`}
                  href={l.href}
                  className="text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-[#E8F4FB] hover:text-[#1A6FC4]"
                  style={{ color: '#4A5A6B', fontFamily: 'var(--font-ui)' }}
                >
                  {l.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <button className="btn-primary text-sm px-6 py-2.5">
                    My Dashboard
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <button
                      className="font-semibold text-sm px-5 py-2.5 rounded-lg transition-all duration-200 hover:bg-[#E8F4FB] hover:text-[#1A6FC4]"
                      style={{ color: '#4A5A6B', fontFamily: 'var(--font-ui)' }}
                    >
                      Login
                    </button>
                  </Link>
                  <Link href="/login">
                    <button className="btn-primary text-sm px-6 py-2.5">
                      Book Now
                    </button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors hover:bg-[#E8F4FB]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen
                ? <X className="w-5 h-5" style={{ color: '#1A6FC4' }} />
                : <Menu className="w-5 h-5" style={{ color: '#4A5A6B' }} />
              }
            </button>
          </div>
        </div>
      </header>

      {/* Rendered outside <header> so fixed positioning is relative to viewport, not a stacking context */}

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          style={{ top: headerBottom }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Slide-in drawer */}
      <div
        className={cn(
          'fixed right-0 bottom-0 w-full sm:w-80 bg-white shadow-2xl z-50 transition-all duration-300 ease-out overflow-y-auto md:hidden',
          mobileOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none',
        )}
        style={{ top: headerBottom }}
      >
        {/* Menu header */}
        <div
          className="px-6 py-5 border-b"
          style={{ borderColor: '#A8D8F0' }}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: '#8FA3B1', fontFamily: 'var(--font-ui)' }}
          >
            Menu
          </p>
        </div>

        {/* Nav links */}
        <nav className="px-4 py-5 space-y-1">
          {NAV_LINKS.map((l) => (
            <a
              key={`${l.label}-${l.href}`}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center px-4 py-3.5 text-base font-semibold rounded-lg transition-all duration-200 border-l-4 border-transparent hover:bg-[#E8F4FB] hover:text-[#1A6FC4] hover:border-l-[#1A6FC4]"
              style={{ color: '#1B2A3B', fontFamily: 'var(--font-ui)' }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="mx-4 border-t" style={{ borderColor: '#A8D8F0' }} />

        {/* CTAs */}
        <div className="px-4 py-5 space-y-3">
          {isAuthenticated ? (
            <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
              <button className="btn-primary w-full py-3.5 text-sm">
                My Dashboard
              </button>
            </Link>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <button className="btn-secondary w-full py-3.5 text-sm">
                  Login
                </button>
              </Link>
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <button className="btn-primary w-full py-3.5 text-sm">
                  Book Pickup
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Trust micro-line */}
        <p
          className="text-center text-xs pb-6 px-4"
          style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}
        >
          No subscription needed · 500+ happy customers
        </p>
      </div>
    </>
  );
}
