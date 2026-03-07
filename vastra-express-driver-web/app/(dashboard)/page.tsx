'use client';

import { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useDeliveryStore } from '@/store/deliveryStore';
import { KpiCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { getAssignmentStatusColor, statusLabel, formatSlot } from '@/lib/utils';
import { PackageSearch, Truck, CheckCircle2, ArrowRight } from 'lucide-react';
import type { DeliveryAssignment } from '@/types';

function TaskRow({ task }: { task: DeliveryAssignment }) {
  const isPickup = task.assignmentType === 'PICKUP';
  const href = isPickup ? `/pickups/${task.id}` : `/deliveries/${task.id}`;
  const slot = task.order.pickupSlot;

  return (
    <Link
      href={href}
      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors group"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isPickup ? 'bg-violet-100' : 'bg-emerald-100'}`}>
        {isPickup
          ? <PackageSearch className="w-4 h-4 text-violet-700" />
          : <Truck className="w-4 h-4 text-emerald-700" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {task.order.orderNumber}
          </p>
          <Badge className={getAssignmentStatusColor(task.status)}>
            {statusLabel(task.status)}
          </Badge>
        </div>
        <p className="text-xs text-gray-500 truncate">
          {task.order.customer.name ?? task.order.customer.mobileNumber} •{' '}
          {task.order.address.street}, {task.order.address.city.name}
        </p>
        {slot && (
          <p className="text-xs text-gray-400 mt-0.5">
            🕐 {formatSlot(slot.slotDate, slot.startTime, slot.endTime)}
          </p>
        )}
      </div>
      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { pickupTasks, deliveryTasks, fetchPickupTasks, fetchDeliveryTasks, isLoading } =
    useDeliveryStore();

  const load = useCallback(async () => {
    await Promise.all([fetchPickupTasks(), fetchDeliveryTasks()]);
  }, [fetchPickupTasks, fetchDeliveryTasks]);

  useEffect(() => { load(); }, [load]);

  const activePickups = pickupTasks.filter((t) =>
    ['ASSIGNED', 'IN_PROGRESS'].includes(t.status)
  );
  const activeDeliveries = deliveryTasks.filter((t) =>
    ['ASSIGNED', 'IN_PROGRESS'].includes(t.status)
  );
  const completedToday = [...pickupTasks, ...deliveryTasks].filter((t) => {
    if (t.status !== 'COMPLETED') return false;
    if (!t.completedAt) return false;
    return new Date(t.completedAt).toDateString() === new Date().toDateString();
  });

  const activeTasks = [
    ...activePickups.map((t) => ({ ...t, _type: 'PICKUP' as const })),
    ...activeDeliveries.map((t) => ({ ...t, _type: 'DELIVERY' as const })),
  ].slice(0, 8);

  if (isLoading && pickupTasks.length === 0 && deliveryTasks.length === 0) {
    return <Loading label="Loading your tasks..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          {user?.name?.split(' ')[0] ?? 'Driver'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Here's your task overview for today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Active Pickups"
          value={activePickups.length}
          icon={<PackageSearch className="w-5 h-5" />}
          colorClass="bg-violet-100 text-violet-700"
          subtext="Assigned or in progress"
        />
        <KpiCard
          label="Active Deliveries"
          value={activeDeliveries.length}
          icon={<Truck className="w-5 h-5" />}
          colorClass="bg-emerald-100 text-emerald-700"
          subtext="Assigned or in progress"
        />
        <KpiCard
          label="Completed Today"
          value={completedToday.length}
          icon={<CheckCircle2 className="w-5 h-5" />}
          colorClass="bg-blue-100 text-blue-700"
          subtext="Pickups + Deliveries"
        />
      </div>

      {/* Active Tasks */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Current Tasks</h2>
          <div className="flex gap-2">
            <Link
              href="/pickups"
              className="text-xs text-violet-600 hover:text-violet-800 font-medium"
            >
              All Pickups
            </Link>
            <span className="text-gray-300">·</span>
            <Link
              href="/deliveries"
              className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
            >
              All Deliveries
            </Link>
          </div>
        </div>

        {activeTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-700 font-medium">All caught up!</p>
            <p className="text-sm text-gray-400 mt-1">No active tasks at the moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 p-2">
            {activeTasks.map((task) => (
              <TaskRow key={`${task.assignmentType}-${task.id}`} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
