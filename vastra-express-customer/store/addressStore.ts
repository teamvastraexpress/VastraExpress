import { create } from 'zustand';
import api from '@/lib/api';
import type { Address, City } from '@/types';

interface AddressState {
  addresses: Address[];
  cities: City[];
  isLoading: boolean;       // address CRUD operations
  citiesLoading: boolean;   // city fetch only
  error: string | null;
  citiesError: string | null;

  fetchAddresses: () => Promise<void>;
  fetchCities: () => Promise<void>;
  addAddress: (data: Omit<Address, 'id' | 'city'>) => Promise<Address>;
  updateAddress: (id: number, data: Partial<Omit<Address, 'id' | 'city'>>) => Promise<void>;
  deleteAddress: (id: number) => Promise<void>;
  setDefault: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  cities: [],
  isLoading: false,
  citiesLoading: false,
  error: null,
  citiesError: null,

  fetchAddresses: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/addresses');
      set({ addresses: res.data, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  fetchCities: async () => {
    set({ citiesLoading: true, citiesError: null });
    try {
      const res = await api.get('/cities');
      set({ cities: res.data ?? [], citiesLoading: false });
    } catch (e: any) {
      set({ citiesLoading: false, citiesError: e.message ?? 'Could not load cities' });
    }
  },

  addAddress: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/addresses', data);
      set((s) => ({ addresses: [...s.addresses, res.data], isLoading: false }));
      return res.data;
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  updateAddress: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.put(`/addresses/${id}`, data);
      set((s) => ({
        addresses: s.addresses.map((a) => (a.id === id ? res.data : a)),
        isLoading: false,
      }));
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  deleteAddress: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/addresses/${id}`);
      set((s) => ({ addresses: s.addresses.filter((a) => a.id !== id), isLoading: false }));
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  setDefault: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.patch(`/addresses/${id}/default`);
      set((s) => ({
        addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
        isLoading: false,
      }));
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  clearError: () => set({ error: null }),
}));
