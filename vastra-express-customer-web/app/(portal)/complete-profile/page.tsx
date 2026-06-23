'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { UserCircle, Mail, User, ArrowRight, Phone } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, user } = useAuthStore();

  const [name,          setName]          = useState('');
  const [email,         setEmail]         = useState('');
  const [mobileNumber,  setMobileNumber]  = useState('');
  const [isLoading,     setIsLoading]     = useState(false);
  const [errors,        setErrors]        = useState<{ name?: string; email?: string; mobileNumber?: string }>({});

  const nameValid  = /^[a-zA-Z\s'-]{2,100}$/.test(name.trim());
  const emailValid = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const mobileValid = /^[6-9]\d{9}$/.test(mobileNumber.trim());

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setMobileNumber(user.mobileNumber || '');
    }
  }, [user]);

  function validate(): boolean {
    const e: { name?: string; email?: string; mobileNumber?: string } = {};
    if (!name.trim())                  e.name  = 'Name is required';
    else if (!nameValid)               e.name  = 'Enter a valid name (letters, spaces, hyphens only)';
    if (email.trim() && !emailValid)   e.email = 'Enter a valid email address';
    if (!mobileNumber.trim())          e.mobileNumber = 'Mobile number is required';
    else if (!mobileValid)             e.mobileNumber = 'Enter a valid 10-digit mobile number';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const payload: { name: string; email?: string; mobileNumber?: string } = { 
        name: name.trim(),
        mobileNumber: mobileNumber.trim(),
      };
      if (email.trim()) payload.email = email.trim().toLowerCase();
      const res = await api.put('/users/profile', payload);
      setUser(res.data);
      toast.success('Welcome to Vastra Express! 🎉');
      router.replace('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const msg = e.response?.data?.message;
      const readable = Array.isArray(msg) ? msg.join(', ') : msg ?? 'Failed to save profile';
      toast.error(readable);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ background: '#F7FBFF' }}
    >
      <div className="w-full max-w-md">

        {/* ── Header ── */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-ve-float"
            style={{
              background: 'linear-gradient(135deg, #1A6FC4 0%, #4EAEE5 100%)',
              boxShadow: '0 4px 16px rgba(26,111,196,0.30)',
            }}
          >
            <UserCircle className="w-9 h-9 text-white" />
          </div>

          <h1
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-display)', color: '#1B2A3B' }}
          >
            Complete your profile
          </h1>
          <p className="text-sm" style={{ color: '#4A5A6B', fontFamily: 'var(--font-body)' }}>
            Welcome! Just a few details to get started.
          </p>
          {user?.mobileNumber && (
            <p className="text-xs mt-1.5" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
              Account:{' '}
              <span className="font-semibold" style={{ color: '#4A5A6B' }}>
                +91 {user.mobileNumber}
              </span>
            </p>
          )}
        </div>

        {/* ── Form card ── */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'white',
            border: '1px solid #A8D8F0',
            boxShadow: '0 4px 20px rgba(26,111,196,0.08)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#1B2A3B', fontFamily: 'var(--font-body)' }}
              >
                Full Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div
                className="flex items-center bg-white rounded-xl overflow-hidden transition-all duration-150"
                style={{
                  border: errors.name ? '1px solid #f87171' : '1px solid #A8D8F0',
                }}
              >
                <span className="pl-3" style={{ color: '#8FA3B1' }}>
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  maxLength={100}
                  autoFocus
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className="flex-1 px-3 py-3 text-sm bg-transparent outline-none"
                  style={{ color: '#1B2A3B', fontFamily: 'var(--font-body)' }}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-red-500" style={{ fontFamily: 'var(--font-body)' }}>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#1B2A3B', fontFamily: 'var(--font-body)' }}
              >
                Email Address{' '}
                <span className="font-normal" style={{ color: '#8FA3B1' }}>(optional)</span>
              </label>
              <div
                className="flex items-center bg-white rounded-xl overflow-hidden transition-all duration-150"
                style={{
                  border: errors.email ? '1px solid #f87171' : '1px solid #A8D8F0',
                }}
              >
                <span className="pl-3" style={{ color: '#8FA3B1' }}>
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  maxLength={200}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className="flex-1 px-3 py-3 text-sm bg-transparent outline-none"
                  style={{ color: '#1B2A3B', fontFamily: 'var(--font-body)' }}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500" style={{ fontFamily: 'var(--font-body)' }}>
                  {errors.email}
                </p>
              )}
              <p className="mt-1.5 text-xs" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
                For order receipts and notifications
              </p>
            </div>

            {/* Mobile Number */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#1B2A3B', fontFamily: 'var(--font-body)' }}
              >
                Mobile Number <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div
                className="flex items-center bg-white rounded-xl overflow-hidden transition-all duration-150"
                style={{
                  border: errors.mobileNumber ? '1px solid #f87171' : '1px solid #A8D8F0',
                }}
              >
                <span className="pl-3" style={{ color: '#8FA3B1' }}>
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={mobileNumber}
                  maxLength={10}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setMobileNumber(val);
                    if (errors.mobileNumber) setErrors((prev) => ({ ...prev, mobileNumber: undefined }));
                  }}
                  className="flex-1 px-3 py-3 text-sm bg-transparent outline-none"
                  style={{ color: '#1B2A3B', fontFamily: 'var(--font-body)' }}
                />
              </div>
              {errors.mobileNumber && (
                <p className="mt-1 text-xs text-red-500" style={{ fontFamily: 'var(--font-body)' }}>
                  {errors.mobileNumber}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isLoading}
              disabled={!name.trim() || !mobileNumber.trim()}
            >
              Save &amp; Continue
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Skip - only if user already has a mobile number */}
          {user?.mobileNumber && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => router.replace('/dashboard')}
                className="text-sm transition-colors hover:text-[#4A5A6B]"
                style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}
              >
                Skip for now
              </button>
            </div>
          )}
        </div>

        <p
          className="text-center text-xs mt-4"
          style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}
        >
          You can update your profile anytime from the Profile section.
        </p>
      </div>
    </div>
  );
}
