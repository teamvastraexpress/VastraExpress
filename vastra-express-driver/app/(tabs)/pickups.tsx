import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, RefreshControl,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { useDeliveryStore } from '@/store/deliveryStore';
import { TaskCard } from '@/components/TaskCard';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { DeliveryAssignment } from '@/types';

type Filter = 'active' | 'completed' | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'active',    label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'all',       label: 'All' },
];

export default function PickupsScreen() {
  const { pickupTasks, fetchPickupTasks, isLoading } = useDeliveryStore();
  const [filter, setFilter] = useState<Filter>('active');

  useEffect(() => { fetchPickupTasks(); }, []);

  const filtered: DeliveryAssignment[] = pickupTasks.filter((t) => {
    if (filter === 'active')    return ['ASSIGNED', 'IN_PROGRESS'].includes(t.status);
    if (filter === 'completed') return ['COMPLETED', 'FAILED'].includes(t.status);
    return true;
  });

  const activeCount = pickupTasks.filter((t) => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-primary-700 px-6 pt-14 pb-5">
        <Text className="text-white text-xl font-bold">📦 Pickup Tasks</Text>
        <Text className="text-blue-200 text-sm mt-0.5">
          {activeCount} active • {pickupTasks.length} total
        </Text>
      </View>

      {/* Filter tabs */}
      <View className="flex-row bg-white px-4 pt-3 pb-2 border-b border-gray-100">
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            className={`mr-2 px-4 py-1.5 rounded-full border
              ${filter === f.key
                ? 'bg-primary-700 border-primary-700'
                : 'bg-white border-gray-200'}`}
          >
            <Text className={`text-xs font-semibold ${filter === f.key ? 'text-white' : 'text-gray-600'}`}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task list */}
      {isLoading && pickupTasks.length === 0 ? (
        <LoadingSpinner label="Loading pickup tasks..." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <TaskCard assignment={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={() => fetchPickupTasks()} />
          }
          ListEmptyComponent={
            <EmptyState
              emoji="📭"
              title={filter === 'active' ? 'No active pickups' : 'No tasks found'}
              subtitle={filter === 'active' ? 'You\'re all caught up!' : 'Try a different filter'}
            />
          }
        />
      )}
    </View>
  );
}
