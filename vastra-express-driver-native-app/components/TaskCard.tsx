import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowRight, PackageSearch, Truck } from 'lucide-react-native';
import { Badge } from './Badge';
import {
  colors,
  getAssignmentStatusColor,
  statusLabel,
  formatSlot,
} from '@/lib/utils';
import type { DeliveryAssignment } from '@/types';

interface TaskCardProps {
  task: DeliveryAssignment;
  onPress: () => void;
}

export function TaskCard({ task, onPress }: TaskCardProps) {
  const isPickup = task.assignmentType === 'PICKUP';
  const slot = task.order.pickupSlot;
  const statusColor = getAssignmentStatusColor(task.status);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.card}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: isPickup ? colors.violet100 : colors.emerald100 },
          ]}
        >
          {isPickup ? (
            <PackageSearch size={16} color={colors.violet700} />
          ) : (
            <Truck size={16} color={colors.emerald700} />
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.orderNumber} numberOfLines={1}>
              {task.order.orderNumber}
            </Text>
            {task.order.isExpress && (
              <Badge bg={colors.orange100} textColor={colors.orange700}>
                Express
              </Badge>
            )}
            <Badge bg={statusColor.bg} textColor={statusColor.text}>
              {statusLabel(task.status)}
            </Badge>
          </View>

          <Text style={styles.customer} numberOfLines={1}>
            {task.order.customer.name ?? task.order.customer.mobileNumber}
          </Text>

          <Text style={styles.address} numberOfLines={1}>
            {task.order.address.houseFlatNo}, {task.order.address.street}
            {task.order.address.landmark
              ? `, ${task.order.address.landmark}`
              : ''}
            , {task.order.address.city.name} — {task.order.address.pincode}
          </Text>

          {slot && (
            <Text
              style={[
                styles.slot,
                { color: isPickup ? colors.violet700 : colors.emerald700 },
              ]}
            >
              {isPickup ? '🕐' : '🚚'}{' '}
              {formatSlot(slot.slotDate, slot.startTime, slot.endTime)}
            </Text>
          )}

          <Text style={styles.service}>
            Service: {task.order.serviceType.replace(/_/g, ' ')}
            {isPickup && task.order.initialWeight
              ? ` • ${task.order.initialWeight} kg`
              : ''}
            {!isPickup && task.order.finalWeight
              ? ` • ${task.order.finalWeight} kg`
              : ''}
          </Text>
        </View>

        <ArrowRight size={16} color={colors.gray300} style={styles.arrow} />
      </View>
    </TouchableOpacity>
  );
}

/** Compact row used on the dashboard */
export function TaskRow({
  task,
  onPress,
}: {
  task: DeliveryAssignment;
  onPress: () => void;
}) {
  const isPickup = task.assignmentType === 'PICKUP';
  const slot = task.order.pickupSlot;
  const statusColor = getAssignmentStatusColor(task.status);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.rowCompact}
    >
      <View
        style={[
          styles.iconBoxSmall,
          { backgroundColor: isPickup ? colors.violet100 : colors.emerald100 },
        ]}
      >
        {isPickup ? (
          <PackageSearch size={14} color={colors.violet700} />
        ) : (
          <Truck size={14} color={colors.emerald700} />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.orderNumberSmall} numberOfLines={1}>
            {task.order.orderNumber}
          </Text>
          <Badge bg={statusColor.bg} textColor={statusColor.text}>
            {statusLabel(task.status)}
          </Badge>
        </View>
        <Text style={styles.addressSmall} numberOfLines={1}>
          {task.order.customer.name ?? task.order.customer.mobileNumber} •{' '}
          {task.order.address.street}, {task.order.address.city.name}
        </Text>
        {slot && (
          <Text style={styles.slotSmall}>
            🕐 {formatSlot(slot.slotDate, slot.startTime, slot.endTime)}
          </Text>
        )}
      </View>

      <ArrowRight size={14} color={colors.gray300} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray900,
  },
  customer: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray700,
  },
  address: {
    fontSize: 11,
    color: colors.gray500,
    marginTop: 2,
  },
  slot: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
  },
  service: {
    fontSize: 11,
    color: colors.gray400,
    marginTop: 4,
  },
  arrow: {
    marginTop: 4,
  },
  // Compact row (dashboard)
  rowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBoxSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderNumberSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray900,
  },
  addressSmall: {
    fontSize: 11,
    color: colors.gray500,
  },
  slotSmall: {
    fontSize: 11,
    color: colors.gray400,
    marginTop: 2,
  },
});
