import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Mail,
  Lock,
  Phone,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  Shield,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants';
import api from '@/lib/api';

type RegisterStep = 'form' | 'otp';

export default function RegisterScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<RegisterStep>('form');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const nameValid = /^[a-zA-Z\s'-]{2,100}$/.test(name.trim());
  const mobileValid = /^[6-9]\d{9}$/.test(mobile.trim());
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;

  function startCooldown() {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendOtp() {
    setError('');
    if (!name.trim()) { setError('Name is required'); return; }
    if (!nameValid) { setError('Enter a valid name'); return; }
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
    if (!otp.trim() || otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        email: email.trim(), otp: otp.trim(), name: name.trim(),
        mobileNumber: mobile.trim(), role: 'CUSTOMER', password,
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

  const InputField = ({
    icon: Icon, placeholder, value, onChangeText, ...rest
  }: {
    icon: any; placeholder: string; value: string;
    onChangeText: (v: string) => void;
    [key: string]: any;
  }) => (
    <View className="flex-row items-center border border-border rounded-xl px-4 py-3.5 bg-white">
      <Icon size={18} color={COLORS.textTertiary} strokeWidth={1.8} />
      <TextInput
        className="flex-1 ml-3 text-text-primary text-sm"
        placeholder={placeholder}
        placeholderTextColor={COLORS.textTertiary}
        value={value}
        onChangeText={(v) => { onChangeText(v); setError(''); }}
        {...rest}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View className="pt-24 pb-10 items-center px-6">
            <View className="w-20 h-20 rounded-3xl items-center justify-center mb-8" style={{ backgroundColor: COLORS.primaryBg }}>
              <Image source={require('@/assets/vastra-logo.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
            </View>
            <Typography variant="display-md" className="text-center">
              {step === 'form' ? 'Create Account' : 'Verify Email'}
            </Typography>
            <Typography variant="body-lg" className="text-text-tertiary text-center mt-2">
              {step === 'form' ? 'Sign up for Vastra Express' : `Code sent to ${email}`}
            </Typography>
          </View>

          {/* Form */}
          <View className="flex-1 px-6">
            {step === 'form' ? (
              <View className="gap-y-4">
                <View>
                  <Typography variant="body-sm" className="mb-2 font-medium text-text-primary">Full Name</Typography>
                  <InputField icon={User} placeholder="e.g. Rahul Sharma" value={name} onChangeText={setName} autoCapitalize="words" />
                </View>
                <View>
                  <Typography variant="body-sm" className="mb-2 font-medium text-text-primary">Mobile Number</Typography>
                  <View className="flex-row items-center border border-border rounded-xl px-4 py-3.5 bg-white">
                    <Phone size={18} color={COLORS.textTertiary} strokeWidth={1.8} />
                    <Typography variant="body-sm" className="ml-3 text-text-tertiary font-medium">+91</Typography>
                    <TextInput className="flex-1 ml-1 text-text-primary text-sm" placeholder="9876543210"
                      placeholderTextColor={COLORS.textTertiary} keyboardType="phone-pad" maxLength={10}
                      value={mobile} onChangeText={(v) => { setMobile(v.replace(/\D/g, '')); setError(''); }} />
                  </View>
                </View>
                <View>
                  <Typography variant="body-sm" className="mb-2 font-medium text-text-primary">Email</Typography>
                  <InputField icon={Mail} placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                </View>
                <View>
                  <Typography variant="body-sm" className="mb-2 font-medium text-text-primary">Password</Typography>
                  <View className="flex-row items-center border border-border rounded-xl px-4 py-3.5 bg-white">
                    <Lock size={18} color={COLORS.textTertiary} strokeWidth={1.8} />
                    <TextInput className="flex-1 ml-3 text-text-primary text-sm" placeholder="Min. 8 characters"
                      placeholderTextColor={COLORS.textTertiary} secureTextEntry={!showPassword}
                      value={password} onChangeText={(v) => { setPassword(v); setError(''); }} />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.6}>
                      {showPassword ? <EyeOff size={18} color={COLORS.textTertiary} /> : <Eye size={18} color={COLORS.textTertiary} />}
                    </TouchableOpacity>
                  </View>
                </View>
                <View>
                  <Typography variant="body-sm" className="mb-2 font-medium text-text-primary">Confirm Password</Typography>
                  <InputField icon={Lock} placeholder="Re-enter password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
                </View>

                {error ? (
                  <View className="bg-status-error-bg rounded-xl px-4 py-3">
                    <Typography variant="body-sm" className="text-status-error font-medium">{error}</Typography>
                  </View>
                ) : null}

                <Button label="Continue" isLoading={sendingOtp} onPress={handleSendOtp} className="mt-1" size="lg" />
              </View>
            ) : (
              <View className="gap-y-5">
                <View className="items-center mb-2">
                  <View className="w-14 h-14 rounded-full items-center justify-center mb-4" style={{ backgroundColor: COLORS.primaryBg }}>
                    <KeyRound size={26} color={COLORS.primary} strokeWidth={1.8} />
                  </View>
                </View>

                <View className="flex-row items-center border border-border rounded-xl px-4 py-4 bg-white">
                  <Shield size={18} color={COLORS.textTertiary} strokeWidth={1.8} />
                  <TextInput className="flex-1 ml-3 text-text-primary text-lg text-center tracking-widest"
                    placeholder="000000" placeholderTextColor={COLORS.textTertiary} keyboardType="number-pad"
                    maxLength={6} value={otp} onChangeText={(v) => { setOtp(v.replace(/\D/g, '')); setError(''); }} autoFocus />
                </View>

                <View className="flex-row justify-between items-center">
                  <TouchableOpacity onPress={() => { setStep('form'); setOtp(''); setError(''); }} className="flex-row items-center">
                    <ArrowLeft size={16} color={COLORS.textTertiary} />
                    <Typography variant="body-sm" className="text-text-tertiary ml-1">Back</Typography>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleResendOtp} disabled={cooldown > 0 || sendingOtp}>
                    <Typography variant="body-sm" className={`font-semibold ${cooldown > 0 ? 'text-text-tertiary' : 'text-primary-400'}`}>
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                    </Typography>
                  </TouchableOpacity>
                </View>

                <View className="rounded-xl p-4" style={{ backgroundColor: COLORS.primaryBg }}>
                  <Typography variant="body-sm" className="text-primary-600 font-medium">
                    {name} · {mobile} · {email}
                  </Typography>
                </View>

                {error ? (
                  <View className="bg-status-error-bg rounded-xl px-4 py-3">
                    <Typography variant="body-sm" className="text-status-error font-medium">{error}</Typography>
                  </View>
                ) : null}

                <Button label="Verify & Create Account" isLoading={loading} onPress={handleVerifyAndRegister} size="lg" />
              </View>
            )}

            <View className="mt-8 flex-row justify-center items-center pb-8">
              <Typography variant="body-md" className="text-text-tertiary">Already have an account? </Typography>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Typography variant="body-md" className="text-primary-400 font-semibold">Sign In</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
