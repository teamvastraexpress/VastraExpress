import { create } from 'zustand';
import api from '@/lib/api';
import type { DeliveryAssignment, PaginatedResponse } from '@/types';

interface DeliveryState {
  pickupTasks: DeliveryAssignment[];
  deliveryTasks: DeliveryAssignment[];
  activeTask: DeliveryAssignment | null;
  isLoading: boolean;
  error: string | null;

  fetchPickupTasks: (status?: string) => Promise<void>;
  fetchDeliveryTasks: (status?: string) => Promise<void>;
  fetchTaskById: (id: number) => Promise<void>;
  updateStatus: (assignmentId: number, status: string, notes?: string) => Promise<void>;
  updateWeight: (orderId: number, initialWeight: number) => Promise<void>;
  clearError: () => void;
}

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  pickupTasks: [],
  deliveryTasks: [],
  activeTask: null,
  isLoading: false,
  error: null,

  fetchPickupTasks: async (status) => {
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, string> = { type: 'PICKUP', limit: '50' };
      if (status) params.status = status;
      const res = await api.get<PaginatedResponse<DeliveryAssignment>>('/delivery/my-assignments', { params });
      set({ pickupTasks: res.data.data, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  fetchDeliveryTasks: async (status) => {
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, string> = { type: 'DELIVERY', limit: '50' };
      if (status) params.status = status;
      const res = await api.get<PaginatedResponse<DeliveryAssignment>>('/delivery/my-assignments', { params });
      set({ deliveryTasks: res.data.data, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  fetchTaskById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // Always fetch fresh — cached list is stale after a status update
      const res = await api.get<PaginatedResponse<DeliveryAssignment>>('/delivery/my-assignments', {
        params: { limit: '100' },
      });
      const task = res.data.data.find((t) => t.id === id) ?? null;
      set({ activeTask: task, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  updateStatus: async (assignmentId, status, notes) => {
    // Do NOT set isLoading — the detail screen manages its own actionLoading spinner
    try {
      await api.patch(`/delivery/${assignmentId}/status`, { status, notes });
    } catch (e: any) {
      throw e;
    }
  },

  updateWeight: async (orderId, initialWeight) => {
    try {
      await api.patch(`/orders/${orderId}/weight`, { initialWeight });
    } catch (e: any) {
      throw e;
    }
  },

  clearError: () => set({ error: null }),
}));
