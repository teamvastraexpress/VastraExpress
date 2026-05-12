import { Platform } from 'react-native';
import type { OrderStatus, ServiceType } from '@/types';

// ─── API Base ─────────────────────────────────────────────────────────────────

export const API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api'   // Android emulator → host machine
    : 'http://localhost:3000/api'; // Web / iOS simulator

// ─── Theme ────────────────────────────────────────────────────────────────────

export const COLORS = {
  primary:   '#7C3AED',
  primary50: '#f5f3ff',
  success:   '#16a34a',
  warning:   '#d97706',
  danger:    '#dc2626',
  gray:      '#6b7280',
};

// ─── Order Status Labels ──────────────────────────────────────────────────────

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_APPROVAL:     'Awaiting Approval',
  ORDER_CREATED:        'Order Placed',
  ORDER_CONFIRMED:      'Order Placed',
  PICKUP_SCHEDULED:     'Pickup Scheduled',
  PICKUP_ASSIGNED:      'Pickup Scheduled',
  OUT_FOR_PICKUP:       'Pickup Scheduled',
  PICKUP_ARRIVED:       'Pickup Scheduled',
  PICKED_UP:            'Picked Up',
  RECEIVED_AT_FACILITY: 'Processing',
  SORTING:              'Processing',
  WASHING:              'Processing',
  IRONING:              'Processing',
  PACKING:              'Processing',
  READY_FOR_DISPATCH:   'Ready for Dispatch',
  DELIVERY_ASSIGNED:    'Out for Delivery',
  OUT_FOR_DELIVERY:     'Out for Delivery',
  DELIVERY_ARRIVED:     'Out for Delivery',
  DELIVERED:            'Delivered ✓',
  CANCELLED:            'Cancelled',
  PICKUP_FAILED:        'Pickup Failed',
  PROCESSING_ISSUE:     'Processing Issue',
  DELIVERY_FAILED:      'Delivery Failed',
  DECLINED:             'Declined',
};

// Status colour groups
export const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING_APPROVAL:     '#f59e0b',
  ORDER_CREATED:        '#6b7280',
  ORDER_CONFIRMED:      '#2563eb',
  PICKUP_SCHEDULED:     '#2563eb',
  PICKUP_ASSIGNED:      '#7c3aed',
  OUT_FOR_PICKUP:       '#7c3aed',
  PICKUP_ARRIVED:       '#7c3aed',
  PICKED_UP:            '#0891b2',
  RECEIVED_AT_FACILITY: '#0891b2',
  SORTING:              '#d97706',
  WASHING:              '#d97706',
  IRONING:              '#d97706',
  PACKING:              '#d97706',
  READY_FOR_DISPATCH:   '#16a34a',
  DELIVERY_ASSIGNED:    '#7c3aed',
  OUT_FOR_DELIVERY:     '#7c3aed',
  DELIVERY_ARRIVED:     '#7c3aed',
  DELIVERED:            '#16a34a',
  CANCELLED:            '#dc2626',
  PICKUP_FAILED:        '#dc2626',
  PROCESSING_ISSUE:     '#dc2626',
  DELIVERY_FAILED:      '#dc2626',
  DECLINED:             '#dc2626',
};

// ─── Service Labels ───────────────────────────────────────────────────────────

export const SERVICE_LABELS: Record<ServiceType, string> = {
  WASH_FOLD:  'Wash & Fold',
  DRY_CLEAN:  'Dry Clean',
  IRON_ONLY:  'Iron Only',
  SOFA_CLEANING: 'Sofa Cleaning',
};

export const SERVICE_ICONS: Record<ServiceType, string> = {
  WASH_FOLD: '🧺',
  DRY_CLEAN: '👔',
  IRON_ONLY: '♨️',
  SOFA_CLEANING: '🛋️',
};

// ─── Active Statuses (order is in-progress) ───────────────────────────────────

export const ACTIVE_STATUSES: OrderStatus[] = [
  'PENDING_APPROVAL',
  'ORDER_CREATED',
  'ORDER_CONFIRMED',
  'PICKUP_SCHEDULED',
  'PICKUP_ASSIGNED',
  'OUT_FOR_PICKUP',
  'PICKUP_ARRIVED',
  'PICKED_UP',
  'RECEIVED_AT_FACILITY',
  'SORTING',
  'WASHING',
  'IRONING',
  'PACKING',
  'READY_FOR_DISPATCH',
  'DELIVERY_ASSIGNED',
  'OUT_FOR_DELIVERY',
  'DELIVERY_ARRIVED',
];

export const TERMINAL_STATUSES: OrderStatus[] = [
  'DELIVERED',
  'CANCELLED',
  'PICKUP_FAILED',
  'DELIVERY_FAILED',
  'DECLINED',
];

// ─── Tracking Timeline (simplified customer view) ────────────────────────────
// Backend retains full detailed statuses; this maps them to 7 customer steps.
export const TRACKING_STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'ORDER_CREATED',      label: 'Order Placed',     icon: '📋' },
  { status: 'PICKUP_SCHEDULED',   label: 'Pickup Scheduled', icon: '📅' },
  { status: 'PICKED_UP',          label: 'Picked Up',        icon: '📦' },
  { status: 'SORTING',            label: 'Processing',       icon: '🫧' },
  { status: 'READY_FOR_DISPATCH', label: 'Ready for Dispatch', icon: '✅' },
  { status: 'OUT_FOR_DELIVERY',   label: 'Out for Delivery', icon: '🚚' },
  { status: 'DELIVERED',          label: 'Delivered',        icon: '🎉' },
];

// Maps detailed backend status → simplified tracking step index
export function getCustomerTrackingStep(status: OrderStatus): number {
  const GROUP: Record<string, number> = {
    PENDING_APPROVAL:     0,
    ORDER_CREATED:        0,
    ORDER_CONFIRMED:      0,
    PICKUP_SCHEDULED:     1,
    PICKUP_ASSIGNED:      1,
    OUT_FOR_PICKUP:       1,
    PICKUP_ARRIVED:       1,
    PICKED_UP:            2,
    RECEIVED_AT_FACILITY: 3,
    SORTING:              3,
    WASHING:              3,
    IRONING:              3,
    PACKING:              3,
    READY_FOR_DISPATCH:   4,
    DELIVERY_ASSIGNED:    5,
    OUT_FOR_DELIVERY:     5,
    DELIVERY_ARRIVED:     5,
    DELIVERED:            6,
    DECLINED:             0,
  };
  return GROUP[status] ?? 0;
}
