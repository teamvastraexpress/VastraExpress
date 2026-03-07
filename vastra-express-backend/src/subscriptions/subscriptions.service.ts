import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePlanDto,
  PurchaseSubscriptionDto,
  RefundWalletDto,
  UpdatePlanDto,
} from './dto/subscription.dto';

const LOW_BALANCE_THRESHOLD = 100; // ₹100

interface CurrentUser {
  userId: number;
  role: string;
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // PLANS
  // ============================================================

  async getPlans(includeInactive = false) {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { price: 'asc' },
    });
    return plans;
  }

  async createPlan(dto: CreatePlanDto) {
    // Prevent duplicate plan names
    const existing = await this.prisma.subscriptionPlan.findFirst({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`A plan named '${dto.name}' already exists`);
    }

    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        durationDays: dto.durationDays,
        price: dto.price,
        walletCredit: dto.walletCredit,
        benefits: (dto.benefits ?? {}) as Prisma.InputJsonValue,
        isActive: true,
      },
    });

    this.logger.log(`✅ Subscription plan created: ${plan.name}`);
    return plan;
  }

  async updatePlan(planId: number, dto: UpdatePlanDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException(`Plan #${planId} not found`);

    const updateData: Prisma.SubscriptionPlanUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.walletCredit !== undefined) updateData.walletCredit = dto.walletCredit;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.benefits !== undefined) updateData.benefits = dto.benefits as Prisma.InputJsonValue;

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id: planId },
      data: updateData,
    });

    this.logger.log(`✅ Plan #${planId} updated`);
    return updated;
  }

  async deactivatePlan(planId: number) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException(`Plan #${planId} not found`);

    // Check for active subscriptions on this plan before deactivating
    const activeCount = await this.prisma.subscription.count({
      where: { planId, isActive: true },
    });
    if (activeCount > 0) {
      throw new BadRequestException(
        `Cannot deactivate plan — ${activeCount} active subscription(s) are using it. ` +
          'Deactivate the subscriptions first or let them expire.',
      );
    }

    return this.prisma.subscriptionPlan.update({
      where: { id: planId },
      data: { isActive: false },
    });
  }

  // ============================================================
  // PURCHASE
  // ============================================================

  async purchase(user: CurrentUser, dto: PurchaseSubscriptionDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan || !plan.isActive) {
      throw new NotFoundException(`Plan #${dto.planId} not found or inactive`);
    }

    // Prevent purchasing while already having an active subscription
    const existing = await this.prisma.subscription.findFirst({
      where: { customerId: user.userId, isActive: true },
    });
    if (existing) {
      throw new ConflictException(
        'You already have an active subscription. ' +
          'Your current subscription expires on ' +
          existing.endDate.toISOString().split('T')[0] +
          '.',
      );
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const subscription = await this.prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.create({
        data: {
          customerId: user.userId,
          planId: plan.id,
          walletBalance: plan.walletCredit,
          startDate: now,
          endDate,
          isActive: true,
          autoRenew: dto.autoRenew ?? false,
        },
        include: { plan: true },
      });

      // Log the initial wallet credit
      await tx.walletTransaction.create({
        data: {
          subscriptionId: sub.id,
          transactionType: 'CREDIT',
          amount: plan.walletCredit,
          balanceAfter: plan.walletCredit,
          description: `Wallet credit on plan purchase: ${plan.name}`,
        },
      });

      return sub;
    });

    this.logger.log(
      `✅ Subscription purchased by user ${user.userId}: ${plan.name}, ` +
        `wallet ₹${plan.walletCredit}, expires ${endDate.toISOString().split('T')[0]}`,
    );

    return this.formatSubscription(subscription);
  }

  // ============================================================
  // MY SUBSCRIPTION
  // ============================================================

  async getMySubscription(userId: number) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { customerId: userId, isActive: true },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return { hasActiveSubscription: false, subscription: null };
    }

    const lowBalance = Number(subscription.walletBalance) < LOW_BALANCE_THRESHOLD;

    return {
      hasActiveSubscription: true,
      lowBalanceAlert: lowBalance
        ? `Wallet balance is low (₹${subscription.walletBalance}). Consider topping up.`
        : null,
      subscription: this.formatSubscription(subscription),
    };
  }

  // ============================================================
  // WALLET HISTORY
  // ============================================================

  async getWalletHistory(
    userId: number,
    page = 1,
    limit = 20,
  ) {
    // Find the customer's active (or most recent) subscription
    const subscription = await this.prisma.subscription.findFirst({
      where: { customerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { subscriptionId: subscription.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          order: { select: { id: true, orderNumber: true } },
        },
      }),
      this.prisma.walletTransaction.count({
        where: { subscriptionId: subscription.id },
      }),
    ]);

    return {
      currentBalance: Number(subscription.walletBalance),
      data: transactions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================================
  // ADMIN: REFUND WALLET
  // ============================================================

  async refundWallet(dto: RefundWalletDto, adminUserId: number) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: dto.subscriptionId },
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription #${dto.subscriptionId} not found`);
    }

    const newBalance = this.round(Number(subscription.walletBalance) + dto.amount);

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: dto.subscriptionId },
        data: { walletBalance: newBalance },
      });

      await tx.walletTransaction.create({
        data: {
          subscriptionId: dto.subscriptionId,
          transactionType: 'REFUND',
          amount: dto.amount,
          balanceAfter: newBalance,
          description: dto.reason ?? `Manual refund by admin #${adminUserId}`,
        },
      });
    });

    this.logger.log(
      `✅ Wallet refund: ₹${dto.amount} added to subscription #${dto.subscriptionId} by admin #${adminUserId}`,
    );

    return {
      message: `₹${dto.amount} credited to wallet successfully`,
      newBalance,
    };
  }

  // ============================================================
  // CRON: EXPIRE SUBSCRIPTIONS
  // ============================================================

  /**
   * Runs every day at 1 AM to deactivate expired subscriptions.
   * Auto-renewal logic would be triggered here (requires Payments module).
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async expireSubscriptions() {
    const now = new Date();

    // Fetch expired subs first (for logging + count), then batch-deactivate.
    // Using updateMany alone would be faster but gives no per-subscription visibility.
    const expired = await this.prisma.subscription.findMany({
      where: { isActive: true, endDate: { lt: now } },
      select: {
        id: true,
        plan: { select: { name: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    const expiredCount = expired.length;

    if (expiredCount === 0) {
      return { expiredCount: 0 };
    }

    // Batch deactivate — single SQL UPDATE instead of N individual UPDATEs
    await this.prisma.subscription.updateMany({
      where: { id: { in: expired.map((s) => s.id) } },
      data: { isActive: false },
    });

    for (const sub of expired) {
      this.logger.log(
        `🔔 Subscription expired: #${sub.id} for customer ${sub.customer.name} (plan: ${sub.plan.name})`,
      );
    }

    this.logger.log(`✅ Expired ${expiredCount} subscription(s) in batch`);
    return { expiredCount };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private formatSubscription(sub: any) {
    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );

    return {
      id: sub.id,
      plan: sub.plan
        ? {
            id: sub.plan.id,
            name: sub.plan.name,
            description: sub.plan.description,
            durationDays: sub.plan.durationDays,
            benefits: sub.plan.benefits,
          }
        : null,
      walletBalance: Number(sub.walletBalance),
      startDate: sub.startDate,
      endDate: sub.endDate,
      daysRemaining,
      isActive: sub.isActive,
      autoRenew: sub.autoRenew,
      createdAt: sub.createdAt,
    };
  }

  private round(n: number) {
    return Math.round(n * 100) / 100;
  }
}
