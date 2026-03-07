import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { PrismaService } from '../prisma/prisma.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal mock order for calculateBill tests */
function buildOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    serviceType: 'WASH_FOLD',
    finalWeight: null,
    initialWeight: '5.00',
    isExpress: false,
    orderItems: [] as Array<{ totalPrice: string | number; quantity: number }>,
    address: { cityId: 10 },
    subscription: null as null | { id: number; walletBalance: string | number; isActive: boolean },
    ...overrides,
  };
}

/** Build a minimal mock pricing config */
function buildPricing(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    serviceType: 'WASH_FOLD',
    cityId: null,
    pricePerKg: '80.00',
    minimumOrderValue: '0',
    expressDeliveryCharge: '50.00',
    pickupDeliveryChargeNonSubscriber: '40.00',
    isActive: true,
    ...overrides,
  };
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('PricingService – calculateBill', () => {
  let service: PricingService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      order: { findUnique: jest.fn() },
      payment: { findFirst: jest.fn() },
      pricingConfiguration: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      city: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  function setupMocks(
    order: ReturnType<typeof buildOrder>,
    pricing: ReturnType<typeof buildPricing> | null,
  ) {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(order);
    (prisma.payment.findFirst as jest.Mock).mockResolvedValue(null); // no existing bill
    // resolvePricing: city-specific first → null, then global → pricing
    (prisma.pricingConfiguration.findFirst as jest.Mock)
      .mockResolvedValueOnce(null)    // city-specific lookup
      .mockResolvedValueOnce(pricing); // global fallback
  }

  // ── ORDER NOT FOUND ────────────────────────────────────────────────────────

  it('throws NotFoundException when order does not exist', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.calculateBill(999)).rejects.toThrow(NotFoundException);
  });

  // ── ALREADY BILLED ────────────────────────────────────────────────────────

  it('throws ConflictException when a non-failed payment already exists', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(buildOrder());
    (prisma.payment.findFirst as jest.Mock).mockResolvedValue({ id: 5, paymentStatus: 'PENDING' });
    await expect(service.calculateBill(1)).rejects.toThrow(ConflictException);
  });

  // ── NO PRICING CONFIG ─────────────────────────────────────────────────────

  it('throws BadRequestException when no pricing config found', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(buildOrder());
    (prisma.payment.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.pricingConfiguration.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(service.calculateBill(1)).rejects.toThrow(BadRequestException);
  });

  // ── WEIGHT-BASED BILLING (core math) ──────────────────────────────────────

  describe('weight-based billing', () => {
    it('calculates correctly for a simple 5 kg standard order', async () => {
      const order = buildOrder({ initialWeight: '5.00', finalWeight: null });
      setupMocks(order, buildPricing({ pricePerKg: '80.00', minimumOrderValue: '0' }));

      const bill = await service.calculateBill(1);

      // serviceCharge = 5 × 80 = 400
      expect(bill.serviceCharge).toBe(400);
      expect(bill.billingMode).toBe('WEIGHT');
      // no express, no subscriber charge
      expect(bill.expressCharge).toBe(0);
      expect(bill.pickupDeliveryCharge).toBe(40); // non-subscriber
      // subtotal = 440
      expect(bill.subtotal).toBe(440);
      // GST = 440 × 0.18 = 79.20
      expect(bill.gstAmount).toBe(79.2);
      // totalAmount = 519.20
      expect(bill.totalAmount).toBe(519.2);
      // no wallet
      expect(bill.walletDeduction).toBe(0);
      expect(bill.amountDue).toBe(519.2);
      expect(bill.minimumApplied).toBe(false);
    });

    it('uses finalWeight over initialWeight when both present', async () => {
      const order = buildOrder({ initialWeight: '5.00', finalWeight: '6.50' });
      setupMocks(order, buildPricing({ pricePerKg: '80.00', minimumOrderValue: '0' }));

      const bill = await service.calculateBill(1);

      // serviceCharge = 6.5 × 80 = 520
      expect(bill.serviceCharge).toBe(520);
    });

    it('throws BadRequestException when weight is missing', async () => {
      const order = buildOrder({ initialWeight: null, finalWeight: null });
      setupMocks(order, buildPricing({ pricePerKg: '80.00' }));
      await expect(service.calculateBill(1)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when pricePerKg is 0 and not using item billing', async () => {
      const order = buildOrder({ initialWeight: '3.00' });
      setupMocks(order, buildPricing({ pricePerKg: '0' }));
      await expect(service.calculateBill(1)).rejects.toThrow(BadRequestException);
    });
  });

  // ── EXPRESS SURCHARGE ────────────────────────────────────────────────────

  describe('express surcharge', () => {
    it('adds expressDeliveryCharge for express orders', async () => {
      const order = buildOrder({ initialWeight: '5.00', isExpress: true });
      setupMocks(order, buildPricing({ pricePerKg: '80.00', expressDeliveryCharge: '50.00' }));

      const bill = await service.calculateBill(1);

      expect(bill.expressCharge).toBe(50);
      // subtotal = 400 (service) + 50 (express) + 40 (pickup) = 490
      expect(bill.subtotal).toBe(490);
    });

    it('does not add express charge for non-express orders', async () => {
      const order = buildOrder({ initialWeight: '5.00', isExpress: false });
      setupMocks(order, buildPricing({ pricePerKg: '80.00', expressDeliveryCharge: '50.00' }));

      const bill = await service.calculateBill(1);
      expect(bill.expressCharge).toBe(0);
    });
  });

  // ── SUBSCRIBER vs. NON-SUBSCRIBER ────────────────────────────────────────

  describe('pickup & delivery charge', () => {
    it('waives pickup charge for active subscribers', async () => {
      const order = buildOrder({
        initialWeight: '5.00',
        subscription: { id: 1, walletBalance: '0', isActive: true },
      });
      setupMocks(order, buildPricing({ pricePerKg: '80.00', pickupDeliveryChargeNonSubscriber: '40.00' }));

      const bill = await service.calculateBill(1);
      expect(bill.pickupDeliveryCharge).toBe(0);
    });

    it('charges pickup fee for non-subscribers', async () => {
      const order = buildOrder({ initialWeight: '5.00', subscription: null });
      setupMocks(order, buildPricing({ pricePerKg: '80.00', pickupDeliveryChargeNonSubscriber: '40.00' }));

      const bill = await service.calculateBill(1);
      expect(bill.pickupDeliveryCharge).toBe(40);
    });

    it('charges pickup fee for inactive subscribers', async () => {
      const order = buildOrder({
        initialWeight: '5.00',
        subscription: { id: 2, walletBalance: '500', isActive: false },
      });
      setupMocks(order, buildPricing({ pricePerKg: '80.00', pickupDeliveryChargeNonSubscriber: '40.00' }));

      const bill = await service.calculateBill(1);
      expect(bill.pickupDeliveryCharge).toBe(40);
    });
  });

  // ── MINIMUM ORDER VALUE ──────────────────────────────────────────────────

  describe('minimum order value enforcement', () => {
    it('enforces minimumOrderValue when subtotal is below threshold', async () => {
      // 1 kg × ₹80 = ₹80 service charge + ₹40 pickup = ₹120 raw subtotal
      // minimum = ₹200 → subtotal bumped to ₹200
      const order = buildOrder({ initialWeight: '1.00', subscription: null });
      setupMocks(
        order,
        buildPricing({ pricePerKg: '80.00', minimumOrderValue: '200', pickupDeliveryChargeNonSubscriber: '40.00' }),
      );

      const bill = await service.calculateBill(1);

      expect(bill.minimumApplied).toBe(true);
      expect(bill.subtotal).toBe(200);
      // GST on 200 = 36
      expect(bill.gstAmount).toBe(36);
      expect(bill.totalAmount).toBe(236);
    });

    it('does NOT apply minimum when subtotal already exceeds it', async () => {
      // 5 kg × ₹80 = ₹400 + ₹40 pickup = ₹440 > ₹200 minimum
      const order = buildOrder({ initialWeight: '5.00', subscription: null });
      setupMocks(
        order,
        buildPricing({ pricePerKg: '80.00', minimumOrderValue: '200', pickupDeliveryChargeNonSubscriber: '40.00' }),
      );

      const bill = await service.calculateBill(1);
      expect(bill.minimumApplied).toBe(false);
      expect(bill.subtotal).toBe(440);
    });
  });

  // ── WALLET DEDUCTION ────────────────────────────────────────────────────

  describe('wallet deduction (subscription)', () => {
    it('deducts full wallet balance when wallet < totalAmount', async () => {
      // 5 kg × ₹80 = ₹400 + ₹0 pickup (subscriber) = ₹400 subtotal
      // GST = ₹72 → total = ₹472
      // wallet = ₹200 → deduction = ₹200, amountDue = ₹272
      const order = buildOrder({
        initialWeight: '5.00',
        subscription: { id: 1, walletBalance: '200', isActive: true },
      });
      setupMocks(order, buildPricing({ pricePerKg: '80.00', pickupDeliveryChargeNonSubscriber: '40.00' }));

      const bill = await service.calculateBill(1);

      expect(bill.walletDeduction).toBe(200);
      expect(bill.amountDue).toBe(bill.totalAmount - 200);
    });

    it('caps wallet deduction at totalAmount (full prepay)', async () => {
      // 2 kg × ₹80 = ₹160, subscriber (no pickup), total ≈ ₹188.80
      // wallet = ₹500 → deduction capped at totalAmount → amountDue = 0
      const order = buildOrder({
        initialWeight: '2.00',
        subscription: { id: 1, walletBalance: '500', isActive: true },
      });
      setupMocks(order, buildPricing({ pricePerKg: '80.00', pickupDeliveryChargeNonSubscriber: '40.00' }));

      const bill = await service.calculateBill(1);

      expect(bill.walletDeduction).toBe(bill.totalAmount);
      expect(bill.amountDue).toBe(0);
    });

    it('skips wallet deduction when subscription is inactive', async () => {
      const order = buildOrder({
        initialWeight: '5.00',
        subscription: { id: 1, walletBalance: '500', isActive: false },
      });
      setupMocks(order, buildPricing({ pricePerKg: '80.00', pickupDeliveryChargeNonSubscriber: '40.00' }));

      const bill = await service.calculateBill(1);
      expect(bill.walletDeduction).toBe(0);
      expect(bill.amountDue).toBe(bill.totalAmount);
    });
  });

  // ── GST CALCULATION ──────────────────────────────────────────────────────

  describe('GST at 18%', () => {
    it('GST = subtotal × 0.18 rounded to 2 dp', async () => {
      // 3.33 kg × ₹80 = ₹266.40 + ₹40 = ₹306.40
      // GST = 306.40 × 0.18 = 55.152 → rounds to 55.15
      const order = buildOrder({ initialWeight: '3.33', subscription: null });
      setupMocks(order, buildPricing({ pricePerKg: '80.00', minimumOrderValue: '0', pickupDeliveryChargeNonSubscriber: '40.00' }));

      const bill = await service.calculateBill(1);

      expect(bill.gstAmount).toBe(Math.round(bill.subtotal * 18) / 100);
    });

    it('totalAmount = subtotal + gstAmount', async () => {
      const order = buildOrder({ initialWeight: '5.00', subscription: null });
      setupMocks(order, buildPricing({ pricePerKg: '80.00', pickupDeliveryChargeNonSubscriber: '40.00' }));

      const bill = await service.calculateBill(1);
      expect(bill.totalAmount).toBeCloseTo(bill.subtotal + bill.gstAmount, 2);
    });
  });

  // ── ITEM-BASED BILLING ──────────────────────────────────────────────────

  describe('item-based billing', () => {
    it('sums orderItems totalPrice and sets billingMode to ITEM', async () => {
      const order = buildOrder({
        initialWeight: '2.00',
        subscription: null,
        orderItems: [
          { totalPrice: '150.00', quantity: 1 },
          { totalPrice: '300.00', quantity: 2 },
        ],
      });
      setupMocks(order, buildPricing({ pricePerKg: '80.00', pickupDeliveryChargeNonSubscriber: '40.00' }));

      const bill = await service.calculateBill(1, /* useItemBilling */ true);

      expect(bill.billingMode).toBe('ITEM');
      expect(bill.serviceCharge).toBe(450); // 150 + 300
      expect(bill.itemCount).toBe(3);        // 1 + 2
    });

    it('falls back to weight billing when orderItems is empty', async () => {
      const order = buildOrder({ initialWeight: '3.00', orderItems: [] });
      setupMocks(order, buildPricing({ pricePerKg: '80.00', pickupDeliveryChargeNonSubscriber: '40.00' }));

      const bill = await service.calculateBill(1, true);
      // No items → falls back to weight
      expect(bill.billingMode).toBe('WEIGHT');
      expect(bill.serviceCharge).toBe(240); // 3 × 80
    });
  });

  // ── ROUNDING ────────────────────────────────────────────────────────────

  describe('rounding', () => {
    it('all monetary values are rounded to exactly 2 decimal places', async () => {
      const order = buildOrder({ initialWeight: '1.33', subscription: null });
      setupMocks(
        order,
        buildPricing({ pricePerKg: '79.99', pickupDeliveryChargeNonSubscriber: '37.50', minimumOrderValue: '0' }),
      );

      const bill = await service.calculateBill(1);

      for (const key of ['serviceCharge', 'expressCharge', 'pickupDeliveryCharge', 'subtotal', 'gstAmount', 'totalAmount', 'walletDeduction', 'amountDue'] as const) {
        const val = bill[key];
        expect(Number.isFinite(val)).toBe(true);
        expect(Math.round(val * 100) / 100).toBe(val);
      }
    });
  });
});
