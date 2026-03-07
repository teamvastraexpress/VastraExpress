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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function RegisterScreen() {
  const router = useRouter();
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const { updateProfile, isLoading } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const isValid = name.trim().length >= 2;

  async function handleComplete() {
    if (!isValid) return;
    setSaveError(null);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim() || undefined,
      });
      // Registration complete → go to home
      router.replace('/(tabs)/home');
    } catch (e: any) {
      setSaveError(e.message ?? 'Could not save profile. Please try again.');
    }
  }

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
            <Text className="text-4xl">🎉</Text>
          </View>
          <Text className="text-white text-3xl font-bold">Welcome!</Text>
          <Text className="text-primary-200 text-sm mt-1">
            Let's set up your profile
          </Text>
        </View>

        {/* Form */}
        <View className="flex-1 px-6 pt-10">
          <Text className="text-gray-800 text-2xl font-bold mb-1">
            Complete Registration
          </Text>
          <Text className="text-gray-500 text-sm mb-8">
            +91 {mobile} verified ✓ — just a few more details
          </Text>

          {/* Name */}
          <View className="mb-5">
            <Text className="text-gray-600 text-sm font-medium mb-2">
              Full Name <Text className="text-red-400">*</Text>
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className={`border rounded-xl px-4 py-4 bg-gray-50 text-gray-800 text-base ${
                name.trim().length > 0 && name.trim().length < 2
                  ? 'border-red-300'
                  : 'border-gray-200'
              }`}
            />
            {name.trim().length > 0 && name.trim().length < 2 && (
              <Text className="text-red-400 text-xs mt-1">
                Name must be at least 2 characters
              </Text>
            )}
          </View>

          {/* Email */}
          <View className="mb-8">
            <Text className="text-gray-600 text-sm font-medium mb-2">
              Email Address{' '}
              <Text className="text-gray-400 font-normal">(optional)</Text>
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              className="border border-gray-200 rounded-xl px-4 py-4 bg-gray-50 text-gray-800 text-base"
            />
          </View>

          {/* What to expect */}
          <View className="bg-primary-50 rounded-2xl p-4 mb-8">
            <Text className="text-primary-700 font-semibold text-sm mb-2">
              What's next?
            </Text>
            {[
              '📍 Add your pickup address',
              '🧺 Place your first laundry order',
              '⭐ Explore subscription plans & save more',
            ].map((item) => (
              <Text key={item} className="text-primary-600 text-xs mb-1">
                {item}
              </Text>
            ))}
          </View>

          {/* CTA */}
          {saveError && (
            <View className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <Text className="text-red-600 text-sm font-medium">{saveError}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={handleComplete}
            disabled={!isValid || isLoading}
            className={`rounded-xl py-4 items-center ${
              isValid && !isLoading ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                className={`font-semibold text-base ${
                  isValid ? 'text-white' : 'text-gray-400'
                }`}
              >
                Get Started →
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
