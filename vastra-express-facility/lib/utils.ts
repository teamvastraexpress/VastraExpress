import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Indian Rupees */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Format ISO date string to readable form */
export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...opts,
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

/** Return a Tailwind colour class for each order status */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
    ORDER_CREATED: 'bg-gray-100 text-gray-700',
    ORDER_CONFIRMED: 'bg-blue-100 text-blue-700',
    PICKUP_SCHEDULED: 'bg-blue-100 text-blue-700',
    PICKUP_ASSIGNED: 'bg-indigo-100 text-indigo-700',
    OUT_FOR_PICKUP: 'bg-purple-100 text-purple-700',
    PICKUP_ARRIVED: 'bg-purple-100 text-purple-700',
    PICKED_UP: 'bg-cyan-100 text-cyan-700',
    PICKUP_FAILED: 'bg-red-100 text-red-700',
    RECEIVED_AT_FACILITY: 'bg-teal-100 text-teal-700',
    SORTING: 'bg-yellow-100 text-yellow-700',
    WASHING: 'bg-yellow-100 text-yellow-700',
    IRONING: 'bg-orange-100 text-orange-700',
    PACKING: 'bg-orange-100 text-orange-700',
    BILL_GENERATED: 'bg-lime-100 text-lime-700',
    READY_FOR_DISPATCH: 'bg-lime-100 text-lime-700',
    DELIVERY_ASSIGNED: 'bg-emerald-100 text-emerald-700',
    OUT_FOR_DELIVERY: 'bg-green-100 text-green-700',
    DELIVERY_ARRIVED: 'bg-green-100 text-green-700',
    DELIVERED: 'bg-green-200 text-green-800',
    DELIVERY_FAILED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-200 text-gray-600',
    PROCESSING_ISSUE: 'bg-red-100 text-red-700',
    REFUND_INITIATED: 'bg-pink-100 text-pink-700',
    DECLINED: 'bg-red-100 text-red-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

/** Human-readable label for order status */
export function statusLabel(status: string): string {
  const overrides: Record<string, string> = {
    PENDING_APPROVAL: 'Awaiting Approval',
    DECLINED: 'Declined',
  };
  if (overrides[status]) return overrides[status];
  return status
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

/** Truncate a string */
export function truncate(str: string, max = 30): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

/** Extract a readable error message from an Axios error (handles NestJS array messages) */
export function getApiError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const e = error as { response?: { data?: { message?: string | string[] } }; message?: string };
    const msg = e.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg ?? e.message ?? 'An unexpected error occurred';
  }
  return String(error);
}
