'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatDateTime, getApiError, statusLabel } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loading, TableSkeleton } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import {
  Truck,
  UserCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import type { DeliveryAssignment, Order, User, AssignmentType } from '@/types';

const ASSIGNMENT_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'ASSIGNED',    label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED',   label: 'Completed' },
  { value: 'FAILED',      label: 'Failed' },
];

const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
  ASSIGNED:    'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED:   'bg-emerald-100 text-emerald-700',
  FAILED:      'bg-red-100 text-red-700',
};

const ASSIGNMENT_TYPES: { value: AssignmentType; label: string }[] = [
  { value: 'PICKUP',   label: 'Pickup' },
  { value: 'DELIVERY', label: 'Delivery' },
];

export default function DeliveryPage() {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const LIMIT = 20;

  // Assign modal
  const [showAssignModal, setShowAssignModal]   = useState(false);
  const [pendingOrders, setPendingOrders]       = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading]       = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<User[]>([]);
  const [assignForm, setAssignForm]             = useState({
    orderId: '',
    driverId: '',
    assignmentType: 'PICKUP' as AssignmentType,
    notes: '',
  });
  const [assigning, setAssigning]               = useState(false);

  async function loadOrdersForType(type: AssignmentType) {
    setOrdersLoading(true);
    try {
      // PICKUP needs ORDER_CREATED, ORDER_CONFIRMED or PICKUP_SCHEDULED; DELIVERY needs READY_FOR_DISPATCH
      const statuses = type === 'PICKUP'
        ? ['ORDER_CREATED', 'ORDER_CONFIRMED', 'PICKUP_SCHEDULED']
        : ['READY_FOR_DISPATCH'];
      const results = await Promise.all(
        statuses.map((s) => api.get(`/orders?status=${s}&limit=100`))
      );
      const orders = results.flatMap((r) => r.data.data ?? r.data ?? []);
      setPendingOrders(orders);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setOrdersLoading(false);
    }
  }

  // Reassign modal
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [activeAssignment, setActiveAssignment]   = useState<DeliveryAssignment | null>(null);
  const [newDriverId, setNewDriverId]             = useState('');
  const [reassignNote, setReassignNote]           = useState('');
  const [reassigning, setReassigning]             = useState(false);

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      const res = await api.get(`/delivery?${params}`);
      const data = res.data;
      if (Array.isArray(data)) {
        setAssignments(data);
        setTotalPages(1);
      } else {
        setAssignments(data.data ?? []);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  async function openAssignModal() {
    try {
      const usersRes = await api.get('/users/drivers');
      setAvailableDrivers(usersRes.data.data ?? usersRes.data ?? []);
      setAssignForm({ orderId: '', driverId: '', assignmentType: 'PICKUP', notes: '' });
      setShowAssignModal(true);
      await loadOrdersForType('PICKUP');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleAssign() {
    if (!assignForm.orderId || !assignForm.driverId) {
      toast.error('Select an order and a driver');
      return;
    }
    setAssigning(true);
    try {
      await api.post('/delivery/assign', {
        orderId: parseInt(assignForm.orderId),
        driverId: parseInt(assignForm.driverId),
        assignmentType: assignForm.assignmentType,
        notes: assignForm.notes || undefined,
      });
      toast.success('Driver assigned successfully');
      setShowAssignModal(false);
      loadAssignments();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setAssigning(false);
    }
  }

  async function openReassign(assignment: DeliveryAssignment) {
    try {
      const usersRes = await api.get('/users/drivers');
      setAvailableDrivers(usersRes.data.data ?? usersRes.data ?? []);
      setActiveAssignment(assignment);
      setNewDriverId('');
      setReassignNote('');
      setShowReassignModal(true);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleReassign() {
    if (!activeAssignment || !newDriverId) {
      toast.error('Select a new driver');
      return;
    }
    setReassigning(true);
    try {
      await api.post(`/delivery/${activeAssignment.id}/reassign`, {
        newDriverId: parseInt(newDriverId),
        reason: reassignNote || undefined,
      });
      toast.success('Driver reassigned');
      setShowReassignModal(false);
      loadAssignments();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setReassigning(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Assignment</h1>
          <p className="text-gray-500 text-sm mt-1">Assign and manage pickups and deliveries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={loadAssignments}>
            Refresh
          </Button>
          <Button size="sm" leftIcon={<Truck className="w-3.5 h-3.5" />} onClick={openAssignModal}>
            Assign Driver
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <Select
            options={ASSIGNMENT_STATUSES}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-48"
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Order</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Driver</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Assigned At</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6}><TableSkeleton rows={8} cols={6} /></td></tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Truck className="w-8 h-8 text-gray-300" />
                      <p className="text-gray-400">No assignments found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">
                        #{a.order?.orderNumber ?? a.orderId}
                      </p>
                      {a.order?.customer && (
                        <p className="text-xs text-gray-400">{a.order.customer.name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{a.driver?.name ?? `Driver #${a.driverId}`}</p>
                      <p className="text-xs text-gray-400">{a.driver?.mobileNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={a.assignmentType === 'PICKUP'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                      }>
                        {a.assignmentType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={ASSIGNMENT_STATUS_COLORS[a.status] ?? 'bg-gray-100 text-gray-600'}>
                        {a.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDateTime(a.assignedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.status === 'ASSIGNED' && (
                        <button
                          onClick={() => openReassign(a)}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-400 hover:text-emerald-700"
                          title="Reassign driver"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
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

      {/* Assign Modal */}
      <Modal open={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Driver to Order">
        <div className="space-y-4">
          <Select
            label="Assignment Type"
            value={assignForm.assignmentType}
            options={ASSIGNMENT_TYPES}
            onChange={(e) => {
              const t = e.target.value as AssignmentType;
              setAssignForm({ ...assignForm, assignmentType: t, orderId: '' });
              loadOrdersForType(t);
            }}
          />
          <Select
            label="Order"
            value={assignForm.orderId}
            options={[
              { value: '', label: ordersLoading ? 'Loading orders…' : pendingOrders.length === 0 ? 'No eligible orders' : 'Select order…' },
              ...pendingOrders.map((o) => ({
                value: String(o.id),
                label: `#${o.orderNumber} – ${o.customer?.name ?? 'Customer'} (${o.currentStatus})`,
              })),
            ]}
            onChange={(e) => setAssignForm({ ...assignForm, orderId: e.target.value })}
            required
          />
          <Select
            label="Driver"
            value={assignForm.driverId}
            options={[
              { value: '', label: 'Select driver…' },
              ...availableDrivers.map((d) => ({
                value: String(d.id),
                label: `${d.name} (${d.mobileNumber})`,
              })),
            ]}
            onChange={(e) => setAssignForm({ ...assignForm, driverId: e.target.value })}
            required
          />
          <Textarea
            label="Notes (optional)"
            placeholder="Any special instructions…"
            value={assignForm.notes}
            onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleAssign} loading={assigning} disabled={!assignForm.orderId || !assignForm.driverId} className="flex-1">
              Assign Driver
            </Button>
            <Button variant="outline" onClick={() => setShowAssignModal(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reassign Modal */}
      <Modal open={showReassignModal} onClose={() => setShowReassignModal(false)} title="Reassign Driver">
        {activeAssignment && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-semibold text-gray-900">Order #{activeAssignment.order?.orderNumber ?? activeAssignment.orderId}</p>
              <p className="text-gray-500 mt-1">Current: <span className="font-medium">{activeAssignment.driver?.name}</span></p>
            </div>
            <Select
              label="New Driver"
              value={newDriverId}
              options={[
                { value: '', label: 'Select driver…' },
                ...availableDrivers
                  .filter((d) => d.id !== activeAssignment.driverId)
                  .map((d) => ({ value: String(d.id), label: `${d.name} (${d.mobileNumber})` })),
              ]}
              onChange={(e) => setNewDriverId(e.target.value)}
              required
            />
            <Textarea
              label="Reason (optional)"
              placeholder="Reason for reassignment…"
              value={reassignNote}
              onChange={(e) => setReassignNote(e.target.value)}
            />
            <div className="flex gap-3 pt-2">
              <Button onClick={handleReassign} loading={reassigning} disabled={!newDriverId} className="flex-1">
                Reassign
              </Button>
              <Button variant="outline" onClick={() => setShowReassignModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
