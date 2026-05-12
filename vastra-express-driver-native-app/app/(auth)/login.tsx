import React, { useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { setToken } from '@/lib/tokenStorage';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { colors } from '@/lib/utils';
import { ShieldCheck, Mail, Lock, KeyRound } from 'lucide-react-native';

type LoginStep = 'login' | 'change-password';

export default function LoginScreen() {
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<LoginStep>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    if (!email.trim()) { setError('Enter your email address'); return; }
    if (!password) { setError('Enter your password'); return; }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user, mustChangePassword, tempToken: token } = res.data;
      const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name ?? '';
      if (roleName !== 'DRIVER') throw new Error('This account is not registered as a driver.');

      if (mustChangePassword && token) {
        setTempToken(token);
        setUserName(user.name);
        setStep('change-password');
        setLoading(false);
        return;
      }

      await setToken(accessToken);
      setAuth(user, accessToken);
      Alert.alert('Welcome back!');
      router.replace('/(tabs)');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    setError('');
    if (!newPassword) { setError('Enter your new password'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await api.post('/auth/change-password', { tempToken, newPassword });
      const { accessToken, user } = res.data;
      await setToken(accessToken);
      setAuth(user, accessToken);
      Alert.alert('Password set successfully. Welcome!');
      router.replace('/(tabs)');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoBox}>
              <Image source={require('@/assets/vastra-logo.png')} style={styles.logoImg} resizeMode="contain" />
            </View>
            <Text style={styles.brand}>Vastra Express</Text>
            <Text style={styles.subtitle}>Driver Portal</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {step === 'login' ? (
              <>
                <View style={styles.headerRow}>
                  <ShieldCheck size={20} color={colors.gray800} />
                  <Text style={styles.cardTitle}>Sign in</Text>
                </View>
                <Text style={styles.cardSubtitle}>Use your email and password to continue</Text>

                <View style={styles.form}>
                  <Input label="Email" keyboardType="email-address" autoCapitalize="none"
                    placeholder="driver@example.com" value={email}
                    onChangeText={(v) => { setError(''); setEmail(v); }}
                    leftAddon={<Mail size={16} color={colors.gray400} />} />
                  <Input label="Password" secureTextEntry placeholder="Enter your password"
                    value={password} onChangeText={(v) => { setError(''); setPassword(v); }}
                    leftAddon={<Lock size={16} color={colors.gray400} />} />

                  {!!error && (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <Button size="lg" loading={loading} onPress={handleLogin}>Sign in</Button>
                </View>

                <Text style={styles.hint}>First time? Use the OTP sent to your email as the password.</Text>
              </>
            ) : (
              <>
                <View style={styles.headerRow}>
                  <KeyRound size={20} color={colors.amber600} />
                  <Text style={styles.cardTitle}>Set New Password</Text>
                </View>
                <Text style={styles.cardSubtitle}>Welcome, {userName}! Please set your own password.</Text>

                <View style={styles.form}>
                  <Input label="New Password" secureTextEntry placeholder="Minimum 8 characters"
                    value={newPassword} onChangeText={(v) => { setError(''); setNewPassword(v); }}
                    leftAddon={<Lock size={16} color={colors.gray400} />} />
                  <Input label="Confirm Password" secureTextEntry placeholder="Re-enter your password"
                    value={confirmPassword} onChangeText={(v) => { setError(''); setConfirmPassword(v); }}
                    leftAddon={<Lock size={16} color={colors.gray400} />} />

                  {!!error && (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <Button size="lg" loading={loading} onPress={handleChangePassword}>Set Password & Continue</Button>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f8fafc', justifyContent: 'center', padding: 16 },
  inner: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 72, height: 72, borderRadius: 16, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, marginBottom: 16 },
  logoImg: { width: 48, height: 48 },
  brand: { fontSize: 22, fontWeight: '700', color: colors.gray900 },
  subtitle: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  card: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.gray200, padding: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: colors.gray900 },
  cardSubtitle: { fontSize: 13, color: colors.gray500, marginBottom: 20 },
  form: { gap: 16 },
  errorBox: { backgroundColor: colors.red50, borderWidth: 1, borderColor: colors.red200, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  errorText: { fontSize: 13, color: colors.red600 },
  hint: { fontSize: 11, color: colors.gray400, textAlign: 'center', marginTop: 16 },
});
