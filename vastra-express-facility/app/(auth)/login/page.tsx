'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { Shirt, ShieldCheck, KeyRound } from 'lucide-react';

type LoginStep = 'login' | 'change-password';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<LoginStep>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Enter your email address');
      return;
    }

    if (!password) {
      setError('Enter your password');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email,
        password,
      });

      const { accessToken, user, mustChangePassword, tempToken: token } = res.data;
      const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name ?? '';

      if (roleName !== 'FACILITY_STAFF') {
        throw new Error('This account is not registered as facility staff.');
      }

      // First-time login — prompt password change
      if (mustChangePassword && token) {
        setTempToken(token);
        setUserName(user.name);
        setStep('change-password');
        setLoading(false);
        return;
      }

      setAuth(user, accessToken);
      toast.success('Welcome back!');

      const from = searchParams.get('from') ?? '/';
      const safePath = from.startsWith('/') && !from.startsWith('//') ? from : '/';
      router.replace(safePath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!newPassword) {
      setError('Enter your new password');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/change-password', {
        tempToken,
        newPassword,
      });

      const { accessToken, user } = res.data;
      setAuth(user, accessToken);
      toast.success('Password set successfully. Welcome!');

      const from = searchParams.get('from') ?? '/';
      const safePath = from.startsWith('/') && !from.startsWith('//') ? from : '/';
      router.replace(safePath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4">
            <img src="/vastra-logo.png" alt="Vastra Express" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Vastra Express</h1>
          <p className="text-gray-500 text-sm mt-1">Facility Staff Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {step === 'login' ? (
            <>
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Sign in</h2>
                  <p className="text-xs text-gray-400">Enter your registered email and password</p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="staff@example.com"
                  value={email}
                  onChange={(e) => {
                    setError('');
                    setEmail(e.target.value);
                  }}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setError('');
                    setPassword(e.target.value);
                  }}
                />

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Sign in
                </Button>
              </form>

              <p className="text-xs text-gray-400 text-center mt-4">
                First time? Use the OTP sent to your email as the password.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Set New Password</h2>
                  <p className="text-xs text-gray-400">Welcome, {userName}! Please set your own password.</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => {
                    setError('');
                    setNewPassword(e.target.value);
                  }}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setError('');
                    setConfirmPassword(e.target.value);
                  }}
                />

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Set Password & Continue
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#ECFDF5' }} />}>
      <LoginPageContent />
    </Suspense>
  );
}
