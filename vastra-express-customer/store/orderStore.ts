import { create } from 'zustand';
import api from '@/lib/api';
import type { Order, PickupSlot, ServiceType, OrderStatusHistory } from '@/types';

interface CreateOrderPayload {
  addressId: number;
  pickupSlotId: number;
  serviceType: ServiceType;
  isExpress?: boolean;
  customerNotes?: string;
}

interface OrderState {
  orders: Order[];
  activeOrder: Order | null;
  statusHistory: OrderStatusHistory[];
  availableSlots: PickupSlot[];
  isLoading: boolean;
  isSlotsLoading: boolean;
  error: string | null;

  fetchOrders: (status?: 'active' | 'completed') => Promise<void>;
  fetchOrderById: (id: number) => Promise<void>;
  fetchStatusHistory: (id: number) => Promise<void>;
  fetchAvailableSlots: (date: string, facilityId?: number) => Promise<void>;
  createOrder: (data: CreateOrderPayload) => Promise<Order>;
  cancelOrder: (id: number, notes?: string) => Promise<void>;
  clearActiveOrder: () => void;
  clearError: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  activeOrder: null,
  statusHistory: [],
  availableSlots: [],
  isLoading: false,
  isSlotsLoading: false,
  error: null,

  fetchOrders: async (filter) => {
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, string> = { limit: '50' };
      if (filter === 'active') {
        // fetch without status filter — we'll filter client-side
      }
      const res = await api.get('/orders', { params });
      const raw: any[] = res.data.data ?? res.data;
      const orders = raw.map((o: any) => ({
        ...o,
        status: o.currentStatus ?? o.status,
        items: o.orderItems ?? o.items ?? [],
      }));
      set({ orders, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  fetchOrderById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/orders/${id}`);
      const raw = res.data;
      const normalized = {
        ...raw,
        status: raw.currentStatus ?? raw.status,
        items: raw.orderItems ?? raw.items ?? [],
      };
      set({ activeOrder: normalized, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  fetchStatusHistory: async (id) => {
    try {
      const res = await api.get(`/orders/${id}/history`);
      set({ statusHistory: res.data });
    } catch {
      // non-fatal
    }
  },

  fetchAvailableSlots: async (date, facilityId) => {
    set({ isSlotsLoading: true });
    try {
      const params: Record<string, string | number> = { date };
      if (facilityId) params.facilityId = facilityId;
      const res = await api.get('/pickup-slots/available', { params });
      set({ availableSlots: res.data, isSlotsLoading: false });
    } catch {
      set({ availableSlots: [], isSlotsLoading: false });
    }
  },

  createOrder: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/orders', data);
      set((s) => ({ orders: [res.data, ...s.orders], isLoading: false }));
      return res.data;
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  cancelOrder: async (id, notes) => {
    // Do NOT touch isLoading — the detail screen manages its own cancelling spinner
    // and the isLoading guard would blank the screen mid-cancel.
    try {
      await api.patch(`/orders/${id}/cancel`, { notes });
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === id ? { ...o, status: 'CANCELLED' as any } : o,
        ),
        activeOrder:
          s.activeOrder?.id === id
            ? { ...s.activeOrder, status: 'CANCELLED' as any }
            : s.activeOrder,
      }));
    } catch (e: any) {
      throw e;
    }
  },

  clearActiveOrder: () => set({ activeOrder: null, statusHistory: [] }),
  clearError: () => set({ error: null }),
}));
