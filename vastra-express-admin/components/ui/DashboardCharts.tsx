'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { TrendingUp, ShoppingBag } from 'lucide-react';
import { formatCurrency, formatDate, statusLabel } from '@/lib/utils';
import type { DashboardSummary } from '@/types';

const PIE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
];

function serviceLabel(key: string) {
  const map: Record<string, string> = {
    STANDARD_WASH: 'Standard Wash',
    EXPRESS_WASH: 'Express Wash',
    DRY_CLEAN: 'Dry Clean',
    IRON_ONLY: 'Iron Only',
    WASH_AND_IRON: 'Wash & Iron',
    PREMIUM: 'Premium',
  };
  return map[key] ?? key.replace(/_/g, ' ');
}

export default function DashboardCharts({ summary }: { summary: DashboardSummary }) {
  return (
    <>
      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue trend */}
        <Card className="xl:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Revenue Trend (Last 7 days)</h3>
          </div>
          {summary?.revenueByDay?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={summary.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => formatDate(d, { day: '2-digit', month: 'short' })}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v) => formatCurrency(v as number)} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              No revenue data yet
            </div>
          )}
        </Card>

        {/* Service type pie chart */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-5">Service Type Distribution</h3>
          {summary?.ordersByServiceType?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={summary.ordersByServiceType}
                  dataKey="count"
                  nameKey="serviceType"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${serviceLabel(name ?? '')} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {summary.ordersByServiceType.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, serviceLabel(n as string)]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              No data yet
            </div>
          )}
        </Card>
      </div>

      {/* Orders per day bar chart */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <ShoppingBag className="w-4 h-4 text-emerald-600" />
          <h3 className="font-semibold text-gray-900">Orders per Day (Last 7 days)</h3>
        </div>
        {summary?.ordersByDay?.length ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={summary.ordersByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => formatDate(d, { day: '2-digit', month: 'short' })}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                labelFormatter={(d) => formatDate(d as string, { weekday: 'short', day: '2-digit', month: 'short' })}
                formatter={(v) => [v, 'Orders']}
              />
              <Bar dataKey="count" name="Orders" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">
            No order data yet
          </div>
        )}
      </Card>
    </>
  );
}
