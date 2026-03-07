'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useOrderStore } from '@/store/orderStore';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  statusLabel, getStatusColor, formatDate, formatDateTime,
  formatCurrency, serviceLabel, getApiError, ORDER_STEPS, getOrderStepIndex,
} from '@/lib/utils';
import { Order, OrderStatusHistory, PickupSlot } from '@/types';
import { ArrowLeft, CheckCircle, Clock, XCircle, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { fetchOrderById, cancelOrder, isLoading } = useOrderStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [payingCod, setPayingCod] = useState(false);
  const [payingOnline, setPayingOnline] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Slot change
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<PickupSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [changingSlot, setChangingSlot] = useState(false);
  const [selectedNewSlotId, setSelectedNewSlotId] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    fetchOrderById(id).then(setOrder).catch(() => router.replace('/orders'));
    api.get<OrderStatusHistory[]>(`/orders/${id}/history`).then((r) => setHistory(r.data)).catch(() => {});
  }, [id, fetchOrderById, router]);

  // Poll every 30s while order is being processed — detects bill generation automatically
  useEffect(() => {
    if (!id || !order) return;
    const POLL_STATUSES = ['RECEIVED_AT_FACILITY', 'SORTING', 'WASHING', 'IRONING', 'PACKING'];
    if (!POLL_STATUSES.includes(order.currentStatus)) return;
    const interval = setInterval(async () => {
      const updated = await fetchOrderById(id).catch(() => null);
      if (updated) setOrder(updated);
    }, 30_000);
    return () => clearInterval(interval);
  }, [id, order, fetchOrderById]);

  async function handleCod() {
    if (!order) return;
    setPayingCod(true);
    try {
      // POST /payments/create-order with paymentMethod COD — selects COD as payment method.
      // (POST /payments/cod is the *driver* endpoint for confirming cash collection)
      await api.post('/payments/create-order', { orderId: order.id, paymentMethod: 'COD' });
      toast.success('COD selected! Driver will collect cash on delivery.');
      const updated = await fetchOrderById(id);
      setOrder(updated);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setPayingCod(false);
    }
  }

  async function handleOnlinePayment() {
    if (!order) return;
    setPayingOnline(true);
    try {
      const res = await api.post<{ razorpayOrderId: string; amount: number; currency: string; keyId: string }>(
        '/payments/create-order', { orderId: order.id }
      );
      const { razorpayOrderId, amount, currency, keyId } = res.data;

      // Dynamically load Razorpay
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rzp = new (window as any).Razorpay({
          key: keyId,
          amount,
          currency,
          order_id: razorpayOrderId,
          name: 'Vastra Express',
          description: `Order ${order.orderNumber}`,
          theme: { color: '#2563eb' },
          handler: async () => {
            toast.success('Payment successful!');
            const updated = await fetchOrderById(id);
            setOrder(updated);
          },
        });
        rzp.open();
        setPayingOnline(false);
      };
    } catch (err) {
      toast.error(getApiError(err));
      setPayingOnline(false);
    }
  }

  async function openSlotModal() {
    if (!order) return;
    setSlotsLoading(true);
    setShowSlotModal(true);
    setSelectedNewSlotId('');
    try {
      // Fetch available slots for the same facility
      const facilityId = order.facility?.id;
      const params = new URLSearchParams();
      if (facilityId) params.set('facilityId', String(facilityId));
      const res = await api.get(`/pickup-slots/available?${params}`);
      const slots: PickupSlot[] = Array.isArray(res.data) ? res.data : res.data.data ?? [];
      setAvailableSlots(slots.filter((s) => String(s.id) !== String(order.pickupSlotId)));
    } catch (err) {
      toast.error(getApiError(err));
      setShowSlotModal(false);
    } finally {
      setSlotsLoading(false);
    }
  }

  async function handleChangeSlot() {
    if (!order || !selectedNewSlotId) return;
    setChangingSlot(true);
    try {
      await api.patch(`/orders/${order.id}/slot`, { newSlotId: Number(selectedNewSlotId) });
      toast.success('Pickup slot updated!');
      setShowSlotModal(false);
      const updated = await fetchOrderById(id);
      setOrder(updated);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setChangingSlot(false);
    }
  }

  async function handleCancel() {
    if (!order) return;
    setCancelling(true);
    try {
      await cancelOrder(order.id);
      toast.success('Order cancelled');
      const updated = await fetchOrderById(id);
      setOrder(updated);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  }

  if (isLoading || !order) return <Loading fullPage />;

  const stepIndex = getOrderStepIndex(order.currentStatus);
  const canCancel = ['ORDER_CREATED', 'ORDER_CONFIRMED', 'PICKUP_SCHEDULED', 'PICKUP_ASSIGNED'].includes(order.currentStatus);
  const canChangeSlot = ['ORDER_CREATED', 'ORDER_CONFIRMED', 'PICKUP_SCHEDULED', 'PICKUP_ASSIGNED'].includes(order.currentStatus);
  const showPayment = order.currentStatus === 'BILL_GENERATED' && !order.paymentMethod;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back + header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{order.orderNumber}</h1>
            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            {order.isExpress && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-lg font-medium">
                ⚡ Express
              </span>
            )}
            <Badge variant={getStatusColor(order.currentStatus)}>
              {statusLabel(order.currentStatus)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Bill ready banner */}
      {order.currentStatus === 'BILL_GENERATED' && !order.paymentMethod && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🧾</span>
            <div className="flex-1">
              <p className="font-bold text-lg leading-tight">Your bill is ready!</p>
              <p className="text-blue-100 text-sm mt-0.5">
                Total due: <span className="font-bold text-white">{formatCurrency(order.bill?.totalAmount ?? 0)}</span>
              </p>
              <p className="text-blue-100 text-xs mt-1">Select a payment method below to complete your order.</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Order Progress</h2>
        {['CANCELLED', 'FAILED'].includes(order.currentStatus) ? (
          <div className="flex items-center gap-3 text-red-600">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">
              Order {order.currentStatus === 'CANCELLED' ? 'Cancelled' : 'Failed'}
            </span>
          </div>
        ) : (
          <div className="relative">
            {/* connector line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 z-0" />
            <div
              className="absolute top-4 left-4 h-0.5 bg-blue-600 z-0 transition-all duration-500"
              style={{ width: `${Math.max(0, (stepIndex / (ORDER_STEPS.length - 1)) * 100)}%` }}
            />
            <div className="relative z-10 flex justify-between">
              {ORDER_STEPS.map((step, i) => {
                const done = i < stepIndex;
                const current = i === stepIndex;
                return (
                  <div key={step.label} className="flex flex-col items-center gap-1.5" style={{ width: `${100 / ORDER_STEPS.length}%` }}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                      done ? 'bg-blue-600 border-blue-600 text-white'
                        : current ? 'bg-white border-blue-600 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className={`text-center leading-tight text-[10px] ${current ? 'font-semibold text-blue-700' : done ? 'text-gray-600' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Order Info */}
      <Card className="p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Order Details</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Service</p>
            <p className="font-medium text-gray-900">{serviceLabel(order.serviceType)}</p>
          </div>
          {order.initialWeight && (
            <div>
              <p className="text-gray-500">Weight</p>
              <p className="font-medium text-gray-900">{order.initialWeight} kg</p>
            </div>
          )}
          {order.pickupSlot && (
            <div className="col-span-2">
              <p className="text-gray-500">Pickup Slot</p>
              <p className="font-medium text-gray-900 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {formatDate(order.pickupSlot.slotDate)} · {order.pickupSlot.startTime}–{order.pickupSlot.endTime}
              </p>
            </div>
          )}
          {order.address && (
            <div className="col-span-2">
              <p className="text-gray-500">Address</p>
              <p className="font-medium text-gray-900">
                {order.address.houseFlatNo}, {order.address.street}
                {order.address.landmark ? `, ${order.address.landmark}` : ''} — {order.address.pincode}
              </p>
              {order.address.city && <p className="text-gray-500 text-xs">{order.address.city.name}</p>}
            </div>
          )}
          {order.notes && (
            <div className="col-span-2">
              <p className="text-gray-500">Notes</p>
              <p className="font-medium text-gray-900">{order.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Bill */}
      {order.bill && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Bill Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.bill.subtotal)}</span>
            </div>
            {order.bill.expressCharge > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>Express Charge</span>
                <span>+{formatCurrency(order.bill.expressCharge)}</span>
              </div>
            )}
            {order.bill.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>−{formatCurrency(order.bill.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Tax ({order.bill.taxPercentage}%)</span>
              <span>{formatCurrency(order.bill.taxAmount)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span>{formatCurrency(order.bill.totalAmount)}</span>
            </div>
            {order.paymentMethod && (
              <div className="flex items-center gap-1 text-emerald-600 pt-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="text-xs">Paid via {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online'}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Payment */}
      {showPayment && (
        <Card className="p-5 border-2 border-blue-200 bg-blue-50">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Payment Required</h2>
          <p className="text-xs text-gray-500 mb-4">
            Total: <span className="font-bold text-gray-900">{formatCurrency(order.bill?.totalAmount ?? 0)}</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleCod} variant="secondary" loading={payingCod} className="flex-1">
              💵 Cash on Delivery
            </Button>
            <Button onClick={handleOnlinePayment} loading={payingOnline} className="flex-1">
              💳 Pay Online
            </Button>
          </div>
        </Card>
      )}

      {/* Status History */}
      {history.length > 0 && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Status History</h2>
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={i} className="flex gap-3">
                <div className="relative flex flex-col items-center">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-600 shrink-0" />
                  {i < history.length - 1 && (
                    <div className="flex-1 w-px bg-gray-200 mt-1" style={{ minHeight: '24px' }} />
                  )}
                </div>
                <div className="pb-3">
                  <Badge variant={getStatusColor(h.status)} size="sm">{statusLabel(h.status)}</Badge>
                  {h.notes && <p className="text-xs text-gray-500 mt-0.5">{h.notes}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{h.createdAt ? formatDateTime(h.createdAt) : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cancel */}
      {canCancel && (
        <div className="space-y-3">
          {/* Change Slot */}
          {canChangeSlot && (
            <div className="flex justify-end">
              <button
                onClick={openSlotModal}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                <CalendarClock className="w-4 h-4" /> Change Pickup Slot
              </button>
            </div>
          )}

          {/* Cancel button */}
          <div className="flex justify-end">
            {showCancelConfirm ? (
              <Card className="p-4 flex items-center gap-4 w-full border-red-200 bg-red-50">
                <p className="text-sm text-red-700 flex-1">Are you sure you want to cancel this order?</p>
                <Button variant="danger" size="sm" onClick={handleCancel} loading={cancelling}>
                  Yes, Cancel
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowCancelConfirm(false)}>
                  No
                </Button>
              </Card>
            ) : (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-sm text-red-500 hover:text-red-700 underline"
              >
                Cancel Order
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 text-right">Slot changes &amp; cancellations must be made at least 2 hours before pickup.</p>
        </div>
      )}

      {/* Change Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Change Pickup Slot</h3>
              <button onClick={() => setShowSlotModal(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>

            {order?.pickupSlot && (
              <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm">
                <p className="text-xs text-gray-500 mb-0.5">Current slot</p>
                <p className="font-medium text-blue-800">
                  {formatDate(order.pickupSlot.slotDate)} · {order.pickupSlot.startTime}–{order.pickupSlot.endTime}
                </p>
              </div>
            )}

            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⏰ Slot changes are allowed up to 2 hours before the current slot starts.
            </p>

            {slotsLoading ? (
              <p className="text-sm text-gray-500 text-center py-4">Loading available slots…</p>
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No other available slots found.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {availableSlots.map((slot) => (
                  <label
                    key={slot.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedNewSlotId === String(slot.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="newSlot"
                      value={String(slot.id)}
                      checked={selectedNewSlotId === String(slot.id)}
                      onChange={(e) => setSelectedNewSlotId(e.target.value)}
                      className="accent-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(slot.slotDate)} · {slot.startTime}–{slot.endTime}
                      </p>
                      <p className="text-xs text-gray-400">
                        {slot.availableCapacity ?? (slot.maxCapacity - slot.currentBookings)} spots left
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                onClick={handleChangeSlot}
                loading={changingSlot}
                disabled={!selectedNewSlotId}
                className="flex-1"
              >
                Confirm Change
              </Button>
              <Button variant="secondary" onClick={() => setShowSlotModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
