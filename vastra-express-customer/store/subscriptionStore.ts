import { create } from 'zustand';
import api from '@/lib/api';
import type {
  SubscriptionPlan,
  MySubscription,
  WalletTransaction,
  PaymentMethod,
} from '@/types';

interface SubscriptionState {
  plans: SubscriptionPlan[];
  mySubscription: MySubscription | null;
  walletHistory: WalletTransaction[];
  isLoading: boolean;
  error: string | null;

  fetchPlans: () => Promise<void>;
  fetchMySubscription: () => Promise<void>;
  purchasePlan: (planId: number, autoRenew?: boolean) => Promise<any>;
  fetchWalletHistory: (page?: number) => Promise<void>;
  createPaymentOrder: (
    orderId: number,
    paymentMethod: PaymentMethod,
  ) => Promise<{ razorpayOrderId: string; razorpayKeyId: string; amount: number }>;
  verifyPayment: (dto: {
    orderId: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => Promise<void>;
  clearError: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  plans: [],
  mySubscription: null,
  walletHistory: [],
  isLoading: false,
  error: null,

  fetchPlans: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/subscriptions/plans');
      set({ plans: res.data, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  fetchMySubscription: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/subscriptions/my-subscription');
      set({ mySubscription: res.data, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  purchasePlan: async (planId, autoRenew = false) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/subscriptions/purchase', { planId, autoRenew });
      set({ isLoading: false });
      return res.data;
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  fetchWalletHistory: async (page = 1) => {
    try {
      const res = await api.get('/subscriptions/wallet-history', {
        params: { page, limit: 20 },
      });
      set({ walletHistory: res.data.data ?? res.data });
    } catch {
      // non-fatal
    }
  },

  createPaymentOrder: async (orderId, paymentMethod) => {
    const res = await api.post('/payments/create-order', { orderId, paymentMethod });
    return res.data;
  },

  verifyPayment: async (dto) => {
    await api.post('/payments/verify', dto);
  },

  clearError: () => set({ error: null }),
}));
