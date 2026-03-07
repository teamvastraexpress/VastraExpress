import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { mySubscription, fetchMySubscription } = useSubscriptionStore();

  useEffect(() => {
    fetchMySubscription();
  }, []);

  async function handleLogout() {
    // Alert.alert is silently blocked on Expo Web — use window.confirm instead
    const confirmed =
      Platform.OS === 'web'
        ? (window as any).confirm('Are you sure you want to logout?')
        : await new Promise<boolean>((resolve) =>
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Logout', style: 'destructive', onPress: () => resolve(true) },
            ])
          );
    if (!confirmed) return;
    await logout();
    router.replace('/(auth)/login');
  }

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={fetchMySubscription}
          colors={['#7C3AED']}
          tintColor="#7C3AED"
        />
      }
    >
      {/* Header */}
      <View className="bg-primary-600 pt-14 pb-10 px-6 items-center">
        <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-3">
          <Text className="text-white text-3xl font-bold">{initials}</Text>
        </View>
        <Text className="text-white text-xl font-bold">{user?.name ?? 'Customer'}</Text>
        <Text className="text-primary-200 text-sm mt-0.5">+91 {user?.mobile}</Text>
        {user?.email ? (
          <Text className="text-primary-200 text-xs mt-0.5">{user.email}</Text>
        ) : null}
      </View>

      <View className="px-4 -mt-4">
        {/* Subscription card hidden — feature not yet active */}

        {/* Menu items */}
        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 overflow-hidden">
          {[
            { icon: '👤', label: 'Edit Profile', route: '/profile/edit' },
            { icon: '📍', label: 'My Addresses', route: '/addresses' },
            { icon: '📋', label: 'Order History', route: '/(tabs)/orders' },
          ].map(({ icon, label, route }, i) => (
            <TouchableOpacity
              key={route}
              onPress={() => router.push(route as any)}
              className={`flex-row items-center px-4 py-4 ${
                i > 0 ? 'border-t border-gray-50' : ''
              }`}
            >
              <Text className="text-lg mr-3">{icon}</Text>
              <Text className="flex-1 text-gray-700 font-medium">{label}</Text>
              <Text className="text-gray-300">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-50 border border-red-100 rounded-2xl py-4 items-center mb-8"
        >
          <Text className="text-red-500 font-semibold">🚪 Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
