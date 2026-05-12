/** Format ISO date string to readable form */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Format ISO date-time string */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format slot time range */
export function formatSlot(date: string, start: string, end: string): string {
  return `${formatDate(date)}, ${start} – ${end}`;
}

/** Return colour config for assignment status */
export function getAssignmentStatusColor(status: string): {
  bg: string;
  text: string;
} {
  const map: Record<string, { bg: string; text: string }> = {
    ASSIGNED: { bg: '#DBEAFE', text: '#1D4ED8' },
    IN_PROGRESS: { bg: '#FEF3C7', text: '#B45309' },
    COMPLETED: { bg: '#D1FAE5', text: '#047857' },
    FAILED: { bg: '#FEE2E2', text: '#B91C1C' },
  };
  return map[status] ?? { bg: '#F3F4F6', text: '#4B5563' };
}

/** Return colour config for order status */
export function getOrderStatusColor(status: string): {
  bg: string;
  text: string;
} {
  const map: Record<string, { bg: string; text: string }> = {
    ORDER_CREATED: { bg: '#F3F4F6', text: '#374151' },
    ORDER_CONFIRMED: { bg: '#DBEAFE', text: '#1D4ED8' },
    PICKUP_ASSIGNED: { bg: '#E0E7FF', text: '#4338CA' },
    OUT_FOR_PICKUP: { bg: '#EDE9FE', text: '#7C3AED' },
    PICKUP_ARRIVED: { bg: '#EDE9FE', text: '#7C3AED' },
    PICKED_UP: { bg: '#CFFAFE', text: '#0E7490' },
    PICKUP_FAILED: { bg: '#FEE2E2', text: '#B91C1C' },
    DELIVERY_ASSIGNED: { bg: '#D1FAE5', text: '#047857' },
    OUT_FOR_DELIVERY: { bg: '#D1FAE5', text: '#047857' },
    DELIVERY_ARRIVED: { bg: '#D1FAE5', text: '#047857' },
    DELIVERED: { bg: '#A7F3D0', text: '#065F46' },
    DELIVERY_FAILED: { bg: '#FEE2E2', text: '#B91C1C' },
    CANCELLED: { bg: '#E5E7EB', text: '#4B5563' },
  };
  return map[status] ?? { bg: '#F3F4F6', text: '#4B5563' };
}

/** Human-readable label for a status string */
export function statusLabel(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

/** Get role name from role object or string */
export function getRoleName(
  role: { name: string } | string | undefined
): string {
  if (!role) return '';
  return typeof role === 'string' ? role : role.name;
}

/** Extract a readable error message from an Axios error */
export function getApiError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const e = error as {
      response?: { data?: { message?: string | string[] } };
      message?: string;
    };
    const msg = e.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg ?? e.message ?? 'An unexpected error occurred';
  }
  return String(error);
}

// ─── Color constants (matching the web Tailwind theme) ────────────────────────

export const colors = {
  primary50: '#f5f3ff',
  primary100: '#ede9fe',
  primary200: '#ddd6fe',
  primary300: '#c4b5fd',
  primary400: '#a78bfa',
  primary500: '#8b5cf6',
  primary600: '#7c3aed',
  primary700: '#6d28d9',
  primary800: '#5b21b6',
  primary900: '#4c1d95',

  violet50: '#f5f3ff',
  violet100: '#ede9fe',
  violet700: '#6d28d9',
  violet800: '#5b21b6',

  emerald50: '#ecfdf5',
  emerald100: '#d1fae5',
  emerald600: '#059669',
  emerald700: '#047857',

  green50: '#f0fdf4',
  green100: '#dcfce7',
  green200: '#bbf7d0',
  green600: '#16a34a',
  green700: '#15803d',
  green800: '#166534',

  blue100: '#dbeafe',
  blue700: '#1d4ed8',

  amber50: '#fffbeb',
  amber100: '#fef3c7',
  amber200: '#fde68a',
  amber600: '#d97706',
  amber700: '#b45309',
  amber900: '#78350f',

  orange100: '#ffedd5',
  orange700: '#c2410c',

  red50: '#fef2f2',
  red100: '#fee2e2',
  red200: '#fecaca',
  red400: '#f87171',
  red500: '#ef4444',
  red600: '#dc2626',
  red700: '#b91c1c',

  cyan100: '#cffafe',
  cyan700: '#0e7490',

  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  white: '#ffffff',
  black: '#000000',
};
