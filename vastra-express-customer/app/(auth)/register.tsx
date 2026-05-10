import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

type RegisterStep = 'form' | 'otp';

export default function RegisterScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<RegisterStep>('form');

  // Form fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');

  // State
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
    setError('');

    if (!name.trim()) { setError('Name is required'); return; }
    if (!nameValid) { setError('Enter a valid name (letters, spaces, hyphens only)'); return; }
    if (!mobile.trim()) { setError('Mobile number is required'); return; }
    if (!mobileValid) { setError('Enter a valid 10-digit mobile number'); return; }
    if (!email.trim()) { setError('Email is required'); return; }
    if (!emailValid) { setError('Enter a valid email address'); return; }
    if (!password) { setError('Password is required'); return; }
    if (!passwordValid) { setError('Password must be at least 8 characters'); return; }
    if (!confirmPassword) { setError('Confirm your password'); return; }
    if (!passwordsMatch) { setError('Passwords do not match'); return; }

    setSendingOtp(true);
    try {
      await api.post('/auth/send-otp', { email: email.trim() });
      setStep('otp');
      startCooldown();
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleResendOtp() {
    if (cooldown > 0) return;
    setSendingOtp(true);
    try {
      await api.post('/auth/send-otp', { email: email.trim() });
      startCooldown();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Failed to resend OTP');
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyAndRegister() {
    setError('');

    if (!otp.trim() || otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }

    setLoading(true);
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
      await setAuth(user, accessToken);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="bg-primary-600 px-6 pt-16 pb-12 items-center">
          <View className="w-20 h-20 bg-white/20 rounded-3xl items-center justify-center mb-4">
            <Text className="text-4xl">{step === 'form' ? '📝' : '📧'}</Text>
          </View>
          <Text className="text-white text-3xl font-bold">
            {step === 'form' ? 'Create Account' : 'Verify Email'}
          </Text>
          <Text className="text-blue-200 text-base mt-1">
            {step === 'form'
              ? 'Sign up for Vastra Express'
              : `OTP sent to ${email}`}
          </Text>
        </View>

        <View className="flex-1 px-6 pt-8 pb-6">
          {step === 'form' ? (
            <>
              {/* Name */}
              <Text className="text-gray-700 text-sm font-semibold mb-1">Full Name</Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 mb-4 bg-gray-50">
                <TextInput
                  className="flex-1 py-3.5 text-gray-800 text-base"
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  value={name}
                  onChangeText={(v) => { setName(v); setError(''); }}
                />
              </View>

              {/* Mobile */}
              <Text className="text-gray-700 text-sm font-semibold mb-1">Mobile Number</Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 mb-4 bg-gray-50">
                <Text className="text-gray-500 mr-1">+91</Text>
                <TextInput
                  className="flex-1 py-3.5 text-gray-800 text-base"
                  placeholder="9876543210"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={mobile}
                  onChangeText={(v) => { setMobile(v.replace(/\D/g, '')); setError(''); }}
                />
              </View>

              {/* Email */}
              <Text className="text-gray-700 text-sm font-semibold mb-1">Email</Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 mb-4 bg-gray-50">
                <TextInput
                  className="flex-1 py-3.5 text-gray-800 text-base"
                  placeholder="you@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(''); }}
                />
              </View>

              {/* Password */}
              <Text className="text-gray-700 text-sm font-semibold mb-1">Password</Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 mb-4 bg-gray-50">
                <TextInput
                  className="flex-1 py-3.5 text-gray-800 text-base"
                  placeholder="Minimum 8 characters"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(''); }}
                />
              </View>

              {/* Confirm Password */}
              <Text className="text-gray-700 text-sm font-semibold mb-1">Confirm Password</Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 mb-1 bg-gray-50">
                <TextInput
                  className="flex-1 py-3.5 text-gray-800 text-base"
                  placeholder="Re-enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); setError(''); }}
                />
              </View>

              {error ? <Text className="text-red-500 text-xs mt-3">{error}</Text> : null}

              <TouchableOpacity
                className={`rounded-xl py-4 items-center mt-6 ${sendingOtp ? 'bg-blue-300' : 'bg-primary-600'}`}
                onPress={handleSendOtp}
                disabled={sendingOtp}
              >
                {sendingOtp ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">Send Verification OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-4 items-center"
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text className="text-gray-500 text-sm">
                  Already have an account?{' '}
                  <Text className="text-blue-600 font-semibold">Sign In</Text>
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text className="text-gray-800 text-xl font-bold mb-1">Enter OTP</Text>
              <Text className="text-gray-500 text-sm mb-6">
                Enter the 6-digit code sent to your email
              </Text>

              {/* OTP Input */}
              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 mb-4 bg-gray-50">
                <TextInput
                  className="flex-1 py-4 text-gray-800 text-xl text-center tracking-widest"
                  placeholder="000000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={(v) => { setOtp(v.replace(/\D/g, '')); setError(''); }}
                  autoFocus
                />
              </View>

              {/* Resend / Back */}
              <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity onPress={() => { setStep('form'); setOtp(''); setError(''); }}>
                  <Text className="text-gray-500 text-sm">← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={cooldown > 0 || sendingOtp}
                >
                  <Text className={`text-sm font-semibold ${cooldown > 0 ? 'text-gray-400' : 'text-blue-600'}`}>
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Summary */}
              <View className="bg-blue-50 rounded-xl p-3 mb-4">
                <Text className="text-blue-700 text-xs">
                  <Text className="font-semibold">Summary: </Text>
                  {name} · {mobile} · {email}
                </Text>
              </View>

              {error ? <Text className="text-red-500 text-xs mb-3">{error}</Text> : null}

              <TouchableOpacity
                className={`rounded-xl py-4 items-center ${loading ? 'bg-blue-300' : 'bg-primary-600'}`}
                onPress={handleVerifyAndRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">Verify & Create Account</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
