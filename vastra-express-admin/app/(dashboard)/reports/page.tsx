'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { getApiError } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import dynamic from 'next/dynamic';
import { ShoppingBag, Truck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const ReportsCharts = dynamic(
  () => import('@/components/ui/ReportsCharts'),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[280px] animate-pulse bg-gray-100 rounded-xl" />
        ))}
      </div>
    ),
  }
);

type DateRange = { from: string; to: string };

function todayStr() { return new Date().toISOString().split('T')[0]; }
function monthStartStr() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

export default function ReportsPage() {
  const [range, setRange] = useState<DateRange>({ from: monthStartStr(), to: todayStr() });
  const [orders, setOrders] = useState<Record<string, unknown> | null>(null);
  const [drivers, setDrivers] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const q = `from=${range.from}&to=${range.to}`;
      const [ordRes, drvRes] = await Promise.all([
        api.get(`/reports/orders?${q}`),
        api.get(`/reports/drivers?${q}`),
      ]);

      // Backend: { ordersByStatus, ordersByServiceType, dailyRevenue[{date, revenue, orders}] }
      const ordRaw = ordRes.data;
      setOrders({
        byStatus:     ordRaw.ordersByStatus     ?? [],
        byServiceType: ordRaw.ordersByServiceType ?? [],
        dailyVolume:  (ordRaw.dailyRevenue ?? []).map((d: { date: string; orders: number }) => ({
          date:  d.date,
          count: d.orders,
        })),
      });

      // Backend: { drivers: [{ driver: { name }, completed, failed, successRate }] }
      setDrivers(drvRes.data?.drivers ?? drvRes.data ?? []);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Business insights and performance metrics</p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={fetchAll} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* Date range selector */}
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <Input
            label="From"
            type="date"
            value={range.from}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            className="w-40"
          />
          <Input
            label="To"
            type="date"
            value={range.to}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            className="w-40"
          />
          <Button onClick={fetchAll} loading={loading}>
            Apply
          </Button>
        </div>
      </Card>

      {loading ? (
        <Loading />
      ) : (
        <>
          {/* Charts — lazily loaded so recharts (~600 KB) doesn't slow webpack/turbopack rebuilds */}
          <ReportsCharts
            revenue={null}
            orders={orders as { byStatus?: { status: string; count: number }[]; byServiceType?: { serviceType: string; count: number }[]; dailyVolume?: { date: string; count: number }[] } | null}
          />

          {/* Driver performance */}
          {Array.isArray(drivers) && drivers.length > 0 && (
            <Card padding={false}>
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gray-400" /> Driver Performance
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      {['Driver', 'Completed', 'Failed', 'Success Rate'].map((h) => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(drivers as { driver: { name: string }; completed: number; failed: number; successRate: number }[]).map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium text-gray-800">{d.driver?.name ?? '—'}</td>
                        <td className="px-6 py-3 text-green-600 font-semibold">{d.completed}</td>
                        <td className="px-6 py-3 text-red-600 font-semibold">{d.failed}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-24">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${d.successRate}%` }} />
                            </div>
                            <span className="text-gray-700 text-xs font-medium">{d.successRate?.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
