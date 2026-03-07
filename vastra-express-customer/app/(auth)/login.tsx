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

type Tab = 'login' | 'register';

export default function LoginScreen() {
  const router = useRouter();
  const { sendOtp, isLoading, error, clearError } = useAuthStore();

  const [tab, setTab] = useState<Tab>('login');
  const [mobile, setMobile] = useState('');

  const isValid = /^\d{10}$/.test(mobile);

  async function handleSend() {
    if (!isValid) return;
    clearError();
    try {
      await sendOtp(mobile);
      router.push({ pathname: '/(auth)/otp', params: { mobile, intent: tab } });
    } catch {
      // error shown via store
    }
  }

  const isRegister = tab === 'register';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="bg-primary-600 px-6 pt-16 pb-12 items-center">
          <View className="w-20 h-20 bg-white/20 rounded-3xl items-center justify-center mb-4">
            <Text className="text-4xl">👕</Text>
          </View>
          <Text className="text-white text-3xl font-bold">Vastra Express</Text>
          <Text className="text-primary-200 text-sm mt-1">
            Premium laundry at your doorstep
          </Text>
        </View>

        {/* Tabs */}
        <View className="flex-row mx-6 mt-6 bg-gray-100 rounded-2xl p-1">
          {(['login', 'register'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => { setTab(t); clearError(); setMobile(''); }}
              className={`flex-1 py-3 rounded-xl items-center ${tab === t ? 'bg-white shadow-sm' : ''}`}
            >
              <Text
                className={`text-sm font-semibold ${tab === t ? 'text-primary-600' : 'text-gray-500'}`}
              >
                {t === 'login' ? '🔑 Sign In' : '✨ Register'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form */}
        <View className="flex-1 px-6 pt-8">
          <Text className="text-gray-800 text-xl font-bold mb-1">
            {isRegister ? 'Create your account' : 'Welcome back 👋'}
          </Text>
          <Text className="text-gray-500 text-sm mb-6">
            {isRegister
              ? 'Enter your mobile number to get started'
              : 'Enter your registered mobile number'}
          </Text>

          {/* Mobile input */}
          <View className="mb-4">
            <Text className="text-gray-600 text-sm font-medium mb-2">Mobile Number</Text>
            <View
              className={`flex-row items-center border rounded-xl px-4 bg-gray-50 ${
                error ? 'border-red-400' : 'border-gray-200'
              }`}
            >
              <Text className="text-gray-500 text-base mr-2 py-4">+91</Text>
              <View className="w-px h-5 bg-gray-200 mr-3" />
              <TextInput
                value={mobile}
                onChangeText={(t) => {
                  clearError();
                  setMobile(t.replace(/\D/g, '').slice(0, 10));
                }}
                placeholder="Enter 10-digit number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
                className="flex-1 text-gray-800 text-base py-4"
              />
            </View>
            {error ? (
              <Text className="text-red-500 text-xs mt-2">{error}</Text>
            ) : null}
          </View>

          {/* Info box for register tab */}
          {isRegister && (
            <View className="bg-primary-50 rounded-2xl p-4 mb-5">
              <Text className="text-primary-700 font-semibold text-sm mb-1">How it works</Text>
              <Text className="text-primary-600 text-xs leading-5">
                1️⃣  Enter your mobile number{'\n'}
                2️⃣  Verify via OTP{'\n'}
                3️⃣  Set up your name & address{'\n'}
                4️⃣  Start booking laundry orders!
              </Text>
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={!isValid || isLoading}
            className={`rounded-xl py-4 items-center mt-2 ${
              isValid && !isLoading ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                className={`font-semibold text-base ${isValid ? 'text-white' : 'text-gray-400'}`}
              >
                {isRegister ? 'Register →' : 'Get OTP →'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Switch hint */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500 text-sm">
              {isRegister ? 'Already have an account? ' : 'New to Vastra Express? '}
            </Text>
            <TouchableOpacity onPress={() => { setTab(isRegister ? 'login' : 'register'); clearError(); setMobile(''); }}>
              <Text className="text-primary-600 text-sm font-semibold">
                {isRegister ? 'Sign In' : 'Register'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-gray-400 text-xs text-center mt-4 leading-5">
            By continuing, you agree to our{' '}
            <Text className="text-primary-600">Terms of Service</Text> and{' '}
            <Text className="text-primary-600">Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
