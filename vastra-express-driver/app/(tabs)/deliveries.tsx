import { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
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

export default function DeliveriesScreen() {
  const { deliveryTasks, fetchDeliveryTasks, isLoading } = useDeliveryStore();
  const [filter, setFilter] = useState<Filter>('active');

  useEffect(() => { fetchDeliveryTasks(); }, []);

  const filtered: DeliveryAssignment[] = deliveryTasks.filter((t) => {
    if (filter === 'active')    return ['ASSIGNED', 'IN_PROGRESS'].includes(t.status);
    if (filter === 'completed') return ['COMPLETED', 'FAILED'].includes(t.status);
    return true;
  });

  const activeCount = deliveryTasks.filter((t) => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-purple-700 px-6 pt-14 pb-5">
        <Text className="text-white text-xl font-bold">🚚 Delivery Tasks</Text>
        <Text className="text-purple-200 text-sm mt-0.5">
          {activeCount} active • {deliveryTasks.length} total
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
                ? 'bg-purple-700 border-purple-700'
                : 'bg-white border-gray-200'}`}
          >
            <Text className={`text-xs font-semibold ${filter === f.key ? 'text-white' : 'text-gray-600'}`}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && deliveryTasks.length === 0 ? (
        <LoadingSpinner label="Loading delivery tasks..." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <TaskCard assignment={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={() => fetchDeliveryTasks()} />
          }
          ListEmptyComponent={
            <EmptyState
              emoji="📭"
              title={filter === 'active' ? 'No active deliveries' : 'No tasks found'}
              subtitle={filter === 'active' ? 'You\'re all caught up!' : 'Try a different filter'}
            />
          }
        />
      )}
    </View>
  );
}
