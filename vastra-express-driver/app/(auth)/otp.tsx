import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function OtpScreen() {
  const router = useRouter();
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const { verifyOtp, sendOtp, isLoading, error, clearError } = useAuthStore();

  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const inputRef = useRef<TextInput>(null);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH) return;
    clearError();
    try {
      await verifyOtp(mobile!, otp);
      // Navigation handled by AuthGate in _layout
    } catch {
      // error shown below
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    clearError();
    try {
      await sendOtp(mobile!);
      setOtp('');
      setCountdown(RESEND_COOLDOWN);
    } catch {
      // error shown
    }
  };

  const formatted = mobile ? `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}` : '';

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="bg-primary-700 px-6 pt-16 pb-12 items-center">
          <Text className="text-5xl mb-3">🔐</Text>
          <Text className="text-white text-3xl font-bold">Verify OTP</Text>
        </View>

        <View className="flex-1 px-6 pt-10">
          <Text className="text-gray-800 text-2xl font-bold mb-1">Enter OTP</Text>
          <Text className="text-gray-500 text-sm mb-8">
            A 6-digit OTP was sent to{' '}
            <Text className="text-gray-700 font-semibold">{formatted}</Text>
          </Text>

          {/* OTP Input */}
          <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
            <View className="flex-row justify-between mb-2">
              {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <View
                  key={i}
                  className={`w-12 h-14 rounded-xl border-2 items-center justify-center
                    ${i < otp.length ? 'border-primary-600 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
                >
                  <Text className="text-gray-800 text-xl font-bold">
                    {otp[i] ? '•' : ''}
                  </Text>
                </View>
              ))}
            </View>
            {/* Hidden input */}
            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={(v) => { setOtp(v.replace(/\D/g, '').slice(0, OTP_LENGTH)); clearError(); }}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              className="opacity-0 absolute h-1 w-1"
              autoFocus
            />
          </TouchableOpacity>

          {error ? <Text className="text-red-500 text-xs mb-3">{error}</Text> : null}

          <TouchableOpacity
            className={`rounded-xl py-4 items-center mt-4 ${isLoading || otp.length < OTP_LENGTH ? 'bg-blue-300' : 'bg-primary-700'}`}
            onPress={handleVerify}
            disabled={isLoading || otp.length < OTP_LENGTH}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Verify & Login</Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View className="flex-row items-center justify-center mt-6">
            <Text className="text-gray-500 text-sm">Didn't receive OTP? </Text>
            <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
              <Text className={`text-sm font-semibold ${countdown > 0 ? 'text-gray-400' : 'text-primary-600'}`}>
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="mt-4 items-center"
            onPress={() => router.back()}
          >
            <Text className="text-primary-600 text-sm">← Change number</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
