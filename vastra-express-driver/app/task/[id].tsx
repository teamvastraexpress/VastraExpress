import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDeliveryStore } from '@/store/deliveryStore';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SERVICE_LABELS, STATUS_LABELS } from '@/constants';
import type { AssignmentType } from '@/types';

// ─── Step definitions ─────────────────────────────────────────────────────────

interface Step {
  key: string;       // status input to send to backend
  label: string;
  description: string;
  emoji: string;
  color: string;     // tailwind bg class for active step
  requiresWeight?: boolean; // only for PICKUP COMPLETED step
}

const PICKUP_STEPS: Step[] = [
  {
    key: 'IN_PROGRESS',
    label: 'Start Trip',
    description: 'Confirm you have started heading to the customer.',
    emoji: '🚗',
    color: 'bg-blue-600',
  },
  {
    key: 'ARRIVED',
    label: 'Arrived',
    description: 'Mark that you have arrived at the customer\'s address.',
    emoji: '📍',
    color: 'bg-indigo-600',
  },
  {
    key: 'COMPLETED',
    label: 'Pickup Complete',
    description: 'Enter the laundry weight and confirm pickup.',
    emoji: '✅',
    color: 'bg-green-600',
    requiresWeight: true,
  },
];

const DELIVERY_STEPS: Step[] = [
  {
    key: 'IN_PROGRESS',
    label: 'Start Trip',
    description: 'Confirm you have started heading to the customer.',
    emoji: '🚗',
    color: 'bg-purple-600',
  },
  {
    key: 'ARRIVED',
    label: 'Arrived',
    description: 'Mark that you have arrived at the customer\'s address.',
    emoji: '📍',
    color: 'bg-indigo-600',
  },
  {
    key: 'COMPLETED',
    label: 'Delivery Complete',
    description: 'Confirm that the order has been delivered.',
    emoji: '✅',
    color: 'bg-green-600',
  },
];

// Which assignment status maps to which step index (0-based)
// Uses the order's currentStatus to distinguish ARRIVED (step 1) from just IN_PROGRESS (step 0)
// because the backend keeps assignmentStatus = 'IN_PROGRESS' for both sub-states.
function getCurrentStepIndex(assignmentStatus: string, orderStatus?: string): number {
  if (assignmentStatus === 'COMPLETED') return 2;
  if (assignmentStatus === 'FAILED')    return -2;
  if (assignmentStatus === 'IN_PROGRESS') {
    // If order has already moved past OUT_FOR_PICKUP / OUT_FOR_DELIVERY → ARRIVED step is done
    const arrivedStatuses = ['PICKUP_ARRIVED', 'DELIVERY_ARRIVED'];
    if (orderStatus && arrivedStatuses.includes(orderStatus)) return 1;
    return 0;
  }
  return -1; // ASSIGNED — no step done yet
}

// ─── Weight Modal ─────────────────────────────────────────────────────────────

function WeightModal({
  visible,
  onConfirm,
  onCancel,
  isLoading,
}: {
  visible: boolean;
  onConfirm: (weight: number) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [value, setValue] = useState('');
  const valid = parseFloat(value) > 0 && parseFloat(value) < 200;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
          <Text className="text-gray-800 text-xl font-bold mb-1">Enter Laundry Weight</Text>
          <Text className="text-gray-500 text-sm mb-5">
            Weigh the bag and enter the measured weight in kg.
          </Text>
          <View className="flex-row items-center border-2 border-blue-400 rounded-xl px-4 mb-4 bg-blue-50">
            <TextInput
              className="flex-1 py-3.5 text-gray-800 text-xl font-bold"
              placeholder="0.0"
              keyboardType="decimal-pad"
              value={value}
              onChangeText={setValue}
              autoFocus
            />
            <Text className="text-gray-500 text-lg font-semibold ml-2">kg</Text>
          </View>
          <TouchableOpacity
            className={`rounded-xl py-4 items-center mb-3 ${!valid || isLoading ? 'bg-green-300' : 'bg-green-600'}`}
            onPress={() => valid && onConfirm(parseFloat(value))}
            disabled={!valid || isLoading}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : (
              <Text className="text-white font-bold text-base">Confirm Pickup</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity className="items-center py-2" onPress={onCancel}>
            <Text className="text-gray-500">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TaskDetailScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();
  const router = useRouter();
  const { activeTask, fetchTaskById, updateStatus, updateWeight, isLoading } = useDeliveryStore();

  const [actionLoading, setActionLoading] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [pendingStep, setPendingStep] = useState<Step | null>(null);
  const [confirmStep, setConfirmStep] = useState<Step | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchTaskById(Number(id));
  }, [id]);

  if (isLoading && !activeTask) return <LoadingSpinner label="Loading task..." />;
  if (!activeTask) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">Task not found</Text>
      </View>
    );
  }

  const assignmentType = (activeTask.assignmentType ?? type) as AssignmentType;
  const steps = assignmentType === 'PICKUP' ? PICKUP_STEPS : DELIVERY_STEPS;
  const orderStatus = (activeTask.order as any)?.currentStatus ?? (activeTask.order as any)?.status;
  const currentStepIdx = getCurrentStepIndex(activeTask.status, orderStatus);
  const isDone = ['COMPLETED', 'FAILED'].includes(activeTask.status);
  const nextStep = isDone ? null : steps[currentStepIdx + 1] ?? null;

  const { order } = activeTask;

  // ── Action handler ──────────────────────────────────────────────────────────
  const handleStep = async (step: Step, weightKg?: number) => {
    setActionLoading(true);
    setStepError(null);
    try {
      if (step.requiresWeight && weightKg !== undefined) {
        await updateWeight(order.id, weightKg);
      }
      await updateStatus(activeTask.id, step.key);
      await fetchTaskById(activeTask.id); // refresh
    } catch (e: any) {
      setStepError(e?.response?.data?.message ?? e.message ?? 'Could not update status');
    } finally {
      setActionLoading(false);
      setShowWeightModal(false);
      setPendingStep(null);
    }
  };

  const handleStepPress = (step: Step) => {
    if (step.requiresWeight) {
      setPendingStep(step);
      setShowWeightModal(true);
    } else {
      setConfirmStep(step);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Order Info Card */}
      <View className="bg-white m-4 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <View className={`px-4 py-3 ${assignmentType === 'PICKUP' ? 'bg-blue-50' : 'bg-purple-50'}`}>
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-700 font-bold text-base">#{order.orderNumber}</Text>
            <StatusBadge status={activeTask.status} size="md" />
          </View>
          <Text className={`text-xs font-semibold mt-0.5 ${assignmentType === 'PICKUP' ? 'text-blue-600' : 'text-purple-600'}`}>
            {assignmentType === 'PICKUP' ? '📦 Pickup Task' : '🚚 Delivery Task'}
          </Text>
        </View>

        <View className="px-4 py-4">
          {/* Customer */}
          <View className="mb-3">
            <Text className="text-gray-400 text-xs mb-0.5">CUSTOMER</Text>
            <Text className="text-gray-800 font-semibold">{order.customer?.name ?? '—'}</Text>
            <Text className="text-blue-600 text-sm">{order.customer?.mobileNumber}</Text>
          </View>

          {/* Address */}
          <View className="mb-3">
            <Text className="text-gray-400 text-xs mb-0.5">ADDRESS</Text>
            <Text className="text-gray-700 text-sm">
              {order.address
                ? `${order.address.houseFlatNo}, ${order.address.street}`
                : '—'}
            </Text>
            {order.address?.landmark && (
              <Text className="text-gray-400 text-xs">Near {order.address.landmark}</Text>
            )}
            <Text className="text-gray-500 text-xs">
              {order.address?.city?.name} – {order.address?.pincode}
            </Text>
          </View>

          {/* Service + weight */}
          <View className="flex-row">
            <View className="flex-1">
              <Text className="text-gray-400 text-xs mb-0.5">SERVICE</Text>
              <Text className="text-gray-700 text-sm">
                {SERVICE_LABELS[order.serviceType] ?? order.serviceType}
                {order.isExpress ? '  ⚡' : ''}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-400 text-xs mb-0.5">WEIGHT</Text>
              <Text className="text-gray-700 text-sm">
                {order.initialWeight ? `${order.initialWeight} kg` : 'Not measured'}
              </Text>
            </View>
          </View>

          {/* Pickup slot (pickup only) */}
          {assignmentType === 'PICKUP' && order.pickupSlot && (
            <View className="mt-3">
              <Text className="text-gray-400 text-xs mb-0.5">SLOT</Text>
              <Text className="text-gray-700 text-sm">
                {new Date(order.pickupSlot.slotDate).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}{' '}
                • {order.pickupSlot.startTime} – {order.pickupSlot.endTime}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress Steps */}
      <View className="bg-white mx-4 rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <Text className="text-gray-700 font-bold mb-4">Progress</Text>
        {steps.map((step, idx) => {
          const done = currentStepIdx >= idx;
          const isNext = idx === currentStepIdx + 1 && !isDone;
          return (
            <View key={step.key} className="flex-row items-start mb-4">
              {/* Icon */}
              <View
                className={`w-10 h-10 rounded-full items-center justify-center mr-3
                  ${done ? 'bg-green-500' : isNext ? 'bg-gray-200' : 'bg-gray-100'}`}
              >
                <Text className="text-lg">{done ? '✅' : step.emoji}</Text>
              </View>
              {/* Label */}
              <View className="flex-1">
                <Text className={`font-semibold text-sm ${done ? 'text-gray-800' : 'text-gray-400'}`}>
                  {step.label}
                </Text>
                <Text className="text-gray-400 text-xs">{step.description}</Text>
              </View>
              {done && <Text className="text-green-500 text-xs font-semibold ml-2">Done</Text>}
            </View>
          );
        })}
        {activeTask.status === 'FAILED' && (
          <View className="flex-row items-center bg-red-50 rounded-xl px-3 py-2 mt-1">
            <Text className="text-red-500 mr-2">❌</Text>
            <Text className="text-red-600 text-sm font-semibold">Task marked as failed</Text>
          </View>
        )}
      </View>

      {/* Error banner */}
      {stepError && (
        <View className="mx-4 mb-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          <Text className="text-red-600 text-sm font-medium">⚠️ {stepError}</Text>
        </View>
      )}

      {/* Action Buttons */}
      {!isDone && nextStep && (
        <View className="mx-4 mb-4">
          {/* Inline confirm panel */}
          {confirmStep ? (
            <View className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <Text className="text-gray-900 font-bold text-base text-center mb-1">
                {confirmStep.emoji} {confirmStep.label}
              </Text>
              <Text className="text-gray-500 text-sm text-center mb-5">
                {confirmStep.description}
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setConfirmStep(null)}
                  className="flex-1 bg-gray-100 rounded-xl py-3 items-center"
                >
                  <Text className="text-gray-700 font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setConfirmStep(null); handleStep(confirmStep); }}
                  disabled={actionLoading}
                  className={`flex-1 ${confirmStep.color} rounded-xl py-3 items-center`}
                >
                  {actionLoading
                    ? <ActivityIndicator color="#fff" />
                    : <Text className="text-white font-bold">Confirm</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              className={`rounded-2xl py-4 items-center ${nextStep.color} ${actionLoading ? 'opacity-60' : ''}`}
              onPress={() => handleStepPress(nextStep)}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-2">{nextStep.emoji}</Text>
                  <Text className="text-white font-bold text-base">{nextStep.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Completed state */}
      {activeTask.status === 'COMPLETED' && (
        <View className="mx-4 mb-6 bg-green-50 rounded-2xl p-5 items-center border border-green-100">
          <Text className="text-4xl mb-2">🎉</Text>
          <Text className="text-green-700 font-bold text-lg">Task Complete!</Text>
          <Text className="text-green-600 text-sm mt-1">
            {assignmentType === 'PICKUP' ? 'Laundry has been picked up.' : 'Order delivered successfully.'}
          </Text>
          <TouchableOpacity
            className="mt-4 bg-green-600 rounded-xl px-6 py-2.5"
            onPress={() =>
              router.replace(assignmentType === 'PICKUP' ? '/(tabs)/pickups' : '/(tabs)/deliveries')
            }
          >
            <Text className="text-white font-bold">Back to Tasks</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Weight modal */}
      <WeightModal
        visible={showWeightModal}
        onConfirm={(w) => pendingStep && handleStep(pendingStep, w)}
        onCancel={() => { setShowWeightModal(false); setPendingStep(null); }}
        isLoading={actionLoading}
      />
    </ScrollView>
  );
}
