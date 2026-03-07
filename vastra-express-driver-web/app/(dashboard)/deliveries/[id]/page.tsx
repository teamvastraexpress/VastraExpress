'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDeliveryStore } from '@/store/deliveryStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import {
  getAssignmentStatusColor,
  statusLabel,
  formatSlot,
  formatDateTime,
} from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  MapPin,
  User,
  Phone,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Banknote,
} from 'lucide-react';
import Link from 'next/link';

interface Step {
  key: string;
  label: string;
  description: string;
  icon: string;
}

const DELIVERY_STEPS: Step[] = [
  {
    key: 'IN_PROGRESS',
    label: 'Start Trip',
    description: 'Confirm you have started heading to the customer.',
    icon: '🚗',
  },
  {
    key: 'ARRIVED',
    label: 'Mark Arrived',
    description: 'Mark that you have arrived at the delivery address.',
    icon: '📍',
  },
  {
    key: 'COMPLETED',
    label: 'Delivery Complete',
    description: 'Confirm the order has been successfully delivered.',
    icon: '✅',
  },
];

function getCurrentStepIndex(assignmentStatus: string, orderStatus?: string): number {
  if (assignmentStatus === 'COMPLETED') return 3;
  if (assignmentStatus === 'FAILED') return -2;
  if (assignmentStatus === 'IN_PROGRESS') {
    if (orderStatus && ['DELIVERY_ARRIVED'].includes(orderStatus)) return 1;
    return 0;
  }
  return -1;
}

export default function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { activeTask, fetchTaskById, updateStatus, isLoading, clearActiveTask, confirmCodPayment } =
    useDeliveryStore();

  const [actionLoading, setActionLoading] = useState(false);
  const [codLoading, setCodLoading] = useState(false);

  const load = useCallback(() => {
    fetchTaskById(Number(id), 'DELIVERY');
  }, [id, fetchTaskById]);

  useEffect(() => {
    load();
    return () => clearActiveTask();
  }, [load, clearActiveTask]);

  if (isLoading && !activeTask) return <Loading label="Loading task..." />;
  if (!activeTask) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Task not found.</p>
        <Link href="/deliveries" className="text-emerald-600 text-sm mt-2 inline-block">
          ← Back to Deliveries
        </Link>
      </div>
    );
  }

  const { order, status: assignmentStatus } = activeTask;
  const currentStep = getCurrentStepIndex(assignmentStatus, order.currentStatus);
  const isDone = assignmentStatus === 'COMPLETED';
  const isFailed = assignmentStatus === 'FAILED';

  async function handleStepAction(step: Step) {
    setActionLoading(true);
    try {
      await updateStatus(activeTask!.id, step.key);
      toast.success(`${step.label} — done!`);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCodConfirm() {
    if (!activeTask) return;
    setCodLoading(true);
    try {
      await confirmCodPayment(activeTask.order.id);
      toast.success('Cash payment confirmed — ₹' + Number(activeTask.order.payment?.totalAmount ?? 0).toFixed(2) + ' recorded!');
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to confirm payment');
    } finally {
      setCodLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/deliveries"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Deliveries
      </Link>

      {/* Order Header */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{order.orderNumber}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {order.serviceType.replace(/_/g, ' ')}
              {order.isExpress ? ' · Express' : ''}
            </p>
          </div>
          <Badge className={getAssignmentStatusColor(assignmentStatus)}>
            {statusLabel(assignmentStatus)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Customer</p>
              <p className="text-sm font-medium text-gray-900">
                {order.customer.name ?? 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Mobile</p>
              <a
                href={`tel:${order.customer.mobileNumber}`}
                className="text-sm font-medium text-emerald-600 hover:underline"
              >
                {order.customer.mobileNumber}
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 mt-3 p-3 bg-gray-50 rounded-lg">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400">Delivery Address</p>
            <p className="text-sm text-gray-700">
              {order.address.houseFlatNo}, {order.address.street}
              {order.address.landmark ? `, ${order.address.landmark}` : ''},{' '}
              {order.address.city.name} — {order.address.pincode}
            </p>
          </div>
        </div>

        {order.pickupSlot && (
          <div className="flex items-center gap-2 mt-3">
            <Clock className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-600">
              Slot:{' '}
              <span className="font-medium text-emerald-700">
                {formatSlot(
                  order.pickupSlot.slotDate,
                  order.pickupSlot.startTime,
                  order.pickupSlot.endTime
                )}
              </span>
            </p>
          </div>
        )}

        {(order.finalWeight || order.initialWeight) && (
          <div className="flex items-center gap-2 mt-2">
            <Package className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-600">
              Weight: <span className="font-medium">{order.finalWeight ?? order.initialWeight} kg</span>
            </p>
          </div>
        )}
      </Card>

      {/* COD Payment Collection */}
      {(() => {
        const payment = order.payment;
        const isCod = !payment?.paymentMethod || payment.paymentMethod === 'COD';
        const isPending = payment?.paymentStatus === 'PENDING';
        if (!payment || !isCod || !isPending) return null;
        const hasArrived = order.currentStatus === 'DELIVERY_ARRIVED';
        return (
          <Card className="p-5 border-amber-200 bg-amber-50">
            <div className="flex items-center gap-2 mb-3">
              <Banknote className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-amber-900">Cash on Delivery</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Service Amount</span>
                <span className="font-medium">₹{Number(payment.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST</span>
                <span className="font-medium">₹{Number(payment.gstAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-amber-200 pt-2 mt-1">
                <span className="font-bold text-amber-900">Total to Collect</span>
                <span className="font-bold text-amber-900 text-base">₹{Number(payment.totalAmount).toFixed(2)}</span>
              </div>
            </div>
            {hasArrived ? (
              <Button
                className="w-full mt-4"
                loading={codLoading}
                onClick={handleCodConfirm}
              >
                <Banknote className="w-4 h-4 mr-2" />
                Confirm ₹{Number(payment.totalAmount).toFixed(2)} Received
              </Button>
            ) : (
              <p className="text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2 mt-3 text-center">
                ✋ Arrive at the customer&apos;s location to confirm payment
              </p>
            )}
          </Card>
        );
      })()}

      {/* Step Flow */}
      {!isDone && !isFailed && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Delivery Steps</h2>
          <div className="space-y-3">
            {DELIVERY_STEPS.map((step, idx) => {
              const isDoneStep = idx < currentStep + 1;
              const isCurrentStep = idx === currentStep + 1;

              return (
                <div
                  key={step.key}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    isDoneStep
                      ? 'bg-green-50 border-green-200'
                      : isCurrentStep
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-gray-50 border-gray-200 opacity-50'
                  }`}
                >
                  <div className="text-2xl">{isDoneStep ? '✅' : step.icon}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{step.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                  </div>
                  {isCurrentStep && (
                    <Button
                      size="sm"
                      variant="success"
                      loading={actionLoading}
                      onClick={() => handleStepAction(step)}
                      className="flex-shrink-0"
                    >
                      {step.label}
                    </Button>
                  )}
                  {isDoneStep && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {isDone && (
        <Card className="p-6 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h3 className="font-bold text-gray-900 text-lg">Delivery Completed!</h3>
          <p className="text-sm text-gray-500 mt-1">
            {activeTask.completedAt
              ? `Completed at ${formatDateTime(activeTask.completedAt)}`
              : 'Great job!'}
          </p>
          <Button variant="secondary" className="mt-4" onClick={() => router.push('/deliveries')}>
            Back to Deliveries
          </Button>
        </Card>
      )}

      {isFailed && (
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-700">Delivery Failed</p>
              <p className="text-sm text-gray-500">
                {activeTask.notes ?? 'This delivery was marked as failed.'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
