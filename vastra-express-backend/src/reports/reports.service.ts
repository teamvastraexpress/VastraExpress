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

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      ordersToday,
      totalCustomers,
      pendingDeliveries,
      activeFacilities,
      ordersByStatus,
      ordersByServiceType,
      ordersByDay,
      ordersByDayByFacility,
    ] = await Promise.all([
      // KPI 1: orders created today
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),

      // KPI 2: total customers
      this.prisma.user.count({ where: { role: { name: 'CUSTOMER' } } }),

      // KPI 3: orders currently in a delivery phase
      this.prisma.order.count({
        where: {
          currentStatus: {
            in: ['READY_FOR_DISPATCH', 'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERY_ARRIVED'],
          },
        },
      }),

      // KPI 4: active facilities
      this.prisma.facility.count({ where: { isActive: true } }),

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

      // Chart: orders per day broken down by facility
      this.prisma.$queryRaw<{ date: string; facilityId: number; facilityName: string; count: bigint }[]>`
        SELECT
          DATE(o.created_at) as date,
          f.id as facilityId,
          f.name as facilityName,
          COUNT(*) as count
        FROM orders o
        JOIN facilities f ON o.facility_id = f.id
        WHERE o.created_at >= ${sevenDaysAgo}
        GROUP BY DATE(o.created_at), f.id, f.name
        ORDER BY date ASC, f.name ASC
      `,
    ]);

    return {
      todayOrders: ordersToday,
      totalCustomers,
      pendingDeliveries,
      activeFacilities,
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.currentStatus,
        count: s._count._all,
      })),
      ordersByServiceType: ordersByServiceType.map((s) => ({
        serviceType: s.serviceType,
        count: s._count._all,
      })),
      ordersByDay: ordersByDay.map((d) => ({
        date: d.date,
        count: Number(d.count),
      })),
      ordersByDayByFacility: ordersByDayByFacility.map((r) => ({
        date: r.date,
        facilityId: Number(r.facilityId),
        facilityName: r.facilityName,
        count: Number(r.count),
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
      dailyOrdersRaw,
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

      // Daily order counts for the period
      this.prisma.$queryRaw<{ date: string; orders: bigint }[]>`
        SELECT
          DATE(o.created_at) as date,
          COUNT(DISTINCT o.id) as orders
        FROM orders o
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
      dailyOrders: dailyOrdersRaw.map((d) => ({
        date: d.date,
        orders: Number(d.orders),
      })),
      expressVsStandard: {
        express: expressVsStandard.find((e) => e.isExpress)?._count._all ?? 0,
        standard: expressVsStandard.find((e) => !e.isExpress)?._count._all ?? 0,
      },
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
    const ordersByFacility = await this.prisma.order.groupBy({
      by: ['facilityId'],
      where: { createdAt: { gte: from, lte: to } },
      _count: { _all: true },
    });

    const facilityIds = [...new Set(ordersByFacility.map((f) => f.facilityId))];
    const facilities = await this.prisma.facility.findMany({
      where: { id: { in: facilityIds } },
      select: { id: true, name: true },
    });

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      facilities: facilities.map((f) => {
        const orders = ordersByFacility.find((o) => o.facilityId === f.id)?._count._all ?? 0;
        return { facility: f, orders };
      }),
    };
  }

}

