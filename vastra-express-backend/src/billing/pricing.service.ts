import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePricingDto } from './dto/billing.dto';

const GST_RATE = 0.18; // 18%

export interface BillBreakdown {
  serviceCharge: number;   // Weight-based OR item-based charge
  expressCharge: number;   // Extra for express orders
  pickupDeliveryCharge: number; // For non-subscribers
  subtotal: number;        // serviceCharge + expressCharge + pickupDeliveryCharge
  gstAmount: number;       // GST on subtotal
  totalAmount: number;     // subtotal + gstAmount (before wallet deduction)
  walletDeduction: number; // Amount deducted from subscription wallet
  amountDue: number;       // totalAmount - walletDeduction (what customer actually pays)
  minimumApplied: boolean; // true if minimum order rule was enforced
  billingMode: 'WEIGHT' | 'ITEM';
  itemCount?: number;
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // COMPUTE BILL FOR AN ORDER
  // ============================================================

  /**
   * Calculate the full bill breakdown for an order.
   * Does NOT persist anything — pure calculation.
   * Call saveBill() to write the Payment record.
   */
  async calculateBill(orderId: number, useItemBilling = false): Promise<BillBreakdown> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
        address: { include: { city: true } },
        subscription: { select: { id: true, walletBalance: true, isActive: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Prevent re-billing
    const existingPayment = await this.prisma.payment.findFirst({
      where: { orderId, paymentStatus: { not: 'FAILED' } },
    });
    if (existingPayment) {
      throw new ConflictException('Bill already generated for this order');
    }

    // Fetch applicable pricing config (city-specific falls back to global)
    const cityId = order.address.cityId;
    const pricing = await this.resolvePricing(order.serviceType, cityId);

    if (!pricing) {
      throw new BadRequestException(
        `No pricing configuration found for service type '${order.serviceType}'. ` +
          'Please ask an admin to configure pricing first.',
      );
    }

    // ── CALCULATE SERVICE CHARGE ─────────────────────────────────────────────
    let serviceCharge = 0;
    let billingMode: 'WEIGHT' | 'ITEM' = 'WEIGHT';
    let itemCount: number | undefined;

    if (useItemBilling && order.orderItems.length > 0) {
      // Item-based billing: sum all item totalPrices
      serviceCharge = order.orderItems.reduce(
        (sum, item) => sum + Number(item.totalPrice),
        0,
      );
      billingMode = 'ITEM';
      itemCount = order.orderItems.reduce((n, item) => n + item.quantity, 0);
    } else {
      // Weight-based billing: finalWeight × pricePerKg
      const weight = order.finalWeight ?? order.initialWeight;
      if (!weight) {
        throw new BadRequestException(
          'Order weight not recorded. Update the weight before generating a bill.',
        );
      }
      const pricePerKg = Number(pricing.pricePerKg ?? 0);
      if (pricePerKg === 0) {
        throw new BadRequestException(
          `No per-kg rate configured for '${order.serviceType}'. Use item billing instead.`,
        );
      }
      serviceCharge = Number(weight) * pricePerKg;
      billingMode = 'WEIGHT';
    }

    // ── ADDITIONAL CHARGES ────────────────────────────────────────────────────
    const expressCharge = order.isExpress ? Number(pricing.expressDeliveryCharge) : 0;

    // Pickup & delivery charge: free for active subscribers
    const hasActiveSubscription = order.subscription?.isActive === true;
    const pickupDeliveryCharge = hasActiveSubscription
      ? 0
      : Number(pricing.pickupDeliveryChargeNonSubscriber);

    // ── MINIMUM ORDER VALUE ───────────────────────────────────────────────────
    const minimumOrderValue = Number(pricing.minimumOrderValue);
    const rawSubtotal = serviceCharge + expressCharge + pickupDeliveryCharge;
    const subtotal = Math.max(rawSubtotal, minimumOrderValue);
    const minimumApplied = subtotal > rawSubtotal;

    // ── GST ───────────────────────────────────────────────────────────────────
    const gstAmount = this.roundToTwoDecimals(subtotal * GST_RATE);
    const totalAmount = this.roundToTwoDecimals(subtotal + gstAmount);

    // ── WALLET DEDUCTION (subscription) ──────────────────────────────────────
    let walletDeduction = 0;
    if (order.subscription?.isActive && Number(order.subscription.walletBalance) > 0) {
      walletDeduction = Math.min(
        Number(order.subscription.walletBalance),
        totalAmount,
      );
      walletDeduction = this.roundToTwoDecimals(walletDeduction);
    }

    const amountDue = this.roundToTwoDecimals(totalAmount - walletDeduction);

    this.logger.debug(
      `Bill for order ${orderId}: service=₹${serviceCharge}, express=₹${expressCharge}, ` +
        `pickup=₹${pickupDeliveryCharge}, subtotal=₹${subtotal}, GST=₹${gstAmount}, ` +
        `total=₹${totalAmount}, wallet=-₹${walletDeduction}, due=₹${amountDue}`,
    );

    return {
      serviceCharge: this.roundToTwoDecimals(serviceCharge),
      expressCharge: this.roundToTwoDecimals(expressCharge),
      pickupDeliveryCharge: this.roundToTwoDecimals(pickupDeliveryCharge),
      subtotal: this.roundToTwoDecimals(subtotal),
      gstAmount,
      totalAmount,
      walletDeduction,
      amountDue,
      minimumApplied,
      billingMode,
      ...(itemCount !== undefined && { itemCount }),
    };
  }

  // ============================================================
  // GET PRICING CONFIG
  // ============================================================

  async getPricing(serviceType?: string) {
    const where = serviceType ? { serviceType, isActive: true } : { isActive: true };
    const configs = await this.prisma.pricingConfiguration.findMany({
      where,
      include: { city: { select: { id: true, name: true, state: true } } },
      orderBy: [{ serviceType: 'asc' }, { cityId: 'asc' }],
    });
    return configs;
  }

  // ============================================================
  // UPDATE / CREATE PRICING CONFIG
  // ============================================================

  async upsertPricing(dto: UpdatePricingDto) {
    // Validate cityId if provided
    if (dto.cityId) {
      const city = await this.prisma.city.findUnique({ where: { id: dto.cityId } });
      if (!city || !city.isActive) {
        throw new NotFoundException(`City #${dto.cityId} not found or inactive`);
      }
    }

    // For item-based pricing, itemName + pricePerItem must both be present
    if (dto.itemName && dto.pricePerItem === undefined) {
      throw new BadRequestException('pricePerItem is required when itemName is provided');
    }
    if (dto.pricePerItem !== undefined && !dto.itemName) {
      throw new BadRequestException('itemName is required when pricePerItem is provided');
    }

    // Find existing config to upsert
    const existing = await this.prisma.pricingConfiguration.findFirst({
      where: {
        serviceType: dto.serviceType,
        cityId: dto.cityId ?? null,
        ...(dto.itemName ? { itemName: dto.itemName } : {}),
      },
    });

    const data: any = {
      serviceType: dto.serviceType,
      cityId: dto.cityId ?? null,
      effectiveFrom: new Date(),
      isActive: true,
      ...(dto.pricePerKg !== undefined && { pricePerKg: dto.pricePerKg }),
      ...(dto.itemName !== undefined && { itemName: dto.itemName }),
      ...(dto.pricePerItem !== undefined && { pricePerItem: dto.pricePerItem }),
      ...(dto.minimumOrderValue !== undefined && { minimumOrderValue: dto.minimumOrderValue }),
      ...(dto.expressDeliveryCharge !== undefined && {
        expressDeliveryCharge: dto.expressDeliveryCharge,
      }),
      ...(dto.pickupDeliveryChargeNonSubscriber !== undefined && {
        pickupDeliveryChargeNonSubscriber: dto.pickupDeliveryChargeNonSubscriber,
      }),
    };

    if (existing) {
      return this.prisma.pricingConfiguration.update({
        where: { id: existing.id },
        data,
        include: { city: { select: { id: true, name: true } } },
      });
    }

    // Validate required fields for a new record
    if (!data.expressDeliveryCharge && data.expressDeliveryCharge !== 0) {
      throw new BadRequestException(
        'expressDeliveryCharge is required for new pricing configurations',
      );
    }
    if (!data.pickupDeliveryChargeNonSubscriber && data.pickupDeliveryChargeNonSubscriber !== 0) {
      throw new BadRequestException(
        'pickupDeliveryChargeNonSubscriber is required for new pricing configurations',
      );
    }

    return this.prisma.pricingConfiguration.create({
      data,
      include: { city: { select: { id: true, name: true } } },
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Resolve pricing config: city-specific first, then global (cityId = NULL).
   */
  private async resolvePricing(serviceType: string, cityId: number) {
    // Try city-specific first
    const cityPricing = await this.prisma.pricingConfiguration.findFirst({
      where: { serviceType, cityId, isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    });
    if (cityPricing) return cityPricing;

    // Fall back to global
    return this.prisma.pricingConfiguration.findFirst({
      where: { serviceType, cityId: null, isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  private roundToTwoDecimals(n: number): number {
    return Math.round(n * 100) / 100;
  }
}
