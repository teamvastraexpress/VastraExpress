import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useOrderStore } from '@/store/orderStore';
import OrderCard from '@/components/OrderCard';
import EmptyState from '@/components/EmptyState';
import { ACTIVE_STATUSES, TERMINAL_STATUSES } from '@/constants';
import type { Order } from '@/types';

type Filter = 'all' | 'active' | 'completed';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

export default function OrdersScreen() {
  const { orders, isLoading, fetchOrders } = useOrderStore();
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = orders.filter((o: Order) => {
    if (filter === 'active') return ACTIVE_STATUSES.includes(o.status);
    if (filter === 'completed') return TERMINAL_STATUSES.includes(o.status);
    return true;
  });

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 pt-14 pb-4">
        <Text className="text-gray-800 text-xl font-bold">My Orders</Text>

        {/* Filter tabs */}
        <View className="flex-row gap-2 mt-3">
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full ${
                filter === f.key
                  ? 'bg-primary-600'
                  : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  filter === f.key ? 'text-white' : 'text-gray-500'
                }`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(o) => String(o.id)}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchOrders}
            colors={['#7C3AED']}
            tintColor="#7C3AED"
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="📋"
            title="No orders found"
            subtitle={
              filter === 'active'
                ? 'You have no active orders right now'
                : filter === 'completed'
                ? 'No completed orders yet'
                : 'Place your first order to get started'
            }
          />
        }
      />
    </View>
  );
}
