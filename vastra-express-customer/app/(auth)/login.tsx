import React, { useState } from 'react';
import { View, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
    <SafeAreaView className="flex-1 bg-offwhite">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View className="pt-20 pb-10 items-center">
             <View className="bg-white p-4 rounded-3xl shadow-xl mb-6 border border-brand-bubble/20">
                <Image 
                  source={require('@/assets/vastra-logo.png')} 
                  style={{ width: 100, height: 100 }} 
                  resizeMode="contain"
                />
             </View>
             <Typography variant="display-sm" className="text-text-dark text-center font-bold">Vastra Express</Typography>
             <Typography variant="body-md" className="text-text-light text-center mt-1">
               Customer Portal
             </Typography>
          </View>

          {/* Form Section */}
          <View className="flex-1 px-6">
            <Card variant="elevated" className="p-8 border border-brand-bubble/10">
              <Typography variant="heading-lg" className="mb-1 text-text-dark">Sign in</Typography>
              <Typography variant="body-sm" className="mb-8 text-text-light">Use your email and password to continue</Typography>

              <View className="gap-y-5">
                <View>
                  <Typography variant="body-sm" className="mb-2 font-bold text-text-dark">Email</Typography>
                  <View className="flex-row items-center border border-brand-bubble/30 rounded-2xl px-4 py-4 bg-brand-section/50">
                    <Mail size={20} color={COLORS.primary} />
                    <TextInput
                      className="flex-1 ml-3 text-text-dark text-base"
                      placeholder="you@example.com"
                      placeholderTextColor={COLORS.textLight}
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

                <View>
                  <Typography variant="body-sm" className="mb-2 font-bold text-text-dark">Password</Typography>
                  <View className="flex-row items-center border border-brand-bubble/30 rounded-2xl px-4 py-4 bg-brand-section/50">
                    <Lock size={20} color={COLORS.primary} />
                    <TextInput
                      className="flex-1 ml-3 text-text-dark text-base"
                      placeholder="Enter your password"
                      placeholderTextColor={COLORS.textLight}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(val) => {
                        clearError();
                        setPassword(val);
                      }}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowPassword(!showPassword)}
                      className="ml-2"
                      activeOpacity={0.7}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color={COLORS.textLight} />
                      ) : (
                        <Eye size={20} color={COLORS.textLight} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {(localError || error) && (
                  <View className="bg-danger/5 border border-danger/20 rounded-xl px-4 py-3">
                    <Typography variant="body-sm" className="text-danger font-medium">
                      {localError || error}
                    </Typography>
                  </View>
                )}

                <Button 
                  label="Sign in" 
                  isLoading={isLoading} 
                  onPress={handleLogin}
                  className="mt-4 shadow-brand py-4"
                  size="lg"
                />
              </View>

              <View className="mt-8 flex-row justify-center items-center">
                <Typography variant="body-sm" className="text-text-light">New customer? </Typography>
                <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                  <Typography variant="body-sm" className="text-brand-blue font-bold">
                    Create an account
                  </Typography>
                </TouchableOpacity>
              </View>
            </Card>

            <View className="mt-12 mb-10 items-center opacity-40">
              <View className="flex-row items-center">
                <ShieldCheck size={16} color={COLORS.textLight} />
                <Typography variant="caption" className="ml-2 text-text-light font-bold">
                  SECURE PORTAL
                </Typography>
              </View>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
