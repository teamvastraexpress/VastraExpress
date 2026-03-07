import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

function parseRange(from?: string, to?: string): { from: Date; to: Date } {
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month
  const fromDate = from ? new Date(from) : defaultFrom;
  const toDate = to ? new Date(to) : now;

  if (isNaN(fromDate.getTime())) {
    throw new BadRequestException(`Invalid "from" date: "${from}"`);
  }
  if (isNaN(toDate.getTime())) {
    throw new BadRequestException(`Invalid "to" date: "${to}"`);
  }

  return { from: fromDate, to: toDate };
}

@ApiTags('reports')
@ApiBearerAuth('JWT')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'FACILITY_STAFF')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * GET /api/reports/dashboard
   * High-level KPIs for the admin dashboard.
   */
  @Get('dashboard')
  @Roles('ADMIN')
  getDashboard() {
    return this.reportsService.getDashboardSummary();
  }

  /**
   * GET /api/reports/orders?from=2025-01-01&to=2025-01-31&facilityId=1
   * Order analytics: by status, service type, daily volume, express ratio.
   */
  @Get('orders')
  getOrderAnalytics(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('facilityId') facilityId?: string,
  ) {
    const { from: f, to: t } = parseRange(from, to);
    // Parse facilityId safely — +facilityId produces NaN for non-numeric strings
    const rawFid = facilityId ? Number.parseInt(facilityId, 10) : undefined;
    if (rawFid !== undefined && isNaN(rawFid)) {
      throw new BadRequestException('Invalid facilityId');
    }
    // Facility staff can only see their own facility
    const fid = user.role === 'FACILITY_STAFF' ? user.facilityId : rawFid;
    return this.reportsService.getOrderAnalytics(f, t, fid);
  }

  /**
   * GET /api/reports/revenue?from=2025-01-01&to=2025-01-31&facilityId=1
   * Revenue report: totals, GST, by payment method.
   */
  @Get('revenue')
  @Roles('ADMIN')
  getRevenue(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('facilityId') facilityId?: string,
  ) {
    const { from: f, to: t } = parseRange(from, to);
    const rawFid = facilityId ? Number.parseInt(facilityId, 10) : undefined;
    if (rawFid !== undefined && isNaN(rawFid)) {
      throw new BadRequestException('Invalid facilityId');
    }
    return this.reportsService.getRevenueReport(f, t, rawFid);
  }

  /**
   * GET /api/reports/drivers?from=2025-01-01&to=2025-01-31
   * Driver delivery performance: success rate, completed, failed.
   */
  @Get('drivers')
  @Roles('ADMIN')
  getDriverPerformance(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { from: f, to: t } = parseRange(from, to);
    return this.reportsService.getDriverPerformance(f, t);
  }

  /**
   * GET /api/reports/facilities?from=2025-01-01&to=2025-01-31
   * Facility performance: orders processed and revenue per facility.
   */
  @Get('facilities')
  @Roles('ADMIN')
  getFacilityPerformance(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { from: f, to: t } = parseRange(from, to);
    return this.reportsService.getFacilityPerformance(f, t);
  }

  /**
   * GET /api/reports/subscriptions?from=2025-01-01&to=2025-01-31
   * Subscription analytics: active subs, new/expired, wallet balance, plan breakdown.
   */
  @Get('subscriptions')
  @Roles('ADMIN')
  getSubscriptions(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { from: f, to: t } = parseRange(from, to);
    return this.reportsService.getSubscriptionAnalytics(f, t);
  }
}
