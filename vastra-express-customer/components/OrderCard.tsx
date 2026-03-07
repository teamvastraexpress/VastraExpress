import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import StatusBadge from './StatusBadge';
import { SERVICE_LABELS, SERVICE_ICONS } from '@/constants';
import type { Order } from '@/types';

interface Props {
  order: Order;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function OrderCard({ order }: Props) {
  const router = useRouter();
  const icon = SERVICE_ICONS[order.serviceType] ?? '🧺';
  const label = SERVICE_LABELS[order.serviceType] ?? order.serviceType;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/order/${order.id}`)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3 active:opacity-80"
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-10 h-10 rounded-xl bg-primary-50 items-center justify-center">
            <Text className="text-lg">{icon}</Text>
          </View>
          <View>
            <Text className="text-gray-800 font-semibold text-sm">{label}</Text>
            <Text className="text-gray-400 text-xs">#{order.id}</Text>
          </View>
        </View>
        <StatusBadge status={order.status} size="sm" />
      </View>

      <View className="border-t border-gray-50 pt-3 flex-row justify-between items-center">
        <View>
          <Text className="text-gray-400 text-xs mb-0.5">Pickup date</Text>
          <Text className="text-gray-700 text-sm font-medium">
            {order.pickupSlot?.slotDate
              ? formatDate(order.pickupSlot.slotDate)
              : '—'}
          </Text>
        </View>
        {order.estimatedAmount != null && (
          <View className="items-end">
            <Text className="text-gray-400 text-xs mb-0.5">Amount</Text>
            <Text className="text-primary-600 font-semibold text-sm">
              ₹{order.estimatedAmount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
