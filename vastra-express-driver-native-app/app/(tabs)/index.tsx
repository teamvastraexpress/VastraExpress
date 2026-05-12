import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useDeliveryStore } from '@/store/deliveryStore';
import { KpiCard } from '@/components/Card';
import { Loading } from '@/components/Loading';
import { TaskRow } from '@/components/TaskCard';
import { colors } from '@/lib/utils';
import { PackageSearch, Truck, CheckCircle2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { pickupTasks, deliveryTasks, fetchPickupTasks, fetchDeliveryTasks, isLoading } = useDeliveryStore();

  const load = useCallback(async () => {
    await Promise.all([fetchPickupTasks(), fetchDeliveryTasks()]);
  }, [fetchPickupTasks, fetchDeliveryTasks]);

  useEffect(() => { load(); }, [load]);

  const activePickups = pickupTasks.filter((t) => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status));
  const activeDeliveries = deliveryTasks.filter((t) => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status));
  const completedToday = [...pickupTasks, ...deliveryTasks].filter((t) => {
    if (t.status !== 'COMPLETED' || !t.completedAt) return false;
    return new Date(t.completedAt).toDateString() === new Date().toDateString();
  });

  const activeTasks = [
    ...activePickups.map((t) => ({ ...t, _type: 'PICKUP' as const })),
    ...activeDeliveries.map((t) => ({ ...t, _type: 'DELIVERY' as const })),
  ].slice(0, 8);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  if (isLoading && pickupTasks.length === 0 && deliveryTasks.length === 0) {
    return <Loading label="Loading your tasks..." />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} colors={[colors.violet700]} />}
      >
        {/* Header */}
        <Text style={styles.greeting}>
          Good {greeting}, {user?.name?.split(' ')[0] ?? 'Driver'} 👋
        </Text>
        <Text style={styles.sub}>Here's your task overview for today.</Text>

        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiItem}>
            <KpiCard label="Active Pickups" value={activePickups.length}
              icon={<PackageSearch size={20} color={colors.violet700} />}
              iconBg={colors.violet100} subtext="Assigned or in progress" />
          </View>
          <View style={styles.kpiItem}>
            <KpiCard label="Active Deliveries" value={activeDeliveries.length}
              icon={<Truck size={20} color={colors.emerald700} />}
              iconBg={colors.emerald100} subtext="Assigned or in progress" />
          </View>
        </View>
        <KpiCard label="Completed Today" value={completedToday.length}
          icon={<CheckCircle2 size={20} color={colors.blue700} />}
          iconBg={colors.blue100} subtext="Pickups + Deliveries" />

        {/* Active Tasks */}
        <View style={styles.taskSection}>
          <View style={styles.taskHeader}>
            <Text style={styles.taskTitle}>Current Tasks</Text>
            <View style={styles.links}>
              <TouchableOpacity onPress={() => router.push('/(tabs)/pickups')}>
                <Text style={styles.linkViolet}>All Pickups</Text>
              </TouchableOpacity>
              <Text style={styles.dot}>·</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/deliveries')}>
                <Text style={styles.linkGreen}>All Deliveries</Text>
              </TouchableOpacity>
            </View>
          </View>

          {activeTasks.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>No active tasks at the moment.</Text>
            </View>
          ) : (
            activeTasks.map((task) => (
              <TaskRow
                key={`${task.assignmentType}-${task.id}`}
                task={task}
                onPress={() => {
                  const path = task.assignmentType === 'PICKUP'
                    ? `/(tabs)/pickups/${task.id}`
                    : `/(tabs)/deliveries/${task.id}`;
                  router.push(path as any);
                }}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray50 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16 },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.gray900 },
  sub: { fontSize: 13, color: colors.gray500, marginTop: -8 },
  kpiRow: { flexDirection: 'row', gap: 12 },
  kpiItem: { flex: 1 },
  taskSection: { backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.gray200 },
  taskHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  taskTitle: { fontSize: 15, fontWeight: '600', color: colors.gray900 },
  links: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkViolet: { fontSize: 12, color: colors.violet700, fontWeight: '500' },
  linkGreen: { fontSize: 12, color: colors.emerald600, fontWeight: '500' },
  dot: { color: colors.gray300 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '500', color: colors.gray700 },
  emptySubtitle: { fontSize: 13, color: colors.gray400, marginTop: 4 },
});
