'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

type Step = 'mobile' | 'otp';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#E8F4FB' }} />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sendOtp, verifyOtp, isLoading, error, clearError } = useAuthStore();

  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  const mobileValid = /^\d{10}$/.test(mobile);
  const otpValid = /^\d{4,6}$/.test(otp);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      const result = await sendOtp(mobile);
      setIsNewUser(result.isNewUser);
      setStep('otp');
      if (result.debugOtp) {
        toast.success(`Test OTP: ${result.debugOtp}`, { duration: 10000 });
      }
      toast.success(result.isNewUser ? 'OTP sent! Please verify to create your account.' : 'OTP sent!');
    } catch {
      // error shown via store
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      const result = await verifyOtp(mobile, otp);
      const isNew = result.isNewUser;
      if (isNew) {
        router.replace('/register');
      } else {
        toast.success('Welcome back!');
        const from = searchParams.get('from');
        const safePath = from && from.startsWith('/') && !from.startsWith('//') ? from : '/dashboard';
        router.replace(safePath);
      }
    } catch {
      // error shown via store
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT: Brand panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ background: 'linear-gradient(160deg, #1A6FC4 0%, #145DA0 55%, #0F4A85 100%)' }}
      >
        {/* Bubble decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[
            { size: 180, top: '-5%',   left: '-8%',  opacity: 0.10, delay: '0s'   },
            { size: 90,  top: '10%',   left: '12%',  opacity: 0.12, delay: '0.8s' },
            { size: 60,  top: '40%',   left: '-4%',  opacity: 0.10, delay: '1.6s' },
            { size: 140, top: 'auto',  left: 'auto', opacity: 0.10, delay: '0.4s', bottom: '-6%', right: '-5%' },
            { size: 70,  top: 'auto',  left: 'auto', opacity: 0.12, delay: '1.2s', bottom: '20%', right: '8%'  },
            { size: 36,  top: '60%',   left: 'auto', opacity: 0.15, delay: '2s',   right: '20%'  },
          ].map((b, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-ve-float-slow"
              style={{
                width: b.size,
                height: b.size,
                top:    b.top    !== 'auto' ? b.top    : undefined,
                bottom: 'bottom' in b       ? b.bottom : undefined,
                left:   b.left   !== 'auto' ? b.left   : undefined,
                right:  'right'  in b       ? b.right  : undefined,
                opacity: b.opacity,
                animationDelay: b.delay,
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), rgba(168,216,240,0.25))',
                border: '1.5px solid rgba(255,255,255,0.18)',
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 text-white text-center max-w-sm">
          {/* Animated logo mark */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-ve-float"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.28)',
            }}
          >
            <svg viewBox="0 0 200 200" className="w-12 h-12" fill="none">
              <circle cx="100" cy="50" r="18" stroke="white" strokeWidth="12" fill="none" strokeLinecap="round"/>
              <path d="M 85 68 Q 100 75 115 68" stroke="white" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 80 68 Q 70 90 75 120" stroke="rgba(168,216,240,0.9)" strokeWidth="14" fill="none" strokeLinecap="round"/>
              <text x="100" y="160" fontFamily="Arial, sans-serif" fontSize="80" fontWeight="bold" textAnchor="middle" fill="white">V</text>
              <text x="155" y="160" fontFamily="Arial, sans-serif" fontSize="80" fontWeight="bold" textAnchor="middle" fill="rgba(168,216,240,0.9)">X</text>
            </svg>
          </div>

          <h1
            className="text-4xl font-extrabold mb-3 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Vastra Express
          </h1>
          <p
            className="text-lg leading-relaxed mb-8"
            style={{ color: 'rgba(255,255,255,0.80)', fontFamily: 'var(--font-body)' }}
          >
            Premium laundry at your doorstep. Fresh, clean clothes — on time, every time.
          </p>

          {/* Trust pills */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: '🧼', label: 'Hygienic'    },
              { icon: '⏰', label: 'On-Time'     },
              { icon: '📊', label: 'Transparent' },
            ].map((t) => (
              <div
                key={t.label}
                className="rounded-xl p-3 text-sm font-medium flex flex-col items-center gap-1.5"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <span className="text-xl">{t.icon}</span>
                <span style={{ color: 'rgba(255,255,255,0.88)' }}>{t.label}</span>
              </div>
            ))}
          </div>

          {/* Rating strip */}
          <div
            className="flex items-center justify-center gap-3 text-sm rounded-xl px-4 py-3"
            style={{
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.15)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <span style={{ color: '#F5A623', letterSpacing: '2px' }}>★★★★★</span>
            <span style={{ color: 'rgba(255,255,255,0.85)' }}>4.9 · 2,000+ customers</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form ── */}
      <div
        className="flex-1 flex items-center justify-center p-6"
        style={{ background: '#F7FBFF' }}
      >
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
              style={{ background: '#1A6FC4' }}
            >
              <span
                className="text-white font-extrabold text-xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                VX
              </span>
            </div>
            <h1
              className="text-xl font-bold"
              style={{ fontFamily: 'var(--font-display)', color: '#1B2A3B' }}
            >
              Vastra Express
            </h1>
          </div>

          {/* Form card */}
          <div
            className="bg-white rounded-2xl p-8"
            style={{
              border: '1px solid #A8D8F0',
              boxShadow: '0 4px 20px rgba(26,111,196,0.08)',
            }}
          >
            {step === 'mobile' ? (
              <>
                <div className="mb-6">
                  <h2
                    className="text-2xl font-bold mb-1"
                    style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
                  >
                    Welcome 👋
                  </h2>
                  <p className="text-sm" style={{ color: '#4A5A6B', fontFamily: 'var(--font-body)' }}>
                    Login or create an account with your mobile number
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1">
                    <label
                      className="block text-sm font-medium"
                      style={{ color: '#1B2A3B', fontFamily: 'var(--font-body)' }}
                    >
                      Mobile Number
                    </label>
                    <div
                      className="flex items-center bg-white rounded-xl overflow-hidden"
                      style={{ border: error ? '1px solid #f87171' : '1px solid #A8D8F0' }}
                    >
                      <span
                        className="px-4 py-3 text-sm font-medium border-r"
                        style={{ color: '#4A5A6B', borderColor: '#A8D8F0', fontFamily: 'var(--font-body)' }}
                      >
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="10-digit number"
                        value={mobile}
                        maxLength={10}
                        onChange={(e) => {
                          clearError();
                          setMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
                        }}
                        className="flex-1 px-3 py-3 text-sm bg-transparent outline-none"
                        style={{ color: '#1B2A3B', fontFamily: 'var(--font-body)' }}
                      />
                    </div>
                    {error && (
                      <p className="text-xs text-red-500" style={{ fontFamily: 'var(--font-body)' }}>
                        {error}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" size="lg" loading={isLoading} disabled={!mobileValid}>
                    Get OTP →
                  </Button>
                </form>

                <p
                  className="text-xs text-center mt-5 leading-5"
                  style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}
                >
                  By continuing, you agree to our{' '}
                  <a href="#" className="hover:underline" style={{ color: '#1A6FC4' }}>Terms</a>{' '}and{' '}
                  <a href="#" className="hover:underline" style={{ color: '#1A6FC4' }}>Privacy Policy</a>
                </p>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-5 h-5" style={{ color: '#1A6FC4' }} />
                    <h2
                      className="text-2xl font-bold"
                      style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
                    >
                      Verify your number
                    </h2>
                  </div>
                  <p className="text-sm" style={{ color: '#4A5A6B', fontFamily: 'var(--font-body)' }}>
                    OTP sent to{' '}
                    <span className="font-semibold" style={{ color: '#1B2A3B' }}>+91 {mobile}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <Input
                    label="OTP"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter 4–6 digit OTP"
                    value={otp}
                    maxLength={6}
                    onChange={(e) => {
                      clearError();
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    }}
                    error={error ?? undefined}
                    autoFocus
                  />
                  <Button type="submit" className="w-full" size="lg" loading={isLoading} disabled={!otpValid}>
                    {isNewUser ? 'Verify & Continue →' : 'Verify & Login'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setStep('mobile'); setOtp(''); clearError(); }}
                    className="w-full text-sm py-1 transition-colors duration-200 hover:text-[#4A5A6B]"
                    style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}
                  >
                    ← Change mobile number
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-sm mt-4" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
            <Link href="/" className="transition-colors duration-200 hover:text-[#1A6FC4]">
              ← Back to homepage
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
