import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, isLoading } = useAuthStore();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  async function handleSave() {
    try {
      await updateProfile({ name: name.trim() || undefined, email: email.trim() || undefined });
      Alert.alert('Saved', 'Profile updated successfully!');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not update profile');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-gray-50"
    >
      <View className="bg-white border-b border-gray-100 px-4 pt-14 pb-4 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-2xl text-gray-600">←</Text>
        </TouchableOpacity>
        <Text className="text-gray-800 text-xl font-bold">Edit Profile</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" keyboardShouldPersistTaps="handled">
        <View className="bg-white rounded-2xl border border-gray-100 p-4 gap-4 mb-6">
          {/* Mobile (read-only) */}
          <View>
            <Text className="text-gray-600 text-sm font-medium mb-1.5">
              Mobile Number
            </Text>
            <View className="border border-gray-100 rounded-xl px-4 py-3 bg-gray-50 flex-row items-center">
              <Text className="text-gray-400 text-sm">+91 {user?.mobileNumber}</Text>
              <View className="ml-2 bg-gray-200 px-2 py-0.5 rounded">
                <Text className="text-gray-400 text-xs">Verified</Text>
              </View>
            </View>
          </View>

          {/* Name */}
          <View>
            <Text className="text-gray-600 text-sm font-medium mb-1.5">Full Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50 text-sm"
            />
          </View>

          {/* Email */}
          <View>
            <Text className="text-gray-600 text-sm font-medium mb-1.5">
              Email (optional)
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50 text-sm"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          className={`rounded-xl py-4 items-center ${
            isLoading ? 'bg-gray-200' : 'bg-primary-600'
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
