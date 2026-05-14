import React, { useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useOrderStore } from '@/store/orderStore';
import OrderCard from '@/components/OrderCard';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { FadeInView } from '@/components/ui/FadeInView';
import { COLORS, ACTIVE_STATUSES, COMPLETED_STATUSES, CANCELLED_STATUSES } from '@/constants';
import type { Order } from '@/types';
import { useRouter, useFocusEffect } from 'expo-router';
import { Inbox } from 'lucide-react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type FilterType = 'all' | 'active' | 'completed' | 'cancelled';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Done' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, isLoading, fetchOrders } = useOrderStore();
  const [filter, setFilter] = useState<FilterType>('all');

  useFocusEffect(
    React.useCallback(() => {
      fetchOrders();
    }, [])
  );

  const filteredOrders = orders.filter((o: Order) => {
    if (filter === 'active') return ACTIVE_STATUSES.includes(o.status);
    if (filter === 'completed') return COMPLETED_STATUSES.includes(o.status);
    if (filter === 'cancelled') return CANCELLED_STATUSES.includes(o.status);
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-5">
        <FadeInView delay={0}>
          <Typography variant="display-sm">My Orders</Typography>
          <Typography variant="body-md" className="text-text-tertiary mt-1">
            {orders.length} total orders
          </Typography>
        </FadeInView>

        {/* Filter Tabs */}
        <FadeInView delay={100}>
          <View className="flex-row gap-x-2 mt-5">
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.7}
                className={cn(
                  "px-4 py-2 rounded-full",
                  filter === f.key
                    ? "bg-primary-400"
                    : "bg-surface-secondary border border-border-light"
                )}
              >
                <Typography
                  variant="body-sm"
                  className={cn(
                    "font-semibold",
                    filter === f.key ? "text-white" : "text-text-secondary"
                  )}
                >
                  {f.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </FadeInView>
      </View>

      <View className="h-[0.5px] bg-border" />

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchOrders}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center justify-center py-20 px-6">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-5"
                style={{ backgroundColor: COLORS.primaryBg }}
              >
                <Inbox size={32} color={COLORS.primary} strokeWidth={1.5} />
              </View>
              <Typography variant="heading-md" className="text-center mb-2">
                {filter === 'cancelled' ? 'No cancelled orders' : 'No orders found'}
              </Typography>
              <Typography variant="body-md" className="text-center text-text-tertiary mb-8">
                {filter === 'active'
                  ? "You don't have any active orders right now."
                  : filter === 'completed'
                  ? "You haven't completed any orders yet."
                  : filter === 'cancelled'
                  ? "No cancelled or failed orders."
                  : "Book a pickup to get started"}
              </Typography>
              {filter !== 'cancelled' && (
                <Button
                  label="Book a Pickup"
                  onPress={() => router.push('/(tabs)/book')}
                />
              )}
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
