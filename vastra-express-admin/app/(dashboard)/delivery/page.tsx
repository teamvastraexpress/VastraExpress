'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatDateTime, getApiError, statusLabel } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { TableSkeleton } from '@/components/ui/Loading';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { DeliveryAssignment } from '@/types';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'PICKUP', label: 'Pickup' },
  { value: 'DELIVERY', label: 'Delivery' },
];

const assignmentStatusColor: Record<string, string> = {
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

export default function DeliveryPage() {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(status && { status }),
      });
      const res = await api.get(`/delivery?${params}`);
      const body = res.data;
      setAssignments(body.data ?? body);
      setTotal(body.total ?? body.length ?? 0);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Delivery Assignments</h1>
        <p className="text-gray-500 text-sm mt-0.5">Track all driver pickup and delivery tasks</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3">
          <div className="w-48">
            <Select
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              placeholder=""
            />
          </div>
          <Button variant="outline" onClick={fetchAssignments} loading={loading}>Refresh</Button>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{total} assignment{total !== 1 ? 's' : ''}</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6"><TableSkeleton rows={8} cols={6} /></div>
          ) : assignments.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No assignments found</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['ID', 'Order #', 'Driver', 'Type', 'Status', 'Assigned At', 'Order'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 text-gray-500 text-xs">#{a.id}</td>
                    <td className="px-6 py-3 font-mono text-xs font-medium text-gray-700">
                      {a.order?.orderNumber ?? `#${a.orderId}`}
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      {a.driver?.name ?? `#${a.driverId}`}
                    </td>
                    <td className="px-6 py-3">
                      <Badge className={a.assignmentType === 'PICKUP' ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'}>
                        {a.assignmentType}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <Badge className={assignmentStatusColor[a.status] ?? 'bg-gray-100 text-gray-600'}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                      {formatDateTime(a.assignedAt)}
                    </td>
                    <td className="px-6 py-3">
                      <Link href={`/orders/${a.orderId}`} className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                        View Order
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1} leftIcon={<ChevronLeft className="w-4 h-4" />}>Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
