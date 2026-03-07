import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import OrderCard from '@/components/OrderCard';
import { ACTIVE_STATUSES } from '@/constants';
import type { Order } from '@/types';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { orders, isLoading, fetchOrders } = useOrderStore();

  useEffect(() => {
    fetchOrders();
  }, []);

  const activeOrders = orders.filter((o: Order) =>
    ACTIVE_STATUSES.includes(o.status),
  );
  const recentOrders = orders.slice(0, 3);

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => {
            fetchOrders();
          }}
          colors={['#7C3AED']}
          tintColor="#7C3AED"
        />
      }
    >
      {/* Header banner */}
      <View className="bg-primary-600 pt-14 pb-8 px-6">
        <Text className="text-primary-200 text-sm">{getGreeting()},</Text>
        <Text className="text-white text-2xl font-bold mt-0.5">
          {user?.name ?? user?.mobile ?? 'Customer'} 👋
        </Text>

        {/* Subscription pill hidden — feature not yet active */}
      </View>

      <View className="px-4 -mt-4">
        {/* Quick actions */}
        <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <Text className="text-gray-700 font-semibold mb-3">Quick Actions</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push('/order/new')}
              className="flex-1 bg-primary-600 rounded-xl py-4 items-center"
            >
              <Text className="text-2xl mb-1">🧺</Text>
              <Text className="text-white text-xs font-semibold">New Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/addresses')}
              className="flex-1 bg-primary-50 rounded-xl py-4 items-center"
            >
              <Text className="text-2xl mb-1">📍</Text>
              <Text className="text-primary-700 text-xs font-semibold">Addresses</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active orders */}
        {activeOrders.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-800 font-semibold">
                Active ({activeOrders.length})
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
                <Text className="text-primary-600 text-sm">See all</Text>
              </TouchableOpacity>
            </View>
            {activeOrders.slice(0, 2).map((o: Order) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </View>
        )}

        {/* Recent orders */}
        {recentOrders.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-800 font-semibold">Recent Orders</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
                <Text className="text-primary-600 text-sm">See all</Text>
              </TouchableOpacity>
            </View>
            {recentOrders.map((o: Order) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </View>
        )}

        {orders.length === 0 && !isLoading && (
          <View className="bg-white rounded-2xl p-10 items-center mb-6 border border-gray-100">
            <Text className="text-4xl mb-3">🧺</Text>
            <Text className="text-gray-700 font-semibold text-center">
              No orders yet
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-1">
              Place your first order and enjoy fresh laundry!
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/order/new')}
              className="mt-4 bg-primary-600 rounded-xl px-6 py-3"
            >
              <Text className="text-white font-semibold">Order Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
