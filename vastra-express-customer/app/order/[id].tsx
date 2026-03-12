import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOrderStore } from '@/store/orderStore';
import StatusBadge from '@/components/StatusBadge';
import { SERVICE_LABELS, SERVICE_ICONS, TRACKING_STEPS, getCustomerTrackingStep } from '@/constants';
import type { OrderStatus } from '@/types';

function formatDate(s?: string) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return s; }
}

// Which step index is "done" given current status
function getTrackingProgress(status: OrderStatus): number {
  return getCustomerTrackingStep(status);
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    activeOrder,
    statusHistory,
    isLoading,
    fetchOrderById,
    fetchStatusHistory,
    cancelOrder,
    clearActiveOrder,
  } = useOrderStore();

  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelDone, setCancelDone] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderById(Number(id));
      fetchStatusHistory(Number(id));
    }
    return () => clearActiveOrder();
  }, [id]);

  if (isLoading || !activeOrder) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  const order = activeOrder;
  const progress = getTrackingProgress(order.status);

  // Customer can cancel before driver is en-route (state machine rule)
  const CUSTOMER_CANCELLABLE = [
    'ORDER_CREATED', 'ORDER_CONFIRMED', 'PICKUP_SCHEDULED', 'PICKUP_ASSIGNED',
  ];
  const canCancel = CUSTOMER_CANCELLABLE.includes(order.status);

  async function handleCancel() {
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelOrder(order.id);
      setCancelDone(true);
      setShowCancelConfirm(false);
    } catch (e: any) {
      setCancelError(e?.response?.data?.message ?? e.message ?? 'Could not cancel. Please try again.');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-primary-600 pt-14 pb-8 px-4">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-white text-2xl">←</Text>
        </TouchableOpacity>
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-primary-200 text-sm">Order #{order.id}</Text>
            <Text className="text-white text-xl font-bold mt-0.5">
              {SERVICE_ICONS[order.serviceType]} {SERVICE_LABELS[order.serviceType]}
            </Text>
          </View>
          <StatusBadge status={order.status} />
        </View>
      </View>

      <View className="px-4 -mt-4">
        {/* Tracking timeline */}
        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <Text className="text-gray-700 font-semibold mb-4">Order Tracking</Text>
          <View className="gap-0">
            {TRACKING_STEPS.map((step, i) => {
              const done = i <= progress;
              const isLast = i === TRACKING_STEPS.length - 1;
              return (
                <View key={step.status} className="flex-row">
                  {/* Timeline connector */}
                  <View className="items-center mr-3">
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center ${
                        done ? 'bg-primary-600' : 'bg-gray-100'
                      }`}
                    >
                      <Text className="text-sm">{step.icon}</Text>
                    </View>
                    {!isLast && (
                      <View
                        className={`w-0.5 flex-1 min-h-4 ${
                          done && i < progress ? 'bg-primary-300' : 'bg-gray-100'
                        }`}
                      />
                    )}
                  </View>
                  {/* Label */}
                  <View className={`flex-1 ${!isLast ? 'pb-4' : ''}`}>
                    <Text
                      className={`text-sm font-medium mt-1.5 ${
                        done ? 'text-gray-800' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </Text>
                    {/* Show timestamp from history if available */}
                    {statusHistory.find((h) => h.status === step.status) && (
                      <Text className="text-gray-400 text-xs mt-0.5">
                        {formatDate(
                          statusHistory.find((h) => h.status === step.status)?.changedAt ??
                          statusHistory.find((h) => h.status === step.status)?.createdAt,
                        )}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Order Info */}
        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <Text className="text-gray-700 font-semibold mb-3">Order Details</Text>
          <View className="gap-2.5">
            {[
              ['Service', `${SERVICE_ICONS[order.serviceType]} ${SERVICE_LABELS[order.serviceType]}`],
              ['Express', order.isExpress ? '⚡ Yes' : 'No'],
              ['Pickup Date', order.pickupSlot?.slotDate ?? '—'],
              ['Pickup Slot', order.pickupSlot
                ? `${order.pickupSlot.startTime} – ${order.pickupSlot.endTime}`
                : '—'],
              ['Pickup Address', order.address
                ? `${order.address.houseFlatNo}, ${order.address.street}, ${order.address.pincode}`
                : '—'],
            ].map(([k, v]) => (
              <View key={k} className="flex-row justify-between items-start gap-2">
                <Text className="text-gray-400 text-sm w-28 shrink-0">{k}</Text>
                <Text className="text-gray-700 text-sm font-medium flex-1 text-right">
                  {v}
                </Text>
              </View>
            ))}
            {order.customerNotes ? (
              <View className="mt-1 pt-2 border-t border-gray-50">
                <Text className="text-gray-400 text-xs mb-1">Notes</Text>
                <Text className="text-gray-700 text-sm">{order.customerNotes}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
            <Text className="text-gray-700 font-semibold mb-3">Items</Text>
            {order.items.map((item) => (
              <View
                key={item.id}
                className="flex-row justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <Text className="text-gray-700 text-sm">{item.itemName}</Text>
                <View className="flex-row gap-3">
                  <Text className="text-gray-400 text-sm">×{item.quantity}</Text>
                  {item.price != null && (
                    <Text className="text-gray-700 text-sm font-medium">
                      ₹{item.price}
                    </Text>
                  )}
                </View>
              </View>
            ))}

          </View>
        )}

        {/* Cancel button */}
        {canCancel && !cancelDone && (
          <TouchableOpacity
            onPress={() => { setCancelError(null); setShowCancelConfirm(true); }}
            className="bg-red-50 border border-red-100 rounded-2xl py-4 items-center mb-4"
          >
            <Text className="text-red-500 font-semibold">Cancel Order</Text>
          </TouchableOpacity>
        )}

        {/* Cancel success banner */}
        {cancelDone && (
          <View className="bg-gray-100 border border-gray-200 rounded-2xl p-4 mb-4 items-center">
            <Text className="text-2xl mb-1">✅</Text>
            <Text className="text-gray-700 font-semibold">Order Cancelled</Text>
            <Text className="text-gray-400 text-xs mt-1">Your order has been successfully cancelled.</Text>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/orders')}
              className="mt-3 bg-primary-600 rounded-xl px-6 py-2"
            >
              <Text className="text-white text-sm font-medium">View My Orders</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error banner */}
        {cancelError && (
          <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
            <Text className="text-red-600 text-sm font-medium">⚠️ {cancelError}</Text>
          </View>
        )}

        {/* Inline cancel confirm overlay */}
        {showCancelConfirm && (
          <View className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
            <Text className="text-gray-900 font-bold text-base mb-1 text-center">Cancel Order?</Text>
            <Text className="text-gray-500 text-sm text-center mb-5">
              This will cancel Order #{order.id}. This action cannot be undone.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => { setShowCancelConfirm(false); setCancelError(null); }}
                className="flex-1 bg-gray-100 rounded-xl py-3 items-center"
              >
                <Text className="text-gray-700 font-semibold">Keep Order</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancel}
                disabled={cancelling}
                className="flex-1 bg-red-500 rounded-xl py-3 items-center"
              >
                {cancelling ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Yes, Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View className="h-8" />
      </View>
    </ScrollView>
  );
}
