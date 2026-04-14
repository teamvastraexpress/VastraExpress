'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { getStatusColor, statusLabel, formatDate, formatDateTime, getApiError } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Loading, TableSkeleton } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowRightCircle,
  Scale,
  PackageCheck,
} from 'lucide-react';
import type { Order, OrderStatus } from '@/types';

// Facility-relevant statuses only
const FACILITY_STATUSES: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'PICKUP_SCHEDULED',    label: 'Pickup Scheduled' },
  { value: 'PICKED_UP',           label: 'Picked Up' },
  { value: 'RECEIVED_AT_FACILITY',label: 'Received at Facility' },
  { value: 'SORTING',             label: 'Sorting' },
  { value: 'WASHING',             label: 'Washing' },
  { value: 'IRONING',             label: 'Ironing' },
  { value: 'PACKING',             label: 'Packing' },
  { value: 'READY_FOR_DISPATCH',  label: 'Ready for Dispatch' },
  { value: 'DELIVERY_ASSIGNED',   label: 'Delivery Assigned' },
  { value: 'DELIVERED',           label: 'Delivered' },
];

// Next possible statuses from a given status (facility workflow — V2)
const NEXT_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PICKED_UP:             ['RECEIVED_AT_FACILITY'],
  RECEIVED_AT_FACILITY:  ['SORTING'],
  SORTING:               ['WASHING'],
  WASHING:               ['READY_FOR_DISPATCH'],
  IRONING:               ['READY_FOR_DISPATCH'],
  PACKING:               ['READY_FOR_DISPATCH'],
  READY_FOR_DISPATCH:    ['DELIVERY_ASSIGNED'],
};

function OrdersPageContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const presetStatus = searchParams.get('status') ?? '';

  const [orders, setOrders]           = useState<Order[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState(presetStatus);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const LIMIT = 20;

  // Modals
  const [detailOrder, setDetailOrder]     = useState<Order | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [activeOrder, setActiveOrder]   = useState<Order | null>(null);

  // Status update form
  const [nextStatus, setNextStatus]       = useState<OrderStatus | ''>('');
  const [statusNote, setStatusNote]       = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Weight form
  const [finalWeight, setFinalWeight]     = useState('');
  const [weightLoading, setWeightLoading] = useState(false);

  // Mark ready loading
  const [readyLoading, setReadyLoading]   = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      const res = await api.get(`/orders?${params}`);
      const data = res.data;
      if (Array.isArray(data)) {
        setOrders(data);
        setTotalPages(1);
      } else {
        setOrders(data.data ?? []);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // ── Status update ────────────────────────────────────────────────────────────
  async function handleStatusUpdate() {
    if (!activeOrder || !nextStatus) return;
    setStatusLoading(true);
    try {
      await api.patch(`/orders/${activeOrder.id}/status`, {
        status: nextStatus,
        notes: statusNote || undefined,
      });
      toast.success(`Order moved to ${statusLabel(nextStatus)}`);
      setShowStatusModal(false);
      setStatusNote('');
      setNextStatus('');
      loadOrders();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setStatusLoading(false);
    }
  }

  // ── Weight confirmation ──────────────────────────────────────────────────────
  async function handleWeightSave() {
    if (!activeOrder || !finalWeight) return;
    setWeightLoading(true);
    try {
      await api.patch(`/orders/${activeOrder.id}/weight`, {
        finalWeight: parseFloat(finalWeight),
      });
      toast.success('Final weight saved');
      setShowWeightModal(false);
      setFinalWeight('');
      loadOrders();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setWeightLoading(false);
    }
  }

  // ── Mark Ready for Dispatch ───────────────────────────────────────────
  async function handleMarkReady(order: Order) {
    setReadyLoading(true);
    try {
      await api.patch(`/orders/${order.id}/status`, {
        status: 'READY_FOR_DISPATCH',
        notes: 'Order ready for dispatch',
      });
      toast.success('Order marked as Ready for Dispatch');
      loadOrders();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setReadyLoading(false);
    }
  }
  // ── Open detail ──────────────────────────────────────────────────────────────
  async function openDetail(order: Order) {
    try {
      const res = await api.get(`/orders/${order.id}`);
      const fresh = res.data;
      setDetailOrder({ ...fresh, items: fresh.orderItems ?? fresh.items ?? [] });
    } catch {
      setDetailOrder(order);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage processing and weight</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={loadOrders}
        >
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search order number or customer…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <Select
              options={FACILITY_STATUSES}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="min-w-48"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Order</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Service</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Weight</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7}><TableSkeleton rows={8} cols={7} /></td></tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isHighlighted = highlightId === String(order.id);
                  const canAdvance = !!NEXT_STATUSES[order.currentStatus]?.length;
                  return (
                    <tr
                      key={order.id}
                      className={isHighlighted ? 'bg-emerald-50' : 'hover:bg-gray-50'}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-900">#{order.orderNumber}</p>
                          {order.isExpress && (
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                              EXPRESS
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {order.customer?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusColor(order.serviceType)}>
                          {order.serviceType?.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusColor(order.currentStatus)}>
                          {statusLabel(order.currentStatus)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {order.initialWeight ? `${order.initialWeight} kg pickup` : '—'}
                        {order.finalWeight ? ` / ${order.finalWeight} kg final` : ''}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* View detail */}
                          <button
                            onClick={() => openDetail(order)}
                            title="View details"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Advance status */}
                          {canAdvance && (
                            <button
                              onClick={() => { setActiveOrder(order); setShowStatusModal(true); }}
                              title="Update status"
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700"
                            >
                              <ArrowRightCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Weight */}
                          {['RECEIVED_AT_FACILITY','SORTING','WASHING','IRONING','PACKING'].includes(order.currentStatus) && (
                            <button
                              onClick={() => { setActiveOrder(order); setFinalWeight(String(order.finalWeight ?? '')); setShowWeightModal(true); }}
                              title="Set final weight"
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 hover:text-blue-700"
                            >
                              <Scale className="w-4 h-4" />
                            </button>
                          )}

                          {/* Mark Ready for Dispatch — shown when PACKING */}
                          {order.currentStatus === 'PACKING' && (
                            <button
                              onClick={() => handleMarkReady(order)}
                              title="Mark Ready for Dispatch"
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-400 hover:text-emerald-700"
                            >
                              <PackageCheck className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* ── Order Detail Modal ─────────────────────────────────────────────── */}
      <Modal open={!!detailOrder} onClose={() => setDetailOrder(null)} title={`Order #${detailOrder?.orderNumber}`} size="lg">
        {detailOrder && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Customer</p>
                <p className="font-medium">{detailOrder.customer?.name ?? '—'}</p>
                <p className="text-gray-500">{detailOrder.customer?.mobileNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status</p>
                <Badge className={getStatusColor(detailOrder.currentStatus)}>
                  {statusLabel(detailOrder.currentStatus)}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Service Type</p>
                <p className="font-medium">{detailOrder.serviceType?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Weight</p>
                <p>Pickup: <span className="font-medium">{detailOrder.initialWeight ?? '—'} kg</span></p>
                <p>Final: <span className="font-medium">{detailOrder.finalWeight ?? '—'} kg</span></p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Created</p>
                <p className="text-gray-600">{formatDateTime(detailOrder.createdAt)}</p>
              </div>
              {detailOrder.customerNotes && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Customer Notes</p>
                  <p className="text-gray-600">{detailOrder.customerNotes}</p>
                </div>
              )}
            </div>

            {/* Address */}
            {detailOrder.address && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Delivery Address</p>
                <p className="text-gray-700">
                  {detailOrder.address.houseFlatNo}, {detailOrder.address.street}
                  {detailOrder.address.landmark && `, ${detailOrder.address.landmark}`}
                  {' — '}{detailOrder.address.city?.name} · {detailOrder.address.pincode}
                </p>
              </div>
            )}

            {/* Status History */}
            {(detailOrder.statusHistory?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">History</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {detailOrder.statusHistory!.slice().reverse().map((h) => (
                    <div key={h.id} className="flex items-start gap-3 text-xs">
                      <Badge className={`${getStatusColor(h.status)} flex-shrink-0`}>
                        {statusLabel(h.status)}
                      </Badge>
                      <div>
                        <p className="text-gray-500">{formatDateTime(h.timestamp)}</p>
                        {h.notes && <p className="text-gray-400">{h.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Status Update Modal ────────────────────────────────────────────── */}
      <Modal
        open={showStatusModal}
        onClose={() => { setShowStatusModal(false); setNextStatus(''); setStatusNote(''); }}
        title="Update Order Status"
      >
        {activeOrder && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="text-gray-500">Current: <span className="font-medium text-gray-800">{statusLabel(activeOrder.currentStatus)}</span></p>
              <p className="font-semibold text-gray-900 mt-1">Order #{activeOrder.orderNumber}</p>
            </div>

            <Select
              label="Move to"
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
              options={[
                { value: '', label: 'Select next status…' },
                ...(NEXT_STATUSES[activeOrder.currentStatus] ?? []).map((s) => ({
                  value: s,
                  label: statusLabel(s),
                })),
              ]}
              required
            />

            <Textarea
              label="Notes (optional)"
              placeholder="Processing notes, damage report, etc."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleStatusUpdate}
                loading={statusLoading}
                disabled={!nextStatus}
                className="flex-1"
              >
                Update Status
              </Button>
              <Button variant="outline" onClick={() => setShowStatusModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Weight Modal ───────────────────────────────────────────────────── */}
      <Modal
        open={showWeightModal}
        onClose={() => { setShowWeightModal(false); setFinalWeight(''); }}
        title="Set Final Weight"
      >
        {activeOrder && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-semibold text-gray-900">Order #{activeOrder.orderNumber}</p>
              <p className="text-gray-500 mt-1">
                Pickup weight: <span className="font-medium">{activeOrder.initialWeight ?? '—'} kg</span>
              </p>
            </div>

            <Input
              label="Final Weight (kg)"
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 3.5"
              value={finalWeight}
              onChange={(e) => setFinalWeight(e.target.value)}
              required
            />

            <div className="flex gap-3 pt-2">
              <Button onClick={handleWeightSave} loading={weightLoading} disabled={!finalWeight} className="flex-1">
                Save Weight
              </Button>
              <Button variant="outline" onClick={() => setShowWeightModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OrdersPageContent />
    </Suspense>
  );
}
