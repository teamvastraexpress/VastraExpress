'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatCurrency, getApiError } from '@/lib/utils';
import { Card, KpiCard } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  ShoppingBag,
  CheckCircle2,
  Truck,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import type { DashboardSummary } from '@/types';

const PIE_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
];

// Processing stage labels for facility view
const FACILITY_STATUS_LABELS: Record<string, string> = {
  RECEIVED_AT_FACILITY: 'Received',
  SORTING:              'Sorting',
  WASHING:              'Washing',
  IRONING:              'Ironing',
  PACKING:              'Packing',
  BILL_GENERATED:       'Billed',
  READY_FOR_DISPATCH:   'Ready',
  DELIVERY_ASSIGNED:    'Dispatched',
  DELIVERED:            'Delivered',
};

export default function ReportsPage() {
  const [summary, setSummary]   = useState<DashboardSummary | null>(null);
  const [loading, setLoading]   = useState(true);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard');
      setSummary(res.data);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  if (loading) return <Loading />;

  // Format revenue by day for chart
  const revenueData = (summary?.revenueByDay ?? []).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    revenue: d.revenue,
  }));

  // Format status distribution — filter to facility-relevant statuses
  const statusData = (summary?.ordersByStatus ?? [])
    .filter((s) => FACILITY_STATUS_LABELS[s.status])
    .map((s) => ({
      name: FACILITY_STATUS_LABELS[s.status] ?? s.status,
      value: s.count,
    }));

  // Service type data
  const serviceData = (summary?.ordersByServiceType ?? []).map((s) => ({
    name: s.serviceType.replace(/_/g, ' '),
    orders: s.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Facility performance overview</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={loadReports}
        >
          Refresh
        </Button>
      </div>

      {/* KPIs */}
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
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <KpiCard
          title="Pending Deliveries"
          value={summary?.pendingDeliveries ?? 0}
          icon={<Truck className="w-5 h-5" />}
          color="yellow"
        />
        <KpiCard
          title="Orders Processed"
          value={summary?.totalProcessed ?? (summary?.todayOrders ?? 0)}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Revenue Chart */}
      <Card>
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Revenue – Last 30 Days
        </h2>
        {revenueData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No revenue data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Status + Service charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Order status distribution */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Orders by Processing Stage
          </h2>
          {statusData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {statusData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Service type distribution */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Orders by Service Type
          </h2>
          {serviceData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={serviceData} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="orders" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Summary table */}
      <Card>
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Order Status Breakdown
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-600">Count</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-600">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(summary?.ordersByStatus ?? []).map((row) => {
                const total = summary?.ordersByStatus.reduce((s, r) => s + r.count, 0) || 1;
                return (
                  <tr key={row.status} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">
                      {row.status.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-900">{row.count}</td>
                    <td className="px-4 py-2 text-right text-gray-500">
                      {((row.count / total) * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
