import { useState } from 'react';
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
import api from '@/lib/api';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');

    if (!email.trim()) {
      setError('Enter your email address');
      return;
    }

    if (!password) {
      setError('Enter your password');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user } = res.data;
      const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name ?? '';

      if (roleName !== 'CUSTOMER') {
        throw new Error('This account is not registered as a customer.');
      }

      setAuth(user, accessToken);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="bg-primary-600 px-6 pt-16 pb-12 items-center">
          <Text className="text-5xl mb-3">👕</Text>
          <Text className="text-white text-3xl font-bold">Vastra Express</Text>
          <Text className="text-blue-200 text-base mt-1">Customer Portal</Text>
        </View>

        <View className="flex-1 px-6 pt-10">
          <Text className="text-gray-800 text-2xl font-bold mb-1">Welcome back</Text>
          <Text className="text-gray-500 text-sm mb-8">Sign in with your email and password</Text>

          <Text className="text-gray-700 text-sm font-semibold mb-1">Email</Text>
          <View className="flex-row items-center border border-gray-300 rounded-xl px-4 mb-4 bg-gray-50">
            <TextInput
              className="flex-1 py-3.5 text-gray-800 text-base"
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setError('');
              }}
              autoFocus
            />
          </View>

          <Text className="text-gray-700 text-sm font-semibold mb-1">Password</Text>
          <View className="flex-row items-center border border-gray-300 rounded-xl px-4 mb-1 bg-gray-50">
            <TextInput
              className="flex-1 py-3.5 text-gray-800 text-base"
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setError('');
              }}
            />
          </View>

          {error ? <Text className="text-red-500 text-xs mt-3">{error}</Text> : null}

          <TouchableOpacity
            className={`rounded-xl py-4 items-center mt-6 ${loading ? 'bg-blue-300' : 'bg-primary-600'}`}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-5 items-center"
            onPress={() => router.push('/(auth)/register')}
          >
            <Text className="text-gray-500 text-sm">
              Don't have an account?{' '}
              <Text className="text-blue-600 font-semibold">Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
