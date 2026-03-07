'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor, statusLabel, getApiError } from '@/lib/utils';
import { KpiCard, Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import dynamic from 'next/dynamic';
import {
  ShoppingBag,
  IndianRupee,
  Users,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import type { DashboardSummary, Order } from '@/types';
import toast from 'react-hot-toast';

const DashboardCharts = dynamic(
  () => import('@/components/ui/DashboardCharts'),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <div className="h-[280px] animate-pulse bg-gray-100 rounded-xl" />
        <div className="h-[230px] animate-pulse bg-gray-100 rounded-xl" />
      </div>
    ),
  }
);

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const [summaryRes, ordersRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/orders?page=1&limit=10'),
      ]);
      setSummary(summaryRes.data);
      setRecentOrders(ordersRes.data.data ?? ordersRes.data);
      setLastUpdated(new Date());
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30_000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back! Here&apos;s what&apos;s happening today.
          {lastUpdated && <span className="ml-2 text-xs text-gray-400">· Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Today's Orders"
          value={summary?.todayOrders ?? 0}
          icon={<ShoppingBag className="w-5 h-5" />}
          color="blue"
        />
        <KpiCard
          title="Monthly Revenue"
          value={formatCurrency(summary?.monthlyRevenue ?? 0)}
          icon={<IndianRupee className="w-5 h-5" />}
          color="green"
        />
        <KpiCard
          title="Total Customers"
          value={summary?.totalCustomers ?? 0}
          icon={<Users className="w-5 h-5" />}
          color="purple"
        />
        <KpiCard
          title="Pending Deliveries"
          value={summary?.pendingDeliveries ?? 0}
          icon={<Truck className="w-5 h-5" />}
          color="yellow"
        />
      </div>

      {/* Charts — lazily loaded so recharts (~600 KB) doesn't slow webpack rebuilds */}
      {summary && <DashboardCharts summary={summary} />}

      {/* Recent orders */}
      <Card padding={false}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent Orders</h3>
          <Link href="/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No orders yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order #</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs font-medium text-gray-700">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      {order.customer?.name ?? `#${order.customerId}`}
                    </td>
                    <td className="px-6 py-3">
                      <Badge className={getStatusColor(order.currentStatus)}>
                        {statusLabel(order.currentStatus)}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {statusLabel(order.serviceType)}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-xs"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
