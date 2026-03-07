import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useDeliveryStore } from '@/store/deliveryStore';

interface StatCardProps {
  emoji: string;
  count: number;
  label: string;
  onPress?: () => void;
  color: string;
}

function StatCard({ emoji, count, label, onPress, color }: StatCardProps) {
  return (
    <TouchableOpacity
      className="flex-1 rounded-2xl p-4 mx-1 items-center"
      style={{ backgroundColor: color }}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <Text className="text-3xl mb-1">{emoji}</Text>
      <Text className="text-white text-2xl font-bold">{count}</Text>
      <Text className="text-white text-xs opacity-80 text-center mt-0.5">{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    pickupTasks, deliveryTasks,
    fetchPickupTasks, fetchDeliveryTasks,
    isLoading,
  } = useDeliveryStore();

  const load = () => {
    fetchPickupTasks();
    fetchDeliveryTasks();
  };

  useEffect(() => { load(); }, []);

  // Compute stats from task lists
  const activePickups   = pickupTasks.filter((t) => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length;
  const activeDeliveries = deliveryTasks.filter((t) => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length;
  const completedToday  = [...pickupTasks, ...deliveryTasks].filter((t) => {
    if (t.status !== 'COMPLETED') return false;
    const d = new Date(t.completedAt ?? t.assignedAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Recent active tasks (up to 3)
  const recentActive = [...pickupTasks, ...deliveryTasks]
    .filter((t) => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status))
    .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
    .slice(0, 3);

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} />}
    >
      {/* Header */}
      <View className="bg-primary-700 px-6 pt-14 pb-8">
        <Text className="text-blue-200 text-sm">{greeting()},</Text>
        <Text className="text-white text-2xl font-bold mt-0.5">
          {user?.name ?? 'Driver'} 👋
        </Text>
        <Text className="text-blue-300 text-xs mt-1">+91 {user?.mobile}</Text>
      </View>

      <View className="px-4 -mt-4">
        {/* Stats row */}
        <View className="flex-row mb-4">
          <StatCard
            emoji="📦"
            count={activePickups}
            label="Active Pickups"
            color="#2563EB"
            onPress={() => router.push('/(tabs)/pickups')}
          />
          <StatCard
            emoji="🚚"
            count={activeDeliveries}
            label="Active Deliveries"
            color="#7C3AED"
            onPress={() => router.push('/(tabs)/deliveries')}
          />
          <StatCard
            emoji="✅"
            count={completedToday}
            label="Done Today"
            color="#059669"
          />
        </View>

        {/* Quick Actions */}
        <View className="flex-row mb-5">
          <TouchableOpacity
            className="flex-1 bg-white rounded-2xl p-4 mr-2 border border-gray-100 shadow-sm flex-row items-center"
            onPress={() => router.push('/(tabs)/pickups')}
          >
            <Text className="text-2xl mr-3">📦</Text>
            <View>
              <Text className="text-gray-800 font-bold text-sm">Pickup Tasks</Text>
              <Text className="text-gray-400 text-xs">{activePickups} pending</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-white rounded-2xl p-4 ml-2 border border-gray-100 shadow-sm flex-row items-center"
            onPress={() => router.push('/(tabs)/deliveries')}
          >
            <Text className="text-2xl mr-3">🚚</Text>
            <View>
              <Text className="text-gray-800 font-bold text-sm">Delivery Tasks</Text>
              <Text className="text-gray-400 text-xs">{activeDeliveries} pending</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent active tasks */}
        {recentActive.length > 0 && (
          <View className="mb-6">
            <Text className="text-gray-700 font-bold text-base mb-3">🔥 Active Now</Text>
            {recentActive.map((t) => {
              const isPickup = t.assignmentType === 'PICKUP';
              return (
                <TouchableOpacity
                  key={t.id}
                  className="bg-white rounded-2xl p-4 mb-2 border border-gray-100 shadow-sm"
                  onPress={() =>
                    router.push({ pathname: '/task/[id]', params: { id: String(t.id), type: t.assignmentType } })
                  }
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-800 font-bold">#{t.order.orderNumber}</Text>
                    <View className={`px-2 py-0.5 rounded-full ${isPickup ? 'bg-blue-100' : 'bg-purple-100'}`}>
                      <Text className={`text-xs font-semibold ${isPickup ? 'text-blue-700' : 'text-purple-700'}`}>
                        {isPickup ? '📦 Pickup' : '🚚 Delivery'}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-gray-500 text-xs mt-1">
                    {t.order.customer?.name} • {t.order.address?.city?.name}
                  </Text>
                  <Text className="text-primary-600 text-xs font-semibold mt-2">
                    Tap to continue →
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {recentActive.length === 0 && !isLoading && (
          <View className="bg-white rounded-2xl p-8 items-center border border-gray-100 mb-6">
            <Text className="text-4xl mb-2">🎉</Text>
            <Text className="text-gray-700 font-bold text-base">All clear!</Text>
            <Text className="text-gray-400 text-sm mt-1">No active tasks right now</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
