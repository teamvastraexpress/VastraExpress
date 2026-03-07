'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatDateTime, getPaymentStatusColor, getApiError } from '@/lib/utils';
import { Card, KpiCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Loading';
import { IndianRupee, RotateCcw, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { Payment } from '@/types';
import toast from 'react-hot-toast';

interface PaymentRow extends Payment {
  order?: { orderNumber: string };
  customer?: { name: string; mobileNumber: string };
}

interface PaymentStats {
  totalRevenue: number;
  completedCount: number;
  pendingCount: number;
  refundedCount: number;
  totalCount: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PaymentStats | null>(null);

  // Refund modal
  const [refundPayment, setRefundPayment] = useState<PaymentRow | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

  const LIMIT = 20;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentsRes, statsRes] = await Promise.all([
        api.get(`/payments/history?page=${page}&limit=${LIMIT}`),
        api.get('/payments/stats'),
      ]);
      const body = paymentsRes.data;
      setPayments(body.data ?? body);
      setTotal(body.total ?? body.meta?.total ?? body.length ?? 0);
      setStats(statsRes.data);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  async function handleRefund() {
    if (!refundPayment) return;
    if (!refundReason.trim()) {
      toast.error('Please provide a reason for the refund');
      return;
    }
    setRefunding(true);
    try {
      await api.post(`/payments/refund/${refundPayment.id}`, { reason: refundReason });
      toast.success('Refund initiated successfully');
      setRefundPayment(null);
      setRefundReason('');
      fetchAll();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setRefunding(false);
    }
  }

  const METHOD_LABELS: Record<string, string> = {
    RAZORPAY_UPI: 'UPI',
    RAZORPAY_CARD: 'Card',
    COD: 'Cash on Delivery',
    WALLET: 'Wallet',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 text-sm mt-0.5">Payment history and refund management</p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={fetchAll} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* KPI summary — from dedicated stats endpoint, reflects all-time data */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Total Revenue" value={formatCurrency(stats?.totalRevenue ?? 0)} icon={<IndianRupee className="w-5 h-5" />} color="green" subtitle="All completed payments" />
        <KpiCard title="Total Payments" value={stats?.totalCount ?? total} icon={<IndianRupee className="w-5 h-5" />} color="blue" subtitle="All-time records" />
        <KpiCard title="Pending" value={stats?.pendingCount ?? 0} icon={<IndianRupee className="w-5 h-5" />} color="yellow" subtitle="Awaiting payment" />
        <KpiCard title="Refunded" value={stats?.refundedCount ?? 0} icon={<RotateCcw className="w-5 h-5" />} color="purple" subtitle="All-time refunds" />
      </div>

      {/* Table */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Payment History</h3>
          <Button variant="outline" size="sm" onClick={fetchAll} loading={loading}>Refresh</Button>
        </div>

        {loading ? (
          <div className="p-6"><TableSkeleton rows={10} cols={7} /></div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No payment records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Order', 'Customer', 'Method', 'Amount', 'GST', 'Total', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      {p.order?.orderNumber ? (
                        <Link
                          href={`/orders/${p.orderId}`}
                          className="text-blue-600 hover:underline font-mono text-xs flex items-center gap-1"
                        >
                          {p.order.orderNumber}
                          <LinkIcon className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-gray-400 font-mono text-xs">#{p.orderId}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 whitespace-nowrap">
                        {p.customer?.name ?? '—'}
                      </p>
                      <p className="text-xs text-gray-400">{p.customer?.mobileNumber ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-mono whitespace-nowrap">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono whitespace-nowrap">
                      {formatCurrency(p.gstAmount)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 font-mono whitespace-nowrap">
                      {formatCurrency(p.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getPaymentStatusColor(p.paymentStatus)}>
                        {p.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {p.paidAt ? formatDateTime(p.paidAt) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {p.paymentStatus === 'COMPLETED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setRefundPayment(p); setRefundReason(''); }}
                          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        >
                          Refund
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} · {total} total
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Refund Modal */}
      <Modal
        open={!!refundPayment}
        onClose={() => setRefundPayment(null)}
        title="Initiate Refund"
        size="sm"
      >
        {refundPayment && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <p className="font-semibold text-amber-800">
                Refund {formatCurrency(refundPayment.totalAmount)}
              </p>
              <p className="text-amber-600 text-xs mt-0.5">
                Order #{refundPayment.order?.orderNumber ?? refundPayment.orderId} ·{' '}
                {METHOD_LABELS[refundPayment.paymentMethod] ?? refundPayment.paymentMethod}
              </p>
            </div>
            <Input
              label="Reason for refund"
              placeholder="e.g. Customer complaint, order lost in transit…"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              required
            />
            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setRefundPayment(null)}>Cancel</Button>
              <Button
                variant="danger"
                loading={refunding}
                onClick={handleRefund}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Confirm Refund
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
