'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatDate, statusLabel } from '@/lib/utils';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

type RevenueData = {
  byServiceType?: { serviceType: string; revenue: number }[];
  byPaymentMethod?: { method: string; revenue: number }[];
};

type OrdersData = {
  byStatus?: { status: string; count: number }[];
  dailyVolume?: { date: string; count: number }[];
};

interface ReportsChartsProps {
  revenue: RevenueData | null;
  orders: OrdersData | null;
}

export default function ReportsCharts({ revenue, orders }: ReportsChartsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Revenue by service type */}
      {revenue?.byServiceType?.length ? (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-5">Revenue by Service Type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenue.byServiceType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="serviceType" tickFormatter={statusLabel} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v) => formatCurrency(v as number)} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      ) : null}

      {/* Revenue by payment method */}
      {revenue?.byPaymentMethod?.length ? (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-5">Revenue by Payment Method</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={revenue.byPaymentMethod}
                dataKey="revenue"
                nameKey="method"
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                {revenue.byPaymentMethod.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v as number)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      ) : null}

      {/* Orders by status */}
      {orders?.byStatus?.length ? (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-5">Orders by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={orders.byStatus} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                dataKey="status"
                type="category"
                tickFormatter={statusLabel}
                tick={{ fontSize: 10 }}
                width={120}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      ) : null}

      {/* Daily order volume */}
      {orders?.dailyVolume?.length ? (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-5">Daily Order Volume</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={orders.dailyVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => formatDate(d, { day: '2-digit', month: 'short' })}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      ) : null}
    </div>
  );
}
