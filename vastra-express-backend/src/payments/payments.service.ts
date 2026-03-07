import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from './razorpay.service';
import {
  CodPaymentDto,
  CreatePaymentOrderDto,
  PaymentMethod,
  VerifyPaymentDto,
} from './dto/payment.dto';
import { OrderStatus } from '../orders/enums/order-status.enum';

interface CurrentUser {
  userId: number;
  role: string;
  facilityId?: number | null;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  // Webhook secret used to verify Razorpay webhook POST requests
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
    private readonly configService: ConfigService,
  ) {
    this.webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET', '');

    // SECURITY: Warn loudly if webhook secret is not configured.
    // Without it, anyone can POST to /payments/webhook and forge payment events.
    if (!this.webhookSecret) {
      const env = this.configService.get('NODE_ENV', 'development');
      if (env === 'production') {
        throw new Error(
          'RAZORPAY_WEBHOOK_SECRET must be set in production. ' +
            'Set it in .env before starting the server.',
        );
      } else {
        this.logger.warn(
          '⚠️  RAZORPAY_WEBHOOK_SECRET not set — webhook signature verification DISABLED. ' +
            'Set this in .env before going to production!',
        );
      }
    }
  }

  // ============================================================
  // CREATE RAZORPAY ORDER
  // ============================================================

  /**
   * Creates a Razorpay payment order for the amount due on an order.
   * Returns the Razorpay order details that the frontend SDK needs.
   */
  async createPaymentOrder(dto: CreatePaymentOrderDto, user: CurrentUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        payments: {
          where: { paymentStatus: { in: ['PENDING', 'COMPLETED'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Customer can only pay for own orders
    if (user.role === 'CUSTOMER' && order.customerId !== user.userId) {
      throw new ForbiddenException('You do not own this order');
    }

    // Bill must be generated first
    if (order.currentStatus !== OrderStatus.BILL_GENERATED &&
        order.currentStatus !== OrderStatus.READY_FOR_DISPATCH) {
      throw new BadRequestException(
        `Payment can only be initiated after bill generation. Current status: ${order.currentStatus}`,
      );
    }

    const pendingPayment = order.payments[0];
    if (!pendingPayment) {
      throw new BadRequestException('No bill found for this order. Generate bill first.');
    }

    if (pendingPayment.paymentStatus === 'COMPLETED') {
      return { message: 'This order has already been paid.', paymentId: pendingPayment.id };
    }

    // If amountDue on the payment record is 0 (wallet fully covered the bill
    // at bill-generation time), no further payment action is needed.
    if (Number(pendingPayment.totalAmount) === 0) {
      return {
        message: 'Order fully paid via wallet credit at bill generation.',
        paymentId: pendingPayment.id,
        amountDue: 0,
      };
    }

    // For COD, skip Razorpay entirely
    if (dto.paymentMethod === PaymentMethod.COD) {
      const updated = await this.prisma.payment.update({
        where: { id: pendingPayment.id },
        data: { paymentMethod: PaymentMethod.COD },
      });
      return {
        paymentMethod: 'COD',
        message: 'Cash on delivery selected. Driver will collect payment.',
        paymentId: updated.id,
        amountDue: Number(pendingPayment.totalAmount),
      };
    }

    // For WALLET, check subscription balance
    if (dto.paymentMethod === PaymentMethod.WALLET) {
      return this.processWalletPayment(order, pendingPayment, user);
    }

    // For Razorpay (UPI / Card)
    const razorpayOrder = await this.razorpay.createOrder(
      Number(pendingPayment.totalAmount),
      order.orderNumber,
    );

    // Store Razorpay order ID on the payment record
    await this.prisma.payment.update({
      where: { id: pendingPayment.id },
      data: {
        paymentMethod: dto.paymentMethod,
        razorpayOrderId: razorpayOrder.id,
      },
    });

    const keyId = this.configService.get('RAZORPAY_KEY_ID', '');
    return {
      razorpayOrderId: razorpayOrder.id,
      keyId,               // used by frontend Razorpay SDK
      razorpayKeyId: keyId, // kept for backward compatibility
      amount: razorpayOrder.amount, // in paise
      currency: 'INR',
      orderNumber: order.orderNumber,
      paymentId: pendingPayment.id,
    };
  }

  // ============================================================
  // VERIFY RAZORPAY PAYMENT
  // ============================================================

  /**
   * Verifies the Razorpay signature and marks the payment as COMPLETED.
   * Advances order to READY_FOR_DISPATCH.
   */
  async verifyPayment(dto: VerifyPaymentDto, user: CurrentUser) {
    const isValid = this.razorpay.verifySignature(
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );

    if (!isValid) {
      throw new UnauthorizedException('Payment signature verification failed');
    }

    // Find the payment record by Razorpay order ID
    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId: dto.razorpayOrderId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found for this Razorpay order');
    }

    if (user.role === 'CUSTOMER' && payment.order.customerId !== user.userId) {
      throw new ForbiddenException('You do not own this order');
    }

    if (payment.paymentStatus === 'COMPLETED') {
      return { message: 'Payment already recorded', paymentId: payment.id };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: 'COMPLETED',
          razorpayPaymentId: dto.razorpayPaymentId,
          paidAt: new Date(),
        },
      });

      // Advance order to READY_FOR_DISPATCH
      await tx.order.update({
        where: { id: payment.orderId },
        data: { currentStatus: OrderStatus.READY_FOR_DISPATCH },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: OrderStatus.READY_FOR_DISPATCH,
          changedByUserId: user.userId,
          notes: `Payment completed via Razorpay (${dto.razorpayPaymentId})`,
        },
      });
    });

    this.logger.log(
      `✅ Payment verified for order #${payment.order.orderNumber}: ₹${payment.totalAmount}`,
    );

    return {
      message: 'Payment verified successfully',
      paymentId: payment.id,
      orderNumber: payment.order.orderNumber,
      amount: Number(payment.totalAmount),
    };
  }

  // ============================================================
  // RAZORPAY WEBHOOK
  // ============================================================

  /**
   * Handles Razorpay webhook events (payment.captured, payment.failed, etc.).
   * Verifies the X-Razorpay-Signature header before processing.
   */
  async handleWebhook(payload: Buffer, signature: string) {
    // Verify webhook authenticity
    if (this.webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      const sigBuffer = Buffer.from(signature, 'hex');
      const expBuffer = Buffer.from(expectedSignature, 'hex');

      // Guard against length-mismatch crash in timingSafeEqual
      const isValid =
        sigBuffer.length === expBuffer.length &&
        crypto.timingSafeEqual(expBuffer, sigBuffer);

      if (!isValid) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    } else {
      // Secret not configured — only allow in non-production environments
      const env = this.configService.get('NODE_ENV', 'development');
      if (env === 'production') {
        throw new UnauthorizedException('Webhook secret not configured');
      }
      this.logger.warn('⚠️  Webhook received without signature verification (dev mode)');
    }

    const event = JSON.parse(payload.toString());
    this.logger.log(`📥 Razorpay webhook: ${event.event}`);

    switch (event.event) {
      case 'payment.captured': {
        const rzpPaymentId = event.payload?.payment?.entity?.id;
        const rzpOrderId = event.payload?.payment?.entity?.order_id;
        if (rzpPaymentId && rzpOrderId) {
          await this.markPaymentComplete(rzpOrderId, rzpPaymentId);
        }
        break;
      }

      case 'payment.failed': {
        const rzpOrderId = event.payload?.payment?.entity?.order_id;
        if (rzpOrderId) {
          await this.markPaymentFailed(rzpOrderId);
        }
        break;
      }

      default:
        this.logger.debug(`Unhandled webhook event: ${event.event}`);
    }

    return { received: true };
  }

  // ============================================================
  // COD PAYMENT (Driver marks cash received)
  // ============================================================

  async markCodPaid(dto: CodPaymentDto, user: CurrentUser) {
    if (user.role !== 'DRIVER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only drivers or admin can mark COD payment');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { orderId: dto.orderId, paymentMethod: 'COD', paymentStatus: 'PENDING' },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('No pending COD payment found for this order');
    }

    // Verify driver is assigned to this order
    if (user.role === 'DRIVER') {
      const assignment = await this.prisma.deliveryAssignment.findFirst({
        where: { orderId: dto.orderId, driverId: user.userId },
      });
      if (!assignment) {
        throw new ForbiddenException('You are not assigned to this order');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { paymentStatus: 'COMPLETED', paidAt: new Date() },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: dto.orderId,
          status: payment.order.currentStatus,
          changedByUserId: user.userId,
          notes: dto.notes ?? 'COD payment collected by driver',
        },
      });
    });

    return { message: 'COD payment recorded successfully', paymentId: payment.id };
  }

  // ============================================================
  // PAYMENT HISTORY
  // ============================================================

  // ============================================================
  // ADMIN: PAYMENT AGGREGATE STATS
  // ============================================================

  async getStats() {
    const [completed, pending, refunded, total] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { paymentStatus: 'COMPLETED' },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      this.prisma.payment.count({ where: { paymentStatus: 'PENDING' } }),
      this.prisma.payment.count({ where: { paymentStatus: 'REFUNDED' } }),
      this.prisma.payment.count(),
    ]);
    return {
      totalRevenue: Number(completed._sum.totalAmount ?? 0),
      completedCount: completed._count._all,
      pendingCount: pending,
      refundedCount: refunded,
      totalCount: total,
    };
  }

  async getHistory(user: CurrentUser, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> =
      user.role === 'CUSTOMER'
        ? { order: { customerId: user.userId } }
        : user.role === 'FACILITY_STAFF' && user.facilityId
          ? { order: { facilityId: user.facilityId } }
          : {};

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              currentStatus: true,
              customer: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================================
  // ADMIN: PROCESS REFUND
  // ============================================================

  async processRefund(paymentId: number, reason: string, adminUserId: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) throw new NotFoundException(`Payment #${paymentId} not found`);

    if (payment.paymentStatus !== 'COMPLETED') {
      throw new BadRequestException('Can only refund completed payments');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: { paymentStatus: 'REFUNDED' },
      });

      await tx.refund.create({
        data: {
          paymentId,
          orderId: payment.orderId,
          amount: payment.totalAmount,
          reason,
          status: 'INITIATED',
          processedByUserId: adminUserId,
          processedAt: new Date(),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: OrderStatus.REFUND_INITIATED,
          changedByUserId: adminUserId,
          notes: `Refund initiated: ${reason}`,
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: { currentStatus: OrderStatus.REFUND_INITIATED },
      });
    });

    this.logger.log(`✅ Refund initiated for payment #${paymentId} by admin #${adminUserId}`);
    return { message: 'Refund initiated successfully', paymentId, orderId: payment.orderId };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async processWalletPayment(order: any, payment: any, user: CurrentUser) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { customerId: order.customerId, isActive: true },
    });

    if (!subscription || Number(subscription.walletBalance) <= 0) {
      throw new BadRequestException(
        'No active subscription wallet found or insufficient balance',
      );
    }

    const walletBalance = Number(subscription.walletBalance);
    const totalDue = Number(payment.totalAmount);

    if (walletBalance < totalDue) {
      throw new BadRequestException(
        `Insufficient wallet balance. ` +
          `Required: ₹${totalDue}, Available: ₹${walletBalance}. ` +
          'Please choose a different payment method for the remaining amount.',
      );
    }

    const newBalance = Math.round((walletBalance - totalDue) * 100) / 100;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          paymentMethod: PaymentMethod.WALLET,
          paymentStatus: 'COMPLETED',
          paidAt: new Date(),
        },
      });

      await tx.subscription.update({
        where: { id: subscription.id },
        data: { walletBalance: newBalance },
      });

      await tx.walletTransaction.create({
        data: {
          subscriptionId: subscription.id,
          orderId: order.id,
          transactionType: 'DEBIT',
          amount: totalDue,
          balanceAfter: newBalance,
          description: `Payment for order #${order.orderNumber}`,
        },
      });

      // Do NOT auto-advance order status — facility staff must explicitly
      // click "Mark Ready for Dispatch" after verifying the packed order.
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: order.currentStatus,
          changedByUserId: user.userId,
          notes: `Payment completed via wallet. New balance: ₹${newBalance}. Awaiting dispatch confirmation.`,
        },
      });
    });

    return {
      message: 'Payment completed via wallet',
      paymentId: payment.id,
      walletDeducted: totalDue,
      newWalletBalance: newBalance,
    };
  }

  private async markPaymentComplete(rzpOrderId: string, rzpPaymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId: rzpOrderId },
    });
    if (!payment || payment.paymentStatus === 'COMPLETED') return;

    await this.prisma.$transaction(async (tx) => {
      // Resolve a real admin user ID for the status-history record.
      // Webhook events are system-triggered (no authenticated user), so we find
      // the first active admin. Falls back to ID 1 only if none is found.
      const admin = await tx.user.findFirst({
        where: { role: { name: 'ADMIN' }, isActive: true },
        select: { id: true },
        orderBy: { id: 'asc' },
      });
      const systemUserId = admin?.id ?? 1;

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: 'COMPLETED',
          razorpayPaymentId: rzpPaymentId,
          paidAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: { currentStatus: OrderStatus.READY_FOR_DISPATCH },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: OrderStatus.READY_FOR_DISPATCH,
          changedByUserId: systemUserId,
          notes: `Payment captured via webhook (${rzpPaymentId})`,
        },
      });
    });

    this.logger.log(`✅ Webhook: payment captured for order #${payment.orderId}`);
  }

  private async markPaymentFailed(rzpOrderId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId: rzpOrderId },
    });
    if (!payment) return;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { paymentStatus: 'FAILED' },
    });

    this.logger.warn(`⚠️ Webhook: payment failed for order #${payment.orderId}`);
  }
}
