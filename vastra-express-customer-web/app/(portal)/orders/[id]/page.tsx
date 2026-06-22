'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { useOrderStore } from '@/store/orderStore';
import {
  ORDER_STEPS,
  cn,
  formatDate,
  formatDateTime,
  formatSlot,
  getOrderStepIndex,
  getStatusColor,
  serviceLabel,
  statusLabel,
} from '@/lib/utils';
import type { OrderStatusHistory } from '@/types';

function getHistoryTimestamp(history?: OrderStatusHistory) {
  if (!history) return null;
  return history.changedAt ?? history.createdAt ?? null;
}

export default function OrderFlowPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentOrder, isLoading, fetchOrderById, clearCurrent } = useOrderStore();
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderById(String(id));
    }
    return () => clearCurrent();
  }, [id, fetchOrderById, clearCurrent]);

  const order = currentOrder;
  const currentStepIndex = useMemo(
    () => (order ? getOrderStepIndex(order.currentStatus) : 0),
    [order],
  );

  const stepHistoryLookup = useMemo(() => {
    const map = new Map<string, OrderStatusHistory>();
    if (!order?.statusHistory) return map;

    ORDER_STEPS.forEach((step) => {
      const entry = order.statusHistory?.find((history) => step.statuses.includes(history.status));
      if (entry) map.set(step.label, entry);
    });

    return map;
  }, [order]);

  async function handleRefresh() {
    if (!id) return;
    setSpinning(true);
    await fetchOrderById(String(id));
    setSpinning(false);
  }

  if (isLoading) return <Loading />;
  if (!order) {
    return (
      <div className="rounded-2xl border border-[#A8D8F0] bg-white p-8 text-center">
        <p className="text-base font-semibold" style={{ color: '#1B2A3B' }}>
          Order not found
        </p>
        <p className="text-sm mt-2" style={{ color: '#8FA3B1' }}>
          Please refresh or return to My Orders.
        </p>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push('/orders')}>
            Back to My Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div>
            <p className="text-xs font-semibold" style={{ color: '#8FA3B1' }}>
              Order #{order.orderNumber}
            </p>
            <h1
              className="text-xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
            >
              Order Flow
            </h1>
            <p className="text-xs" style={{ color: '#8FA3B1' }}>
              Placed {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: 'white',
            border: '1px solid #A8D8F0',
            color: '#4A5A6B',
            fontFamily: 'var(--font-ui)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} style={{ color: '#1A6FC4' }} />
          Refresh
        </button>
      </div>

      <Card className="p-5" variant="outline">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor(order.currentStatus)} size="sm">
              {statusLabel(order.currentStatus)}
            </Badge>
            {order.isExpress && (
              <Badge variant="warning" size="sm">
                Express
              </Badge>
            )}
          </div>
          <p className="text-xs" style={{ color: '#8FA3B1' }}>
            Last updated {formatDateTime(order.updatedAt)}
          </p>
        </div>
        {order.serviceType === 'SOFA_CLEANING' && (
          <div
            className="mt-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3 text-xs"
            style={{ color: '#92400E' }}
          >
            This is a special request. The store will review availability and confirm or decline the request.
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5" variant="outline">
            <div className="flex items-center justify-between">
              <h2
                className="text-base font-semibold"
                style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
              >
                Tracking Timeline
              </h2>
              <Badge variant="sky" size="sm">
                Step {currentStepIndex + 1} of {ORDER_STEPS.length}
              </Badge>
            </div>

            <div className="mt-5 space-y-4">
              {ORDER_STEPS.map((step, index) => {
                const isDone = index <= currentStepIndex;
                const isLast = index === ORDER_STEPS.length - 1;
                const history = stepHistoryLookup.get(step.label);
                const historyTimestamp = getHistoryTimestamp(history);

                return (
                  <div key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold',
                          isDone ? 'bg-[#1A6FC4] text-white' : 'bg-[#E8F4FB] text-[#8FA3B1]',
                        )}
                      >
                        {index + 1}
                      </div>
                      {!isLast && (
                        <div
                          className={cn(
                            'w-0.5 flex-1 min-h-6',
                            isDone ? 'bg-[#A8D8F0]' : 'bg-[#E8F4FB]',
                          )}
                        />
                      )}
                    </div>
                    <div className={cn('flex-1', !isLast && 'pb-4')}>
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          isDone ? 'text-[#1B2A3B]' : 'text-[#8FA3B1]',
                        )}
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        {step.label}
                      </p>
                      {historyTimestamp && (
                        <p className="text-xs mt-1" style={{ color: '#8FA3B1' }}>
                          {formatDateTime(historyTimestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {order.statusHistory && order.statusHistory.length > 0 && (
            <Card className="p-5" variant="outline">
              <h2
                className="text-base font-semibold"
                style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
              >
                Status History
              </h2>
              <ol className="mt-4 space-y-3">
                {[...order.statusHistory].reverse().map((entry) => (
                  <li key={entry.id} className="rounded-xl border border-[#E8F4FB] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant={getStatusColor(entry.status)} size="sm">
                        {statusLabel(entry.status)}
                      </Badge>
                      <span className="text-xs" style={{ color: '#8FA3B1' }}>
                        {formatDateTime(
                          entry.changedAt ?? entry.createdAt ?? order.updatedAt,
                        )}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-xs mt-2" style={{ color: '#4A5A6B' }}>
                        {entry.notes}
                      </p>
                    )}
                    {entry.changedBy && (
                      <p className="text-[11px] mt-2" style={{ color: '#8FA3B1' }}>
                        Updated by {entry.changedBy.name ?? entry.changedBy.role}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-5" variant="outline">
            <h2
              className="text-base font-semibold"
              style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
            >
              Order Details
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs uppercase" style={{ color: '#8FA3B1' }}>Service</span>
                <span className="font-semibold" style={{ color: '#1B2A3B' }}>
                  {serviceLabel(order.serviceType)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs uppercase" style={{ color: '#8FA3B1' }}>Pickup Slot</span>
                <span className="text-right" style={{ color: '#1B2A3B' }}>
                  {order.pickupSlot
                    ? formatSlot(order.pickupSlot)
                    : '—'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs uppercase" style={{ color: '#8FA3B1' }}>Express</span>
                <span style={{ color: '#1B2A3B' }}>{order.isExpress ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs uppercase" style={{ color: '#8FA3B1' }}>Initial Weight</span>
                <span style={{ color: '#1B2A3B' }}>
                  {order.initialWeight ? `${order.initialWeight} kg` : '—'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs uppercase" style={{ color: '#8FA3B1' }}>Final Weight</span>
                <span style={{ color: '#1B2A3B' }}>
                  {order.finalWeight ? `${order.finalWeight} kg` : '—'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs uppercase" style={{ color: '#8FA3B1' }}>Payment</span>
                <span style={{ color: '#1B2A3B' }}>{order.paymentMethod ?? '—'}</span>
              </div>
            </div>

            {order.notes && (
              <div className="mt-4 border-t border-[#E8F4FB] pt-4">
                <p className="text-xs uppercase" style={{ color: '#8FA3B1' }}>Notes</p>
                <p className="text-sm mt-1" style={{ color: '#1B2A3B' }}>
                  {order.notes}
                </p>
              </div>
            )}
          </Card>

          {order.address && (
            <Card className="p-5" variant="outline">
              <h2
                className="text-base font-semibold"
                style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
              >
                Pickup Address
              </h2>
              <p className="text-sm mt-3" style={{ color: '#4A5A6B' }}>
                {order.address.houseFlatNo}, {order.address.street}
                {order.address.landmark ? `, ${order.address.landmark}` : ''}
                {order.address.city?.name ? `, ${order.address.city.name}` : ''}
                {order.address.pincode ? ` - ${order.address.pincode}` : ''}
              </p>
            </Card>
          )}

          {order.facility && (
            <Card className="p-5" variant="outline">
              <h2
                className="text-base font-semibold"
                style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
              >
                Store
              </h2>
              <p className="text-sm mt-3" style={{ color: '#4A5A6B' }}>
                {order.facility.name}
              </p>
              {order.facility.contactNumber && (
                <p className="text-xs mt-2" style={{ color: '#8FA3B1' }}>
                  Contact: {order.facility.contactNumber}
                </p>
              )}
            </Card>
          )}

          <Card className="p-5" variant="outline">
            <h2
              className="text-base font-semibold"
              style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
            >
              Timeline
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase" style={{ color: '#8FA3B1' }}>Created</span>
                <span style={{ color: '#1B2A3B' }}>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase" style={{ color: '#8FA3B1' }}>Last Updated</span>
                <span style={{ color: '#1B2A3B' }}>{formatDate(order.updatedAt)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
