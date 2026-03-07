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
  getOrderStatusColor,
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
} from 'lucide-react';
import Link from 'next/link';

// ─── Step definitions ─────────────────────────────────────────────────────────

interface Step {
  key: string;
  label: string;
  description: string;
  icon: string;
  requiresWeight?: boolean;
}

const PICKUP_STEPS: Step[] = [
  {
    key: 'IN_PROGRESS',
    label: 'Start Trip',
    description: 'Confirm you have started heading to the customer.',
    icon: '🚗',
  },
  {
    key: 'ARRIVED',
    label: 'Mark Arrived',
    description: 'Mark that you have arrived at the customer address.',
    icon: '📍',
  },
  {
    key: 'COMPLETED',
    label: 'Complete Pickup',
    description: 'Enter the laundry weight and confirm pickup.',
    icon: '✅',
    requiresWeight: true,
  },
];

function getCurrentStepIndex(assignmentStatus: string, orderStatus?: string): number {
  if (assignmentStatus === 'COMPLETED') return 3; // all done
  if (assignmentStatus === 'FAILED') return -2;
  if (assignmentStatus === 'IN_PROGRESS') {
    if (orderStatus && ['PICKUP_ARRIVED'].includes(orderStatus)) return 1;
    return 0;
  }
  return -1; // ASSIGNED — no step started
}

// ─── Weight Modal ─────────────────────────────────────────────────────────────

function WeightModal({
  open,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  onConfirm: (w: number) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [value, setValue] = useState('');
  const valid = parseFloat(value) > 0 && parseFloat(value) < 200;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Enter Laundry Weight</h3>
        <p className="text-sm text-gray-500 mb-4">Weigh the bag and enter the measured weight in kg.</p>
        <div className="flex items-center gap-3 border-2 border-violet-400 rounded-xl px-4 bg-violet-50 mb-4">
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="199"
            placeholder="0.0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            className="flex-1 py-3 text-xl font-bold text-gray-900 bg-transparent outline-none"
          />
          <span className="text-gray-500 font-semibold">kg</span>
        </div>
        <Button
          className="w-full mb-2"
          variant="success"
          size="lg"
          loading={loading}
          disabled={!valid}
          onClick={() => valid && onConfirm(parseFloat(value))}
        >
          Confirm Pickup
        </Button>
        <button
          onClick={onCancel}
          className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 text-center"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PickupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { activeTask, fetchTaskById, updateStatus, updateWeight, isLoading, clearActiveTask } =
    useDeliveryStore();

  const [actionLoading, setActionLoading] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [pendingStep, setPendingStep] = useState<Step | null>(null);

  const load = useCallback(() => {
    fetchTaskById(Number(id), 'PICKUP');
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
        <Link href="/pickups" className="text-violet-600 text-sm mt-2 inline-block">
          ← Back to Pickups
        </Link>
      </div>
    );
  }

  const { order, status: assignmentStatus } = activeTask;
  const currentStep = getCurrentStepIndex(assignmentStatus, order.currentStatus);
  const isDone = assignmentStatus === 'COMPLETED';
  const isFailed = assignmentStatus === 'FAILED';

  async function handleStepAction(step: Step) {
    if (step.requiresWeight) {
      setPendingStep(step);
      setShowWeightModal(true);
      return;
    }
    await executeStep(step, undefined);
  }

  async function executeStep(step: Step, weight: number | undefined) {
    setActionLoading(true);
    try {
      if (step.requiresWeight && weight !== undefined) {
        await updateWeight(order.id, weight);
      }
      await updateStatus(activeTask!.id, step.key);
      toast.success(`${step.label} — done!`);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading(false);
      setShowWeightModal(false);
      setPendingStep(null);
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Back */}
      <Link
        href="/pickups"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Pickups
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
                className="text-sm font-medium text-violet-600 hover:underline"
              >
                {order.customer.mobileNumber}
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 mt-3 p-3 bg-gray-50 rounded-lg">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400">Pickup Address</p>
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
              Scheduled:{' '}
              <span className="font-medium text-violet-700">
                {formatSlot(
                  order.pickupSlot.slotDate,
                  order.pickupSlot.startTime,
                  order.pickupSlot.endTime
                )}
              </span>
            </p>
          </div>
        )}

        {order.initialWeight && (
          <div className="flex items-center gap-2 mt-2">
            <Package className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-600">
              Weight recorded: <span className="font-medium">{order.initialWeight} kg</span>
            </p>
          </div>
        )}
      </Card>

      {/* Step Flow */}
      {!isDone && !isFailed && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Trip Steps</h2>
          <div className="space-y-3">
            {PICKUP_STEPS.map((step, idx) => {
              const isDoneStep = idx < currentStep + 1;
              const isCurrentStep = idx === currentStep + 1;
              const isLocked = idx > currentStep + 1;

              return (
                <div
                  key={step.key}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    isDoneStep
                      ? 'bg-green-50 border-green-200'
                      : isCurrentStep
                      ? 'bg-violet-50 border-violet-300'
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
                      variant={step.requiresWeight ? 'success' : 'primary'}
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

      {/* Completed State */}
      {isDone && (
        <Card className="p-6 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h3 className="font-bold text-gray-900 text-lg">Pickup Completed!</h3>
          <p className="text-sm text-gray-500 mt-1">
            {activeTask.completedAt
              ? `Completed at ${formatDateTime(activeTask.completedAt)}`
              : 'Great job!'}
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => router.push('/pickups')}
          >
            Back to Pickups
          </Button>
        </Card>
      )}

      {/* Failed State */}
      {isFailed && (
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-700">Pickup Failed</p>
              <p className="text-sm text-gray-500">
                {activeTask.notes ?? 'This pickup was marked as failed.'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Weight Modal */}
      <WeightModal
        open={showWeightModal}
        loading={actionLoading}
        onConfirm={(w) => pendingStep && executeStep(pendingStep, w)}
        onCancel={() => { setShowWeightModal(false); setPendingStep(null); }}
      />
    </div>
  );
}
