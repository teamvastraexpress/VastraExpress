'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { ShoppingBag } from 'lucide-react';
import { formatDate } from '@/lib/utils';
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
    WASH_FOLD: 'Wash & Fold',
    PREMIUM: 'Premium',
  };
  return map[key] ?? key.replace(/_/g, ' ');
}

/**
 * Transforms flat ordersByDayByFacility rows into recharts-friendly data:
 * [{ date, "Facility A": 3, "Facility B": 5, ... }, ...]
 */
function buildStackedData(rows: DashboardSummary['ordersByDayByFacility']) {
  const dateMap = new Map<string, Record<string, number>>();
  const facilityNames = new Set<string>();

  for (const row of rows) {
    if (!dateMap.has(row.date)) dateMap.set(row.date, {});
    dateMap.get(row.date)![row.facilityName] = row.count;
    facilityNames.add(row.facilityName);
  }

  const sorted = [...dateMap.entries()].sort(([a], [b]) => a.localeCompare(b));
  return {
    data: sorted.map(([date, counts]) => ({ date, ...counts })),
    facilities: [...facilityNames].sort(),
  };
}

export default function DashboardCharts({ summary }: { summary: DashboardSummary }) {
  const { data: stackedData, facilities } = buildStackedData(
    summary?.ordersByDayByFacility ?? [],
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Service type distribution */}
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

      {/* Orders per day — stacked by facility */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <ShoppingBag className="w-4 h-4 text-emerald-600" />
          <h3 className="font-semibold text-gray-900">Orders per Day (Last 7 days)</h3>
        </div>
        {stackedData.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stackedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => formatDate(d, { day: '2-digit', month: 'short' })}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                labelFormatter={(d) => formatDate(d as string, { weekday: 'short', day: '2-digit', month: 'short' })}
                formatter={(v, name) => [v, name as string]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {facilities.map((name, i) => (
                <Bar
                  key={name}
                  dataKey={name}
                  stackId="a"
                  fill={PIE_COLORS[i % PIE_COLORS.length]}
                  radius={i === facilities.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
            No order data yet
          </div>
        )}
      </Card>
    </div>
  );
}
