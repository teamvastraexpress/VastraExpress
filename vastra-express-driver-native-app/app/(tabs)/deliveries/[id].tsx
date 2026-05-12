import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useDeliveryStore } from '@/store/deliveryStore';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Loading } from '@/components/Loading';
import { StepCard, type StepDef } from '@/components/StepCard';
import { colors, getAssignmentStatusColor, statusLabel, formatSlot, formatDateTime } from '@/lib/utils';
import { ArrowLeft, MapPin, User, Phone, Package, Clock, AlertTriangle, Banknote } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DELIVERY_STEPS: StepDef[] = [
  { key: 'IN_PROGRESS', label: 'Start Trip', description: 'Confirm you have started heading to the customer.', icon: '🚗' },
  { key: 'ARRIVED', label: 'Mark Arrived', description: 'Mark that you have arrived at the delivery address.', icon: '📍' },
  { key: 'COMPLETED', label: 'Delivery Complete', description: 'Confirm the order has been successfully delivered.', icon: '✅' },
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

export default function DeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeTask, fetchTaskById, updateStatus, isLoading, clearActiveTask, confirmCodPayment } = useDeliveryStore();
  const [actionLoading, setActionLoading] = useState(false);
  const [codLoading, setCodLoading] = useState(false);

  const load = useCallback(() => { fetchTaskById(Number(id), 'DELIVERY'); }, [id, fetchTaskById]);
  useEffect(() => { load(); return () => clearActiveTask(); }, [load, clearActiveTask]);

  if (isLoading && !activeTask) return <Loading label="Loading task..." />;
  if (!activeTask) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.center}>
          <Text style={s.notFound}>Task not found.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.emerald600, marginTop: 8 }}>← Back to Deliveries</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { order, status: assignmentStatus } = activeTask;
  const currentStep = getCurrentStepIndex(assignmentStatus, order.currentStatus);
  const isDone = assignmentStatus === 'COMPLETED';
  const isFailed = assignmentStatus === 'FAILED';
  const statusColor = getAssignmentStatusColor(assignmentStatus);

  async function handleStepAction(step: StepDef) {
    setActionLoading(true);
    try {
      await updateStatus(activeTask!.id, step.key);
      Alert.alert('Success', `${step.label} — done!`);
      await load();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Action failed');
    } finally { setActionLoading(false); }
  }

  async function handleCodConfirm() {
    setCodLoading(true);
    try {
      await confirmCodPayment(activeTask!.order.id);
      Alert.alert('Success', '₹' + Number(order.payment?.totalAmount ?? 0).toFixed(2) + ' recorded!');
      await load();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to confirm payment');
    } finally { setCodLoading(false); }
  }

  const payment = order.payment;
  const isCod = !payment?.paymentMethod || payment.paymentMethod === 'COD';
  const isPending = payment?.paymentStatus === 'PENDING';
  const showCod = payment && isCod && isPending;
  const hasArrived = order.currentStatus === 'DELIVERY_ARRIVED';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={16} color={colors.gray500} />
          <Text style={s.backText}>Back to Deliveries</Text>
        </TouchableOpacity>

        <Card style={s.cardPad}>
          <View style={s.row_between}>
            <View>
              <Text style={s.orderNum}>{order.orderNumber}</Text>
              <Text style={s.serviceText}>{order.serviceType.replace(/_/g, ' ')}{order.isExpress ? ' · Express' : ''}</Text>
            </View>
            <Badge bg={statusColor.bg} textColor={statusColor.text}>{statusLabel(assignmentStatus)}</Badge>
          </View>

          <View style={s.infoGrid}>
            <View style={s.infoItem}>
              <User size={14} color={colors.gray400} />
              <View><Text style={s.infoLabel}>Customer</Text><Text style={s.infoValue}>{order.customer.name ?? 'N/A'}</Text></View>
            </View>
            <View style={s.infoItem}>
              <Phone size={14} color={colors.gray400} />
              <View>
                <Text style={s.infoLabel}>Mobile</Text>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.customer.mobileNumber}`)}>
                  <Text style={[s.infoValue, { color: colors.emerald600 }]}>{order.customer.mobileNumber}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={s.addressBox}>
            <MapPin size={14} color={colors.gray400} />
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>Delivery Address</Text>
              <Text style={s.addressText}>
                {order.address.houseFlatNo}, {order.address.street}
                {order.address.landmark ? `, ${order.address.landmark}` : ''}, {order.address.city.name} — {order.address.pincode}
              </Text>
            </View>
          </View>

          {order.pickupSlot && (
            <View style={s.slotRow}><Clock size={14} color={colors.gray400} />
              <Text style={s.slotText}>Slot: <Text style={{ fontWeight: '500', color: colors.emerald700 }}>{formatSlot(order.pickupSlot.slotDate, order.pickupSlot.startTime, order.pickupSlot.endTime)}</Text></Text>
            </View>
          )}
          {(order.finalWeight || order.initialWeight) && (
            <View style={s.slotRow}><Package size={14} color={colors.gray400} />
              <Text style={s.slotText}>Weight: <Text style={{ fontWeight: '500' }}>{order.finalWeight ?? order.initialWeight} kg</Text></Text>
            </View>
          )}
        </Card>

        {/* COD Payment */}
        {showCod && (
          <Card style={[s.cardPad, { borderColor: colors.amber200, backgroundColor: colors.amber50 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Banknote size={20} color={colors.amber600} />
              <Text style={{ fontWeight: '600', color: colors.amber900, fontSize: 15 }}>Cash on Delivery</Text>
            </View>
            <View style={{ gap: 6 }}>
              <View style={s.codRow}><Text style={s.codLabel}>Service Amount</Text><Text style={s.codVal}>₹{Number(payment!.amount).toFixed(2)}</Text></View>
              <View style={s.codRow}><Text style={s.codLabel}>GST</Text><Text style={s.codVal}>₹{Number(payment!.gstAmount).toFixed(2)}</Text></View>
              <View style={[s.codRow, { borderTopWidth: 1, borderTopColor: colors.amber200, paddingTop: 8, marginTop: 4 }]}>
                <Text style={s.codTotal}>Total to Collect</Text><Text style={[s.codTotal, { fontSize: 16 }]}>₹{Number(payment!.totalAmount).toFixed(2)}</Text>
              </View>
            </View>
            {hasArrived ? (
              <Button loading={codLoading} onPress={handleCodConfirm} style={{ marginTop: 16, width: '100%' }}>
                Confirm ₹{Number(payment!.totalAmount).toFixed(2)} Received
              </Button>
            ) : (
              <View style={{ backgroundColor: colors.amber100, borderRadius: 8, padding: 10, marginTop: 12 }}>
                <Text style={{ fontSize: 12, color: colors.amber700, textAlign: 'center' }}>✋ Arrive at the customer's location to confirm payment</Text>
              </View>
            )}
          </Card>
        )}

        {/* Steps */}
        {!isDone && !isFailed && (
          <Card style={s.cardPad}>
            <Text style={s.sectionTitle}>Delivery Steps</Text>
            <View style={{ gap: 10 }}>
              {DELIVERY_STEPS.map((step, idx) => (
                <StepCard key={step.key} step={step} isDone={idx < currentStep + 1} isCurrent={idx === currentStep + 1} isLocked={idx > currentStep + 1} loading={actionLoading} accentColor={colors.emerald600} onAction={() => handleStepAction(step)} />
              ))}
            </View>
          </Card>
        )}

        {isDone && (
          <Card style={[s.cardPad, { alignItems: 'center' }]}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🎉</Text>
            <Text style={s.doneTitle}>Delivery Completed!</Text>
            <Text style={s.doneSubtitle}>{activeTask.completedAt ? `Completed at ${formatDateTime(activeTask.completedAt)}` : 'Great job!'}</Text>
            <Button variant="secondary" style={{ marginTop: 16 }} onPress={() => router.back()}>Back to Deliveries</Button>
          </Card>
        )}

        {isFailed && (
          <Card style={s.cardPad}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={22} color={colors.red500} />
              <View><Text style={{ fontWeight: '600', color: colors.red700 }}>Delivery Failed</Text>
                <Text style={{ fontSize: 13, color: colors.gray500 }}>{activeTask.notes ?? 'This delivery was marked as failed.'}</Text></View>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray50 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 13, color: colors.gray500 },
  cardPad: { padding: 20 },
  row_between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  orderNum: { fontSize: 18, fontWeight: '700', color: colors.gray900 },
  serviceText: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  infoGrid: { flexDirection: 'row', gap: 16, marginTop: 16 },
  infoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flex: 1 },
  infoLabel: { fontSize: 11, color: colors.gray400 },
  infoValue: { fontSize: 13, fontWeight: '500', color: colors.gray900 },
  addressBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12, backgroundColor: colors.gray50, borderRadius: 8, padding: 12 },
  addressText: { fontSize: 13, color: colors.gray700 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  slotText: { fontSize: 13, color: colors.gray600 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.gray700, marginBottom: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: colors.gray500 },
  doneTitle: { fontSize: 17, fontWeight: '700', color: colors.gray900 },
  doneSubtitle: { fontSize: 13, color: colors.gray500, marginTop: 4 },
  codRow: { flexDirection: 'row', justifyContent: 'space-between' },
  codLabel: { fontSize: 13, color: colors.gray600 },
  codVal: { fontSize: 13, fontWeight: '500' },
  codTotal: { fontWeight: '700', color: colors.amber900 },
});
