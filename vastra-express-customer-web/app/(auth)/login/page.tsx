'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import logo from '@/public/vastra-logo.png';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ShieldCheck, Mail, Lock } from 'lucide-react';

function LoginPageShell() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#E8F4FB' }} />}>
      <LoginContent />
    </Suspense>
  );
}

export default LoginPageShell;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, setUser, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setError(null);

    if (!email.trim()) {
      setError('Enter your email address');
      return;
    }

    if (!password) {
      setError('Enter your password');
      return;
    }

    try {
      setIsLoading(true);
      const sessionRes = await api.post('/auth/login', {
        email,
        password,
      });

      const { accessToken, user } = sessionRes.data;
      const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name ?? '';

      if (roleName !== 'CUSTOMER') {
        throw new Error('This account is not registered as a customer.');
      }

      setAuth(user, accessToken);

      try {
        const profileRes = await api.get('/auth/profile');
        setUser(profileRes.data);
      } catch {
        // Non-fatal; login payload is enough for the session.
      }

      toast.success('Welcome back!');
      const from = searchParams.get('from');
      const safePath = from && from.startsWith('/') && !from.startsWith('//') ? from : '/dashboard';
      router.replace(safePath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ background: 'linear-gradient(160deg, #1A6FC4 0%, #145DA0 55%, #0F4A85 100%)' }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[
            { size: 180, top: '-5%', left: '-8%', opacity: 0.10 },
            { size: 90, top: '10%', left: '12%', opacity: 0.12 },
            { size: 60, top: '40%', left: '-4%', opacity: 0.10 },
            { size: 140, bottom: '-6%', right: '-5%', opacity: 0.10 },
            { size: 70, bottom: '20%', right: '8%', opacity: 0.12 },
            { size: 36, top: '60%', right: '20%', opacity: 0.15 },
          ].map((b, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: b.size,
                height: b.size,
                top: b.top,
                bottom: b.bottom,
                left: b.left,
                right: b.right,
                opacity: b.opacity,
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), rgba(168,216,240,0.25))',
                border: '1.5px solid rgba(255,255,255,0.18)',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-white text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-white shadow-xl overflow-hidden">
            <Image 
              src={logo} 
              alt="Vastra Express" 
              width={56} 
              height={56} 
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Vastra Express
          </h1>
          <p className="text-lg leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.80)', fontFamily: 'var(--font-body)' }}>
            Premium laundry at your doorstep. Fresh, clean clothes - on time, every time.
          </p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: '🧼', label: 'Hygienic' },
              { icon: '⏰', label: 'On-Time' },
              { icon: '📊', label: 'Transparent' },
            ].map((t) => (
              <div
                key={t.label}
                className="rounded-xl px-3 py-4"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.18)',
                }}
              >
                <div className="text-2xl mb-1">{t.icon}</div>
                <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.90)' }}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-sky-50 via-white to-cyan-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-4">
              <img src="/vastra-logo.png" alt="Vastra Express" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Vastra Express</h1>
            <p className="text-gray-500 text-sm mt-1">Customer Portal</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Sign in</h2>
              <p className="text-sm text-gray-500 mt-1">Use your email and password to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                variant="light"
                onChange={(e) => {
                  clearError();
                  setEmail(e.target.value);
                }}
                leftAddon={<Mail className="w-4 h-4" />}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                variant="light"
                onChange={(e) => {
                  clearError();
                  setPassword(e.target.value);
                }}
                leftAddon={<Lock className="w-4 h-4" />}
              />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" loading={isLoading}>
                Sign in
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              New customer?{' '}
              <Link href="/register" className="font-medium text-cyan-700 hover:text-cyan-800">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
