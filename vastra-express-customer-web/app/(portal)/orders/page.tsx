'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useOrderStore } from '@/store/orderStore';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { statusLabel, getStatusColor, formatDate, serviceLabel } from '@/lib/utils';
import { RefreshCw, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Order } from '@/types';

type Tab = 'active' | 'completed' | 'all';

const ACTIVE_STATUSES = [
  'ORDER_CREATED', 'ORDER_CONFIRMED', 'PICKUP_SCHEDULED', 'PICKUP_ASSIGNED',
  'OUT_FOR_PICKUP', 'PICKUP_ARRIVED', 'PICKED_UP', 'RECEIVED_AT_FACILITY',
  'SORTING', 'WASHING', 'IRONING', 'PACKING',
  'READY_FOR_DISPATCH', 'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERY_ARRIVED',
];
const DONE_STATUSES = ['DELIVERED', 'CANCELLED', 'FAILED'];

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const initTab = (searchParams.get('tab') as Tab) ?? 'all';
  const [tab,      setTab]      = useState<Tab>(initTab);
  const [spinning, setSpinning] = useState(false);
  const { orders, isLoading, fetchOrders } = useOrderStore();

  useEffect(() => { fetchOrders({ page: 1, limit: 50 }); }, [fetchOrders]);

  const tabOrders: Order[] = (() => {
    if (tab === 'active')    return orders.filter((o) => ACTIVE_STATUSES.includes(o.currentStatus));
    if (tab === 'completed') return orders.filter((o) => DONE_STATUSES.includes(o.currentStatus));
    return orders;
  })();

  async function handleRefresh() {
    setSpinning(true);
    await fetchOrders({ page: 1, limit: 50 });
    setSpinning(false);
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all',       label: 'All',       count: orders.length },
    { key: 'active',    label: 'Active',    count: orders.filter((o) => ACTIVE_STATUSES.includes(o.currentStatus)).length },
    { key: 'completed', label: 'Completed', count: orders.filter((o) => DONE_STATUSES.includes(o.currentStatus)).length },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
          >
            My Orders
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
            {orders.length} total order{orders.length !== 1 ? 's' : ''}
          </p>
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

      {/* ── Tabs ── */}
      <div
        className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: '#F0F8FF', border: '1px solid #A8D8F0' }}
      >
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-1.5 text-sm rounded-lg font-medium transition-all duration-200"
              style={{
                background:  active ? 'white'    : 'transparent',
                color:       active ? '#1B2A3B'  : '#8FA3B1',
                boxShadow:   active ? '0 1px 4px rgba(26,111,196,0.10)' : 'none',
                fontFamily: 'var(--font-ui)',
              }}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    background: active ? '#E8F4FB' : 'rgba(168,216,240,0.3)',
                    color:      active ? '#1A6FC4' : '#8FA3B1',
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── List ── */}
      {isLoading ? (
        <Loading />
      ) : tabOrders.length === 0 ? (
        <div
          className="p-12 rounded-2xl text-center"
          style={{
            background: 'white',
            border: '1px solid #A8D8F0',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          <div className="text-5xl mb-3">📭</div>
          <p
            className="font-semibold mb-1"
            style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
          >
            No {tab !== 'all' ? tab : ''} orders found
          </p>
          <p className="text-sm" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
            {tab === 'active' ? 'You have no active orders right now.' : 'Book a pickup to get started!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tabOrders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <div
                className="flex items-center justify-between p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                style={{
                  background: 'white',
                  border: '1px solid rgba(168,216,240,0.4)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: '#E8F4FB' }}
                  >
                    👕
                  </div>

                  {/* Text */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className="font-semibold text-sm"
                        style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
                      >
                        {order.orderNumber}
                      </p>
                      {order.isExpress && (
                        <span
                          className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                          style={{ background: '#FFF7ED', color: '#f97316', border: '1px solid #fed7aa' }}
                        >
                          ⚡ Express
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs truncate mt-0.5"
                      style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}
                    >
                      {serviceLabel(order.serviceType)} · {formatDate(order.createdAt)}
                    </p>
                    {order.address && (
                      <p
                        className="text-xs truncate mt-0.5"
                        style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}
                      >
                        📍 {order.address.street}, {order.address.city?.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: badge + arrow */}
                <div className="flex items-center gap-2.5 ml-3 shrink-0">
                  <Badge variant={getStatusColor(order.currentStatus)} size="sm">
                    {statusLabel(order.currentStatus)}
                  </Badge>
                  <ArrowRight className="w-4 h-4" style={{ color: '#8FA3B1' }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
