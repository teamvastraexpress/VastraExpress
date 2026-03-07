import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStateMachineService, UserRole } from './order-state-machine.service';
import { OrderStatus } from './enums/order-status.enum';

describe('OrderStateMachineService', () => {
  let service: OrderStateMachineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderStateMachineService],
    }).compile();

    service = module.get<OrderStateMachineService>(OrderStateMachineService);
  });

  // ── VALID TRANSITIONS ────────────────────────────────────────────────────

  describe('validateTransition – happy path (main flow)', () => {
    const mainFlow: Array<{ from: OrderStatus; to: OrderStatus; role: UserRole }> = [
      { from: OrderStatus.ORDER_CREATED,         to: OrderStatus.ORDER_CONFIRMED,       role: 'ADMIN' },
      { from: OrderStatus.ORDER_CONFIRMED,        to: OrderStatus.PICKUP_SCHEDULED,      role: 'FACILITY_STAFF' },
      { from: OrderStatus.PICKUP_SCHEDULED,       to: OrderStatus.PICKUP_ASSIGNED,       role: 'ADMIN' },
      { from: OrderStatus.PICKUP_ASSIGNED,        to: OrderStatus.OUT_FOR_PICKUP,        role: 'DRIVER' },
      { from: OrderStatus.OUT_FOR_PICKUP,         to: OrderStatus.PICKUP_ARRIVED,        role: 'DRIVER' },
      { from: OrderStatus.PICKUP_ARRIVED,         to: OrderStatus.PICKED_UP,             role: 'DRIVER' },
      { from: OrderStatus.PICKED_UP,              to: OrderStatus.RECEIVED_AT_FACILITY,  role: 'FACILITY_STAFF' },
      { from: OrderStatus.RECEIVED_AT_FACILITY,   to: OrderStatus.SORTING,               role: 'FACILITY_STAFF' },
      { from: OrderStatus.SORTING,                to: OrderStatus.WASHING,               role: 'FACILITY_STAFF' },
      { from: OrderStatus.WASHING,                to: OrderStatus.IRONING,               role: 'FACILITY_STAFF' },
      { from: OrderStatus.IRONING,                to: OrderStatus.PACKING,               role: 'FACILITY_STAFF' },
      { from: OrderStatus.PACKING,                to: OrderStatus.BILL_GENERATED,        role: 'FACILITY_STAFF' },
      { from: OrderStatus.BILL_GENERATED,         to: OrderStatus.READY_FOR_DISPATCH,    role: 'ADMIN' },
      { from: OrderStatus.READY_FOR_DISPATCH,     to: OrderStatus.DELIVERY_ASSIGNED,     role: 'FACILITY_STAFF' },
      { from: OrderStatus.DELIVERY_ASSIGNED,      to: OrderStatus.OUT_FOR_DELIVERY,      role: 'DRIVER' },
      { from: OrderStatus.OUT_FOR_DELIVERY,       to: OrderStatus.DELIVERY_ARRIVED,      role: 'DRIVER' },
      { from: OrderStatus.DELIVERY_ARRIVED,       to: OrderStatus.DELIVERED,             role: 'DRIVER' },
      { from: OrderStatus.DELIVERED,              to: OrderStatus.REFUND_INITIATED,      role: 'ADMIN' },
    ];

    it.each(mainFlow)(
      '$from → $to as $role should be valid',
      ({ from, to, role }) => {
        expect(() => service.validateTransition(from, to, role)).not.toThrow();
      },
    );
  });

  describe('validateTransition – cancellation flow', () => {
    it('CUSTOMER can cancel ORDER_CREATED', () => {
      expect(() =>
        service.validateTransition(OrderStatus.ORDER_CREATED, OrderStatus.CANCELLED, 'CUSTOMER'),
      ).not.toThrow();
    });

    it('CUSTOMER can cancel ORDER_CONFIRMED', () => {
      expect(() =>
        service.validateTransition(OrderStatus.ORDER_CONFIRMED, OrderStatus.CANCELLED, 'CUSTOMER'),
      ).not.toThrow();
    });

    it('CUSTOMER can cancel PICKUP_SCHEDULED', () => {
      expect(() =>
        service.validateTransition(OrderStatus.PICKUP_SCHEDULED, OrderStatus.CANCELLED, 'CUSTOMER'),
      ).not.toThrow();
    });

    it('CUSTOMER cannot cancel once OUT_FOR_PICKUP', () => {
      expect(() =>
        service.validateTransition(OrderStatus.OUT_FOR_PICKUP, OrderStatus.CANCELLED, 'CUSTOMER'),
      ).toThrow(BadRequestException);
    });

    it('ADMIN can cancel OUT_FOR_PICKUP', () => {
      expect(() =>
        service.validateTransition(OrderStatus.OUT_FOR_PICKUP, OrderStatus.CANCELLED, 'ADMIN'),
      ).not.toThrow();
    });

    it('Nobody can cancel after PICKED_UP', () => {
      const roles: UserRole[] = ['CUSTOMER', 'ADMIN', 'FACILITY_STAFF', 'DRIVER'];
      for (const role of roles) {
        expect(() =>
          service.validateTransition(OrderStatus.PICKED_UP, OrderStatus.CANCELLED, role),
        ).toThrow(BadRequestException);
      }
    });
  });

  describe('validateTransition – exception / recovery flows', () => {
    it('DRIVER can mark OUT_FOR_PICKUP as PICKUP_FAILED', () => {
      expect(() =>
        service.validateTransition(OrderStatus.OUT_FOR_PICKUP, OrderStatus.PICKUP_FAILED, 'DRIVER'),
      ).not.toThrow();
    });

    it('ADMIN can reschedule from PICKUP_FAILED', () => {
      expect(() =>
        service.validateTransition(OrderStatus.PICKUP_FAILED, OrderStatus.PICKUP_SCHEDULED, 'ADMIN'),
      ).not.toThrow();
    });

    it('DRIVER can mark OUT_FOR_DELIVERY as DELIVERY_FAILED', () => {
      expect(() =>
        service.validateTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERY_FAILED, 'DRIVER'),
      ).not.toThrow();
    });

    it('ADMIN can reschedule from DELIVERY_FAILED to READY_FOR_DISPATCH', () => {
      expect(() =>
        service.validateTransition(OrderStatus.DELIVERY_FAILED, OrderStatus.READY_FOR_DISPATCH, 'ADMIN'),
      ).not.toThrow();
    });

    it('FACILITY_STAFF can mark PROCESSING_ISSUE from WASHING', () => {
      expect(() =>
        service.validateTransition(OrderStatus.WASHING, OrderStatus.PROCESSING_ISSUE, 'FACILITY_STAFF'),
      ).not.toThrow();
    });

    it('FACILITY_STAFF can recover PROCESSING_ISSUE → SORTING', () => {
      expect(() =>
        service.validateTransition(OrderStatus.PROCESSING_ISSUE, OrderStatus.SORTING, 'FACILITY_STAFF'),
      ).not.toThrow();
    });
  });

  // ── INVALID TRANSITIONS ──────────────────────────────────────────────────

  describe('validateTransition – wrong role', () => {
    it('CUSTOMER cannot confirm an order', () => {
      expect(() =>
        service.validateTransition(OrderStatus.ORDER_CREATED, OrderStatus.ORDER_CONFIRMED, 'CUSTOMER'),
      ).toThrow(BadRequestException);
    });

    it('DRIVER cannot confirm an order', () => {
      expect(() =>
        service.validateTransition(OrderStatus.ORDER_CREATED, OrderStatus.ORDER_CONFIRMED, 'DRIVER'),
      ).toThrow(BadRequestException);
    });

    it('CUSTOMER cannot move to SORTING', () => {
      expect(() =>
        service.validateTransition(OrderStatus.RECEIVED_AT_FACILITY, OrderStatus.SORTING, 'CUSTOMER'),
      ).toThrow(BadRequestException);
    });

    it('FACILITY_STAFF cannot initiate REFUND_INITIATED', () => {
      expect(() =>
        service.validateTransition(OrderStatus.DELIVERED, OrderStatus.REFUND_INITIATED, 'FACILITY_STAFF'),
      ).toThrow(BadRequestException);
    });

    it('DRIVER cannot start DELIVERY without DELIVERY_ASSIGNED state', () => {
      expect(() =>
        service.validateTransition(OrderStatus.READY_FOR_DISPATCH, OrderStatus.OUT_FOR_DELIVERY, 'DRIVER'),
      ).toThrow(BadRequestException);
    });
  });

  describe('validateTransition – skipping states', () => {
    it('Cannot skip from ORDER_CREATED directly to PICKED_UP', () => {
      expect(() =>
        service.validateTransition(OrderStatus.ORDER_CREATED, OrderStatus.PICKED_UP, 'ADMIN'),
      ).toThrow(BadRequestException);
    });

    it('Cannot skip from BILL_GENERATED directly to DELIVERED', () => {
      expect(() =>
        service.validateTransition(OrderStatus.BILL_GENERATED, OrderStatus.DELIVERED, 'ADMIN'),
      ).toThrow(BadRequestException);
    });

    it('Cannot go backwards: WASHING → ORDER_CREATED', () => {
      expect(() =>
        service.validateTransition(OrderStatus.WASHING, OrderStatus.ORDER_CREATED, 'ADMIN'),
      ).toThrow(BadRequestException);
    });
  });

  describe('validateTransition – terminal states', () => {
    it('Cannot transition from CANCELLED', () => {
      expect(() =>
        service.validateTransition(OrderStatus.CANCELLED, OrderStatus.ORDER_CREATED, 'ADMIN'),
      ).toThrow(BadRequestException);
    });

    it('Cannot transition from REFUND_INITIATED', () => {
      expect(() =>
        service.validateTransition(OrderStatus.REFUND_INITIATED, OrderStatus.DELIVERED, 'ADMIN'),
      ).toThrow(BadRequestException);
    });
  });

  describe('validateTransition – error message content', () => {
    it('error message names both from and to statuses', () => {
      try {
        service.validateTransition(OrderStatus.ORDER_CREATED, OrderStatus.DELIVERED, 'ADMIN');
        fail('Expected BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect((err as BadRequestException).message).toContain(OrderStatus.ORDER_CREATED);
        expect((err as BadRequestException).message).toContain(OrderStatus.DELIVERED);
      }
    });

    it('error message names the role when role is wrong', () => {
      try {
        service.validateTransition(OrderStatus.ORDER_CREATED, OrderStatus.ORDER_CONFIRMED, 'CUSTOMER');
        fail('Expected BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect((err as BadRequestException).message).toContain('CUSTOMER');
      }
    });
  });

  // ── getAllowedTransitions ─────────────────────────────────────────────────

  describe('getAllowedTransitions', () => {
    it('CUSTOMER from ORDER_CREATED sees only CANCELLED', () => {
      const allowed = service.getAllowedTransitions(OrderStatus.ORDER_CREATED, 'CUSTOMER');
      expect(allowed).toEqual([OrderStatus.CANCELLED]);
    });

    it('ADMIN from ORDER_CREATED sees ORDER_CONFIRMED + CANCELLED', () => {
      const allowed = service.getAllowedTransitions(OrderStatus.ORDER_CREATED, 'ADMIN');
      expect(allowed).toContain(OrderStatus.ORDER_CONFIRMED);
      expect(allowed).toContain(OrderStatus.CANCELLED);
    });

    it('DRIVER from PICKED_UP sees nothing (no driver transitions allowed)', () => {
      const allowed = service.getAllowedTransitions(OrderStatus.PICKED_UP, 'DRIVER');
      expect(allowed).toHaveLength(0);
    });

    it('returns empty array for terminal CANCELLED state', () => {
      const allowed = service.getAllowedTransitions(OrderStatus.CANCELLED, 'ADMIN');
      expect(allowed).toHaveLength(0);
    });

    it('DRIVER from DELIVERY_ARRIVED sees DELIVERED and DELIVERY_FAILED', () => {
      const allowed = service.getAllowedTransitions(OrderStatus.DELIVERY_ARRIVED, 'DRIVER');
      expect(allowed).toContain(OrderStatus.DELIVERED);
      expect(allowed).toContain(OrderStatus.DELIVERY_FAILED);
    });
  });
});
