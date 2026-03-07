'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatDate, formatCurrency, getApiError } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Loading';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SubscriptionPlan, Subscription } from '@/types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface PlanForm {
  name: string;
  description?: string;
  durationDays: number;
  price: number;
  walletCredit: number;
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [planModal, setPlanModal] = useState<{ open: boolean; data?: SubscriptionPlan }>({ open: false });
  const [deactivatePlanId, setDeactivatePlanId] = useState<number | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const LIMIT = 20;

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<PlanForm>();

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const res = await api.get('/subscriptions/plans?includeInactive=true');
      setPlans(res.data);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/subscriptions?page=${page}&limit=${LIMIT}`);
      const body = res.data;
      setSubs(body.data ?? body);
      setTotal(body.total ?? body.length ?? 0);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchPlans(); fetchSubs(); }, [fetchPlans, fetchSubs]);

  function openEditPlan(plan: SubscriptionPlan) {
    setValue('name', plan.name);
    setValue('description', plan.description ?? '');
    setValue('durationDays', plan.durationDays);
    setValue('price', plan.price);
    setValue('walletCredit', plan.walletCredit);
    setPlanModal({ open: true, data: plan });
  }

  async function handleSavePlan(data: PlanForm) {
    try {
      if (planModal.data) {
        await api.put(`/subscriptions/plans/${planModal.data.id}`, data);
        toast.success('Plan updated');
      } else {
        await api.post('/subscriptions/plans', data);
        toast.success('Plan created');
      }
      setPlanModal({ open: false });
      reset();
      fetchPlans();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleDeactivatePlan(id: number) {
    setDeactivating(true);
    try {
      await api.delete(`/subscriptions/plans/${id}`);
      toast.success('Plan deactivated');
      setDeactivatePlanId(null);
      fetchPlans();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setDeactivating(false);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      {/* Plans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage plans and active customer subscriptions</p>
          </div>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => { reset(); setPlanModal({ open: true }); }}>
            New Plan
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {plansLoading ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="h-36 bg-gray-100 animate-pulse rounded-xl" />)
          ) : plans.map((plan) => (
            <Card key={plan.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{plan.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{plan.durationDays} days</p>
                </div>
                <Badge className={plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-xl font-bold text-gray-900">{formatCurrency(plan.price)}</span>
                <span className="text-xs text-gray-400">/ plan</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Wallet credit: <span className="font-semibold text-gray-700">{formatCurrency(plan.walletCredit)}</span>
              </p>
              <div className="flex gap-2">
                <button onClick={() => openEditPlan(plan)} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                {plan.isActive && (
                  <button onClick={() => setDeactivatePlanId(plan.id)} className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Deactivate
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Active subscriptions */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Active Subscriptions ({total})</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6"><TableSkeleton rows={8} cols={5} /></div>
          ) : subs.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No active subscriptions</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Customer', 'Plan', 'Wallet Balance', 'Start', 'End', 'Status'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subs.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-800">{s.customer?.name ?? `#${s.customerId}`}</td>
                    <td className="px-6 py-3 text-gray-600">{s.plan?.name ?? `#${s.planId}`}</td>
                    <td className="px-6 py-3 font-semibold text-gray-800">{formatCurrency(s.walletBalance)}</td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(s.startDate)}</td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(s.endDate)}</td>
                    <td className="px-6 py-3">
                      <Badge className={s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                        {s.isActive ? 'Active' : 'Expired'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1} leftIcon={<ChevronLeft className="w-4 h-4" />}>Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        )}
      </Card>

      {/* Plan Modal */}
      <Modal open={planModal.open} onClose={() => { setPlanModal({ open: false }); reset(); }} title={planModal.data ? 'Edit Plan' : 'Create Plan'}>
        <form onSubmit={handleSubmit(handleSavePlan)} className="space-y-4">
          <Input label="Plan Name" required placeholder="Premium Monthly" {...register('name', { required: true })} />
          <Input label="Description" placeholder="All-inclusive laundry plan" {...register('description')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Duration (days)" type="number" required placeholder="30" {...register('durationDays', { required: true, valueAsNumber: true })} />
            <Input label="Price (₹)" type="number" step="0.01" required placeholder="999" {...register('price', { required: true, valueAsNumber: true })} />
            <Input label="Wallet Credit (₹)" type="number" step="0.01" required placeholder="1200" {...register('walletCredit', { required: true, valueAsNumber: true })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setPlanModal({ open: false }); reset(); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Save Plan</Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Confirmation Modal */}
      <Modal
        open={deactivatePlanId !== null}
        onClose={() => setDeactivatePlanId(null)}
        title="Deactivate Plan"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to deactivate this plan? Existing subscribers will not be affected, but no new subscriptions can be purchased.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeactivatePlanId(null)}>Cancel</Button>
          <Button
            variant="danger"
            loading={deactivating}
            onClick={() => deactivatePlanId !== null && handleDeactivatePlan(deactivatePlanId)}
          >
            Deactivate
          </Button>
        </div>
      </Modal>
    </div>
  );
}
