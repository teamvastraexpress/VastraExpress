import { Platform } from 'react-native';

// On web (Expo web running at port 3003), backend is at 3000
// On Android emulator, use 10.0.2.2 instead of localhost
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }
  return 'http://localhost:3000/api';
};

export const API_BASE_URL = getBaseUrl();

export const COLORS = {
  primary:   '#1D4ED8',
  primaryLight: '#3B82F6',
  success:   '#16A34A',
  warning:   '#D97706',
  danger:    '#DC2626',
  neutral:   '#6B7280',
  bgLight:   '#F9FAFB',
  bgWhite:   '#FFFFFF',
  border:    '#E5E7EB',
  textDark:  '#111827',
  textMid:   '#374151',
  textLight: '#9CA3AF',
};

export const STATUS_LABELS: Record<string, string> = {
  ORDER_CREATED:        'Order Created',
  ORDER_CONFIRMED:      'Confirmed',
  PICKUP_SCHEDULED:     'Pickup Scheduled',
  PICKUP_ASSIGNED:      'Pickup Assigned',
  OUT_FOR_PICKUP:       'Out for Pickup',
  PICKUP_ARRIVED:       'Arrived at Customer',
  PICKED_UP:            'Picked Up',
  PICKUP_FAILED:        'Pickup Failed',
  RECEIVED_AT_FACILITY: 'At Facility',
  SORTING:              'Sorting',
  WASHING:              'Washing',
  IRONING:              'Ironing',
  PACKING:              'Packing',
  BILL_GENERATED:       'Bill Generated',
  READY_FOR_DISPATCH:   'Ready for Dispatch',
  DELIVERY_ASSIGNED:    'Delivery Assigned',
  OUT_FOR_DELIVERY:     'Out for Delivery',
  DELIVERY_ARRIVED:     'Arrived at Customer',
  DELIVERED:            'Delivered',
  DELIVERY_FAILED:      'Delivery Failed',
  CANCELLED:            'Cancelled',
  PROCESSING_ISSUE:     'Processing Issue',
  REFUND_INITIATED:     'Refund Initiated',
};

export const SERVICE_LABELS: Record<string, string> = {
  WASH_FOLD:  'Wash & Fold',
  DRY_CLEAN:  'Dry Clean',
  IRON_ONLY:  'Iron Only',
};
