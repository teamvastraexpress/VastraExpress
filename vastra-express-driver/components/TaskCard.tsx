import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBadge } from './StatusBadge';
import { SERVICE_LABELS } from '@/constants';
import type { DeliveryAssignment } from '@/types';

interface Props {
  assignment: DeliveryAssignment;
}

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatSlot(slot: { slotDate: string; startTime: string; endTime: string } | null) {
  if (!slot) return 'Slot N/A';
  return `${formatDate(slot.slotDate)} • ${slot.startTime} – ${slot.endTime}`;
}

export function TaskCard({ assignment }: Props) {
  const router = useRouter();
  const { order, assignmentType, status, id } = assignment;

  const isPending = ['ASSIGNED'].includes(status);
  const isActive  = ['IN_PROGRESS'].includes(status);
  const isDone    = ['COMPLETED', 'FAILED'].includes(status);

  const borderColor = isActive ? 'border-l-indigo-500'
    : isPending ? 'border-l-blue-500'
    : isDone ? 'border-l-gray-300'
    : 'border-l-gray-200';

  return (
    <TouchableOpacity
      className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${borderColor} mb-3 p-4 shadow-sm`}
      onPress={() => router.push({ pathname: '/task/[id]', params: { id: String(id), type: assignmentType } })}
      activeOpacity={0.8}
    >
      {/* Row 1: order number + badge */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-800 font-bold text-sm">#{order.orderNumber}</Text>
        <StatusBadge status={status} />
      </View>

      {/* Row 2: customer name + service */}
      <Text className="text-gray-700 font-semibold text-base mb-0.5">
        {order.customer?.name ?? 'Customer'}
      </Text>
      <Text className="text-gray-400 text-xs mb-2">
        {SERVICE_LABELS[order.serviceType] ?? order.serviceType}
        {order.isExpress ? '  ⚡ Express' : ''}
        {order.initialWeight ? `  •  ${order.initialWeight} kg` : ''}
      </Text>

      {/* Row 3: address */}
      <View className="flex-row items-start">
        <Text className="text-gray-400 mr-1">📍</Text>
        <Text className="text-gray-500 text-xs flex-1">
          {order.address
            ? `${order.address.houseFlatNo}, ${order.address.street}, ${order.address.city?.name}`
            : 'Address unavailable'}
        </Text>
      </View>

      {/* Row 4: slot (pickup only) */}
      {assignmentType === 'PICKUP' && order.pickupSlot && (
        <View className="flex-row items-center mt-1.5">
          <Text className="text-gray-400 mr-1">🕐</Text>
          <Text className="text-gray-500 text-xs">{formatSlot(order.pickupSlot)}</Text>
        </View>
      )}

      {/* Footer: action hint */}
      {!isDone && (
        <View className="mt-3 pt-3 border-t border-gray-100 flex-row items-center justify-between">
          <Text className="text-primary-600 text-xs font-semibold">
            {isPending ? 'Tap to start task →' : 'Tap to update status →'}
          </Text>
          <Text className="text-gray-400 text-xs">
            {assignmentType === 'PICKUP' ? '📦 Pickup' : '🚚 Delivery'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
