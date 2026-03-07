'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { UserCircle, Mail, User, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, user } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  // Validation helpers
  const nameValid = /^[a-zA-Z\s'-]{2,100}$/.test(name.trim());
  const emailValid = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  function validate(): boolean {
    const e: { name?: string; email?: string } = {};
    if (!name.trim()) {
      e.name = 'Name is required';
    } else if (!nameValid) {
      e.name = 'Enter a valid name (letters, spaces, hyphens only)';
    }
    if (email.trim() && !emailValid) {
      e.email = 'Enter a valid email address';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const payload: { name: string; email?: string } = { name: name.trim() };
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
            <UserCircle className="w-9 h-9 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Complete your profile</h1>
          <p className="text-gray-500 text-sm mt-2">
            Welcome! Just a few details to get started.
          </p>
          {user?.mobileNumber && (
            <p className="text-xs text-gray-400 mt-1">
              Account: <span className="font-medium text-gray-600">+91 {user.mobileNumber}</span>
            </p>
          )}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className={`flex items-center border rounded-xl bg-white transition-colors ${
                errors.name ? 'border-red-400' : 'border-gray-300 focus-within:border-blue-500'
              }`}>
                <span className="pl-3 text-gray-400">
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
                  className="flex-1 px-3 py-3 text-sm text-gray-900 bg-transparent outline-none rounded-r-xl"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className={`flex items-center border rounded-xl bg-white transition-colors ${
                errors.email ? 'border-red-400' : 'border-gray-300 focus-within:border-blue-500'
              }`}>
                <span className="pl-3 text-gray-400">
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
                  className="flex-1 px-3 py-3 text-sm text-gray-900 bg-transparent outline-none rounded-r-xl"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                For order receipts and notifications
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isLoading}
              disabled={!name.trim()}
            >
              Save &amp; Continue
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Skip */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => router.replace('/dashboard')}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          You can update your profile anytime from the Profile section.
        </p>
      </div>
    </div>
  );
}
