import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Shirt } from 'lucide-react-native';
import { Typography } from './ui/Typography';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { COLORS, STATUS_LABELS, STATUS_COLORS, SERVICE_LABELS } from '@/constants';
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
    return 'warning';
  };

  const formattedDate = order.createdAt 
    ? format(new Date(order.createdAt), 'dd MMM yyyy')
    : '—';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(`/order/${order.id}`)}
    >
      <Card variant="default" className="p-4 mb-3">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-brand-hero items-center justify-center">
              <Shirt size={20} color={COLORS.primary} />
            </View>
            <View className="ml-3">
              <Typography variant="heading-sm" className="text-sm">
                {order.orderNumber || `#${String(order.id).padStart(4, '0')}`}
              </Typography>
              <Typography variant="caption" className="mt-0.5">
                {SERVICE_LABELS[order.serviceType] || order.serviceType} · {formattedDate}
              </Typography>
            </View>
          </View>
          <View className="flex-row items-center">
            <Badge variant={getStatusVariant(order.status)} size="sm">
              {STATUS_LABELS[order.status] || order.status}
            </Badge>
            <ArrowRight size={14} color={COLORS.textLight} className="ml-2" />
          </View>
        </View>

        {order.estimatedAmount != null && (
          <View className="border-t border-brand-bubble/20 pt-3 flex-row justify-between items-center">
            <Typography variant="body-sm">Estimated Amount</Typography>
            <Typography variant="heading-sm" className="text-brand-blue">
              ₹{order.estimatedAmount}
            </Typography>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}
