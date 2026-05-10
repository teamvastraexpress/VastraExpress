import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  RefreshCw, 
  MapPin, 
  Calendar, 
  Shirt, 
  Zap, 
  Clock, 
  CheckCircle,
  AlertCircle
} from 'lucide-react-native';
import { useOrderStore } from '@/store/orderStore';
import { Typography } from '@/components/ui/Typography';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  COLORS, 
  STATUS_LABELS, 
  STATUS_COLORS, 
  SERVICE_LABELS, 
  TRACKING_STEPS, 
  getCustomerTrackingStep 
} from '@/constants';
import { formatDate, getApiError } from '@/lib/utils';

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

  const [refreshing, setRefreshing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderById(Number(id));
      fetchStatusHistory(Number(id));
    }
    return () => clearActiveOrder();
  }, [id]);

  const onRefresh = async () => {
    if (id) {
      setRefreshing(true);
      await Promise.all([
        fetchOrderById(Number(id)),
        fetchStatusHistory(Number(id)),
      ]);
      setRefreshing(false);
    }
  };

  if (isLoading && !activeOrder) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!activeOrder) {
    return (
      <SafeAreaView className="flex-1 bg-offwhite items-center justify-center px-6">
        <AlertCircle size={48} color={COLORS.textLight} />
        <Typography variant="heading-md" className="mt-4">Order Not Found</Typography>
        <Button label="Go Back" className="mt-6" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const order = activeOrder;
  const currentStepIndex = getCustomerTrackingStep(order.status);

  const getStatusVariant = (status: string): any => {
    if (['DELIVERED'].includes(status)) return 'success';
    if (['CANCELLED', 'PICKUP_FAILED', 'DELIVERY_FAILED'].includes(status)) return 'danger';
    if (['ORDER_CREATED', 'ORDER_CONFIRMED'].includes(status)) return 'brand';
    return 'warning';
  };

  const canCancel = ['ORDER_CREATED', 'ORDER_CONFIRMED', 'PICKUP_SCHEDULED', 'PICKUP_ASSIGNED'].includes(order.status);

  const handleCancelOrder = () => {
    const performCancel = async () => {
      setIsCancelling(true);
      try {
        await cancelOrder(order.id);
        Alert.alert('Success', 'Order cancelled successfully.');
      } catch (err) {
        Alert.alert('Error', getApiError(err));
      } finally {
        setIsCancelling(false);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to cancel this order?')) {
        performCancel();
      }
    } else {
      Alert.alert(
        'Cancel Order',
        'Are you sure you want to cancel this order?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes, Cancel', style: 'destructive', onPress: performCancel },
        ]
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-offwhite">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-brand-bubble/10 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Typography variant="heading-sm" className="flex-1 ml-2">Order Details</Typography>
        <TouchableOpacity onPress={onRefresh} className="p-2">
          <RefreshCw size={20} color={COLORS.primary} className={refreshing ? 'animate-spin' : ''} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <View className="px-6 py-6">
          {/* Order Summary Card */}
          <Card className="p-5 mb-6">
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Typography variant="caption" className="text-text-light mb-1">
                  ORDER {order.orderNumber || `#${order.id}`}
                </Typography>
                <Typography variant="heading-md">
                  {SERVICE_LABELS[order.serviceType] || order.serviceType}
                </Typography>
              </View>
              <Badge variant={getStatusVariant(order.status)}>
                {STATUS_LABELS[order.status] || order.status}
              </Badge>
            </View>

            <View className="flex-row gap-x-2">
              {order.isExpress && (
                <Badge variant="warning" size="sm">Express ⚡</Badge>
              )}
              <Typography variant="caption" className="mt-1">
                Placed on {formatDate(order.createdAt)}
              </Typography>
            </View>
          </Card>

          {/* Tracking Timeline */}
          <Card className="p-5 mb-6">
            <View className="flex-row justify-between items-center mb-6">
              <Typography variant="heading-sm">Tracking Timeline</Typography>
              <Badge variant="sky" size="sm">Step {currentStepIndex + 1} of {TRACKING_STEPS.length}</Badge>
            </View>

            <View>
              {TRACKING_STEPS.map((step, index) => {
                const isDone = index <= currentStepIndex;
                const isLast = index === TRACKING_STEPS.length - 1;
                const historyEntry = statusHistory.find(h => getCustomerTrackingStep(h.status) === index);

                return (
                  <View key={index} className="flex-row">
                    <View className="items-center">
                      <View className={`w-8 h-8 rounded-full items-center justify-center ${isDone ? 'bg-brand-blue shadow-brand' : 'bg-brand-bubble/20'}`}>
                        <Typography className={isDone ? 'text-white' : 'text-text-light'}>{step.icon}</Typography>
                      </View>
                      {!isLast && (
                        <View className={`w-[2px] h-10 ${isDone && index < currentStepIndex ? 'bg-brand-blue' : 'bg-brand-bubble/20'}`} />
                      )}
                    </View>
                    <View className="ml-4 flex-1 pb-4">
                      <Typography variant="body-md" className={isDone ? 'font-bold text-text-dark' : 'text-text-light'}>
                        {step.label}
                      </Typography>
                      {historyEntry && (
                        <Typography variant="caption" className="mt-0.5">
                          {formatDate(historyEntry.createdAt || historyEntry.changedAt || '')}
                        </Typography>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* Order Details Grid */}
          <Card className="p-5 mb-6">
            <Typography variant="heading-sm" className="mb-4">Information</Typography>
            <View className="gap-y-4">
               <View className="flex-row justify-between">
                  <Typography variant="body-sm" className="text-text-light">Pickup Slot</Typography>
                  <Typography variant="body-sm" className="text-right flex-1 ml-4">
                    {order.pickupSlot ? `${order.pickupSlot.startTime} - ${order.pickupSlot.endTime}` : '—'}
                  </Typography>
               </View>
               <View className="flex-row justify-between">
                  <Typography variant="body-sm" className="text-text-light">Address</Typography>
                  <Typography variant="body-sm" className="text-right flex-1 ml-4">
                    {order.address ? `${order.address.houseFlatNo}, ${order.address.street}` : '—'}
                  </Typography>
               </View>
               <View className="flex-row justify-between">
                  <Typography variant="body-sm" className="text-text-light">Weight</Typography>
                  <Typography variant="body-sm">
                    {order.finalWeight ? `${order.finalWeight} kg` : order.initialWeight ? `${order.initialWeight} kg` : 'Pending weighing'}
                  </Typography>
               </View>
               {order.customerNotes && (
                 <View className="pt-3 border-t border-brand-bubble/10">
                   <Typography variant="caption" className="text-text-light mb-1">Special Instructions</Typography>
                   <Typography variant="body-sm" className="italic text-text-mid">"{order.customerNotes}"</Typography>
                 </View>
               )}
            </View>
          </Card>

          {/* Cancellation Button */}
          {canCancel && (
            <Button 
              variant="outline" 
              label="Cancel Order" 
              className="border-danger" 
              labelClassName="text-danger"
              onPress={handleCancelOrder}
              isLoading={isCancelling}
            />
          )}

          <View className="h-10" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
