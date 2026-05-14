import React, { useState } from 'react';
import { View, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants';

export default function LoginScreen() {
  const router = useRouter();
  const { login, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleLogin() {
    clearError();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('Enter your email address');
      return;
    }
    if (!password) {
      setLocalError('Enter your password');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      // Error handled by store
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="pt-24 pb-12 items-center px-6">
            <View
              className="w-20 h-20 rounded-3xl items-center justify-center mb-8"
              style={{ backgroundColor: COLORS.primaryBg }}
            >
              <Image
                source={require('@/assets/vastra-logo.png')}
                style={{ width: 48, height: 48 }}
                resizeMode="contain"
              />
            </View>
            <Typography variant="display-md" className="text-center">Welcome back</Typography>
            <Typography variant="body-lg" className="text-text-tertiary text-center mt-2">
              Sign in to your account
            </Typography>
          </View>

          {/* Form */}
          <View className="flex-1 px-6">
            <View className="gap-y-5">
              {/* Email */}
              <View>
                <Typography variant="body-sm" className="mb-2 font-medium text-text-primary">
                  Email
                </Typography>
                <View className="flex-row items-center border border-border rounded-xl px-4 py-3.5 bg-white">
                  <Mail size={18} color={COLORS.textTertiary} strokeWidth={1.8} />
                  <TextInput
                    className="flex-1 ml-3 text-text-primary text-sm"
                    placeholder="you@example.com"
                    placeholderTextColor={COLORS.textTertiary}
                    value={email}
                    onChangeText={(val) => {
                      clearError();
                      setEmail(val);
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Password */}
              <View>
                <Typography variant="body-sm" className="mb-2 font-medium text-text-primary">
                  Password
                </Typography>
                <View className="flex-row items-center border border-border rounded-xl px-4 py-3.5 bg-white">
                  <Lock size={18} color={COLORS.textTertiary} strokeWidth={1.8} />
                  <TextInput
                    className="flex-1 ml-3 text-text-primary text-sm"
                    placeholder="Enter your password"
                    placeholderTextColor={COLORS.textTertiary}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(val) => {
                      clearError();
                      setPassword(val);
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.6}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={COLORS.textTertiary} strokeWidth={1.8} />
                    ) : (
                      <Eye size={18} color={COLORS.textTertiary} strokeWidth={1.8} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error */}
              {(localError || error) && (
                <View className="bg-status-error-bg rounded-xl px-4 py-3">
                  <Typography variant="body-sm" className="text-status-error font-medium">
                    {localError || error}
                  </Typography>
                </View>
              )}

              {/* Submit */}
              <Button
                label="Sign in"
                isLoading={isLoading}
                onPress={handleLogin}
                className="mt-2"
                size="lg"
              />
            </View>

            {/* Register Link */}
            <View className="mt-10 flex-row justify-center items-center">
              <Typography variant="body-md" className="text-text-tertiary">New customer? </Typography>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Typography variant="body-md" className="text-primary-400 font-semibold">
                  Create account
                </Typography>
              </TouchableOpacity>
            </View>

            <View className="mt-auto pb-8 pt-12 items-center opacity-30">
              <Typography variant="body-sm" className="text-text-tertiary">
                Vastra Express · Secure Login
              </Typography>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
