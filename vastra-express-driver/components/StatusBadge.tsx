import { View, Text } from 'react-native';
import { STATUS_LABELS } from '@/constants';

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

function getBadgeStyle(status: string) {
  // Pickup flow
  if (['PICKUP_ASSIGNED', 'ASSIGNED'].includes(status))
    return { bg: 'bg-blue-100', text: 'text-blue-700' };
  if (['OUT_FOR_PICKUP', 'IN_PROGRESS'].includes(status))
    return { bg: 'bg-indigo-100', text: 'text-indigo-700' };
  if (status === 'PICKUP_ARRIVED' || status === 'DELIVERY_ARRIVED')
    return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
  if (status === 'PICKED_UP' || status === 'COMPLETED')
    return { bg: 'bg-green-100', text: 'text-green-700' };
  if (status === 'PICKUP_FAILED' || status === 'DELIVERY_FAILED' || status === 'FAILED')
    return { bg: 'bg-red-100', text: 'text-red-700' };
  // Delivery flow
  if (status === 'DELIVERY_ASSIGNED')
    return { bg: 'bg-blue-100', text: 'text-blue-700' };
  if (status === 'OUT_FOR_DELIVERY')
    return { bg: 'bg-indigo-100', text: 'text-indigo-700' };
  if (status === 'DELIVERED')
    return { bg: 'bg-green-100', text: 'text-green-700' };
  if (status === 'CANCELLED')
    return { bg: 'bg-gray-100', text: 'text-gray-600' };
  // default
  return { bg: 'bg-gray-100', text: 'text-gray-600' };
}

export function StatusBadge({ status, size = 'sm' }: Props) {
  const { bg, text } = getBadgeStyle(status);
  const label = STATUS_LABELS[status] ?? status;
  const px = size === 'md' ? 'px-3 py-1' : 'px-2 py-0.5';
  const fontSize = size === 'md' ? 'text-xs' : 'text-xs';

  return (
    <View className={`rounded-full ${bg} ${px} self-start`}>
      <Text className={`${text} ${fontSize} font-semibold`}>{label}</Text>
    </View>
  );
}
