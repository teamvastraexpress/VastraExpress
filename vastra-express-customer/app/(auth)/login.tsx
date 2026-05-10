import React, { useState } from 'react';
import { View, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react-native';
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
    <SafeAreaView className="flex-1 bg-brand-hero">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View className="h-[350px] bg-brand-blue justify-center items-center px-6 overflow-hidden">
             <View className="absolute top-[-10] left-[-20] w-40 h-40 rounded-full bg-white/10" />
             <View className="absolute bottom-[-20] right-[-10] w-32 h-32 rounded-full bg-white/10" />
             
             <View className="bg-white p-4 rounded-2xl shadow-xl mb-4">
                <Image 
                  source={require('@/assets/icon.png')} 
                  style={{ width: 60, height: 60 }} 
                  resizeMode="contain"
                />
             </View>
             <Typography variant="display-sm" className="text-white text-center">Vastra Express</Typography>
             <Typography variant="body-md" className="text-white/80 text-center mt-2">
               Premium laundry at your doorstep
             </Typography>
          </View>

          {/* Form Section */}
          <View className="flex-1 px-6 -mt-10">
            <Card variant="elevated" className="p-8">
              <Typography variant="heading-lg" className="mb-1">Sign in</Typography>
              <Typography variant="body-sm" className="mb-6">Use your email and password to continue</Typography>

              <View className="gap-y-4">
                <View>
                  <Typography variant="body-sm" className="mb-1.5 font-semibold text-text-dark">Email</Typography>
                  <View className="flex-row items-center border border-brand-bubble/50 rounded-xl px-4 py-3 bg-offwhite">
                    <Mail size={18} color={COLORS.textLight} />
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
                  <Typography variant="body-sm" className="mb-1.5 font-semibold text-text-dark">Password</Typography>
                  <View className="flex-row items-center border border-brand-bubble/50 rounded-xl px-4 py-3 bg-offwhite">
                    <Lock size={18} color={COLORS.textLight} />
                    <TextInput
                      className="flex-1 ml-3 text-text-dark text-base"
                      placeholder="••••••••"
                      placeholderTextColor={COLORS.textLight}
                      secureTextEntry
                      value={password}
                      onChangeText={(val) => {
                        clearError();
                        setPassword(val);
                      }}
                    />
                  </View>
                </View>

                {(localError || error) && (
                  <View className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                    <Typography variant="body-sm" className="text-danger">
                      {localError || error}
                    </Typography>
                  </View>
                )}

                <Button 
                  label="Sign in" 
                  isLoading={isLoading} 
                  onPress={handleLogin}
                  className="mt-4"
                  size="lg"
                  rightIcon={<ArrowRight size={18} color="white" />}
                />
              </View>

              <View className="mt-8 flex-row justify-center items-center">
                <Typography variant="body-sm">New customer? </Typography>
                <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                  <Typography variant="body-sm" className="text-brand-blue font-bold">
                    Create an account
                  </Typography>
                </TouchableOpacity>
              </View>
            </Card>

            <View className="mt-8 mb-10 items-center">
              <View className="flex-row items-center bg-white/50 px-4 py-2 rounded-full border border-brand-bubble/20">
                <ShieldCheck size={16} color={COLORS.primary} />
                <Typography variant="caption" className="ml-2 text-brand-blue">
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
