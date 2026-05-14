import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Shirt } from 'lucide-react-native';
import { Typography } from './ui/Typography';
import { Badge } from './ui/Badge';
import { COLORS, STATUS_LABELS, SERVICE_LABELS } from '@/constants';
import type { Order } from '@/types';
import { format } from 'date-fns';

interface Props {
  order: Order;
}

export default function OrderCard({ order }: Props) {
  const router = useRouter();

  const getStatusVariant = (status: string): any => {
    if (['DELIVERED'].includes(status)) return 'success';
    if (['CANCELLED', 'PICKUP_FAILED', 'DELIVERY_FAILED'].includes(status)) return 'danger';
    if (['ORDER_CREATED', 'ORDER_CONFIRMED'].includes(status)) return 'brand';
    if (['PENDING_APPROVAL'].includes(status)) return 'warning';
    return 'sky';
  };

  const formattedDate = order.createdAt
    ? format(new Date(order.createdAt), 'dd MMM yyyy')
    : '—';

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={() => router.push(`/order/${order.id}`)}
    >
      <View
        className="bg-white rounded-2xl p-4 mb-3 border border-border"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View
              className="w-11 h-11 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: COLORS.primaryBg }}
            >
              <Shirt size={20} color={COLORS.primary} strokeWidth={1.5} />
            </View>
            <View className="flex-1">
              <Typography variant="heading-sm" className="text-sm">
                {order.orderNumber || `#${String(order.id).padStart(4, '0')}`}
              </Typography>
              <Typography variant="body-sm" className="text-text-tertiary mt-0.5">
                {SERVICE_LABELS[order.serviceType] || order.serviceType} · {formattedDate}
              </Typography>
            </View>
          </View>
          <View className="flex-row items-center ml-2">
            <Badge variant={getStatusVariant(order.status)} size="sm">
              {STATUS_LABELS[order.status] || order.status}
            </Badge>
            <ChevronRight size={16} color={COLORS.textTertiary} className="ml-1" />
          </View>
        </View>

        {order.estimatedAmount != null && (
          <View className="border-t border-border mt-3 pt-3 flex-row justify-between items-center">
            <Typography variant="body-sm" className="text-text-tertiary">Estimated</Typography>
            <Typography variant="heading-sm" className="text-primary-400">
              ₹{order.estimatedAmount}
            </Typography>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
