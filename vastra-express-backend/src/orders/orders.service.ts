import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStateMachineService, UserRole } from './order-state-machine.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AssignOrderDriverDto } from './dto/assign-driver.dto';
import { UpdateWeightDto } from './dto/update-weight.dto';
import { OrderStatus, ServiceType } from './enums/order-status.enum';
import { haversineDistanceKm } from '../common/geo';
import { NotificationsService } from '../notifications/notifications.service';

interface CurrentUser {
  userId: number;
  role: string;
  facilityId?: number | null;
}

const MAX_SERVICE_DISTANCE_KM = 5;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: OrderStateMachineService,
    private readonly notifications: NotificationsService,
  ) {}

  // ============================================================
  // ORDER NUMBER GENERATION
  // ============================================================

  /**
   * Generates a human-readable order number:
   *   Express → EX-DD-MM-HH:MM-SS  (e.g. EX-01-03-14:30-01)
   *   Normal  →  N-DD-MM-HH:MM-SS  (e.g.  N-01-03-14:30-02)
   *
   * All times are in IST (UTC+5:30).
   * SS = daily serial — count of today's orders + 1, zero-padded to 2 digits.
   * Called inside a Prisma transaction so the count is consistent with the insert.
   */
  private async generateOrderNumber(tx: any, isExpress: boolean): Promise<string> {
    const nowUTC = new Date();
    // IST = UTC + 330 min
    const nowIST = new Date(nowUTC.getTime() + 330 * 60 * 1000);

    const dd  = String(nowIST.getUTCDate()).padStart(2, '0');
    const mm  = String(nowIST.getUTCMonth() + 1).padStart(2, '0');
    const hh  = String(nowIST.getUTCHours()).padStart(2, '0');
    const min = String(nowIST.getUTCMinutes()).padStart(2, '0');
    const prefix = isExpress ? 'EX' : 'N';

    // Midnight IST expressed as UTC (for the DB query)
    const midnightIST = new Date(
      Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate())
      - 330 * 60 * 1000,
    );

    const todayCount = await tx.order.count({
      where: { createdAt: { gte: midnightIST } },
    });

    const serial = String(todayCount + 1).padStart(2, '0');
    return `${prefix}-${dd}-${mm}-${hh}:${min}-${serial}`;
  }

  // ============================================================
  // CREATE ORDER
  // ============================================================

  async create(dto: CreateOrderDto, user: CurrentUser) {
    const resolvedServiceType = dto.serviceType ?? ServiceType.WASH_FOLD;
    const isSofaCleaning = resolvedServiceType === ServiceType.SOFA_CLEANING;
    const resolvedIsExpress = isSofaCleaning ? false : (dto.isExpress ?? false);
    const initialStatus = isSofaCleaning ? OrderStatus.PENDING_APPROVAL : OrderStatus.ORDER_CREATED;

    // 1. Verify address belongs to this customer
    const address = await this.prisma.address.findUnique({
      where: { id: dto.addressId },
    });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== user.userId) {
      throw new ForbiddenException('You do not own this address');
    }

    // 2. Verify pickup slot exists, is active, has capacity, and isn't past
    const slot = await this.prisma.pickupSlot.findUnique({
      where: { id: dto.pickupSlotId },
    });
    if (!slot) throw new NotFoundException('Pickup slot not found');
    if (!slot.isActive) {
      throw new BadRequestException('Pickup slot is not active');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (slot.slotDate < today) {
      throw new BadRequestException('Pickup slot date is in the past');
    }

    const facility = await this.prisma.facility.findUnique({
      where: { id: slot.facilityId },
    });
    if (!facility || !facility.isActive) {
      throw new NotFoundException('Facility not found or inactive');
    }

    const addressLat = Number(address.latitude);
    const addressLng = Number(address.longitude);
    const facilityLat = Number(facility.latitude);
    const facilityLng = Number(facility.longitude);

    if (
      !Number.isFinite(addressLat) ||
      !Number.isFinite(addressLng) ||
      !Number.isFinite(facilityLat) ||
      !Number.isFinite(facilityLng)
    ) {
      throw new BadRequestException('GPS coordinates missing for address or facility');
    }

    const distanceKm = haversineDistanceKm(
      addressLat,
      addressLng,
      facilityLat,
      facilityLng,
    );

    if (distanceKm > MAX_SERVICE_DISTANCE_KM) {
      throw new BadRequestException('Service not available in your area yet.');
    }

    const maxCap = slot.maxCapacity ?? 10;
    if (slot.currentBookings >= maxCap) {
      throw new ConflictException(
        'Pickup slot is fully booked. Please choose a different slot.',
      );
    }

    // 4. Create order + status history + increment slot bookings (atomic)
    const order = await this.prisma.$transaction(async (tx) => {
      // Generate order number inside the transaction so the daily serial count
      // is consistent with the insert (avoids a separate pre-transaction round-trip).
      const orderNumber = await this.generateOrderNumber(tx, resolvedIsExpress);

      // Atomic capacity check + increment — prevents race-condition overbooking.
      // Using updateMany with a conditional WHERE so the entire check+write is one
      // atomic SQL statement; count === 0 means the slot was just filled concurrently.
      const slotUpdate = await tx.pickupSlot.updateMany({
        where: {
          id: dto.pickupSlotId,
          currentBookings: { lt: maxCap },
        },
        data: { currentBookings: { increment: 1 } },
      });

      if (slotUpdate.count === 0) {
        throw new ConflictException(
          'Pickup slot is fully booked. Please choose a different slot.',
        );
      }

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: user.userId,
          addressId: dto.addressId,
          facilityId: slot.facilityId,
          pickupSlotId: dto.pickupSlotId,
          serviceType: resolvedServiceType,
          isExpress: resolvedIsExpress,
          customerNotes: dto.customerNotes ?? null,
          currentStatus: initialStatus,
        },
        include: this.orderDetailInclude(),
      });

      // Initial status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          status: initialStatus,
          changedByUserId: user.userId,
          notes: isSofaCleaning
            ? 'Sofa cleaning request submitted by customer'
            : 'Order placed by customer',
        },
      });

      return newOrder;
    });

    if (isSofaCleaning) {
      const body =
        'Your sofa cleaning request has been sent to the facility for approval. We will notify you once it is accepted or declined.';
      await this.notifications.sendToUser({
        userId: order.customer?.id ?? user.userId,
        title: `Request #${order.orderNumber}`,
        body,
        type: 'SPECIAL_ORDER_REQUEST',
        data: { orderNumber: order.orderNumber, status: initialStatus },
      });

      await this.notifications.sendEmailToUser(
        order.customer?.id ?? user.userId,
        `Sofa cleaning request #${order.orderNumber} received`,
        `We have received your sofa cleaning request. Our facility team will review availability and confirm or decline the request soon.\n\nOrder #: ${order.orderNumber}`,
      );
    }

    return this.formatOrder(order);
  }

  // ============================================================
  // LIST ORDERS (role-scoped)
  // ============================================================

  async findAll(
    user: CurrentUser,
    page: number = 1,
    limit: number = 10,
    status?: string,
    serviceType?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    if (status) where.currentStatus = status;
    if (serviceType) where.serviceType = serviceType;

    // Scope by role
    switch (user.role) {
      case 'CUSTOMER':
        where.customerId = user.userId;
        break;
      case 'DRIVER':
        // Drivers see only orders they are assigned to
        where.deliveryAssignments = { some: { driverId: user.userId } };
        break;
      case 'FACILITY_STAFF':
        if (user.facilityId) where.facilityId = user.facilityId;
        break;
      case 'ADMIN':
        // No scope restriction — sees all orders
        break;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.orderListInclude(),
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((o) => this.formatOrderSummary(o)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================
  // GET ORDER DETAIL
  // ============================================================

  async findOne(id: number, user: CurrentUser) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderDetailInclude(),
    });

    if (!order) throw new NotFoundException('Order not found');

    this.assertAccess(order, user);

    return this.formatOrder(order);
  }

  // ============================================================
  // UPDATE STATUS (state machine enforced)
  // ============================================================

  async updateStatus(id: number, dto: UpdateOrderStatusDto, user: CurrentUser) {
    // Fetch with full delivery assignments for access check
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { deliveryAssignments: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    this.assertAccess(order, user);

    if (order.serviceType === ServiceType.SOFA_CLEANING) {
      const allowedFromPending = [
        OrderStatus.ORDER_CONFIRMED,
        OrderStatus.DECLINED,
        OrderStatus.CANCELLED,
      ];

      if (
        order.currentStatus === OrderStatus.PENDING_APPROVAL &&
        !allowedFromPending.includes(dto.status)
      ) {
        throw new BadRequestException(
          'Sofa cleaning requests can only be approved, declined, or cancelled while pending.',
        );
      }

      if (
        order.currentStatus === OrderStatus.ORDER_CONFIRMED &&
        dto.status !== OrderStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Sofa cleaning orders use a minimal flow and cannot be advanced further.',
        );
      }

      if (order.currentStatus === OrderStatus.DECLINED) {
        throw new BadRequestException('Declined sofa cleaning requests cannot be updated.');
      }
    }

    // STATE MACHINE: validate transition + role permission
    this.stateMachine.validateTransition(
      order.currentStatus as OrderStatus,
      dto.status,
      user.role as UserRole,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { currentStatus: dto.status },
        include: this.orderDetailInclude(),
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: dto.status,
          changedByUserId: user.userId,
          notes: dto.notes ?? null,
        },
      });

      // Release pickup slot booking on cancellation.
      // Guard with currentBookings > 0 to prevent underflow on any edge-case
      // data inconsistency (state machine already blocks double-cancel).
      if (dto.status === OrderStatus.CANCELLED || dto.status === OrderStatus.DECLINED) {
        await tx.pickupSlot.updateMany({
          where: { id: order.pickupSlotId, currentBookings: { gt: 0 } },
          data: { currentBookings: { decrement: 1 } },
        });
      }

      return updatedOrder;
    });

    if (
      order.serviceType === ServiceType.SOFA_CLEANING &&
      [OrderStatus.PENDING_APPROVAL, OrderStatus.ORDER_CONFIRMED, OrderStatus.DECLINED].includes(dto.status)
    ) {
      const reason = dto.notes ? ` Reason: ${dto.notes}` : '';
      const statusBodyMap: Record<string, string> = {
        PENDING_APPROVAL:
          'Your sofa cleaning request is awaiting facility approval. We will notify you once a decision is made.',
        ORDER_CONFIRMED:
          'Your sofa cleaning request has been approved. The facility will coordinate the visit with you.',
        DECLINED: `Your sofa cleaning request was declined.${reason}`,
      };

      const body = statusBodyMap[dto.status] ?? `Sofa cleaning request updated: ${dto.status}`;

      await this.notifications.sendToUser({
        userId: order.customerId,
        title: `Request #${updated.orderNumber}`,
        body,
        type: 'SPECIAL_ORDER_UPDATE',
        data: { orderNumber: updated.orderNumber, status: dto.status },
      });

      const emailSubjectMap: Record<string, string> = {
        ORDER_CONFIRMED: `Sofa cleaning request #${updated.orderNumber} approved`,
        DECLINED: `Sofa cleaning request #${updated.orderNumber} declined`,
        PENDING_APPROVAL: `Sofa cleaning request #${updated.orderNumber} received`,
      };

      await this.notifications.sendEmailToUser(
        order.customerId,
        emailSubjectMap[dto.status] ?? `Sofa cleaning request #${updated.orderNumber} update`,
        `${body}\n\nOrder #: ${updated.orderNumber}`,
      );
    }

    return this.formatOrder(updated);
  }

  // ============================================================
  // UPDATE WEIGHT
  // ============================================================

  async updateWeight(id: number, dto: UpdateWeightDto, user: CurrentUser) {
    if (!dto.initialWeight && !dto.finalWeight) {
      throw new BadRequestException(
        'Provide at least one of initialWeight or finalWeight',
      );
    }

    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    if (user.role === 'CUSTOMER') {
      throw new ForbiddenException('Customers cannot update order weight');
    }

    if (user.role === 'DRIVER') {
      if (dto.finalWeight) {
        throw new BadRequestException(
          'Drivers can only update initial weight (measured at pickup)',
        );
      }
      // Driver must be assigned to this order
      const assignment = await this.prisma.deliveryAssignment.findFirst({
        where: { orderId: id, driverId: user.userId },
      });
      if (!assignment) {
        throw new ForbiddenException('You are not assigned to this order');
      }
    }

    if (user.role === 'FACILITY_STAFF' && order.facilityId !== user.facilityId) {
      throw new ForbiddenException('Order is not at your facility');
    }

    const data: { initialWeight?: number; finalWeight?: number } = {};
    if (dto.initialWeight !== undefined) data.initialWeight = dto.initialWeight;
    if (dto.finalWeight !== undefined) data.finalWeight = dto.finalWeight;

    const updated = await this.prisma.order.update({
      where: { id },
      data,
      include: this.orderListInclude(),
    });

    return this.formatOrderSummary(updated);
  }

  // ============================================================
  // ASSIGN DRIVER
  // ============================================================

  async assignDriver(id: number, dto: AssignOrderDriverDto, user: CurrentUser) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    if (user.role === 'FACILITY_STAFF' && order.facilityId !== user.facilityId) {
      throw new ForbiddenException('Order is not at your facility');
    }
    if (user.role === 'CUSTOMER' || user.role === 'DRIVER') {
      throw new ForbiddenException('You are not authorized to assign drivers');
    }

    // Validate driver exists, has DRIVER role, and is active
    const driver = await this.prisma.user.findUnique({
      where: { id: dto.driverId },
      include: { role: true },
    });
    if (!driver) throw new NotFoundException('Driver not found');
    if (driver.role.name !== 'DRIVER') {
      throw new BadRequestException('The specified user does not have the DRIVER role');
    }
    if (!driver.isActive) {
      throw new BadRequestException('Driver account is inactive');
    }

    // Prevent duplicate active assignment for same type
    const existingAssignment = await this.prisma.deliveryAssignment.findFirst({
      where: {
        orderId: id,
        driverId: dto.driverId,
        assignmentType: dto.assignmentType,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
      },
    });
    if (existingAssignment) {
      throw new ConflictException(
        `Driver is already assigned for ${dto.assignmentType} on this order`,
      );
    }

    const assignment = await this.prisma.deliveryAssignment.create({
      data: {
        orderId: id,
        driverId: dto.driverId,
        assignmentType: dto.assignmentType,
        assignedByUserId: user.userId,
        status: 'ASSIGNED',
        notes: dto.notes ?? null,
      },
      include: {
        driver: {
          select: { id: true, name: true, mobileNumber: true },
        },
      },
    });

    return {
      message: `Driver assigned for ${dto.assignmentType} successfully`,
      assignment,
    };
  }

  // ============================================================
  // STATUS HISTORY
  // ============================================================

  async getStatusHistory(id: number, user: CurrentUser) {
    // Fetch with delivery assignments for driver access check
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { deliveryAssignments: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    this.assertAccess(order, user);

    const history = await this.prisma.orderStatusHistory.findMany({
      where: { orderId: id },
      orderBy: { timestamp: 'asc' },
      include: {
        changedByUser: {
          select: {
            id: true,
            name: true,
            role: { select: { name: true } },
          },
        },
      },
    });

    return history;
  }

  // ============================================================
  // CHANGE PICKUP SLOT (Customer — up to 2 hours before slot)
  // ============================================================

  async changePickupSlot(id: number, newSlotId: number, user: CurrentUser) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        pickupSlot: true,
        deliveryAssignments: {
          where: { assignmentType: 'PICKUP', status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
          orderBy: { assignedAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (user.role === 'CUSTOMER' && order.customerId !== user.userId) {
      throw new ForbiddenException('You do not own this order');
    }

    const ALLOWED_STATUSES = [
      OrderStatus.ORDER_CREATED,
      OrderStatus.ORDER_CONFIRMED,
      OrderStatus.PICKUP_SCHEDULED,
      OrderStatus.PICKUP_ASSIGNED,
    ] as string[];
    if (!ALLOWED_STATUSES.includes(order.currentStatus)) {
      throw new BadRequestException(
        `Slot can only be changed before pickup begins. Current status: ${order.currentStatus}`,
      );
    }

    // Enforce 2-hour window on the current slot
    if (order.pickupSlot) {
      const slotDateStr = new Date(order.pickupSlot.slotDate).toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
      });
      const slotStartIST = new Date(`${slotDateStr}T${order.pickupSlot.startTime}:00+05:30`);
      const cutoff = new Date(slotStartIST.getTime() - 2 * 60 * 60 * 1000);
      if (new Date() >= cutoff) {
        throw new BadRequestException(
          'Slot changes are only allowed up to 2 hours before the scheduled pickup time.',
        );
      }
    }

    if (newSlotId === order.pickupSlotId) {
      throw new BadRequestException('The new slot must be different from the current slot.');
    }

    // Validate new slot
    const newSlot = await this.prisma.pickupSlot.findUnique({ where: { id: newSlotId } });
    if (!newSlot) throw new NotFoundException('New pickup slot not found');
    if (!newSlot.isActive) throw new BadRequestException('Selected slot is not active');

    const maxCap = newSlot.maxCapacity ?? 10;
    if (newSlot.currentBookings >= maxCap) {
      throw new ConflictException('Selected slot is fully booked. Please choose a different slot.');
    }

    // New slot must not have started yet
    const newSlotDateStr = new Date(newSlot.slotDate).toLocaleDateString('en-CA', {
      timeZone: 'Asia/Kolkata',
    });
    const newSlotStartIST = new Date(`${newSlotDateStr}T${newSlot.startTime}:00+05:30`);
    if (new Date() >= newSlotStartIST) {
      throw new BadRequestException('Cannot book a slot that has already started.');
    }

    const activeAssignment = order.deliveryAssignments[0] ?? null;
    const hadDriverAssigned = !!activeAssignment;

    // Revert to PICKUP_SCHEDULED only if a driver was assigned
    const previousStatus = order.currentStatus as OrderStatus;
    const resolvedOrderStatus =
      previousStatus === OrderStatus.PICKUP_ASSIGNED
        ? OrderStatus.PICKUP_SCHEDULED
        : previousStatus;

    const updated = await this.prisma.$transaction(async (tx) => {
      // Release old slot booking
      if (order.pickupSlotId) {
        await tx.pickupSlot.updateMany({
          where: { id: order.pickupSlotId, currentBookings: { gt: 0 } },
          data: { currentBookings: { decrement: 1 } },
        });
      }

      // Atomic capacity check + increment on new slot
      const slotUpdate = await tx.pickupSlot.updateMany({
        where: { id: newSlotId, currentBookings: { lt: maxCap } },
        data: { currentBookings: { increment: 1 } },
      });
      if (slotUpdate.count === 0) {
        throw new ConflictException('Slot was just fully booked. Please choose another.');
      }

      // Cancel active PICKUP assignment if one exists
      if (activeAssignment) {
        await tx.deliveryAssignment.update({
          where: { id: activeAssignment.id },
          data: { status: 'CANCELLED', notes: 'Cancelled: customer changed pickup slot' },
        });
      }

      // Update order
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          pickupSlotId: newSlotId,
          ...(resolvedOrderStatus !== previousStatus && { currentStatus: resolvedOrderStatus }),
        },
        include: this.orderDetailInclude(),
      });

      // Status history — always record the slot change
      const historyNote = hadDriverAssigned
        ? 'Customer changed pickup slot. Driver assignment cancelled — awaiting reassignment. [SLOT_CHANGED]'
        : 'Customer changed pickup slot. [SLOT_CHANGED]';

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: resolvedOrderStatus,
          changedByUserId: user.userId,
          notes: historyNote,
        },
      });

      return updatedOrder;
    });

    return this.formatOrder(updated);
  }

  // ============================================================
  // CANCEL ORDER
  // ============================================================

  async cancelOrder(id: number, user: CurrentUser, notes?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { deliveryAssignments: true, pickupSlot: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Ownership / scope check before state machine
    if (user.role === 'CUSTOMER' && order.customerId !== user.userId) {
      throw new ForbiddenException('You do not own this order');
    }
    if (user.role === 'FACILITY_STAFF' && order.facilityId !== user.facilityId) {
      throw new ForbiddenException('Order is not at your facility');
    }
    if (user.role === 'DRIVER') {
      throw new ForbiddenException('Drivers cannot cancel orders');
    }

    // Customer 2-hour cancellation window
    if (user.role === 'CUSTOMER' && order.pickupSlot) {
      const slotDateStr = new Date(order.pickupSlot.slotDate).toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
      });
      const slotStartIST = new Date(`${slotDateStr}T${order.pickupSlot.startTime}:00+05:30`);
      const cutoff = new Date(slotStartIST.getTime() - 2 * 60 * 60 * 1000);
      if (new Date() >= cutoff) {
        throw new BadRequestException(
          'Orders can only be cancelled up to 2 hours before the scheduled pickup time.',
        );
      }
    }

    // Let the state machine validate the cancellation transition and role
    this.stateMachine.validateTransition(
      order.currentStatus as OrderStatus,
      OrderStatus.CANCELLED,
      user.role as UserRole,
    );

    const cancelled = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { currentStatus: OrderStatus.CANCELLED },
        include: this.orderDetailInclude(),
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: OrderStatus.CANCELLED,
          changedByUserId: user.userId,
          notes: notes ?? 'Order cancelled',
        },
      });

      // Release slot booking (guard against underflow)
      await tx.pickupSlot.updateMany({
        where: { id: order.pickupSlotId, currentBookings: { gt: 0 } },
        data: { currentBookings: { decrement: 1 } },
      });

      return updatedOrder;
    });

    return this.formatOrder(cancelled);
  }

  // ============================================================
  // HELPERS: ACCESS CONTROL
  // ============================================================

  /**
   * Asserts the requesting user has permission to view/mutate this order.
   * Throws ForbiddenException if access is denied.
   */
  private assertAccess(order: any, user: CurrentUser): void {
    switch (user.role) {
      case 'CUSTOMER':
        if (order.customerId !== user.userId) {
          throw new ForbiddenException('You do not own this order');
        }
        break;

      case 'DRIVER': {
        const isAssigned = order.deliveryAssignments?.some(
          (a: any) => a.driverId === user.userId,
        );
        if (!isAssigned) {
          throw new ForbiddenException('You are not assigned to this order');
        }
        break;
      }

      case 'FACILITY_STAFF':
        if (user.facilityId && order.facilityId !== user.facilityId) {
          throw new ForbiddenException('Order does not belong to your facility');
        }
        break;

      case 'ADMIN':
        // Admin has unrestricted access
        break;

      default:
        throw new ForbiddenException('Access denied');
    }
  }

  // ============================================================
  // HELPERS: PRISMA INCLUDES
  // ============================================================

  /** Full include for order detail endpoint */
  private orderDetailInclude() {
    return {
      customer: {
        select: { id: true, name: true, mobileNumber: true, email: true },
      },
      address: { include: { city: true } },
      facility: {
        select: { id: true, name: true, contactNumber: true },
      },
      pickupSlot: {
        select: { id: true, slotDate: true, startTime: true, endTime: true },
      },
      statusHistory: {
        orderBy: { timestamp: 'desc' as const },
        take: 5, // Most recent 5 for quick view; use /history for full log
        include: {
          changedByUser: { select: { id: true, name: true } },
        },
      },
      deliveryAssignments: {
        orderBy: { assignedAt: 'desc' as const },
        include: {
          driver: { select: { id: true, name: true, mobileNumber: true } },
        },
      },
    };
  }

  /** Lighter include for list endpoint */
  private orderListInclude() {
    return {
      customer: {
        select: { id: true, name: true, mobileNumber: true },
      },
      address: {
        select: {
          id: true,
          houseFlatNo: true,
          street: true,
          pincode: true,
          city: { select: { id: true, name: true } },
        },
      },
      facility: { select: { id: true, name: true } },
      pickupSlot: {
        select: { id: true, slotDate: true, startTime: true, endTime: true },
      },
      deliveryAssignments: {
        where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
        orderBy: { assignedAt: 'desc' as const },
        take: 1,
        include: {
          driver: { select: { id: true, name: true } },
        },
      },
    };
  }

  // ============================================================
  // HELPERS: RESPONSE FORMATTERS
  // ============================================================

  private formatOrder(order: any) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      currentStatus: order.currentStatus,
      serviceType: order.serviceType,
      isExpress: order.isExpress,
      initialWeight: order.initialWeight,
      finalWeight: order.finalWeight,
      // `notes` is the frontend-facing alias for `customerNotes`
      notes: order.customerNotes,
      customerNotes: order.customerNotes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customer: order.customer,
      address: order.address,
      facility: order.facility,
      pickupSlot: order.pickupSlot,
      recentStatusHistory: order.statusHistory ?? [],
      // Show the most recent active assignment
      currentAssignment:
        order.deliveryAssignments?.find(
          (a: any) => ['ASSIGNED', 'IN_PROGRESS'].includes(a.status),
        ) ?? null,
    };
  }

  private formatOrderSummary(order: any) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      currentStatus: order.currentStatus,
      serviceType: order.serviceType,
      isExpress: order.isExpress,
      initialWeight: order.initialWeight,
      finalWeight: order.finalWeight,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customer: order.customer,
      address: order.address,
      facility: order.facility,
      pickupSlot: order.pickupSlot,
      currentAssignment: order.deliveryAssignments?.[0] ?? null,
    };
  }
}
