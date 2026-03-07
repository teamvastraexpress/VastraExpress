import { create } from 'zustand';
import api from '@/lib/api';
import type { DeliveryAssignment, PaginatedResponse } from '@/types';

interface DeliveryState {
  pickupTasks: DeliveryAssignment[];
  deliveryTasks: DeliveryAssignment[];
  activeTask: DeliveryAssignment | null;
  isLoading: boolean;
  error: string | null;

  fetchPickupTasks: () => Promise<void>;
  fetchDeliveryTasks: () => Promise<void>;
  fetchTaskById: (id: number, type: 'PICKUP' | 'DELIVERY') => Promise<void>;
  updateStatus: (assignmentId: number, status: string, notes?: string) => Promise<void>;
  updateWeight: (orderId: number, initialWeight: number) => Promise<void>;
  confirmCodPayment: (orderId: number, notes?: string) => Promise<void>;
  clearError: () => void;
  clearActiveTask: () => void;
}

export const useDeliveryStore = create<DeliveryState>((set) => ({
  pickupTasks: [],
  deliveryTasks: [],
  activeTask: null,
  isLoading: false,
  error: null,

  fetchPickupTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<PaginatedResponse<DeliveryAssignment>>(
        '/delivery/my-assignments',
        { params: { type: 'PICKUP', limit: '100' } }
      );
      set({ pickupTasks: res.data.data, isLoading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load pickups';
      set({ isLoading: false, error: msg });
    }
  },

  fetchDeliveryTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<PaginatedResponse<DeliveryAssignment>>(
        '/delivery/my-assignments',
        { params: { type: 'DELIVERY', limit: '100' } }
      );
      set({ deliveryTasks: res.data.data, isLoading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load deliveries';
      set({ isLoading: false, error: msg });
    }
  },

  fetchTaskById: async (id, type) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<PaginatedResponse<DeliveryAssignment>>(
        '/delivery/my-assignments',
        { params: { type, limit: '100' } }
      );
      const task = res.data.data.find((t) => t.id === id) ?? null;
      set({ activeTask: task, isLoading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load task';
      set({ isLoading: false, error: msg });
    }
  },

  updateStatus: async (assignmentId, status, notes) => {
    await api.patch(`/delivery/${assignmentId}/status`, { status, notes });
  },

  updateWeight: async (orderId, initialWeight) => {
    await api.patch(`/orders/${orderId}/weight`, { initialWeight });
  },

  confirmCodPayment: async (orderId, notes) => {
    await api.post('/payments/cod', { orderId, notes });
  },

  clearError: () => set({ error: null }),
  clearActiveTask: () => set({ activeTask: null }),
}));
