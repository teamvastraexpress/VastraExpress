import React from 'react';
import { View, Text } from 'react-native';
import { STATUS_LABELS, STATUS_COLORS } from '@/constants';
import type { OrderStatus } from '@/types';

interface Props {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const label = STATUS_LABELS[status] ?? status;
  const color = STATUS_COLORS[status] ?? '#6B7280';

  return (
    <View
      style={{ backgroundColor: color + '20', borderColor: color + '40' }}
      className={`rounded-full border px-3 ${size === 'sm' ? 'py-0.5' : 'py-1'}`}
    >
      <Text
        style={{ color }}
        className={`font-semibold ${size === 'sm' ? 'text-xs' : 'text-xs'}`}
      >
        {label}
      </Text>
    </View>
  );
}
