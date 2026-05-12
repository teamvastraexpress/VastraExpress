import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

/** Return Tailwind colour classes for assignment status */
export function getAssignmentStatusColor(status: string): string {
  const map: Record<string, string> = {
    ASSIGNED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

/** Return Tailwind colour classes for order status */
export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
    ORDER_CREATED: 'bg-gray-100 text-gray-700',
    ORDER_CONFIRMED: 'bg-blue-100 text-blue-700',
    PICKUP_ASSIGNED: 'bg-indigo-100 text-indigo-700',
    OUT_FOR_PICKUP: 'bg-purple-100 text-purple-700',
    PICKUP_ARRIVED: 'bg-purple-100 text-purple-700',
    PICKED_UP: 'bg-cyan-100 text-cyan-700',
    PICKUP_FAILED: 'bg-red-100 text-red-700',
    DELIVERY_ASSIGNED: 'bg-emerald-100 text-emerald-700',
    OUT_FOR_DELIVERY: 'bg-green-100 text-green-700',
    DELIVERY_ARRIVED: 'bg-green-100 text-green-700',
    DELIVERED: 'bg-green-200 text-green-800',
    DELIVERY_FAILED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-200 text-gray-600',
    DECLINED: 'bg-red-100 text-red-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

/** Human-readable label for a status string */
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

/** Get role name from role object or string */
export function getRoleName(role: { name: string } | string | undefined): string {
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
