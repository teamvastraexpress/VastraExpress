import { PickupSlot } from '@/types';
import { format } from 'date-fns';

export function formatSlot(slot: PickupSlot): string {
  if (!slot) return '';
  const date = format(new Date(slot.slotDate), 'EEE, dd MMM');
  return `${date} (${slot.startTime} - ${slot.endTime})`;
}

export function getApiError(error: any): string {
  if (error.response?.data?.message) {
    const msg = error.response.data.message;
    return Array.isArray(msg) ? msg[0] : msg;
  }
  return error.message || 'Something went wrong';
}

export function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy, hh:mm a');
  } catch {
    return dateStr;
  }
}
