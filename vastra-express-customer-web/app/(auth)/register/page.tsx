'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';

type RegisterStep = 'form' | 'otp';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, setUser } = useAuthStore();

  const [step, setStep] = useState<RegisterStep>('form');

  // Form fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');

  // State
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cooldown, setCooldown] = useState(0);

  // Validation
  const nameValid = /^[a-zA-Z\s'-]{2,100}$/.test(name.trim());
  const mobileValid = /^[6-9]\d{9}$/.test(mobile.trim());
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;

  function startCooldown() {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendOtp() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    else if (!nameValid) errs.name = 'Enter a valid name (letters, spaces, hyphens only)';
    if (!mobile.trim()) errs.mobile = 'Mobile number is required';
    else if (!mobileValid) errs.mobile = 'Enter a valid 10-digit mobile number';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!emailValid) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    else if (!passwordValid) errs.password = 'Password must be at least 8 characters';
    if (!confirmPassword) errs.confirmPassword = 'Confirm your password';
    else if (!passwordsMatch) errs.confirmPassword = 'Passwords do not match';

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSendingOtp(true);
    try {
      const res = await api.post('/auth/send-otp', { email: email.trim() });
      setOtpSent(true);
      setStep('otp');
      startCooldown();
      toast.success('OTP sent to your email!');
      // Show debug OTP in development
      if (res.data?.debugOtp) {
        toast(`Debug OTP: ${res.data.debugOtp}`, { duration: 10000, icon: '🔑' });
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const msg = e.response?.data?.message;
      const readable = Array.isArray(msg) ? msg.join(', ') : msg ?? 'Failed to send OTP';
      toast.error(readable);
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleResendOtp() {
    if (cooldown > 0) return;
    setSendingOtp(true);
    try {
      const res = await api.post('/auth/send-otp', { email: email.trim() });
      startCooldown();
      toast.success('OTP resent to your email!');
      if (res.data?.debugOtp) {
        toast(`Debug OTP: ${res.data.debugOtp}`, { duration: 10000, icon: '🔑' });
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const msg = e.response?.data?.message;
      const readable = Array.isArray(msg) ? msg.join(', ') : msg ?? 'Failed to resend OTP';
      toast.error(readable);
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyAndRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      setErrors({ otp: 'Enter the 6-digit OTP' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        email: email.trim(),
        otp: otp.trim(),
        name: name.trim(),
        mobileNumber: mobile.trim(),
        role: 'CUSTOMER',
        password,
      });

      const { accessToken, user } = res.data;
      setAuth(user, accessToken);

      // Fetch full profile
      try {
        const profileRes = await api.get('/auth/profile');
        setUser(profileRes.data);
      } catch {
        // Non-fatal
      }

      toast.success('Welcome to Vastra Express! 🎉');
      router.replace('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const msg = e.response?.data?.message;
      const readable = Array.isArray(msg) ? msg.join(', ') : msg ?? 'Registration failed';
      toast.error(readable);
      setErrors({ otp: readable });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
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
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.28)',
            }}
          >
            <UserPlus className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Join Vastra Express
          </h1>
          <p className="text-lg leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.80)', fontFamily: 'var(--font-body)' }}>
            Premium laundry at your doorstep. Create your account and enjoy hassle-free laundry service.
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

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-sky-50 via-white to-cyan-50">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-700 rounded-2xl shadow-lg mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Vastra Express</h1>
            <p className="text-gray-500 text-sm mt-1">Create your account</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
            {step === 'form' ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Create Account</h2>
                  <p className="text-sm text-gray-500 mt-1">Fill in your details to get started</p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    variant="light"
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    error={errors.name}
                    leftAddon={<User className="w-4 h-4" />}
                  />

                  <Input
                    label="Mobile Number"
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={mobile}
                    variant="light"
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '');
                      setMobile(v);
                      if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: '' }));
                    }}
                    error={errors.mobile}
                    leftAddon={<Phone className="w-4 h-4" />}
                  />

                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    variant="light"
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    error={errors.email}
                    hint="We'll send a verification OTP to this email"
                    leftAddon={<Mail className="w-4 h-4" />}
                  />

                  <Input
                    label="Password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={password}
                    variant="light"
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    error={errors.password}
                    leftAddon={<Lock className="w-4 h-4" />}
                  />

                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    variant="light"
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                    error={errors.confirmPassword}
                    leftAddon={<Lock className="w-4 h-4" />}
                  />

                  <Button
                    className="w-full"
                    size="lg"
                    loading={sendingOtp}
                    onClick={handleSendOtp}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Verification OTP
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Verify Email</h2>
                  </div>
                  <p className="text-sm text-gray-500">
                    Enter the 6-digit OTP sent to <span className="font-semibold text-gray-700">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyAndRegister} className="space-y-4">
                  <Input
                    label="OTP Code"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    value={otp}
                    variant="light"
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '');
                      setOtp(v);
                      if (errors.otp) setErrors((prev) => ({ ...prev, otp: '' }));
                    }}
                    error={errors.otp}
                    leftAddon={<CheckCircle2 className="w-4 h-4" />}
                    autoFocus
                  />

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => { setStep('form'); setOtp(''); setErrors({}); }}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      ← Back to form
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={cooldown > 0 || sendingOtp}
                      className={`font-medium transition-colors ${
                        cooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-cyan-700 hover:text-cyan-800'
                      }`}
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                    </button>
                  </div>

                  <Button type="submit" className="w-full" size="lg" loading={isLoading}>
                    Verify & Create Account
                  </Button>
                </form>

                <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-700">
                    <strong>Summary:</strong> {name} · {mobile} · {email}
                  </p>
                </div>
              </>
            )}

            <div className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-cyan-700 hover:text-cyan-800">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
