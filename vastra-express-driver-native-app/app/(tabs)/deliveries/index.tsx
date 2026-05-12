import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useDeliveryStore } from '@/store/deliveryStore';
import { Loading } from '@/components/Loading';
import { TaskCard } from '@/components/TaskCard';
import { colors } from '@/lib/utils';
import { Truck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { DeliveryAssignment } from '@/types';

type Filter = 'active' | 'completed' | 'all';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

export default function DeliveriesListScreen() {
  const { deliveryTasks, fetchDeliveryTasks, isLoading } = useDeliveryStore();
  const [filter, setFilter] = useState<Filter>('active');

  const load = useCallback(() => fetchDeliveryTasks(), [fetchDeliveryTasks]);
  useEffect(() => { load(); }, [load]);

  const filtered: DeliveryAssignment[] = deliveryTasks.filter((t) => {
    if (filter === 'active') return ['ASSIGNED', 'IN_PROGRESS'].includes(t.status);
    if (filter === 'completed') return ['COMPLETED', 'FAILED'].includes(t.status);
    return true;
  });

  const activeCount = deliveryTasks.filter((t) => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} colors={[colors.emerald600]} />}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Truck size={22} color={colors.emerald600} />
            <Text style={styles.title}>Delivery Tasks</Text>
          </View>
          <Text style={styles.subtitle}>{activeCount} active · {deliveryTasks.length} total</Text>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)}
              style={[styles.filterBtn, filter === f.key && styles.filterActive]}>
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading && deliveryTasks.length === 0 ? (
          <Loading label="Loading delivery tasks..." />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>{filter === 'active' ? 'No active deliveries' : 'No tasks found'}</Text>
            <Text style={styles.emptySubtitle}>{filter === 'active' ? "You're all caught up!" : 'Try a different filter.'}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((task) => (
              <TaskCard key={task.id} task={task}
                onPress={() => router.push(`/(tabs)/deliveries/${task.id}` as any)} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray50 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16 },
  header: {},
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '700', color: colors.gray900 },
  subtitle: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.gray200, backgroundColor: colors.white },
  filterActive: { backgroundColor: colors.emerald600, borderColor: colors.emerald600 },
  filterText: { fontSize: 13, fontWeight: '500', color: colors.gray600 },
  filterTextActive: { color: colors.white },
  list: { gap: 12 },
  empty: { alignItems: 'center', paddingVertical: 64 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '500', color: colors.gray700 },
  emptySubtitle: { fontSize: 13, color: colors.gray400, marginTop: 4 },
});
