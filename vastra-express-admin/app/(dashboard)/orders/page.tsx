'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatDate, getStatusColor, statusLabel, getApiError } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { TableSkeleton } from '@/components/ui/Loading';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Order, OrderStatus } from '@/types';
import toast from 'react-hot-toast';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'ORDER_CREATED', label: 'Order Created' },
  { value: 'ORDER_CONFIRMED', label: 'Confirmed' },
  { value: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled' },
  { value: 'PICKUP_ASSIGNED', label: 'Pickup Assigned' },
  { value: 'OUT_FOR_PICKUP', label: 'Out for Pickup' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'PICKUP_FAILED', label: 'Pickup Failed' },
  { value: 'RECEIVED_AT_FACILITY', label: 'At Facility' },
  { value: 'SORTING', label: 'Sorting' },
  { value: 'WASHING', label: 'Washing' },
  { value: 'IRONING', label: 'Ironing' },
  { value: 'PACKING', label: 'Packing' },
  { value: 'READY_FOR_DISPATCH', label: 'Ready for Dispatch' },
  { value: 'DELIVERY_ASSIGNED', label: 'Delivery Assigned' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'DELIVERY_FAILED', label: 'Delivery Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const LIMIT = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(status && { status }),
      });
      const res = await api.get(`/orders?${params}`);
      const body = res.data;
      setOrders(body.data ?? body);
      setTotal(body.total ?? body.length ?? 0);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage all customer orders</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Select
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              placeholder=""
            />
          </div>
          <Button variant="outline" onClick={fetchOrders} loading={loading}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            {total} order{total !== 1 ? 's' : ''}
          </h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6"><TableSkeleton rows={8} cols={6} /></div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No orders found</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Order #', 'Customer', 'Service', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs font-medium text-gray-700 whitespace-nowrap">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      {order.customer?.name ?? `User #${order.customerId}`}
                    </td>
                    <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                      {statusLabel(order.serviceType)}
                      {order.isExpress && (
                        <span className="ml-1.5 text-xs text-orange-500 font-medium">Express</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <Badge className={getStatusColor(order.currentStatus)}>
                        {statusLabel(order.currentStatus)}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
