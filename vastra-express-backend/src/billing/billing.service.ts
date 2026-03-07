import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from './pricing.service';
import { OrderStatus } from '../orders/enums/order-status.enum';

interface CurrentUser {
  userId: number;
  role: string;
  facilityId?: number | null;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  // ============================================================
  // GENERATE FINAL BILL
  // ============================================================

  /**
   * Generates the final bill for an order.
   * - Calculates charges via PricingService
   * - Creates a Payment record (PENDING)
   * - Advances order status to BILL_GENERATED
   * - Logs wallet deduction as a WalletTransaction if applicable
   *
   * Bill can only be generated when order is in PACKING status.
   */
  async generateBill(orderId: number, user: CurrentUser, useItemBilling = false) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        subscription: true,
        address: { include: { city: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Authorization: only Facility Staff for their own facility, or Admin
    if (user.role === 'FACILITY_STAFF' && order.facilityId !== user.facilityId) {
      throw new ForbiddenException('Order is not at your facility');
    }
    if (user.role === 'CUSTOMER' || user.role === 'DRIVER') {
      throw new ForbiddenException('Only facility staff or admin can generate bills');
    }

    // Bill can be generated once the order is received at the facility and weighed
    const BILLABLE_STATUSES: OrderStatus[] = [
      OrderStatus.RECEIVED_AT_FACILITY,
      OrderStatus.SORTING,
      OrderStatus.WASHING,
      OrderStatus.IRONING,
      OrderStatus.PACKING,
    ];
    if (!BILLABLE_STATUSES.includes(order.currentStatus as OrderStatus)) {
      throw new BadRequestException(
        `Bill can only be generated once the order is at the facility for processing. ` +
          `Current status: ${order.currentStatus}`,
      );
    }

    // Final weight must be recorded before billing
    if (!order.finalWeight) {
      throw new BadRequestException(
        'Final weight must be entered before generating a bill. ' +
          'Please weigh the laundry and save the weight first.',
      );
    }

    // Calculate bill using PricingService
    const bill = await this.pricingService.calculateBill(orderId, useItemBilling);

    // Persist bill + advance status atomically
    const result = await this.prisma.$transaction(async (tx) => {
      // FIX: Store amountDue (after wallet pre-deduction) as totalAmount so that
      // subsequent payment steps deduct the CORRECT remaining amount from wallet/Razorpay.
      // Storing bill.totalAmount here caused a double-deduction: once at bill generation
      // and again in processWalletPayment which reads payment.totalAmount.
      const isFullyPaidByWallet = bill.amountDue === 0 && bill.walletDeduction > 0;

      // 1. Create the Payment record — totalAmount = what customer still needs to pay
      const payment = await tx.payment.create({
        data: {
          orderId,
          // Default to COD; customer can switch to Razorpay/Wallet when they choose to pay online
          paymentMethod: isFullyPaidByWallet ? 'WALLET' : 'COD',
          paymentStatus: isFullyPaidByWallet ? 'COMPLETED' : 'PENDING',
          amount: bill.subtotal - bill.expressCharge, // service + pickup charges only (excluding express)
          expressCharge: bill.expressCharge,           // stored separately for bill breakdown display
          walletDiscount: bill.walletDeduction,        // pre-deducted subscription wallet amount
          gstAmount: bill.gstAmount,
          totalAmount: bill.amountDue, // ← amountDue (not totalAmount) prevents double-deduction
          ...(isFullyPaidByWallet && { paidAt: new Date() }),
        },
      });

      // 2. Log wallet deduction if applicable
      if (bill.walletDeduction > 0 && order.subscription) {
        const newBalance = Number(order.subscription.walletBalance) - bill.walletDeduction;

        await tx.subscription.update({
          where: { id: order.subscription.id },
          data: { walletBalance: newBalance },
        });

        await tx.walletTransaction.create({
          data: {
            subscriptionId: order.subscription.id,
            orderId,
            transactionType: 'DEBIT',
            amount: bill.walletDeduction,
            balanceAfter: newBalance,
            description: `Wallet deduction for order #${order.orderNumber}`,
          },
        });
      }

      // 3. Always advance to BILL_GENERATED so facility staff can
      //    explicitly click "Mark Ready for Dispatch" after verifying the order.
      const nextStatus = OrderStatus.BILL_GENERATED;

      await tx.order.update({
        where: { id: orderId },
        data: { currentStatus: nextStatus },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: nextStatus,
          changedByUserId: user.userId,
          notes: bill.walletDeduction > 0
            ? `Bill generated — fully paid via wallet (₹${bill.walletDeduction} deducted, ${bill.billingMode}-based). Awaiting dispatch.`
            : `Bill generated — ₹${bill.amountDue} due via COD (${bill.billingMode}-based)`,
        },
      });

      return payment;
    });

    this.logger.log(
      `✅ Bill generated for order #${order.orderNumber}: ₹${bill.amountDue} due` +
        (bill.walletDeduction > 0 ? ` (wallet pre-deducted ₹${bill.walletDeduction})` : ''),
    );

    return {
      orderId,
      orderNumber: order.orderNumber,
      paymentId: result.id,
      fullyPaidByWallet: bill.amountDue === 0 && bill.walletDeduction > 0,
      breakdown: bill,
    };
  }

  // ============================================================
  // GET GST INVOICE
  // ============================================================

  /**
   * Returns a full GST-compliant invoice for a billed order.
   */
  async getInvoice(orderId: number, user: CurrentUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { id: true, name: true, mobileNumber: true, email: true } },
        address: { include: { city: true } },
        facility: { select: { id: true, name: true, contactNumber: true, address: true } },
        pickupSlot: { select: { slotDate: true, startTime: true, endTime: true } },
        orderItems: { orderBy: { createdAt: 'asc' } },
        payments: {
          where: { paymentStatus: { not: 'FAILED' } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Access check
    if (user.role === 'CUSTOMER' && order.customerId !== user.userId) {
      throw new ForbiddenException('You do not own this order');
    }
    if (user.role === 'FACILITY_STAFF' && order.facilityId !== user.facilityId) {
      throw new ForbiddenException('Order is not at your facility');
    }

    const payment = order.payments[0];
    if (!payment) {
      throw new BadRequestException(
        'Bill has not been generated for this order yet. Status: ' + order.currentStatus,
      );
    }

    return this.formatInvoice(order, payment);
  }

  // ============================================================
  // PREVIEW BILL (without saving)
  // ============================================================

  /**
   * Returns a bill preview without persisting anything.
   * Useful for the facility to review before finalizing.
   */
  async previewBill(orderId: number, user: CurrentUser, useItemBilling = false) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    if (user.role === 'CUSTOMER' || user.role === 'DRIVER') {
      throw new ForbiddenException('Access denied');
    }
    if (user.role === 'FACILITY_STAFF' && order.facilityId !== user.facilityId) {
      throw new ForbiddenException('Order is not at your facility');
    }

    const bill = await this.pricingService.calculateBill(orderId, useItemBilling);

    return {
      orderId,
      orderNumber: order.orderNumber,
      preview: true,
      breakdown: bill,
    };
  }

  // ============================================================
  // FORMATTER
  // ============================================================

  private formatInvoice(order: any, payment: any) {
    const invoiceDate = payment.createdAt;

    // Build line items for the invoice
    const lineItems =
      order.orderItems.length > 0
        ? order.orderItems.map((item: any) => ({
            description: `${item.itemName} (${item.serviceType})`,
            quantity: item.quantity,
            unitPrice: Number(item.pricePerItem),
            totalPrice: Number(item.totalPrice),
          }))
        : [
            {
              description: `${order.serviceType} service`,
              quantity: 1,
              unitPrice: Number(payment.amount),
              totalPrice: Number(payment.amount),
            },
          ];

    return {
      invoiceNumber: `INV-${order.orderNumber}`,
      invoiceDate,

      // Business details (Vastra Express)
      seller: {
        name: 'Vastra Express',
        gstNumber: 'TO-BE-CONFIGURED', // Set in .env for production
        address: order.facility?.address ?? '',
        contactNumber: order.facility?.contactNumber ?? '',
      },

      // Customer details
      customer: {
        name: order.customer.name,
        mobile: order.customer.mobileNumber,
        email: order.customer.email ?? null,
        address: [
          order.address.houseFlatNo,
          order.address.street,
          order.address.landmark,
          order.address.city?.name,
          order.address.pincode,
        ]
          .filter(Boolean)
          .join(', '),
      },

      // Order details
      order: {
        orderNumber: order.orderNumber,
        serviceType: order.serviceType,
        isExpress: order.isExpress,
        status: order.currentStatus,
        pickupDate: order.pickupSlot?.slotDate ?? null,
        pickupTime: order.pickupSlot
          ? `${order.pickupSlot.startTime} – ${order.pickupSlot.endTime}`
          : null,
      },

      // Line items
      lineItems,

      // Billing summary
      // originalTotal = what the full bill was (subtotal + GST)
      // walletDeduction = how much the subscription wallet covered (0 if none)
      // totalAmount = what was actually charged to the customer
      billing: {
        subtotal: Number(payment.amount),
        gstRate: '18%',
        gstAmount: Number(payment.gstAmount),
        originalTotal: Math.round((Number(payment.amount) + Number(payment.gstAmount)) * 100) / 100,
        walletDeduction: Math.round((Number(payment.amount) + Number(payment.gstAmount) - Number(payment.totalAmount)) * 100) / 100,
        totalAmount: Number(payment.totalAmount),
        paymentStatus: payment.paymentStatus,
        paymentMethod: payment.paymentMethod,
        paidAt: payment.paidAt ?? null,
      },
    };
  }
}
