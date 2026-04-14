'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  getStatusColor,
  statusLabel,
  getApiError,
} from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select, Textarea } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { ArrowLeft, User, MapPin, Clock, Package, Truck, ChevronRight } from 'lucide-react';
import type { Order, User as UserType } from '@/types';
import toast from 'react-hot-toast';

// State machine — allowed next statuses per current status (Admin view)
const NEXT_STATUSES: Record<string, string[]> = {
  ORDER_CREATED: ['ORDER_CONFIRMED', 'CANCELLED'],
  ORDER_CONFIRMED: ['PICKUP_SCHEDULED', 'CANCELLED'],
  PICKUP_SCHEDULED: ['PICKUP_ASSIGNED', 'CANCELLED'],
  PICKUP_ASSIGNED: ['OUT_FOR_PICKUP', 'CANCELLED'],
  OUT_FOR_PICKUP: ['PICKUP_ARRIVED', 'PICKUP_FAILED'],
  PICKUP_ARRIVED: ['PICKED_UP'],
  PICKED_UP: ['RECEIVED_AT_FACILITY'],
  RECEIVED_AT_FACILITY: ['SORTING'],
  SORTING: ['WASHING', 'PROCESSING_ISSUE'],
  WASHING: ['READY_FOR_DISPATCH', 'PROCESSING_ISSUE'],
  IRONING: ['READY_FOR_DISPATCH', 'PROCESSING_ISSUE'],
  PACKING: ['READY_FOR_DISPATCH', 'PROCESSING_ISSUE'],
  READY_FOR_DISPATCH: ['DELIVERY_ASSIGNED'],
  DELIVERY_ASSIGNED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERY_ARRIVED', 'DELIVERY_FAILED'],
  DELIVERY_ARRIVED: ['DELIVERED'],
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [drivers, setDrivers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  // Update status modal
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Assign driver modal
  const [assignModal, setAssignModal] = useState(false);
  const [driverId, setDriverId] = useState('');
  const [assignType, setAssignType] = useState('PICKUP');
  const [assignLoading, setAssignLoading] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      const [orderRes, driversRes] = await Promise.all([
        api.get(`/orders/${id}`),
        api.get('/users?role=DRIVER&limit=100'),
      ]);
      setOrder(orderRes.data);
      setDrivers(driversRes.data.data ?? driversRes.data);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  async function handleUpdateStatus() {
    if (!newStatus) return;
    setStatusLoading(true);
    try {
      await api.patch(`/orders/${id}/status`, { status: newStatus, notes: statusNotes });
      toast.success('Order status updated');
      setStatusModal(false);
      setNewStatus('');
      setStatusNotes('');
      loadOrder();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleAssignDriver() {
    if (!driverId) return;
    setAssignLoading(true);
    try {
      await api.post(`/orders/${id}/assign-driver`, {
        driverId: Number(driverId),
        assignmentType: assignType,
      });
      toast.success('Driver assigned successfully');
      setAssignModal(false);
      loadOrder();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setAssignLoading(false);
    }
  }

  if (loading) return <Loading />;
  if (!order) return <div className="text-center py-20 text-gray-500">Order not found</div>;

  const nextStatuses = NEXT_STATUSES[order.currentStatus] ?? [];
  const canAssignDriver =
    ['PICKUP_SCHEDULED', 'READY_FOR_DISPATCH'].includes(order.currentStatus);

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order {order.orderNumber}</h1>
          <p className="text-sm text-gray-500">Created {formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      {/* Status bar */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge className={`${getStatusColor(order.currentStatus)} px-3 py-1 text-sm`}>
              {statusLabel(order.currentStatus)}
            </Badge>
            {order.isExpress && (
              <Badge className="bg-orange-100 text-orange-700 px-3 py-1 text-sm">Express</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canAssignDriver && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Truck className="w-4 h-4" />}
                onClick={() => setAssignModal(true)}
              >
                Assign Driver
              </Button>
            )}
            {nextStatuses.length > 0 && (
              <Button
                size="sm"
                leftIcon={<ChevronRight className="w-4 h-4" />}
                onClick={() => setStatusModal(true)}
              >
                Update Status
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer */}
          <Card>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-gray-400" /> Customer
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Name</p>
                <p className="text-gray-800 font-medium mt-0.5">{order.customer?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Mobile</p>
                <p className="text-gray-800 font-medium mt-0.5">{order.customer?.mobileNumber ?? '—'}</p>
              </div>
            </div>
          </Card>

          {/* Address */}
          {order.address && (
            <Card>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-gray-400" /> Pickup Address
              </h3>
              <p className="text-sm text-gray-700">
                {order.address.houseFlatNo}, {order.address.street}
                {order.address.landmark && `, ${order.address.landmark}`},{' '}
                {order.address.city?.name} — {order.address.pincode}
              </p>
            </Card>
          )}

          {/* Order items */}
          {order.items && order.items.length > 0 && (
            <Card padding={false}>
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" /> Items
                </h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['Item', 'Qty', 'Service', 'Price/item', 'Total'].map((h) => (
                      <th key={h} className="text-left px-6 py-2 text-xs font-semibold text-gray-500 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-2">{item.itemName}</td>
                      <td className="px-6 py-2">{item.quantity}</td>
                      <td className="px-6 py-2">{statusLabel(item.serviceType)}</td>
                      <td className="px-6 py-2">{formatCurrency(item.pricePerItem)}</td>
                      <td className="px-6 py-2 font-medium">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* Status history */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <Card>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-gray-400" /> Status Timeline
              </h3>
              <ol className="relative border-l-2 border-gray-100 space-y-4 ml-2">
                {[...order.statusHistory].reverse().map((h) => (
                  <li key={h.id} className="ml-4">
                    <div className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge className={`${getStatusColor(h.status)} mb-1`}>
                          {statusLabel(h.status)}
                        </Badge>
                        {h.notes && <p className="text-xs text-gray-400 mt-0.5">{h.notes}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">
                          by {h.changedByUser?.name ?? 'System'}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 whitespace-nowrap">{formatDateTime(h.timestamp)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Order info */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Order Info</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-400 text-xs uppercase">Service</dt>
                <dd className="text-gray-800 font-medium mt-0.5">{statusLabel(order.serviceType)}</dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs uppercase">Initial Weight</dt>
                <dd className="text-gray-800 font-medium mt-0.5">
                  {order.initialWeight ? `${order.initialWeight} kg` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs uppercase">Final Weight</dt>
                <dd className="text-gray-800 font-medium mt-0.5">
                  {order.finalWeight ? `${order.finalWeight} kg` : '—'}
                </dd>
              </div>
              {order.customerNotes && (
                <div>
                  <dt className="text-gray-400 text-xs uppercase">Customer Notes</dt>
                  <dd className="text-gray-700 mt-0.5">{order.customerNotes}</dd>
                </div>
              )}
              {order.pickupSlot && (
                <div>
                  <dt className="text-gray-400 text-xs uppercase">Pickup Slot</dt>
                  <dd className="text-gray-800 font-medium mt-0.5">
                    {formatDate(order.pickupSlot.date)} · {order.pickupSlot.startTime}–{order.pickupSlot.endTime}
                  </dd>
                </div>
              )}
            </dl>
          </Card>


        </div>
      </div>

      {/* Update Status Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Order Status">
        <div className="space-y-4">
          <Select
            label="New Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            options={nextStatuses.map((s) => ({ value: s, label: statusLabel(s) }))}
            placeholder="Select a status"
            required
          />
          <Textarea
            label="Notes (optional)"
            placeholder="Add any notes…"
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setStatusModal(false)}>Cancel</Button>
            <Button
              onClick={handleUpdateStatus}
              loading={statusLoading}
              disabled={!newStatus}
            >
              Update Status
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Driver Modal */}
      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assign Driver">
        <div className="space-y-4">
          <Select
            label="Driver"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            options={drivers.map((d) => ({ value: d.id, label: `${d.name} (${d.mobileNumber})` }))}
            placeholder="Select a driver"
            required
          />
          <Select
            label="Assignment Type"
            value={assignType}
            onChange={(e) => setAssignType(e.target.value)}
            options={[
              { value: 'PICKUP', label: 'Pickup' },
              { value: 'DELIVERY', label: 'Delivery' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAssignModal(false)}>Cancel</Button>
            <Button
              onClick={handleAssignDriver}
              loading={assignLoading}
              disabled={!driverId}
            >
              Assign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
