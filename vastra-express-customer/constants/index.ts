export const COLORS = {
  primary: '#1A6FC4',
  secondary: '#4EAEE5',
  brandHero: '#E8F4FB',
  brandBubble: '#A8D8F0',
  brandSection: '#F0F8FF',
  offwhite: '#F8FAFC',
  white: '#FFFFFF',
  textDark: '#1B2A3B',
  textMid: '#4A5A6B',
  textLight: '#8FA3B1',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

export const STATUS_LABELS: Record<string, string> = {
  ORDER_CREATED: 'Order Placed',
  ORDER_CONFIRMED: 'Confirmed',
  PICKUP_SCHEDULED: 'Scheduled',
  PICKUP_ASSIGNED: 'Driver Assigned',
  OUT_FOR_PICKUP: 'Out for Pickup',
  PICKUP_ARRIVED: 'Arrived',
  PICKED_UP: 'Picked Up',
  PICKUP_FAILED: 'Pickup Failed',
  RECEIVED_AT_FACILITY: 'Received',
  SORTING: 'Processing',
  WASHING: 'Processing',
  IRONING: 'Processing',
  PACKING: 'Processing',
  BILL_GENERATED: 'Bill Ready',
  READY_FOR_DISPATCH: 'Ready',
  DELIVERY_ASSIGNED: 'Delivery Set',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERY_ARRIVED: 'Arrived',
  DELIVERED: 'Delivered',
  DELIVERY_FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  PROCESSING_ISSUE: 'Issue',
};

export const STATUS_COLORS: Record<string, string> = {
  ORDER_CREATED: '#64748b',
  ORDER_CONFIRMED: '#1A6FC4',
  PICKUP_SCHEDULED: '#1A6FC4',
  PICKUP_ASSIGNED: '#6366f1',
  OUT_FOR_PICKUP: '#a855f7',
  PICKUP_ARRIVED: '#a855f7',
  PICKED_UP: '#06b6d4',
  PICKUP_FAILED: '#ef4444',
  RECEIVED_AT_FACILITY: '#14b8a6',
  SORTING: '#eab308',
  WASHING: '#eab308',
  IRONING: '#f97316',
  PACKING: '#f97316',
  BILL_GENERATED: '#84cc16',
  READY_FOR_DISPATCH: '#84cc16',
  DELIVERY_ASSIGNED: '#10b981',
  OUT_FOR_DELIVERY: '#22c55e',
  DELIVERY_ARRIVED: '#22c55e',
  DELIVERED: '#15803d',
  DELIVERY_FAILED: '#ef4444',
  CANCELLED: '#64748b',
};

export const SERVICE_LABELS: Record<string, string> = {
  WASH_FOLD: 'Wash & Fold',
  WASH_IRON: 'Wash & Iron',
  DRY_CLEAN: 'Dry Clean',
  IRON_ONLY: 'Iron Only',
};

export const TRACKING_STEPS = [
  { label: 'Order Placed', statuses: ['ORDER_CREATED', 'ORDER_CONFIRMED'], icon: '📋' },
  { label: 'Pickup Scheduled', statuses: ['PICKUP_SCHEDULED', 'PICKUP_ASSIGNED'], icon: '🛺' },
  { label: 'Picked Up', statuses: ['OUT_FOR_PICKUP', 'PICKUP_ARRIVED', 'PICKED_UP'], icon: '👕' },
  { label: 'Processing', statuses: ['RECEIVED_AT_FACILITY', 'SORTING', 'WASHING', 'IRONING', 'PACKING'], icon: '⚙️' },
  { label: 'Ready', statuses: ['READY_FOR_DISPATCH'], icon: '✨' },
  { label: 'Out for Delivery', statuses: ['DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERY_ARRIVED'], icon: '🚚' },
  { label: 'Delivered', statuses: ['DELIVERED'], icon: '✅' },
];

export function getCustomerTrackingStep(status: string): number {
  for (let i = 0; i < TRACKING_STEPS.length; i++) {
    if (TRACKING_STEPS[i].statuses.includes(status)) return i;
  }
  return 0;
}

export const ACTIVE_STATUSES = [
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
  'BILL_GENERATED',
  'READY_FOR_DISPATCH',
  'DELIVERY_ASSIGNED',
  'OUT_FOR_DELIVERY',
  'DELIVERY_ARRIVED',
];

export const TERMINAL_STATUSES = ['DELIVERED', 'CANCELLED', 'PICKUP_FAILED', 'DELIVERY_FAILED'];

// Update this with your computer's local IP address for physical device testing
// Run 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux) to find it.
export const API_BASE_URL = 'http://192.168.0.100:3000/api';
