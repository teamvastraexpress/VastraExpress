'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatDate, getApiError } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loading, TableSkeleton } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import {
  Plus,
  Pencil,
  RefreshCw,
  Layers,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  CalendarOff,
  CalendarCheck2,
} from 'lucide-react';
import type { PickupSlot } from '@/types';

interface SlotForm {
  slotDate: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  isActive: boolean;
}

const EMPTY_FORM: SlotForm = {
  slotDate: '',
  startTime: '',
  endTime: '',
  maxCapacity: 10,
  isActive: true,
};

export default function SlotsPage() {
  const { user } = useAuthStore();
  const facilityId = (user as any)?.staffProfile?.facilityId as number | undefined;

  const [slots, setSlots]             = useState<PickupSlot[]>([]);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const LIMIT = 20;

  const [showModal, setShowModal]     = useState(false);
  const [editSlot, setEditSlot]       = useState<PickupSlot | null>(null);
  const [form, setForm]               = useState<SlotForm>(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [blockDayState, setBlockDayState] = useState<{ open: boolean; block: boolean } | null>(null);
  const [blockDayLoading, setBlockDayLoading] = useState(false);

  // Date filter
  const [dateFilter, setDateFilter]   = useState('');

  const loadSlots = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(dateFilter ? { date: dateFilter } : {}),
      });
      const res = await api.get(`/pickup-slots?${params}`);
      const data = res.data;
      if (Array.isArray(data)) {
        setSlots(data);
        setTotalPages(1);
      } else {
        setSlots(data.data ?? []);
        setTotalPages(data.meta?.totalPages ?? data.totalPages ?? 1);
      }
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, dateFilter]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  function openCreate() {
    setEditSlot(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(slot: PickupSlot) {
    setEditSlot(slot);
    setForm({
      slotDate: slot.slotDate.split('T')[0],
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxCapacity: slot.maxCapacity,
      isActive: slot.isActive,
    });
    setShowModal(true);
  }

  async function handleToggle(slot: PickupSlot) {
    try {
      await api.patch(`/pickup-slots/${slot.id}/toggle`);
      toast.success(`Slot ${slot.isActive ? 'deactivated' : 'activated'}`);
      loadSlots();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleSave() {
    if (!form.slotDate || !form.startTime || !form.endTime || form.maxCapacity < 1) {
      toast.error('Fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      if (editSlot) {
        await api.put(`/pickup-slots/${editSlot.id}`, { ...form, slotDate: form.slotDate });
        toast.success('Slot updated');
      } else {
        await api.post('/pickup-slots', { ...form, facilityId: Number(facilityId) });
        toast.success('Slot created');
      }
      setShowModal(false);
      loadSlots();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pickup Slots</h1>
          <p className="text-gray-500 text-sm mt-1">Manage slot availability and capacity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={loadSlots}>
            Refresh
          </Button>
          <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>
            New Slot
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <Input
            type="date"
            label=""
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="w-48"
          />
          {dateFilter && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setDateFilter('')}>
                Clear
              </Button>
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<CalendarOff className="w-3.5 h-3.5" />}
                  onClick={() => setBlockDayState({ open: true, block: true })}
                >
                  Block Day
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<CalendarCheck2 className="w-3.5 h-3.5" />}
                  onClick={() => setBlockDayState({ open: true, block: false })}
                >
                  Unblock Day
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Time Window</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Capacity</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Booked</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Available</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7}><TableSkeleton rows={8} cols={7} /></td></tr>
              ) : slots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Layers className="w-8 h-8 text-gray-300" />
                      <p className="text-gray-400">No slots found. Create one to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                slots.map((slot) => {
                  const available = slot.maxCapacity - slot.currentBookings;
                  const isFull = available <= 0;
                  return (
                    <tr key={slot.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatDate(slot.slotDate)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {slot.startTime} – {slot.endTime}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{slot.maxCapacity}</td>
                      <td className="px-4 py-3 text-gray-700">{slot.currentBookings}</td>
                      <td className="px-4 py-3">
                        <span className={isFull ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                          {available}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggle(slot)}
                          title={slot.isActive ? 'Click to deactivate' : 'Click to activate'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                            slot.isActive
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          <ToggleLeft className="w-3.5 h-3.5" />
                          {slot.isActive ? 'Active' : 'Inactive'}
                        </button>
                        {isFull && <Badge className="ml-1 bg-red-100 text-red-600">Full</Badge>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(slot)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                          title="Edit slot"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editSlot ? 'Edit Slot' : 'Create Slot'}
      >
        <div className="space-y-4">
          <Input
            label="Date"
            type="date"
            value={form.slotDate}
            onChange={(e) => setForm({ ...form, slotDate: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              required
            />
            <Input
              label="End Time"
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              required
            />
          </div>
          <Input
            label="Max Capacity"
            type="number"
            min="1"
            value={form.maxCapacity}
            onChange={(e) => setForm({ ...form, maxCapacity: parseInt(e.target.value) || 1 })}
            required
          />
          <Select
            label="Status"
            value={form.isActive ? 'true' : 'false'}
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
            onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
          />

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} loading={saving} className="flex-1">
              {editSlot ? 'Save Changes' : 'Create Slot'}
            </Button>
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Block Day Confirmation */}
      <Modal
        open={!!blockDayState?.open}
        onClose={() => setBlockDayState(null)}
        title={blockDayState?.block ? '🚫 Block Holiday' : '✅ Unblock Day'}
        size="sm"
      >
        <p className="text-gray-600 mb-2">
          {blockDayState?.block
            ? `Deactivate ALL slots on ${dateFilter}? Customers won't be able to book pickups for this day.`
            : `Reactivate ALL slots on ${dateFilter}? Customers will be able to book pickups again.`}
        </p>
        <p className="text-gray-400 text-xs mt-1">
          This affects all time slots for your facility on this date.
        </p>
        <div className="flex justify-end gap-3 mt-5">
          <Button variant="outline" onClick={() => setBlockDayState(null)}>Cancel</Button>
          <Button
            variant={blockDayState?.block ? 'danger' : 'primary'}
            loading={blockDayLoading}
            onClick={() => handleBlockDay(blockDayState?.block ?? true)}
          >
            {blockDayState?.block ? 'Block Day' : 'Unblock Day'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
