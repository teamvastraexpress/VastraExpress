'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatDate, getStatusColor, statusLabel, getApiError, formatCurrency } from '@/lib/utils';
import { KpiCard, Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { PipelineOrderCard } from '@/components/ui/PipelineOrderCard';
import {
  ShoppingBag,
  Package,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Plus,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';
import type { Order, OrderStatus, OrderItem, ServiceType, User } from '@/types';
import toast from 'react-hot-toast';

// Processing pipeline stages for facility staff
const PIPELINE_STAGES: { id: string; statuses: OrderStatus[]; label: string; color: string }[] = [
  { id: 'pendingPickups', statuses: ['ORDER_CREATED', 'ORDER_CONFIRMED', 'PICKUP_SCHEDULED', 'PICKUP_ASSIGNED', 'OUT_FOR_PICKUP', 'PICKUP_ARRIVED', 'PICKED_UP'], label: 'Pending Pickups', color: 'bg-purple-50 border-purple-200' },
  { id: 'received',   statuses: ['RECEIVED_AT_FACILITY'],          label: 'Received',   color: 'bg-teal-50 border-teal-200' },
  { id: 'sorting',    statuses: ['SORTING'],                        label: 'Sorting',    color: 'bg-yellow-50 border-yellow-200' },
  { id: 'processing', statuses: ['WASHING', 'IRONING', 'PACKING'], label: 'Processing', color: 'bg-blue-50 border-blue-200' },
  { id: 'ready',      statuses: ['BILL_GENERATED', 'READY_FOR_DISPATCH'],             label: 'Ready',      color: 'bg-green-50 border-green-200' },
];

// For the status-advance modal (PACKING has multiple options)
const NEXT_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PACKING: ['BILL_GENERATED', 'READY_FOR_DISPATCH'],
};

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'WASH_FOLD', label: 'Wash & Fold' },
  { value: 'DRY_CLEAN', label: 'Dry Clean' },
  { value: 'IRON_ONLY', label: 'Iron Only' },
];

interface NewItem {
  itemName: string;
  quantity: number;
  serviceType: ServiceType;
  pricePerItem: number;
}

interface DashboardStats {
  inProcessing: number;
  pendingPickups: number;
  readyForDispatch: number;
  lowStockItems: number;
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    inProcessing: 0,
    pendingPickups: 0,
    readyForDispatch: 0,
    lowStockItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Status modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [nextStatus, setNextStatus] = useState<OrderStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Weight modal
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [finalWeight, setFinalWeight] = useState('');
  const [weightLoading, setWeightLoading] = useState(false);

  // Items / bill modal
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [billLoading, setBillLoading] = useState(false);
  const [newItem, setNewItem] = useState<NewItem>({
    itemName: '', quantity: 1, serviceType: 'WASH_FOLD', pricePerItem: 0,
  });

  // Driver assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<User[]>([]);
  const [assignType, setAssignType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [driverId, setDriverId] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [assigning, setAssigning] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [ordersRes, inventoryRes] = await Promise.all([
        api.get('/orders?limit=200'),
        api.get('/inventory?limit=200'),
      ]);

      const allOrders: Order[] = ordersRes.data.data ?? ordersRes.data ?? [];

      // Compute stats
      const processingStatuses: OrderStatus[] = ['RECEIVED_AT_FACILITY', 'SORTING', 'WASHING', 'IRONING', 'PACKING'];
      const inProcessing = allOrders.filter((o) => processingStatuses.includes(o.currentStatus)).length;
      // Pending Pickups = orders awaiting driver pickup FROM customer to facility
      const pendingPickups = allOrders.filter((o) =>
        ['ORDER_CREATED', 'ORDER_CONFIRMED', 'PICKUP_SCHEDULED', 'PICKUP_ASSIGNED', 'OUT_FOR_PICKUP', 'PICKUP_ARRIVED', 'PICKED_UP'].includes(o.currentStatus)
      ).length;
      const readyForDispatch = allOrders.filter((o) => o.currentStatus === 'READY_FOR_DISPATCH').length;

      const inventoryItems = inventoryRes.data.data ?? inventoryRes.data ?? [];
      const lowStockItems = inventoryItems.filter((item: { isLowStock?: boolean; quantity: number; lowStockThreshold: number }) =>
        item.isLowStock || item.quantity <= item.lowStockThreshold
      ).length;

      setStats({ inProcessing, pendingPickups, readyForDispatch, lowStockItems });
      setOrders(allOrders);
      setLastUpdated(new Date());
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleQuickStatus(order: Order, toStatus: OrderStatus) {
    try {
      await api.patch(`/orders/${order.id}/status`, { status: toStatus });
      toast.success(`Moved to ${statusLabel(toStatus)}`);
      loadData();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  function openStatusModal(order: Order) {
    setActiveOrder(order);
    setNextStatus('');
    setStatusNote('');
    setShowStatusModal(true);
  }

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
      loadData();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setStatusLoading(false);
    }
  }

  function openWeightModal(order: Order) {
    setActiveOrder(order);
    setFinalWeight(String(order.finalWeight ?? ''));
    setShowWeightModal(true);
  }

  async function handleWeightSave() {
    if (!activeOrder || !finalWeight) return;
    setWeightLoading(true);
    try {
      await api.patch(`/orders/${activeOrder.id}/weight`, {
        finalWeight: parseFloat(finalWeight),
      });
      toast.success('Final weight saved');
      setShowWeightModal(false);
      loadData();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setWeightLoading(false);
    }
  }

  async function openItemsModal(order: Order) {
    try {
      const res = await api.get(`/orders/${order.id}`);
      const fresh = res.data;
      setActiveOrder({ ...fresh, items: fresh.orderItems ?? fresh.items ?? [] });
    } catch {
      setActiveOrder(order);
    }
    setNewItem({ itemName: '', quantity: 1, serviceType: 'WASH_FOLD', pricePerItem: 0 });
    setShowItemsModal(true);
  }

  async function handleAddItem() {
    if (!activeOrder) return;
    if (!newItem.itemName || newItem.quantity < 1 || newItem.pricePerItem <= 0) {
      toast.error('Fill in all item fields');
      return;
    }
    setItemsLoading(true);
    try {
      await api.post(`/orders/${activeOrder.id}/items`, { items: [newItem] });
      toast.success('Item added');
      setNewItem({ itemName: '', quantity: 1, serviceType: 'WASH_FOLD', pricePerItem: 0 });
      const res = await api.get(`/orders/${activeOrder.id}`);
      // Backend returns items as `orderItems` — normalise to `items` for the modal
      const fresh = res.data;
      setActiveOrder({ ...fresh, items: fresh.orderItems ?? fresh.items ?? [] });
      loadData();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setItemsLoading(false);
    }
  }

  async function handleGenerateBill() {
    if (!activeOrder) return;
    setBillLoading(true);
    try {
      const useItemBilling = (activeOrder.items?.length ?? 0) > 0;
      await api.post(`/billing/generate/${activeOrder.id}`, { useItemBilling });
      toast.success('Bill generated successfully');
      setShowItemsModal(false);
      loadData();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setBillLoading(false);
    }
  }

  async function openAssignModal(order: Order, type: 'PICKUP' | 'DELIVERY') {
    try {
      const res = await api.get('/users/drivers');
      setAvailableDrivers(res.data.data ?? res.data ?? []);
    } catch (err) {
      toast.error(getApiError(err));
      return;
    }
    setActiveOrder(order);
    setAssignType(type);
    setDriverId('');
    setAssignNote('');
    setShowAssignModal(true);
  }

  async function handleAssign() {
    if (!activeOrder || !driverId) {
      toast.error('Select a driver');
      return;
    }
    setAssigning(true);
    try {
      await api.post('/delivery/assign', {
        orderId: activeOrder.id,
        driverId: parseInt(driverId),
        assignmentType: assignType,
        notes: assignNote || undefined,
      });
      toast.success('Driver assigned successfully');
      setShowAssignModal(false);
      loadData();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setAssigning(false);
    }
  }

  if (loading) return <Loading />;

  // Group orders by pipeline stage
  const ordersByStage = PIPELINE_STAGES.reduce<Record<string, Order[]>>((acc, stage) => {
    acc[stage.id] = orders.filter((o) => stage.statuses.includes(o.currentStatus));
    return acc;
  }, {});

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Facility Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {formatDate(new Date().toISOString())} · Processing pipeline overview
          {lastUpdated && <span className="ml-2 text-xs text-gray-400">· Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Orders In Processing"
          value={stats.inProcessing}
          icon={<ShoppingBag className="w-5 h-5" />}
          color="blue"
        />
        <KpiCard
          title="Pending Pickups"
          value={stats.pendingPickups}
          icon={<MapPin className="w-5 h-5" />}
          color="yellow"
          subtitle={stats.pendingPickups > 0 ? 'Awaiting pickup' : 'None pending'}
        />
        <KpiCard
          title="Ready for Dispatch"
          value={stats.readyForDispatch}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
        />
        <KpiCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={stats.lowStockItems > 0 ? 'red' : 'emerald'}
          subtitle={stats.lowStockItems > 0 ? 'Needs attention' : 'All stocked'}
        />
      </div>

      {/* Processing Pipeline (Kanban) */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Processing Pipeline</h2>
          <Link
            href="/orders"
            className="text-sm text-emerald-600 hover:underline font-medium"
          >
            View all orders →
          </Link>
        </div>
        <div className="p-4 overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-2">
            {PIPELINE_STAGES.map((stage) => {
              const stageOrders = ordersByStage[stage.id] ?? [];
              return (
                <div
                  key={stage.id}
                  className={`flex flex-col w-56 rounded-xl border-2 ${stage.color} p-3`}
                >
                  {/* Stage header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">{stage.label}</span>
                    <span className="text-xs font-bold bg-white rounded-full px-2 py-0.5 border border-gray-200 text-gray-600">
                      {stageOrders.length}
                    </span>
                  </div>

                  {/* Order cards */}
                  <div className="space-y-2">
                    {stageOrders.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No orders</p>
                    ) : (
                      stageOrders.slice(0, 5).map((order) => (
                        <PipelineOrderCard
                          key={order.id}
                          order={order}
                          onAssignDriver={openAssignModal}
                          onQuickStatus={handleQuickStatus}
                          onAdvanceStatus={openStatusModal}
                          onSetWeight={openWeightModal}
                          onManageItems={openItemsModal}
                        />
                      ))
                    )}
                    {stageOrders.length > 5 && (
                      <Link
                        href={`/orders?status=${stage.statuses[0]}`}
                        className="block text-xs text-center text-emerald-600 hover:underline py-1"
                      >
                        +{stageOrders.length - 5} more
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Recent Active Assignments */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">Recently Updated Orders</h2>
          </div>
          <Link href="/orders" className="text-sm text-emerald-600 hover:underline font-medium">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {orders
            .filter((o) =>
              ![
                'DELIVERED', 'CANCELLED', 'REFUND_INITIATED',
              ].includes(o.currentStatus)
            )
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 8)
            .map((order) => (
              <div key={order.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">#{order.orderNumber}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {order.customer?.name ?? 'Customer'} · {formatDate(order.updatedAt)}
                  </p>
                </div>
                <Badge className={getStatusColor(order.currentStatus)}>
                  {statusLabel(order.currentStatus)}
                </Badge>
              </div>
            ))}
          {orders.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-gray-400">
              No active orders found
            </div>
          )}
        </div>
      </Card>
    </div>

      {/* ── Status Advance Modal (PACKING → multi-choice) ───────────────────────── */}
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
              <Button onClick={handleStatusUpdate} loading={statusLoading} disabled={!nextStatus} className="flex-1">Update Status</Button>
              <Button variant="outline" onClick={() => setShowStatusModal(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Weight Modal ────────────────────────────────────────────────────────────── */}
      <Modal
        open={showWeightModal}
        onClose={() => { setShowWeightModal(false); setFinalWeight(''); }}
        title="Set Final Weight"
      >
        {activeOrder && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-semibold text-gray-900">Order #{activeOrder.orderNumber}</p>
              <p className="text-gray-500 mt-1">Pickup weight: <span className="font-medium">{activeOrder.initialWeight ?? '—'} kg</span></p>
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
              <Button onClick={handleWeightSave} loading={weightLoading} disabled={!finalWeight} className="flex-1">Save Weight</Button>
              <Button variant="outline" onClick={() => setShowWeightModal(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Items & Billing Modal ────────────────────────────────────────────────── */}
      <Modal
        open={showItemsModal}
        onClose={() => setShowItemsModal(false)}
        title="Items & Bill"
        size="lg"
      >
        {activeOrder && (
          <div className="space-y-5">
            <p className="text-sm font-semibold text-gray-800">Order #{activeOrder.orderNumber}</p>

            {/* Existing items */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Items Added</p>
              {(activeOrder.items?.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-400">No items added yet</p>
              ) : (
                <div className="space-y-1">
                  {activeOrder.items!.map((item: OrderItem) => (
                    <div key={item.id} className="flex justify-between text-sm bg-gray-50 rounded px-3 py-2">
                      <div>
                        <span className="font-medium">{item.itemName}</span>
                        <span className="text-gray-400 ml-2">× {item.quantity}</span>
                        <span className="text-gray-400 ml-2 text-xs">({item.serviceType.replace(/_/g, ' ')})</span>
                      </div>
                      <span className="font-semibold text-gray-800">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold px-3 py-2 border-t border-gray-200 mt-2">
                    <span>Total</span>
                    <span>{formatCurrency(activeOrder.items!.reduce((s, i) => s + i.totalPrice, 0))}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Add item */}
            {activeOrder.currentStatus !== 'BILL_GENERATED' && (
              <div className="border border-dashed border-gray-300 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Add Item</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Item Name" placeholder="e.g. Shirt" value={newItem.itemName} onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })} />
                  <Input label="Quantity" type="number" min="1" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })} />
                  <Select label="Service Type" value={newItem.serviceType} options={SERVICE_TYPES} onChange={(e) => setNewItem({ ...newItem, serviceType: e.target.value as ServiceType })} />
                  <Input label="Price per Item (₹)" type="number" step="0.5" min="0" placeholder="0.00" value={newItem.pricePerItem || ''} onChange={(e) => setNewItem({ ...newItem, pricePerItem: parseFloat(e.target.value) || 0 })} />
                </div>
                <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddItem} loading={itemsLoading} className="mt-3">
                  Add Item
                </Button>
              </div>
            )}

            {/* Generate Bill */}
            <div className="pt-2 flex gap-3">
              {activeOrder.currentStatus !== 'BILL_GENERATED' && (
                <div className="flex-1 space-y-1.5">
                  {!activeOrder.finalWeight && (
                    <p className="text-xs text-amber-600">⚠️ Final weight not set — set weight before generating bill.</p>
                  )}
                  {activeOrder.finalWeight && (activeOrder.items?.length ?? 0) === 0 && (
                    <p className="text-xs text-blue-600">ℹ️ No items added — bill will use weight-based pricing (₹/kg).</p>
                  )}
                  {activeOrder.finalWeight && (activeOrder.items?.length ?? 0) > 0 && (
                    <p className="text-xs text-emerald-600">✅ {activeOrder.items!.length} item(s) added — item-based pricing.</p>
                  )}
                  <Button leftIcon={<Receipt className="w-4 h-4" />} onClick={handleGenerateBill} loading={billLoading} disabled={!activeOrder.finalWeight} className="w-full">
                    Generate Bill
                  </Button>
                </div>
              )}
              <Button variant="outline" onClick={() => setShowItemsModal(false)} className="flex-1">Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Assign Driver Modal ───────────────────────────────────────────────────── */}
      <Modal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={`Assign Driver — ${assignType === 'PICKUP' ? 'Pickup' : 'Delivery'}`}
      >
        {activeOrder && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <p className="font-semibold text-gray-900">Order #{activeOrder.orderNumber}</p>
              <p className="text-gray-500">Customer: <span className="font-medium text-gray-700">{activeOrder.customer?.name}</span></p>
              {activeOrder.pickupSlot && (
                <p className="text-gray-500">
                  Slot: <span className="font-medium text-gray-700">
                    {formatDate(activeOrder.pickupSlot.slotDate)} · {activeOrder.pickupSlot.startTime}–{activeOrder.pickupSlot.endTime}
                  </span>
                </p>
              )}
              {activeOrder.address && (
                <p className="text-gray-500 text-xs">
                  Address: {activeOrder.address.houseFlatNo}, {activeOrder.address.street}
                  {activeOrder.address.city && ` · ${activeOrder.address.city.name}`}
                </p>
              )}
              {activeOrder.customerNotes && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                  Note: {activeOrder.customerNotes}
                </p>
              )}
            </div>

            <Select
              label="Select Driver"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              options={[
                { value: '', label: 'Choose a driver…' },
                ...availableDrivers.map((d) => ({
                  value: String(d.id),
                  label: `${d.name} · ${d.mobileNumber}`,
                })),
              ]}
              required
            />

            <Textarea
              label="Notes (optional)"
              placeholder="Any instructions for the driver…"
              value={assignNote}
              onChange={(e) => setAssignNote(e.target.value)}
            />

            <div className="flex gap-3 pt-2">
              <Button onClick={handleAssign} loading={assigning} disabled={!driverId} className="flex-1">
                Assign Driver
              </Button>
              <Button variant="outline" onClick={() => setShowAssignModal(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
