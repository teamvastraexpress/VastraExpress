import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useDeliveryStore } from '@/store/deliveryStore';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Loading } from '@/components/Loading';
import { StepCard, type StepDef } from '@/components/StepCard';
import { WeightModal } from '@/components/WeightModal';
import { colors, getAssignmentStatusColor, statusLabel, formatSlot, formatDateTime } from '@/lib/utils';
import { ArrowLeft, MapPin, User, Phone, Package, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PICKUP_STEPS: StepDef[] = [
  { key: 'IN_PROGRESS', label: 'Start Trip', description: 'Confirm you have started heading to the customer.', icon: '🚗' },
  { key: 'ARRIVED', label: 'Mark Arrived', description: 'Mark that you have arrived at the customer address.', icon: '📍' },
  { key: 'COMPLETED', label: 'Complete Pickup', description: 'Enter the laundry weight and confirm pickup.', icon: '✅', requiresWeight: true },
];

function getCurrentStepIndex(assignmentStatus: string, orderStatus?: string): number {
  if (assignmentStatus === 'COMPLETED') return 3;
  if (assignmentStatus === 'FAILED') return -2;
  if (assignmentStatus === 'IN_PROGRESS') {
    if (orderStatus && ['PICKUP_ARRIVED'].includes(orderStatus)) return 1;
    return 0;
  }
  return -1;
}

export default function PickupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeTask, fetchTaskById, updateStatus, updateWeight, isLoading, clearActiveTask } = useDeliveryStore();
  const [actionLoading, setActionLoading] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [pendingStep, setPendingStep] = useState<StepDef | null>(null);

  const load = useCallback(() => { fetchTaskById(Number(id), 'PICKUP'); }, [id, fetchTaskById]);
  useEffect(() => { load(); return () => clearActiveTask(); }, [load, clearActiveTask]);

  if (isLoading && !activeTask) return <Loading label="Loading task..." />;
  if (!activeTask) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.center}>
          <Text style={s.notFound}>Task not found.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.violet700, marginTop: 8 }}>← Back to Pickups</Text>
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
    if (step.requiresWeight) { setPendingStep(step); setShowWeightModal(true); return; }
    await executeStep(step, undefined);
  }

  async function executeStep(step: StepDef, weight: number | undefined) {
    setActionLoading(true);
    try {
      if (step.requiresWeight && weight !== undefined) await updateWeight(order.id, weight);
      await updateStatus(activeTask!.id, step.key);
      Alert.alert('Success', `${step.label} — done!`);
      await load();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading(false); setShowWeightModal(false); setPendingStep(null);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={16} color={colors.gray500} />
          <Text style={s.backText}>Back to Pickups</Text>
        </TouchableOpacity>

        {/* Order Header */}
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
                  <Text style={[s.infoValue, { color: colors.violet700 }]}>{order.customer.mobileNumber}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={s.addressBox}>
            <MapPin size={14} color={colors.gray400} />
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>Pickup Address</Text>
              <Text style={s.addressText}>
                {order.address.houseFlatNo}, {order.address.street}
                {order.address.landmark ? `, ${order.address.landmark}` : ''}, {order.address.city.name} — {order.address.pincode}
              </Text>
            </View>
          </View>

          {order.pickupSlot && (
            <View style={s.slotRow}>
              <Clock size={14} color={colors.gray400} />
              <Text style={s.slotText}>Scheduled: <Text style={{ fontWeight: '500', color: colors.violet700 }}>{formatSlot(order.pickupSlot.slotDate, order.pickupSlot.startTime, order.pickupSlot.endTime)}</Text></Text>
            </View>
          )}
          {order.initialWeight && (
            <View style={s.slotRow}>
              <Package size={14} color={colors.gray400} />
              <Text style={s.slotText}>Weight recorded: <Text style={{ fontWeight: '500' }}>{order.initialWeight} kg</Text></Text>
            </View>
          )}
        </Card>

        {/* Step Flow */}
        {!isDone && !isFailed && (
          <Card style={s.cardPad}>
            <Text style={s.sectionTitle}>Trip Steps</Text>
            <View style={{ gap: 10 }}>
              {PICKUP_STEPS.map((step, idx) => (
                <StepCard key={step.key} step={step} isDone={idx < currentStep + 1} isCurrent={idx === currentStep + 1} isLocked={idx > currentStep + 1} loading={actionLoading} onAction={() => handleStepAction(step)} />
              ))}
            </View>
          </Card>
        )}

        {isDone && (
          <Card style={[s.cardPad, { alignItems: 'center' }]}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🎉</Text>
            <Text style={s.doneTitle}>Pickup Completed!</Text>
            <Text style={s.doneSubtitle}>{activeTask.completedAt ? `Completed at ${formatDateTime(activeTask.completedAt)}` : 'Great job!'}</Text>
            <Button variant="secondary" style={{ marginTop: 16 }} onPress={() => router.back()}>Back to Pickups</Button>
          </Card>
        )}

        {isFailed && (
          <Card style={s.cardPad}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={22} color={colors.red500} />
              <View>
                <Text style={{ fontWeight: '600', color: colors.red700 }}>Pickup Failed</Text>
                <Text style={{ fontSize: 13, color: colors.gray500 }}>{activeTask.notes ?? 'This pickup was marked as failed.'}</Text>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>

      <WeightModal visible={showWeightModal} loading={actionLoading}
        onConfirm={(w) => pendingStep && executeStep(pendingStep, w)}
        onCancel={() => { setShowWeightModal(false); setPendingStep(null); }} />
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
});
