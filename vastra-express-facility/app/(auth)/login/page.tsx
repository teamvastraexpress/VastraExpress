'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { getApiError } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { Shirt, Phone, KeyRound, ShieldCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import type { StaffCheckResponse, StaffAuthResponse } from '@/types';

// ── Three login states ────────────────────────────────────────────────────────
// mobile   → staff enters their registered mobile number
// setup    → first-time login: enter OTP sent to mobile + set a new password
// password → returning login: enter password
type Step = 'mobile' | 'setup' | 'password';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  const [staffName, setStaffName] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // ── Step 1: Check mobile ────────────────────────────────────────────────────
  async function handleCheckMobile(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!/^\d{10}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<StaffCheckResponse>('/auth/staff-check', {
        mobileNumber: mobile,
      });

      const data = res.data;

      if (!data.exists) {
        setError('This number is not registered. Please contact your administrator.');
        return;
      }

      setStaffName(data.name ?? '');

      if (data.isFirstLogin) {
        // OTP was auto-sent by the backend — go to account setup
        toast.success('OTP sent to your mobile. Please set up your password.');
        startResendTimer();
        setStep('setup');
      } else {
        // Returning staff — just need password
        setStep('password');
      }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2a: First-time setup (OTP + new password) ─────────────────────────
  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP sent to your mobile');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<StaffAuthResponse>('/auth/staff-setup', {
        mobileNumber: mobile,
        otp,
        password,
      });

      const { accessToken, user } = res.data;
      // Map backend `mobile` field to frontend `User.mobileNumber`
      setAuth({ ...user, mobileNumber: user.mobile, isActive: true, createdAt: '', updatedAt: '' }, accessToken);
      toast.success(`Welcome, ${user.name}! Your account is ready.`);

      const from = searchParams.get('from') ?? '/';
      const safePath = from.startsWith('/') && !from.startsWith('//') ? from : '/';
      router.replace(safePath);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2b: Returning login (password only) ───────────────────────────────
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<StaffAuthResponse>('/auth/staff-login', {
        mobileNumber: mobile,
        password,
      });

      const { accessToken, user } = res.data;
      // Map backend `mobile` field to frontend `User.mobileNumber`
      setAuth({ ...user, mobileNumber: user.mobile, isActive: true, createdAt: '', updatedAt: '' }, accessToken);
      toast.success(`Welcome back, ${user.name}!`);

      const from = searchParams.get('from') ?? '/';
      const safePath = from.startsWith('/') && !from.startsWith('//') ? from : '/';
      router.replace(safePath);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Resend OTP (first-time setup only) ─────────────────────────────────────
  function startResendTimer() {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleResendOtp() {
    if (resendTimer > 0) return;
    setError('');
    setLoading(true);
    try {
      await api.post<StaffCheckResponse>('/auth/staff-check', { mobileNumber: mobile });
      toast.success('New OTP sent');
      startResendTimer();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    setStep('mobile');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  }

  // ── UI ──────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl shadow-lg mb-4">
            <Shirt className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Vastra Express</h1>
          <p className="text-gray-500 text-sm mt-1">Facility Staff Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          {/* ── STATE 1: Mobile entry ── */}
          {step === 'mobile' && (
            <>
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Phone className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Sign in</h2>
                  <p className="text-xs text-gray-400">Enter your registered mobile number</p>
                </div>
              </div>

              <form onSubmit={handleCheckMobile} className="space-y-4">
                <Input
                  label="Mobile Number"
                  type="tel"
                  inputMode="numeric"
                  pattern="\d{10}"
                  maxLength={10}
                  placeholder="9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  leftAddon="+91"
                  required
                  autoFocus
                />

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Continue
                </Button>
              </form>
            </>
          )}

          {/* ── STATE 2: First-time setup (OTP + new password) ── */}
          {step === 'setup' && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={goBack}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Account Setup</h2>
                  <p className="text-xs text-gray-400">First-time login — set your password</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-5 pl-1">
                OTP sent to <span className="font-medium text-gray-700">+91 {mobile}</span>
              </p>

              <form onSubmit={handleSetup} className="space-y-4">
                {/* OTP */}
                <Input
                  label="OTP"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  className="tracking-[0.5em] text-center text-lg font-bold"
                />

                {/* New password */}
                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Confirm password */}
                <div className="relative">
                  <Input
                    label="Confirm Password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Verify &amp; Set Password
                </Button>

                {/* Resend OTP */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-xs text-gray-400">Resend OTP in {resendTimer}s</p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-xs text-emerald-600 hover:underline font-medium"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </form>
            </>
          )}

          {/* ── STATE 3: Returning login (password) ── */}
          {step === 'password' && (
            <>
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={goBack}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {staffName ? `Welcome, ${staffName}` : 'Welcome back'}
                  </h2>
                  <p className="text-xs text-gray-400">+91 {mobile}</p>
                </div>
              </div>

              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Sign In
                </Button>
              </form>
            </>
          )}

        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Vastra Express © {new Date().getFullYear()} · Authorised staff only
        </p>
      </div>
    </div>
  );
}
