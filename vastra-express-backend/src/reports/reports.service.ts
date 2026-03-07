import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface CurrentUser {
  userId: number;
  role: string;
  facilityId?: number | null;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // DASHBOARD SUMMARY (Admin)
  // ============================================================

  async getDashboardSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      ordersToday,
      monthlyRevenue,
      totalCustomers,
      pendingDeliveries,
      ordersByStatus,
      ordersByServiceType,
      revenueByDay,
      ordersByDay,
    ] = await Promise.all([
      // KPI 1: orders created today
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),

      // KPI 2: revenue collected in the last 30 days
      this.prisma.payment.aggregate({
        where: { paymentStatus: 'COMPLETED', paidAt: { gte: thirtyDaysAgo } },
        _sum: { totalAmount: true },
      }),

      // KPI 3: total customers
      this.prisma.user.count({ where: { role: { name: 'CUSTOMER' } } }),

      // KPI 4: orders currently in a delivery phase
      this.prisma.order.count({
        where: {
          currentStatus: {
            in: ['READY_FOR_DISPATCH', 'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERY_ARRIVED'],
          },
        },
      }),

      // Chart: orders by status (all orders)
      this.prisma.order.groupBy({
        by: ['currentStatus'],
        _count: { _all: true },
        orderBy: { _count: { currentStatus: 'desc' } },
      }),

      // Chart: orders by service type (all orders)
      this.prisma.order.groupBy({
        by: ['serviceType'],
        _count: { _all: true },
      }),

      // Chart: daily revenue for the last 7 days
      this.prisma.$queryRaw<{ date: string; revenue: number }[]>`
        SELECT
          DATE(p.paid_at) as date,
          COALESCE(SUM(p.total_amount), 0) as revenue
        FROM payments p
        WHERE p.payment_status = 'COMPLETED' AND p.paid_at >= ${sevenDaysAgo}
        GROUP BY DATE(p.paid_at)
        ORDER BY date ASC
      `,

      // Chart: orders created per day for the last 7 days
      this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as count
        FROM orders
        WHERE created_at >= ${sevenDaysAgo}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
    ]);

    return {
      todayOrders: ordersToday,
      monthlyRevenue: Number(monthlyRevenue._sum.totalAmount ?? 0),
      totalCustomers,
      pendingDeliveries,
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.currentStatus,
        count: s._count._all,
      })),
      ordersByServiceType: ordersByServiceType.map((s) => ({
        serviceType: s.serviceType,
        count: s._count._all,
      })),
      revenueByDay: revenueByDay.map((d) => ({
        date: d.date,
        revenue: Number(d.revenue),
      })),
      ordersByDay: ordersByDay.map((d) => ({
        date: d.date,
        count: Number(d.count),
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  // ============================================================
  // ORDER ANALYTICS (trends over time)
  // ============================================================

  async getOrderAnalytics(
    from: Date,
    to: Date,
    facilityId?: number,
  ) {
    const where: Prisma.OrderWhereInput = {
      createdAt: { gte: from, lte: to },
    };
    if (facilityId) where.facilityId = facilityId;

    const [
      ordersByStatus,
      ordersByServiceType,
      revenueByDay,
      expressVsStandard,
    ] = await Promise.all([
      // Orders grouped by status
      this.prisma.order.groupBy({
        by: ['currentStatus'],
        where,
        _count: { _all: true },
        orderBy: { _count: { currentStatus: 'desc' } },
      }),

      // Orders grouped by service type
      this.prisma.order.groupBy({
        by: ['serviceType'],
        where,
        _count: { _all: true },
      }),

      // Daily revenue for the period
      this.prisma.$queryRaw<{ date: string; revenue: number; orders: bigint }[]>`
        SELECT
          DATE(o.created_at) as date,
          COALESCE(SUM(p.total_amount), 0) as revenue,
          COUNT(DISTINCT o.id) as orders
        FROM orders o
        LEFT JOIN payments p ON p.order_id = o.id AND p.payment_status = 'COMPLETED'
        WHERE o.created_at BETWEEN ${from} AND ${to}
          ${facilityId ? Prisma.sql`AND o.facility_id = ${facilityId}` : Prisma.empty}
        GROUP BY DATE(o.created_at)
        ORDER BY date ASC
      `,

      // Express vs standard
      this.prisma.order.groupBy({
        by: ['isExpress'],
        where,
        _count: { _all: true },
      }),
    ]);

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.currentStatus,
        count: s._count._all,
      })),
      ordersByServiceType: ordersByServiceType.map((s) => ({
        serviceType: s.serviceType,
        count: s._count._all,
      })),
      dailyRevenue: revenueByDay.map((d) => ({
        date: d.date,
        revenue: Number(d.revenue),
        orders: Number(d.orders),
      })),
      expressVsStandard: {
        express: expressVsStandard.find((e) => e.isExpress)?._count._all ?? 0,
        standard: expressVsStandard.find((e) => !e.isExpress)?._count._all ?? 0,
      },
    };
  }

  // ============================================================
  // REVENUE REPORT
  // ============================================================

  async getRevenueReport(from: Date, to: Date, facilityId?: number) {
    const wherePayment: Prisma.PaymentWhereInput = {
      paymentStatus: 'COMPLETED',
      paidAt: { gte: from, lte: to },
    };
    if (facilityId) wherePayment.order = { facilityId };

    const [
      totalRevenue,
      revenueByMethod,
      gstCollected,
      refundedAmount,
      averageOrderValue,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: wherePayment,
        _sum: { totalAmount: true, amount: true, gstAmount: true },
        _count: { _all: true },
      }),

      this.prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: wherePayment,
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),

      this.prisma.payment.aggregate({
        where: wherePayment,
        _sum: { gstAmount: true },
      }),

      this.prisma.payment.aggregate({
        where: {
          paymentStatus: 'REFUNDED',
          paidAt: { gte: from, lte: to },
        },
        _sum: { totalAmount: true },
      }),

      this.prisma.payment.aggregate({
        where: wherePayment,
        _avg: { totalAmount: true },
      }),
    ]);

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      summary: {
        totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
        serviceRevenue: Number(totalRevenue._sum.amount ?? 0),
        gstCollected: Number(gstCollected._sum.gstAmount ?? 0),
        refunded: Number(refundedAmount._sum.totalAmount ?? 0),
        netRevenue:
          Number(totalRevenue._sum.totalAmount ?? 0) -
          Number(refundedAmount._sum.totalAmount ?? 0),
        transactionCount: totalRevenue._count._all,
        averageOrderValue: Math.round(Number(averageOrderValue._avg.totalAmount ?? 0) * 100) / 100,
      },
      byPaymentMethod: revenueByMethod.map((m) => ({
        method: m.paymentMethod,
        revenue: Number(m._sum.totalAmount ?? 0),
        count: m._count._all,
      })),
    };
  }

  // ============================================================
  // DRIVER PERFORMANCE REPORT
  // ============================================================

  async getDriverPerformance(from: Date, to: Date) {
    const assignments = await this.prisma.deliveryAssignment.groupBy({
      by: ['driverId', 'status'],
      where: { assignedAt: { gte: from, lte: to } },
      _count: { _all: true },
    });

    // Group by driverId
    const driverMap = new Map<number, Record<string, number>>();
    for (const a of assignments) {
      if (!driverMap.has(a.driverId)) driverMap.set(a.driverId, {});
      driverMap.get(a.driverId)![a.status] = a._count._all;
    }

    const driverIds = [...driverMap.keys()];
    const drivers = await this.prisma.user.findMany({
      where: { id: { in: driverIds } },
      select: { id: true, name: true, mobileNumber: true },
    });

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      drivers: drivers.map((d) => {
        const stats = driverMap.get(d.id) ?? {};
        const total = Object.values(stats).reduce((s, c) => s + c, 0);
        const completed = stats['COMPLETED'] ?? 0;
        const failed = stats['FAILED'] ?? 0;
        return {
          driver: { id: d.id, name: d.name, mobileNumber: d.mobileNumber },
          totalAssignments: total,
          completed,
          failed,
          inProgress: stats['IN_PROGRESS'] ?? 0,
          assigned: stats['ASSIGNED'] ?? 0,
          successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      }),
    };
  }

  // ============================================================
  // FACILITY PERFORMANCE
  // ============================================================

  async getFacilityPerformance(from: Date, to: Date) {
    const [ordersByFacility, revenueByFacility] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['facilityId'],
        where: { createdAt: { gte: from, lte: to } },
        _count: { _all: true },
      }),

      this.prisma.$queryRaw<{ facilityId: number; revenue: number }[]>`
        SELECT o.facility_id as facilityId, COALESCE(SUM(p.total_amount), 0) as revenue
        FROM orders o
        LEFT JOIN payments p ON p.order_id = o.id AND p.payment_status = 'COMPLETED'
        WHERE o.created_at BETWEEN ${from} AND ${to}
        GROUP BY o.facility_id
      `,
    ]);

    const facilityIds = [...new Set(ordersByFacility.map((f) => f.facilityId))];
    const facilities = await this.prisma.facility.findMany({
      where: { id: { in: facilityIds } },
      select: { id: true, name: true },
    });

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      facilities: facilities.map((f) => {
        const orders = ordersByFacility.find((o) => o.facilityId === f.id)?._count._all ?? 0;
        const revenue = Number(revenueByFacility.find((r) => r.facilityId === f.id)?.revenue ?? 0);
        return { facility: f, orders, revenue };
      }),
    };
  }

  // ============================================================
  // SUBSCRIPTION ANALYTICS
  // ============================================================

  async getSubscriptionAnalytics(from: Date, to: Date) {
    const [
      activeSubs,
      newSubs,
      expiredSubs,
      totalWalletBalance,
      planBreakdown,
    ] = await Promise.all([
      this.prisma.subscription.count({ where: { isActive: true } }),
      this.prisma.subscription.count({ where: { createdAt: { gte: from, lte: to } } }),
      this.prisma.subscription.count({
        where: { isActive: false, endDate: { gte: from, lte: to } },
      }),
      this.prisma.subscription.aggregate({
        where: { isActive: true },
        _sum: { walletBalance: true },
      }),
      this.prisma.subscription.groupBy({
        by: ['planId'],
        where: { isActive: true },
        _count: { _all: true },
      }),
    ]);

    const planIds = planBreakdown.map((p) => p.planId);
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true },
    });

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      summary: {
        active: activeSubs,
        newInPeriod: newSubs,
        expiredInPeriod: expiredSubs,
        totalWalletBalance: Number(totalWalletBalance._sum.walletBalance ?? 0),
      },
      byPlan: planBreakdown.map((p) => ({
        plan: plans.find((pl) => pl.id === p.planId),
        activeSubscribers: p._count._all,
      })),
    };
  }
}
