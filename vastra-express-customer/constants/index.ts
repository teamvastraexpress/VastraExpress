// ── Premium Design System — Colors & Tokens ─────────────────────────────────

export const COLORS = {
  // Brand
  primary:    '#4DA6FF',
  primaryDark:'#1A7DE0',
  primaryLight:'#E0EFFF',
  primaryBg:  '#F0F7FF',

  // Surfaces
  white:      '#FFFFFF',
  surface:    '#FFFFFF',
  surfaceAlt: '#F5FAFF',
  surfaceTertiary: '#EDF4FB',

  // Text
  textPrimary:   '#111827',
  textSecondary: '#6B7280',
  textTertiary:  '#9CA3AF',
  textInverse:   '#FFFFFF',

  // Borders
  border:       '#F0F0F0',
  borderLight:  '#F5F5F5',
  borderFocus:  '#4DA6FF',

  // Status
  success:  '#10B981',
  warning:  '#F59E0B',
  danger:   '#EF4444',
  info:     '#4DA6FF',
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: 'Awaiting Approval',
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
  DECLINED: 'Declined',
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING_APPROVAL: '#F59E0B',
  ORDER_CREATED: '#9CA3AF',
  ORDER_CONFIRMED: '#4DA6FF',
  PICKUP_SCHEDULED: '#4DA6FF',
  PICKUP_ASSIGNED: '#8B5CF6',
  OUT_FOR_PICKUP: '#8B5CF6',
  PICKUP_ARRIVED: '#8B5CF6',
  PICKED_UP: '#06B6D4',
  PICKUP_FAILED: '#EF4444',
  RECEIVED_AT_FACILITY: '#14B8A6',
  SORTING: '#F59E0B',
  WASHING: '#F59E0B',
  IRONING: '#F97316',
  PACKING: '#F97316',
  BILL_GENERATED: '#10B981',
  READY_FOR_DISPATCH: '#10B981',
  DELIVERY_ASSIGNED: '#10B981',
  OUT_FOR_DELIVERY: '#10B981',
  DELIVERY_ARRIVED: '#10B981',
  DELIVERED: '#059669',
  DELIVERY_FAILED: '#EF4444',
  CANCELLED: '#9CA3AF',
  PROCESSING_ISSUE: '#EF4444',
  DECLINED: '#EF4444',
};

export const SERVICE_LABELS: Record<string, string> = {
  WASH_FOLD: 'Wash & Fold',
  WASH_IRON: 'Wash & Iron',
  DRY_CLEAN: 'Dry Clean',
  IRON_ONLY: 'Iron Only',
  SOFA_CLEANING: 'Sofa Cleaning',
};

export const SERVICE_ICONS: Record<string, string> = {
  WASH_FOLD: 'Shirt',
  WASH_IRON: 'Shirt',
  DRY_CLEAN: 'Sparkles',
  IRON_ONLY: 'Flame',
  SOFA_CLEANING: 'Sofa',
};

export const TRACKING_STEPS = [
  {
    label: 'Order Placed',
    statuses: ['PENDING_APPROVAL', 'ORDER_CREATED', 'ORDER_CONFIRMED', 'DECLINED'],
    icon: 'ClipboardList',
  },
  { label: 'Pickup Scheduled', statuses: ['PICKUP_SCHEDULED', 'PICKUP_ASSIGNED'], icon: 'CalendarClock' },
  { label: 'Picked Up', statuses: ['OUT_FOR_PICKUP', 'PICKUP_ARRIVED', 'PICKED_UP'], icon: 'Shirt' },
  {
    label: 'Processing',
    statuses: ['RECEIVED_AT_FACILITY', 'SORTING', 'WASHING', 'IRONING', 'PACKING'],
    icon: 'Settings',
  },
  { label: 'Ready', statuses: ['BILL_GENERATED', 'READY_FOR_DISPATCH'], icon: 'Sparkles' },
  { label: 'Out for Delivery', statuses: ['DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERY_ARRIVED'], icon: 'Truck' },
  { label: 'Delivered', statuses: ['DELIVERED'], icon: 'CheckCircle' },
];

export function getCustomerTrackingStep(status: string): number {
  for (let i = 0; i < TRACKING_STEPS.length; i++) {
    if (TRACKING_STEPS[i].statuses.includes(status)) return i;
  }
  return 0;
}

export const ACTIVE_STATUSES = [
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
  'BILL_GENERATED',
  'READY_FOR_DISPATCH',
  'DELIVERY_ASSIGNED',
  'OUT_FOR_DELIVERY',
  'DELIVERY_ARRIVED',
];

export const COMPLETED_STATUSES = ['DELIVERED'];
export const CANCELLED_STATUSES = ['CANCELLED', 'PICKUP_FAILED', 'DELIVERY_FAILED', 'DECLINED'];
export const TERMINAL_STATUSES = [...COMPLETED_STATUSES, ...CANCELLED_STATUSES];

// Update this with your computer's local IP address for physical device testing
// Run 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux) to find it.
export const API_BASE_URL = 'https://vastra-xpress-production.up.railway.app/api';
