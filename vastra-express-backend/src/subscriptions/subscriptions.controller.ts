import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreatePlanDto,
  PurchaseSubscriptionDto,
  RefundWalletDto,
  UpdatePlanDto,
} from './dto/subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('subscriptions')
@ApiBearerAuth('JWT')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ─── PLANS ────────────────────────────────────────────────────────────────

  /**
   * GET /subscriptions/plans?includeInactive=true
   * List all active plans (or all plans for admins with includeInactive=true).
   */
  @Get('plans')
  getPlans(
    @Query('includeInactive') includeInactiveStr: string,
    @CurrentUser('role') role: string,
  ) {
    // Only admin can see inactive plans
    const includeInactive = role === 'ADMIN' && includeInactiveStr === 'true';
    return this.subscriptionsService.getPlans(includeInactive);
  }

  /**
   * POST /subscriptions/plans
   * [Admin] Create a new subscription plan.
   */
  @Post('plans')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  createPlan(@Body() dto: CreatePlanDto) {
    return this.subscriptionsService.createPlan(dto);
  }

  /**
   * PUT /subscriptions/plans/:id
   * [Admin] Update an existing plan.
   */
  @Put('plans/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  updatePlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.subscriptionsService.updatePlan(id, dto);
  }

  /**
   * DELETE /subscriptions/plans/:id
   * [Admin] Deactivate a plan (soft-delete; blocked if active subscriptions exist).
   */
  @Delete('plans/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  deactivatePlan(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionsService.deactivatePlan(id);
  }

  // ─── CUSTOMER ACTIONS ─────────────────────────────────────────────────────

  /**
   * POST /subscriptions/purchase
   * Purchase a subscription plan. Only customers can call this.
   * Blocks if an active subscription already exists.
   */
  @Post('purchase')
  @HttpCode(HttpStatus.CREATED)
  purchase(
    @CurrentUser() user: any,
    @Body() dto: PurchaseSubscriptionDto,
  ) {
    return this.subscriptionsService.purchase(user, dto);
  }

  /**
   * GET /subscriptions/my-subscription
   * Get the caller's active subscription + low-balance alert.
   */
  @Get('my-subscription')
  getMySubscription(@CurrentUser('userId') userId: number) {
    return this.subscriptionsService.getMySubscription(userId);
  }

  /**
   * GET /subscriptions/wallet-history?page=1&limit=20
   * Get wallet transaction history for the caller's subscription.
   */
  @Get('wallet-history')
  getWalletHistory(
    @CurrentUser('userId') userId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.subscriptionsService.getWalletHistory(userId, page, limit);
  }

  // ─── ADMIN ACTIONS ────────────────────────────────────────────────────────

  /**
   * POST /subscriptions/refund
   * [Admin] Manually credit the wallet of a subscription (refund or compensation).
   */
  @Post('refund')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  refundWallet(
    @Body() dto: RefundWalletDto,
    @CurrentUser('userId') adminUserId: number,
  ) {
    return this.subscriptionsService.refundWallet(dto, adminUserId);
  }
}
