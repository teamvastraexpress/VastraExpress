'use client';

import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ShoppingBag, Clock } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { DashboardSummary, SlotPerformanceSummary } from '@/types';

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
];

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

interface DashboardChartsProps {
  summary: DashboardSummary;
  slotDate: string;
  slotPerformance: SlotPerformanceSummary | null;
  slotLoading: boolean;
  onSlotDateChange: (date: string) => void;
}

export default function DashboardCharts({
  summary,
  slotDate,
  slotPerformance,
  slotLoading,
  onSlotDateChange,
}: DashboardChartsProps) {
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const facilityRows = range === '7d'
    ? summary?.ordersByDayByFacility ?? []
    : summary?.ordersByDayByFacility30 ?? [];
  const { data: stackedData, facilities } = buildStackedData(facilityRows);

  const slotData = useMemo(
    () => (slotPerformance?.slots ?? []).map((s) => ({
      slot: `${s.startTime}-${s.endTime}`,
      orders: s.orders,
    })),
    [slotPerformance]
  );

  const slotStats = useMemo(() => {
    if (!slotData.length) return null;
    let total = 0;
    let peak = slotData[0];
    for (const row of slotData) {
      total += row.orders;
      if (row.orders > peak.orders) peak = row;
    }
    return { total, peakSlot: peak.slot, peakOrders: peak.orders };
  }, [slotData]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Orders per day — stacked by facility */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-gray-900">Orders per Day by Facility</h3>
          </div>
          <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
            {([
              { key: '7d', label: 'Last 7 days' },
              { key: '30d', label: 'Last 30 days' },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setRange(opt.key)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  range === opt.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {stackedData.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stackedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => formatDate(d, { day: '2-digit', month: 'short' })}
                tick={{ fontSize: 11 }}
                minTickGap={12}
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
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
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

      {/* Slot performance */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Orders per Slot</h3>
          </div>
          <div className="w-[180px]">
            <Input
              type="date"
              value={slotDate}
              onChange={(e) => {
                if (e.target.value) onSlotDateChange(e.target.value);
              }}
              aria-label="Slot performance date"
            />
          </div>
        </div>
        {slotLoading && slotData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
            Loading slot performance...
          </div>
        ) : slotData.length ? (
          <>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={slotData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="slot" tick={{ fontSize: 11 }} minTickGap={8} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Orders']} />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {slotStats && (
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
                <span>
                  Total orders: <span className="font-medium text-gray-700">{slotStats.total}</span>
                </span>
                <span>
                  Peak slot: <span className="font-medium text-gray-700">{slotStats.peakSlot} ({slotStats.peakOrders})</span>
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
            No slot data for the selected date
          </div>
        )}
      </Card>
    </div>
  );
}
