import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const router = useRouter();
  const { mobile } = useLocalSearchParams<{ mobile: string; intent: string }>();
  const { intent } = useLocalSearchParams<{ mobile: string; intent: string }>();
  const { verifyOtp, sendOtp, isLoading, error, clearError, isNewUser } = useAuthStore();

  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(30);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleVerify() {
    if (otp.length < OTP_LENGTH) return;
    clearError();
    try {
      await verifyOtp(mobile!, otp);
      // If register intent OR server says new user → go to registration form
      if (intent === 'register' || useAuthStore.getState().isNewUser) {
        router.replace({ pathname: '/(auth)/register', params: { mobile } });
      }
      // else AuthGate redirects to /(tabs)/home automatically
    } catch {
      // error shown via store
    }
  }

  async function handleResend() {
    if (countdown > 0 || !mobile) return;
    clearError();
    setOtp('');
    try {
      await sendOtp(mobile);
      setCountdown(30);
    } catch {
      // error shown via store
    }
  }
  const digits = otp.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      {/* Header */}
      <View className="bg-primary-600 px-6 pt-16 pb-10">
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Text className="text-white text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Verify OTP 🔐</Text>
        <Text className="text-primary-200 text-sm mt-1">
          Sent to +91 {mobile}
        </Text>
      </View>

      <View className="px-6 pt-10 flex-1">
        <Text className="text-gray-700 text-sm mb-6 text-center">
          Enter the 6-digit code sent to your number
        </Text>

        {/* Hidden real input */}
        <TextInput
          ref={inputRef}
          value={otp}
          onChangeText={(t) => {
            clearError();
            setOtp(t.replace(/\D/g, '').slice(0, OTP_LENGTH));
          }}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          autoFocus
          className="absolute opacity-0 w-px h-px"
        />

        {/* Visual boxes */}
        <TouchableOpacity
          onPress={() => inputRef.current?.focus()}
          className="flex-row justify-center gap-3 mb-8"
          activeOpacity={1}
        >
          {digits.map((d, i) => (
            <View
              key={i}
              className={`w-12 h-14 rounded-xl border-2 items-center justify-center ${
                i === otp.length
                  ? 'border-primary-600 bg-primary-50'
                  : d
                  ? 'border-primary-400 bg-white'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <Text className="text-gray-800 text-xl font-bold">{d}</Text>
            </View>
          ))}
        </TouchableOpacity>

        {error ? (
          <Text className="text-red-500 text-sm text-center mb-4">{error}</Text>
        ) : null}

        {/* Verify button */}
        <TouchableOpacity
          onPress={handleVerify}
          disabled={otp.length < OTP_LENGTH || isLoading}
          className={`rounded-xl py-4 items-center ${
            otp.length === OTP_LENGTH && !isLoading
              ? 'bg-primary-600'
              : 'bg-gray-200'
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              className={`font-semibold text-base ${
                otp.length === OTP_LENGTH ? 'text-white' : 'text-gray-400'
              }`}
            >
              Verify & Continue →
            </Text>
          )}
        </TouchableOpacity>

        {/* Resend */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-500 text-sm">Didn't receive it? </Text>
          <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
            <Text
              className={`text-sm font-semibold ${
                countdown > 0 ? 'text-gray-400' : 'text-primary-600'
              }`}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
