'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { statusLabel, getStatusColor, formatDate, serviceLabel } from '@/lib/utils';
import { ShoppingBag, Clock, CheckCircle, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { orders, isLoading, fetchOrders } = useOrderStore();

  useEffect(() => {
    fetchOrders({ page: 1, limit: 10 });
  }, [fetchOrders]);

  const activeOrders  = orders.filter((o) => !['DELIVERED', 'CANCELLED', 'FAILED'].includes(o.currentStatus));
  const recentOrders  = orders.slice(0, 5);
  const completedCount = orders.filter((o) => o.currentStatus === 'DELIVERED').length;

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  // ── shared primitives ──────────────────────────────────────────────────────

  const sectionHeading = (text: string) => (
    <h2
      className="text-lg font-bold mb-3"
      style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
    >
      {text}
    </h2>
  );

  const orderCard = (order: (typeof orders)[0]) => (
    <Link key={order.id} href={`/orders/${order.id}`}>
      <div
        className="flex items-center justify-between p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        style={{
          background: 'white',
          border: '1px solid rgba(168,216,240,0.4)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: '#E8F4FB' }}
          >
            👕
          </div>
          <div>
            <p
              className="font-semibold text-sm"
              style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
            >
              {order.orderNumber}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
              {serviceLabel(order.serviceType)} · {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Badge variant={getStatusColor(order.currentStatus)} size="sm">
            {statusLabel(order.currentStatus)}
          </Badge>
          <ArrowRight className="w-4 h-4" style={{ color: '#8FA3B1' }} />
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-8">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
          >
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
            Here&apos;s your laundry dashboard
          </p>
        </div>
        <Button onClick={() => router.push('/book')} size="lg" leftIcon={<Plus className="w-4 h-4" />}>
          Book a Pickup
        </Button>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: <Clock className="w-6 h-6" style={{ color: '#1A6FC4' }} />,
            bg: '#E8F4FB',
            value: activeOrders.length,
            label: 'Active Orders',
          },
          {
            icon: <CheckCircle className="w-6 h-6" style={{ color: '#22c55e' }} />,
            bg: '#ECFDF5',
            value: completedCount,
            label: 'Completed',
          },
          {
            icon: <ShoppingBag className="w-6 h-6" style={{ color: '#f97316' }} />,
            bg: '#FFF7ED',
            value: orders.length,
            label: 'Total Orders',
          },
        ].map(({ icon, bg, value, label }) => (
          <div
            key={label}
            className="flex items-center gap-4 p-5 rounded-2xl"
            style={{
              background: 'white',
              border: '1px solid rgba(168,216,240,0.4)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: bg }}
            >
              {icon}
            </div>
            <div>
              <p
                className="text-2xl font-extrabold leading-tight"
                style={{ fontFamily: 'var(--font-display)', color: '#1B2A3B' }}
              >
                {value}
              </p>
              <p className="text-sm mt-0.5" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Active orders ── */}
      {activeOrders.length > 0 && (
        <section>
          {sectionHeading('Active Orders')}
          <div className="space-y-3">
            {activeOrders.map((order) => orderCard(order))}
          </div>
        </section>
      )}

      {/* ── Recent orders ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          {sectionHeading('Recent Orders')}
          <Link
            href="/orders"
            className="text-sm font-medium transition-colors hover:underline"
            style={{ color: '#1A6FC4', fontFamily: 'var(--font-body)' }}
          >
            View all →
          </Link>
        </div>

        {isLoading ? (
          <Loading />
        ) : recentOrders.length === 0 ? (
          <div
            className="p-12 rounded-2xl text-center"
            style={{
              background: 'white',
              border: '1px solid #A8D8F0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}
          >
            <div className="text-5xl mb-4">🧺</div>
            <p
              className="font-semibold mb-1"
              style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
            >
              No orders yet
            </p>
            <p className="text-sm mb-6" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
              Book your first pickup and enjoy fresh laundry!
            </p>
            <Button onClick={() => router.push('/book')}>Book a Pickup</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => orderCard(order))}
          </div>
        )}
      </section>

      {/* ── Quick actions ── */}
      <section>
        {sectionHeading('Quick Actions')}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Book Pickup', href: '/book',      emoji: '🛺', bg: '#E8F4FB', color: '#1A6FC4' },
            { label: 'My Orders',   href: '/orders',    emoji: '📦', bg: '#FFF7ED', color: '#f97316' },
            { label: 'Addresses',   href: '/addresses', emoji: '📍', bg: '#F0F8FF', color: '#4EAEE5' },
            { label: 'Profile',     href: '/profile',   emoji: '👤', bg: '#F0FDF4', color: '#22c55e' },
          ].map((a) => (
            <Link key={a.href} href={a.href}>
              <div
                className="p-4 rounded-2xl text-center transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                style={{
                  background: a.bg,
                  border: '1px solid rgba(168,216,240,0.3)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div className="text-2xl mb-1.5">{a.emoji}</div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: a.color, fontFamily: 'var(--font-ui)' }}
                >
                  {a.label}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
