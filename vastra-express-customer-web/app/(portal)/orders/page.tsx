'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOrderStore } from '@/store/orderStore';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const initTab = (searchParams.get('tab') as Tab) ?? 'all';
  const [tab, setTab] = useState<Tab>(initTab);
  const [spinning, setSpinning] = useState(false);
  const { orders, isLoading, fetchOrders } = useOrderStore();

  useEffect(() => {
    fetchOrders({ page: 1, limit: 50 });
  }, [fetchOrders]);

  const tabOrders: Order[] = (() => {
    if (tab === 'active') return orders.filter((o) => ACTIVE_STATUSES.includes(o.currentStatus));
    if (tab === 'completed') return orders.filter((o) => DONE_STATUSES.includes(o.currentStatus));
    return orders;
  })();

  async function handleRefresh() {
    setSpinning(true);
    await fetchOrders({ page: 1, limit: 50 });
    setSpinning(false);
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: orders.length },
    { key: 'active', label: 'Active', count: orders.filter((o) => ACTIVE_STATUSES.includes(o.currentStatus)).length },
    { key: 'completed', label: 'Completed', count: orders.filter((o) => DONE_STATUSES.includes(o.currentStatus)).length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{orders.length} total orders</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-all ${
              tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Order List */}
      {isLoading ? (
        <Loading />
      ) : tabOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-700 font-medium mb-1">No {tab !== 'all' ? tab : ''} orders found</p>
          <p className="text-sm text-gray-500">
            {tab === 'active' ? 'You have no active orders right now.' : 'Book a pickup to get started!'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tabOrders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl shrink-0">
                      👕
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{order.orderNumber}</p>
                        {order.isExpress && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md font-medium">
                            Express
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {serviceLabel(order.serviceType)} · {formatDate(order.createdAt)}
                      </p>
                      {order.address && (
                        <p className="text-xs text-gray-400 truncate">
                          📍 {order.address.street}, {order.address.city?.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-3 shrink-0">
                    <Badge variant={getStatusColor(order.currentStatus)} size="sm">
                      {statusLabel(order.currentStatus)}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
