'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Phone, ShieldCheck } from 'lucide-react';

type Step = 'mobile' | 'otp';

export default function LoginPage() {
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
        // New user — go to profile completion before dashboard
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
      {/* Left: Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 to-indigo-800 items-center justify-center p-12">
        <div className="text-white text-center max-w-sm">
          <div className="text-6xl mb-6">👕</div>
          <h1 className="text-4xl font-bold mb-4">Vastra Express</h1>
          <p className="text-blue-200 text-lg leading-relaxed">
            Premium laundry at your doorstep. Fresh, clean clothes — on time, every time.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {['✅ Hygienic', '⏰ On-Time', '📊 Transparent'].map((t) => (
              <div key={t} className="bg-white/10 rounded-xl p-3 text-sm font-medium">
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-3">
              <span className="text-white font-bold text-xl">VE</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Vastra Express</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {step === 'mobile' ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Welcome 👋</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Login or create an account with your mobile number
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                    <div className={`flex items-center border rounded-xl bg-white ${error ? 'border-red-400' : 'border-gray-300'}`}>
                      <span className="px-4 py-3 text-sm text-gray-500 border-r border-gray-200 font-medium">+91</span>
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
                        className="flex-1 px-3 py-3 text-sm text-gray-900 bg-transparent outline-none rounded-r-xl"
                      />
                    </div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    loading={isLoading}
                    disabled={!mobileValid}
                  >
                    Get OTP →
                  </Button>
                </form>

                <p className="text-xs text-gray-400 text-center mt-5 leading-5">
                  By continuing, you agree to our{' '}
                  <a href="#" className="text-blue-600 hover:underline">Terms</a> and{' '}
                  <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                </p>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">
                    Verify your number
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500">
                    OTP sent to <span className="font-semibold text-gray-700">+91 {mobile}</span>
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
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    loading={isLoading}
                    disabled={!otpValid}
                  >
                    {isNewUser ? 'Verify & Continue →' : 'Verify & Login'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setStep('mobile'); setOtp(''); clearError(); }}
                    className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
                  >
                    ← Change mobile number
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            <Link href="/" className="hover:text-gray-700">← Back to homepage</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
