'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatCurrency, getApiError, statusLabel } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Loading';
import { Plus, Edit2 } from 'lucide-react';
import type { PricingConfig } from '@/types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const SERVICE_TYPES = ['WASH_FOLD', 'DRY_CLEAN', 'IRON_ONLY'];

interface PricingForm {
  serviceType: string;
  pricePerKg: number;
  itemName?: string;
  pricePerItem?: number;
  minimumOrderValue: number;
  expressDeliveryCharge: number;
  pickupDeliveryChargeNonSubscriber: number;
  cityId?: number;
}

export default function BillingPage() {
  const [pricings, setPricings] = useState<PricingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; data?: PricingConfig }>({ open: false });

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<PricingForm>();

  const fetchPricings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/billing/pricing');
      setPricings(res.data);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPricings(); }, [fetchPricings]);

  function openEdit(config: PricingConfig) {
    setValue('serviceType', config.serviceType);
    setValue('pricePerKg', config.pricePerKg);
    setValue('minimumOrderValue', config.minimumOrderValue);
    setValue('expressDeliveryCharge', config.expressDeliveryCharge);
    setValue('pickupDeliveryChargeNonSubscriber', config.pickupDeliveryChargeNonSubscriber);
    if (config.itemName) setValue('itemName', config.itemName);
    if (config.pricePerItem) setValue('pricePerItem', config.pricePerItem);
    setModal({ open: true, data: config });
  }

  function openAdd() {
    reset();
    setModal({ open: true });
  }

  async function handleSave(data: PricingForm) {
    try {
      await api.put('/billing/pricing', data);
      toast.success(modal.data ? 'Pricing updated' : 'Pricing created');
      setModal({ open: false });
      reset();
      fetchPricings();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Pricing</h1>
          <p className="text-gray-500 text-sm mt-0.5">Configure service pricing and charges</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openAdd}>Add Pricing</Button>
      </div>

      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Pricing Configurations</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6"><TableSkeleton rows={5} cols={6} /></div>
          ) : pricings.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No pricing configured yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Service Type', 'Per Kg', 'Item', 'Per Item', 'Min Order', 'Express', 'Pickup Charge', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pricings.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{statusLabel(p.serviceType)}</td>
                    <td className="px-5 py-3 text-gray-700">{formatCurrency(p.pricePerKg)}</td>
                    <td className="px-5 py-3 text-gray-500">{p.itemName ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-700">{p.pricePerItem ? formatCurrency(p.pricePerItem) : '—'}</td>
                    <td className="px-5 py-3 text-gray-700">{formatCurrency(p.minimumOrderValue)}</td>
                    <td className="px-5 py-3 text-gray-700">{formatCurrency(p.expressDeliveryCharge)}</td>
                    <td className="px-5 py-3 text-gray-700">{formatCurrency(p.pickupDeliveryChargeNonSubscriber)}</td>
                    <td className="px-5 py-3">
                      <Badge className={p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1">
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={modal.open} onClose={() => { setModal({ open: false }); reset(); }} title={modal.data ? 'Edit Pricing' : 'Add Pricing'} size="lg">
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Service Type"
              required
              options={SERVICE_TYPES.map((s) => ({ value: s, label: statusLabel(s) }))}
              placeholder="Select service"
              {...register('serviceType', { required: true })}
            />
            <Input label="Price per Kg (₹)" type="number" step="0.01" required placeholder="30" {...register('pricePerKg', { required: true, valueAsNumber: true })} />
            <Input label="Minimum Order Value (₹)" type="number" step="0.01" required placeholder="500" {...register('minimumOrderValue', { required: true, valueAsNumber: true })} />
            <Input label="Express Delivery Charge (₹)" type="number" step="0.01" required placeholder="100" {...register('expressDeliveryCharge', { required: true, valueAsNumber: true })} />
            <Input label="Pickup Charge (non-subscriber, ₹)" type="number" step="0.01" required placeholder="50" {...register('pickupDeliveryChargeNonSubscriber', { required: true, valueAsNumber: true })} />
            <Input label="City ID (blank = global)" type="number" placeholder="1 (optional)" {...register('cityId', { valueAsNumber: true })} />
            <Input label="Item Name (for per-item)" placeholder="Shirt (optional)" {...register('itemName')} />
            <Input label="Price per Item (₹)" type="number" step="0.01" placeholder="25 (optional)" {...register('pricePerItem', { valueAsNumber: true })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setModal({ open: false }); reset(); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
