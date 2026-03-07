import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    // Alert.alert is not reliably supported on web — use window.confirm as fallback
    const confirmed =
      Platform.OS === 'web'
        ? window.confirm('Are you sure you want to logout?')
        : await new Promise<boolean>((resolve) =>
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Logout', style: 'destructive', onPress: () => resolve(true) },
            ]),
          );
    if (!confirmed) return;
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    // Navigation handled by AuthGate
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View className="flex-row items-center justify-between py-3.5 border-b border-gray-100">
      <Text className="text-gray-500 text-sm">{label}</Text>
      <Text className="text-gray-800 text-sm font-semibold">{value}</Text>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-primary-700 px-6 pt-14 pb-10 items-center">
        <View className="w-20 h-20 bg-blue-500 rounded-full items-center justify-center mb-3 border-4 border-white">
          <Text className="text-white text-3xl font-bold">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text className="text-white text-xl font-bold">{user?.name ?? 'Driver'}</Text>
        <View className="bg-blue-500 px-3 py-1 rounded-full mt-2">
          <Text className="text-white text-xs font-semibold">🚗 Driver</Text>
        </View>
      </View>

      {/* Info card */}
      <View className="bg-white mx-4 -mt-4 rounded-2xl border border-gray-100 shadow-sm px-4 mb-4">
        <InfoRow label="Mobile" value={`+91 ${user?.mobile ?? '—'}`} />
        <InfoRow label="Email" value={user?.email ?? 'Not set'} />
        <InfoRow label="Account Status" value={user?.isActive ? '✅ Active' : '⛔ Inactive'} />
        <InfoRow label="Role" value={user?.role ?? '—'} />
      </View>

      {/* App info card */}
      <View className="bg-white mx-4 rounded-2xl border border-gray-100 shadow-sm px-4 mb-4">
        <View className="py-3.5 border-b border-gray-100">
          <Text className="text-gray-700 font-semibold text-sm">Vastra Express Driver App</Text>
          <Text className="text-gray-400 text-xs mt-0.5">Version 1.0.0</Text>
        </View>
        <View className="py-3.5">
          <Text className="text-gray-400 text-xs">
            For support or issues, contact your facility manager or admin.
          </Text>
        </View>
      </View>

      {/* Logout */}
      <View className="mx-4 mb-10">
        <TouchableOpacity
          className={`rounded-2xl py-4 items-center border border-red-200 bg-red-50 ${loggingOut ? 'opacity-60' : ''}`}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color="#DC2626" />
          ) : (
            <Text className="text-red-600 font-bold text-base">Logout</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
