import React, { useEffect, useState } from 'react';
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
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FadeInView } from '@/components/ui/FadeInView';
import { COLORS, ACTIVE_STATUSES, COMPLETED_STATUSES, CANCELLED_STATUSES } from '@/constants';
import type { Order } from '@/types';
import { useRouter, useFocusEffect } from 'expo-router';
import { ClipboardList, Filter, XCircle } from 'lucide-react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type FilterType = 'all' | 'active' | 'completed' | 'cancelled';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
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
    <SafeAreaView className="flex-1 bg-offwhite">
      {/* Header */}
      <View className="px-6 pt-8 pb-6 bg-white border-b border-brand-bubble/10">
        <FadeInView delay={100}>
          <View className="flex-row justify-between items-center">
            <View>
              <Typography variant="display-sm" className="text-2xl font-bold">My Orders</Typography>
              <Typography variant="body-sm" className="text-text-light mt-1">
                {orders.length} total orders
              </Typography>
            </View>
            <TouchableOpacity 
              onPress={fetchOrders}
              className="bg-brand-section p-2.5 rounded-xl border border-brand-bubble/20"
            >
              <Typography variant="body-sm" className="text-brand-blue font-bold">Refresh</Typography>
            </TouchableOpacity>
          </View>
        </FadeInView>

        {/* Modern Filter Tabs */}
        <FadeInView delay={200} direction="right">
          <View className="flex-row gap-x-2 mt-6">
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                className={cn(
                  "px-5 py-2.5 rounded-full",
                  filter === f.key ? "bg-brand-blue shadow-brand" : "bg-brand-bubble/10 border border-brand-bubble/20"
                )}
              >
                <Typography 
                  variant="body-sm" 
                  className={cn(
                    "font-bold",
                    filter === f.key ? "text-white" : "text-text-mid"
                  )}
                >
                  {f.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </FadeInView>
      </View>

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
              <View className="w-24 h-24 bg-brand-hero/30 rounded-full items-center justify-center mb-6">
                <Typography className="text-5xl">📬</Typography>
              </View>
              <Typography variant="heading-md" className="text-center text-text-dark font-bold">
                {filter === 'cancelled' ? 'No cancelled orders' : 'No orders found'}
              </Typography>
              <Typography variant="body-sm" className="text-center text-text-light mt-2 px-6">
                {filter === 'active' 
                  ? "You don't have any active orders right now." 
                  : filter === 'completed'
                  ? "You haven't completed any orders yet."
                  : filter === 'cancelled'
                  ? "You don't have any cancelled or failed orders."
                  : "Book a pickup to get started!"}
              </Typography>
              {filter !== 'cancelled' && (
                <Button 
                  label="Book a Pickup" 
                  className="mt-8 px-10 shadow-brand"
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
