'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { Truck, Phone, ShieldCheck } from 'lucide-react';

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
      toast.success('OTP sent to your mobile number');
    } catch {
      // error shown via store
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await verifyOtp(mobile, otp);
      toast.success('Welcome back!');
      const from = searchParams.get('from') ?? '/';
      const safePath = from.startsWith('/') && !from.startsWith('//') ? from : '/';
      router.replace(safePath);
    } catch {
      // error shown via store
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-700 rounded-2xl shadow-lg mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Vastra Express</h1>
          <p className="text-gray-500 text-sm mt-1">Driver Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          {step === 'mobile' ? (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Welcome, Driver</h2>
                <p className="text-sm text-gray-500 mt-1">Enter your registered mobile number</p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <Input
                  label="Mobile Number"
                  type="tel"
                  placeholder="10-digit number"
                  value={mobile}
                  maxLength={10}
                  onChange={(e) => {
                    clearError();
                    setMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
                  }}
                  leftAddon={<Phone className="w-4 h-4" />}
                  error={error ?? undefined}
                />
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={isLoading}
                  disabled={!mobileValid}
                >
                  Get OTP
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-5 h-5 text-violet-700" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {isNewUser ? 'Set Up Your Account' : 'Verify OTP'}
                  </h2>
                </div>
                <p className="text-sm text-gray-500">
                  Enter the OTP sent to <span className="font-medium text-gray-700">+91 {mobile}</span>
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
                  Verify & Login
                </Button>
                <button
                  type="button"
                  onClick={() => { setStep('mobile'); setOtp(''); clearError(); }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 text-center py-1"
                >
                  ← Change mobile number
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Only registered Vastra Express drivers can access this portal.
        </p>
      </div>
    </div>
  );
}
