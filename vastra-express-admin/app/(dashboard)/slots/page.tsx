'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { getApiError } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Loading';
import { Plus, Trash2, Edit2, CalendarDays, Users, ToggleLeft, CalendarOff, CalendarCheck2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PickupSlot {
  id: number;
  facilityId: number;
  facility?: { name: string };
  slotDate: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentBookings: number;
  isActive: boolean;
}

interface Facility {
  id: number;
  name: string;
}

interface SlotForm {
  facilityId: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: string;
}

function todayStr() { return new Date().toISOString().split('T')[0]; }

export default function SlotsPage() {
  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(todayStr());
  const [filterFacility, setFilterFacility] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editSlot, setEditSlot] = useState<PickupSlot | null>(null);
  const [deleteSlot, setDeleteSlot] = useState<PickupSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [blockDayState, setBlockDayState] = useState<{ open: boolean; block: boolean } | null>(null);
  const [blockDayLoading, setBlockDayLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<SlotForm>();

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filterDate) params.set('date', filterDate);
      if (filterFacility) params.set('facilityId', filterFacility);
      const res = await api.get(`/pickup-slots?${params}`);
      const data = res.data;
      setSlots(Array.isArray(data) ? data : data.data ?? []);
      if (data.totalPages) setTotalPages(data.totalPages);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, filterDate, filterFacility]);

  const fetchFacilities = useCallback(async () => {
    try {
      const res = await api.get('/facilities');
      setFacilities(res.data ?? []);
    } catch {
      // facilities not critical — slots still work without filter
    }
  }, []);

  useEffect(() => { fetchSlots(); fetchFacilities(); }, [fetchSlots, fetchFacilities]);

  const openAdd = () => {
    reset({ facilityId: '', date: filterDate || todayStr(), startTime: '09:00', endTime: '12:00', maxCapacity: '20' });
    setAddOpen(true);
  };

  const openEdit = (slot: PickupSlot) => {
    setEditSlot(slot);
    setValue('facilityId', String(slot.facilityId));
    setValue('date', slot.slotDate.split('T')[0]);
    setValue('startTime', slot.startTime);
    setValue('endTime', slot.endTime);
    setValue('maxCapacity', String(slot.maxCapacity));
  };

  const handleToggle = async (slot: PickupSlot) => {
    try {
      await api.patch(`/pickup-slots/${slot.id}/toggle`);
      toast.success(`Slot ${slot.isActive ? 'deactivated' : 'activated'}`);
      fetchSlots();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const onSubmit = async (data: SlotForm) => {
    setSubmitting(true);
    try {
      const body = {
        facilityId: Number(data.facilityId),
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        maxCapacity: Number(data.maxCapacity),
      };
      if (editSlot) {
        await api.put(`/pickup-slots/${editSlot.id}`, body);
        toast.success('Slot updated');
        setEditSlot(null);
      } else {
        await api.post('/pickup-slots', body);
        toast.success('Slot created');
        setAddOpen(false);
      }
      fetchSlots();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteSlot) return;
    setSubmitting(true);
    try {
      await api.delete(`/pickup-slots/${deleteSlot.id}`);
      toast.success('Slot deleted');
      setDeleteSlot(null);
      fetchSlots();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const capacityPct = (slot: PickupSlot) => Math.round((slot.currentBookings / slot.maxCapacity) * 100);

  const handleBlockDay = async (block: boolean) => {
    const facId = filterFacility || (facilities.length === 1 ? String(facilities[0].id) : '');
    if (!facId) { toast.error('Select a facility first'); return; }
    if (!filterDate) { toast.error('Select a date first'); return; }
    setBlockDayLoading(true);
    try {
      const res = await api.patch('/pickup-slots/block-day', {
        date: filterDate,
        facilityId: Number(facId),
        block,
      });
      toast.success(res.data.message);
      setBlockDayState(null);
      fetchSlots();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setBlockDayLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pickup Slots</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage facility pickup slot availability</p>
        </div>
        <Button onClick={openAdd} leftIcon={<Plus className="w-4 h-4" />}>
          Add Slot
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <Input
            label="Filter by Date"
            type="date"
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
            className="w-44"
          />
          {facilities.length > 0 && (
            <Select
              label="Facility"
              value={filterFacility}
              onChange={(e) => { setFilterFacility(e.target.value); setPage(1); }}
              options={[
                { value: '', label: 'All Facilities' },
                ...facilities.map((f) => ({ value: String(f.id), label: f.name })),
              ]}
              className="w-48"
            />
          )}
          <Button variant="ghost" onClick={() => { setFilterDate(todayStr()); setFilterFacility(''); setPage(1); }}>
            Reset
          </Button>
          {filterDate && (
            <div className="flex gap-2 ml-auto">
              <Button
                variant="danger"
                size="sm"
                leftIcon={<CalendarOff className="w-3.5 h-3.5" />}
                onClick={() => setBlockDayState({ open: true, block: true })}
                title={!filterFacility && facilities.length > 1 ? 'Select a facility first' : undefined}
                disabled={!filterFacility && facilities.length > 1}
              >
                Block Day
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<CalendarCheck2 className="w-3.5 h-3.5" />}
                onClick={() => setBlockDayState({ open: true, block: false })}
                title={!filterFacility && facilities.length > 1 ? 'Select a facility first' : undefined}
                disabled={!filterFacility && facilities.length > 1}
              >
                Unblock Day
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Slots */}
      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : slots.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No pickup slots found</p>
            <p className="text-gray-400 text-sm mt-1">Create slots for your facilities to allow bookings</p>
          </div>
        </Card>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Facility', 'Date', 'Time', 'Capacity', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {slots.map((slot) => {
                  const pct = capacityPct(slot);
                  const full = slot.currentBookings >= slot.maxCapacity;
                  return (
                    <tr key={slot.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {slot.facility?.name ?? `Facility #${slot.facilityId}`}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(slot.slotDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{slot.startTime} – {slot.endTime}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span className={`text-xs font-semibold ${full ? 'text-red-600' : 'text-gray-700'}`}>
                            {slot.currentBookings}/{slot.maxCapacity}
                          </span>
                          <div className="w-16 bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${full ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggle(slot)}
                          title={slot.isActive ? 'Click to deactivate' : 'Click to activate'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                            slot.isActive
                              ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          <ToggleLeft className="w-3.5 h-3.5" />
                          {slot.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(slot)}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => setDeleteSlot(slot)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={addOpen || !!editSlot}
        onClose={() => { setAddOpen(false); setEditSlot(null); }}
        title={editSlot ? 'Edit Pickup Slot' : 'Create Pickup Slot'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {facilities.length > 0 ? (
            <Select
              label="Facility"
              options={[
                { value: '', label: 'Select facility…' },
                ...facilities.map((f) => ({ value: String(f.id), label: f.name })),
              ]}
              error={errors.facilityId?.message}
              {...register('facilityId', { required: 'Facility is required' })}
            />
          ) : (
            <Input
              label="Facility ID"
              type="number"
              error={errors.facilityId?.message}
              {...register('facilityId', { required: 'Facility ID is required' })}
            />
          )}
          <Input
            label="Date"
            type="date"
            error={errors.date?.message}
            {...register('date', { required: 'Date is required' })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              error={errors.startTime?.message}
              {...register('startTime', { required: 'Start time is required' })}
            />
            <Input
              label="End Time"
              type="time"
              error={errors.endTime?.message}
              {...register('endTime', { required: 'End time is required' })}
            />
          </div>
          <Input
            label="Max Capacity"
            type="number"
            error={errors.maxCapacity?.message}
            {...register('maxCapacity', { required: 'Max capacity is required', min: { value: 1, message: 'Must be at least 1' } })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setAddOpen(false); setEditSlot(null); }}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editSlot ? 'Update Slot' : 'Create Slot'}</Button>
          </div>
        </form>
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
            ? `Deactivate ALL slots on ${filterDate}? Customers won't be able to book pickups for this day.`
            : `Reactivate ALL slots on ${filterDate}? Customers will be able to book pickups again.`}
        </p>
        <p className="text-gray-400 text-xs mt-1">
          This affects all time slots for the selected facility on this date.
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

      {/* Delete Confirmation */}
      <Modal open={!!deleteSlot} onClose={() => setDeleteSlot(null)} title="Delete Slot" size="sm">
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this slot? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteSlot(null)}>Cancel</Button>
          <Button variant="danger" loading={submitting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
