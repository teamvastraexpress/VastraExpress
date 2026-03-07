import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { sendOtp, isLoading, error, clearError } = useAuthStore();
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');

  const validate = () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setMobileError('Enter a valid 10-digit Indian mobile number');
      return false;
    }
    setMobileError('');
    return true;
  };

  const handleSendOtp = async () => {
    if (!validate()) return;
    clearError();
    try {
      await sendOtp(mobile);
      router.push({ pathname: '/(auth)/otp', params: { mobile } });
    } catch {
      // error already in store
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="bg-primary-700 px-6 pt-16 pb-12 items-center">
          <Text className="text-5xl mb-3">🚚</Text>
          <Text className="text-white text-3xl font-bold">Vastra Express</Text>
          <Text className="text-blue-200 text-base mt-1">Driver Portal</Text>
        </View>

        {/* Form */}
        <View className="flex-1 px-6 pt-10">
          <Text className="text-gray-800 text-2xl font-bold mb-1">Welcome back</Text>
          <Text className="text-gray-500 text-sm mb-8">Enter your registered mobile number to continue</Text>

          <Text className="text-gray-700 text-sm font-semibold mb-1">Mobile Number</Text>
          <View className="flex-row items-center border border-gray-300 rounded-xl px-4 mb-1 bg-gray-50">
            <Text className="text-gray-500 text-base mr-2">+91</Text>
            <TextInput
              className="flex-1 py-3.5 text-gray-800 text-base"
              placeholder="Enter mobile number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              maxLength={10}
              value={mobile}
              onChangeText={(v) => { setMobile(v); setMobileError(''); clearError(); }}
              autoFocus
            />
          </View>
          {mobileError ? <Text className="text-red-500 text-xs mb-3">{mobileError}</Text> : null}
          {error ? <Text className="text-red-500 text-xs mb-3">{error}</Text> : null}

          <TouchableOpacity
            className={`rounded-xl py-4 items-center mt-4 ${isLoading || mobile.length < 10 ? 'bg-blue-300' : 'bg-primary-700'}`}
            onPress={handleSendOtp}
            disabled={isLoading || mobile.length < 10}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Send OTP</Text>
            )}
          </TouchableOpacity>

          <Text className="text-gray-400 text-xs text-center mt-8">
            For drivers only. Contact admin if you need access.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
