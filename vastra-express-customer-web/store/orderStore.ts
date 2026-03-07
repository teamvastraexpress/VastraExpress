import { create } from 'zustand';
import api from '@/lib/api';
import { Order, PaginatedResponse } from '@/types';

interface FetchParams {
  page?: number;
  limit?: number;
  status?: string;
}

interface OrderStore {
  orders: Order[];
  currentOrder: Order | null;
  totalOrders: number;
  isLoading: boolean;
  error: string | null;
  fetchOrders: (params?: FetchParams) => Promise<void>;
  fetchOrderById: (id: string) => Promise<Order>;
  cancelOrder: (id: string) => Promise<void>;
  clearCurrent: () => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],
  currentOrder: null,
  totalOrders: 0,
  isLoading: false,
  error: null,

  fetchOrders: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { page = 1, limit = 20, status } = params;
      const query = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) query.set('status', status);
      const res = await api.get<PaginatedResponse<Order>>(`/orders?${query.toString()}`);
      set({ orders: res.data.data, totalOrders: res.data.meta.total, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load orders';
      set({ error: msg, isLoading: false });
    }
  },

  fetchOrderById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<Order>(`/orders/${id}`);
      set({ currentOrder: res.data, isLoading: false });
      return res.data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load order';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  cancelOrder: async (id: string) => {
    try {
      await api.patch(`/orders/${id}/cancel`);
      // refresh current order
      const res = await api.get<Order>(`/orders/${id}`);
      set({ currentOrder: res.data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel order';
      throw new Error(msg);
    }
  },

  clearCurrent: () => set({ currentOrder: null }),
}));
