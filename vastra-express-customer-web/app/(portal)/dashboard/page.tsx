'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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

  const activeOrders = orders.filter((o) =>
    !['DELIVERED', 'CANCELLED', 'FAILED'].includes(o.currentStatus)
  );
  const recentOrders = orders.slice(0, 5);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here&apos;s your laundry dashboard</p>
        </div>
        <Button onClick={() => router.push('/book')} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Book a Pickup
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{activeOrders.length}</p>
            <p className="text-sm text-gray-500">Active Orders</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {orders.filter((o) => o.currentStatus === 'DELIVERED').length}
            </p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            <p className="text-sm text-gray-500">Total Orders</p>
          </div>
        </Card>
      </div>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Active Orders</h2>
          <div className="space-y-3">
            {activeOrders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-lg">
                      👕
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">
                        {serviceLabel(order.serviceType)} · {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusColor(order.currentStatus)} size="sm">
                      {statusLabel(order.currentStatus)}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Orders */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/orders" className="text-sm text-blue-600 hover:underline font-medium">
            View all →
          </Link>
        </div>

        {isLoading ? (
          <Loading />
        ) : recentOrders.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="text-5xl mb-4">🧺</div>
            <p className="text-gray-700 font-medium mb-1">No orders yet</p>
            <p className="text-sm text-gray-500 mb-5">Book your first pickup and enjoy fresh laundry!</p>
            <Button onClick={() => router.push('/book')}>Book a Pickup</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">
                      {serviceLabel(order.serviceType)} · {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusColor(order.currentStatus)} size="sm">
                      {statusLabel(order.currentStatus)}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Book Pickup', href: '/book', emoji: '🛺', color: 'bg-blue-50 text-blue-700' },
            { label: 'My Orders', href: '/orders', emoji: '📦', color: 'bg-orange-50 text-orange-700' },
            { label: 'Addresses', href: '/addresses', emoji: '📍', color: 'bg-purple-50 text-purple-700' },
            { label: 'Profile', href: '/profile', emoji: '👤', color: 'bg-emerald-50 text-emerald-700' },
          ].map((a) => (
            <Link key={a.href} href={a.href}>
              <Card className={`p-4 text-center hover:shadow-md transition-shadow cursor-pointer ${a.color}`}>
                <div className="text-2xl mb-1">{a.emoji}</div>
                <p className="text-sm font-medium">{a.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
