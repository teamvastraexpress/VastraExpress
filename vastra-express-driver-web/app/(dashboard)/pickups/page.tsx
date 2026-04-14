'use client';

import { Suspense, useEffect, useCallback, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useDeliveryStore } from '@/store/deliveryStore';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { cn, getAssignmentStatusColor, statusLabel, formatSlot } from '@/lib/utils';
import { PackageSearch, ArrowRight, RefreshCw } from 'lucide-react';
import type { DeliveryAssignment } from '@/types';

type Filter = 'active' | 'completed' | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

function TaskCard({ task }: { task: DeliveryAssignment }) {
  const slot = task.order.pickupSlot;
  return (
    <Link
      href={`/pickups/${task.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-violet-200 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900 text-sm">{task.order.orderNumber}</p>
            {task.order.isExpress && (
              <Badge className="bg-orange-100 text-orange-700">Express</Badge>
            )}
            <Badge className={getAssignmentStatusColor(task.status)}>
              {statusLabel(task.status)}
            </Badge>
          </div>
          <p className="text-sm text-gray-700 font-medium truncate">
            {task.order.customer.name ?? task.order.customer.mobileNumber}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {task.order.address.houseFlatNo}, {task.order.address.street}
            {task.order.address.landmark ? `, ${task.order.address.landmark}` : ''},{' '}
            {task.order.address.city.name} — {task.order.address.pincode}
          </p>
          {slot && (
            <p className="text-xs text-violet-600 font-medium mt-1.5">
              🕐 {formatSlot(slot.slotDate, slot.startTime, slot.endTime)}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Service: {task.order.serviceType.replace(/_/g, ' ')}
            {task.order.initialWeight ? ` • ${task.order.initialWeight} kg` : ''}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 transition-colors flex-shrink-0 mt-1" />
      </div>
    </Link>
  );
}

function PickupsPageContent() {
  const searchParams = useSearchParams();
  const { pickupTasks, fetchPickupTasks, isLoading } = useDeliveryStore();
  const [filter, setFilter] = useState<Filter>(
    (searchParams.get('filter') as Filter) ?? 'active'
  );

  const load = useCallback(() => fetchPickupTasks(), [fetchPickupTasks]);
  useEffect(() => { load(); }, [load]);

  const filtered: DeliveryAssignment[] = pickupTasks.filter((t) => {
    if (filter === 'active') return ['ASSIGNED', 'IN_PROGRESS'].includes(t.status);
    if (filter === 'completed') return ['COMPLETED', 'FAILED'].includes(t.status);
    return true;
  });

  const activeCount = pickupTasks.filter((t) =>
    ['ASSIGNED', 'IN_PROGRESS'].includes(t.status)
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PackageSearch className="w-6 h-6 text-violet-700" />
            Pickup Tasks
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeCount} active · {pickupTasks.length} total
          </p>
        </div>
        <button
          onClick={load}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4 text-gray-500', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
              filter === f.key
                ? 'bg-violet-700 text-white border-violet-700'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      {isLoading && pickupTasks.length === 0 ? (
        <Loading label="Loading pickup tasks..." />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="font-medium text-gray-700">
            {filter === 'active' ? 'No active pickups' : 'No tasks found'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {filter === 'active' ? "You're all caught up!" : 'Try a different filter.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PickupsPage() {
  return (
    <Suspense fallback={<Loading label="Loading pickup tasks..." />}>
      <PickupsPageContent />
    </Suspense>
  );
}
