import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AssignDriverDto,
  ReassignDriverDto,
  UpdateAssignmentStatusDto,
} from './dto/delivery.dto';
import { OrderStatus } from '../orders/enums/order-status.enum';

interface CurrentUser {
  userId: number;
  role: string;
  facilityId?: number | null;
}

type TransitionResult = { assignmentStatus: string; orderStatus: OrderStatus | null };

/**
 * Status transitions keyed by [assignmentType][driverStatusInput].
 * 4-step driver flow:
 *   PICKUP:   IN_PROGRESS → OUT_FOR_PICKUP   | ARRIVED → PICKUP_ARRIVED   | COMPLETED → PICKED_UP      | FAILED → PICKUP_FAILED
 *   DELIVERY: IN_PROGRESS → OUT_FOR_DELIVERY | ARRIVED → DELIVERY_ARRIVED | COMPLETED → DELIVERED      | FAILED → DELIVERY_FAILED
 *
 * Driver app flow:
 *   Start trip  → IN_PROGRESS
 *   Arrived     → ARRIVED
 *   Confirm     → COMPLETED
 *   Could not   → FAILED
 */
const STATUS_TRANSITIONS: Record<string, Record<string, TransitionResult>> = {
  PICKUP: {
    IN_PROGRESS: { assignmentStatus: 'IN_PROGRESS', orderStatus: OrderStatus.OUT_FOR_PICKUP },
    ARRIVED:     { assignmentStatus: 'IN_PROGRESS', orderStatus: OrderStatus.PICKUP_ARRIVED },
    COMPLETED:   { assignmentStatus: 'COMPLETED',   orderStatus: OrderStatus.PICKED_UP },
    FAILED:      { assignmentStatus: 'FAILED',       orderStatus: OrderStatus.PICKUP_FAILED },
  },
  DELIVERY: {
    IN_PROGRESS: { assignmentStatus: 'IN_PROGRESS', orderStatus: OrderStatus.OUT_FOR_DELIVERY },
    ARRIVED:     { assignmentStatus: 'IN_PROGRESS', orderStatus: OrderStatus.DELIVERY_ARRIVED },
    COMPLETED:   { assignmentStatus: 'COMPLETED',   orderStatus: OrderStatus.DELIVERED },
    FAILED:      { assignmentStatus: 'FAILED',       orderStatus: OrderStatus.DELIVERY_FAILED },
  },
};

const VALID_STATUS_INPUTS = ['IN_PROGRESS', 'ARRIVED', 'COMPLETED', 'FAILED'];

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // ASSIGN DRIVER TO ORDER
  // ============================================================

  /**
   * Admin/Facility assigns a driver to a ready-for-dispatch order.
   * Driver must exist, be active, and have the DRIVER role.
   */
  async assignDriver(dto: AssignDriverDto, admin: CurrentUser) {
    const [order, driver] = await Promise.all([
      this.prisma.order.findUnique({ where: { id: dto.orderId } }),
      this.prisma.user.findUnique({
        where: { id: dto.driverId },
        include: { role: true },
      }),
    ]);

    if (!order) throw new NotFoundException(`Order #${dto.orderId} not found`);
    if (!driver) throw new NotFoundException(`Driver #${dto.driverId} not found`);

    if (driver.role.name !== 'DRIVER') {
      throw new BadRequestException('Selected user is not a driver');
    }

    if (!driver.isActive) {
      throw new BadRequestException('Driver account is inactive');
    }

    // Validate order is in correct state for the assignment type
    const assignmentType = dto.assignmentType ?? 'DELIVERY';
    if (assignmentType === 'DELIVERY' && order.currentStatus !== OrderStatus.READY_FOR_DISPATCH) {
      throw new BadRequestException(
        `Order must be in READY_FOR_DISPATCH state for a DELIVERY assignment. Current: ${order.currentStatus}`,
      );
    }
    if (
      assignmentType === 'PICKUP' &&
      ![
        OrderStatus.ORDER_CREATED,
        OrderStatus.ORDER_CONFIRMED,
        OrderStatus.PICKUP_SCHEDULED,
      ].includes(order.currentStatus as OrderStatus)
    ) {
      throw new BadRequestException(
        `Order must be in ORDER_CREATED, ORDER_CONFIRMED or PICKUP_SCHEDULED state for a PICKUP assignment. Current: ${order.currentStatus}`,
      );
    }

    // Prevent duplicate active assignment for the same type
    const existing = await this.prisma.deliveryAssignment.findFirst({
      where: {
        orderId: dto.orderId,
        assignmentType,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Order already has an active ${assignmentType} assignment. Use reassign to change driver.`,
      );
    }

    const newOrderStatus =
      assignmentType === 'PICKUP'
        ? OrderStatus.PICKUP_ASSIGNED
        : OrderStatus.DELIVERY_ASSIGNED;

    const assignment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.deliveryAssignment.create({
        data: {
          orderId: dto.orderId,
          driverId: dto.driverId,
          assignmentType,
          assignedByUserId: admin.userId,
          status: 'ASSIGNED',
          notes: dto.notes ?? null,
          assignedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: dto.orderId },
        data: { currentStatus: newOrderStatus },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: dto.orderId,
          status: newOrderStatus,
          changedByUserId: admin.userId,
          notes: `Driver #${dto.driverId} (${driver.name}) assigned for ${assignmentType.toLowerCase()}`,
        },
      });

      return created;
    });

    this.logger.log(
      `✅ Driver #${dto.driverId} assigned to order #${order.orderNumber} by admin #${admin.userId}`,
    );
    return assignment;
  }

  // ============================================================
  // DRIVER: GET MY ASSIGNMENTS
  // ============================================================

  async getMyAssignments(
    driver: CurrentUser,
    page = 1,
    limit = 10,
    type?: string,
    status?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { driverId: driver.userId };
    if (type) where.assignmentType = type.toUpperCase();
    if (status) where.status = status.toUpperCase();

    const [assignments, total] = await Promise.all([
      this.prisma.deliveryAssignment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { assignedAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              currentStatus: true,
              serviceType: true,
              isExpress: true,
              initialWeight: true,
              customer: { select: { id: true, name: true, mobileNumber: true } },
              address: {
                select: {
                  id: true,
                  houseFlatNo: true,
                  street: true,
                  landmark: true,
                  pincode: true,
                  city: { select: { id: true, name: true } },
                },
              },
              pickupSlot: {
                select: { id: true, slotDate: true, startTime: true, endTime: true },
              },
              finalWeight: true,
            },
          },
        },
      }),
      this.prisma.deliveryAssignment.count({ where }),
    ]);

    return {
      data: assignments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================================
  // UPDATE ASSIGNMENT STATUS (Driver or Admin)
  // ============================================================

  /**
   * Valid inputs: IN_PROGRESS, COMPLETED, FAILED
   * ASSIGNED → IN_PROGRESS → COMPLETED | FAILED
   *
   * Business Rule: Driver cannot start trip (IN_PROGRESS) until 2 hours before
   * the pickup slot start time. This prevents premature departures. IST-safe.
   */
  async updateStatus(
    assignmentId: number,
    dto: UpdateAssignmentStatusDto,
    user: CurrentUser,
  ) {
    const statusUpper = dto.status.toUpperCase();
    if (!VALID_STATUS_INPUTS.includes(statusUpper)) {
      throw new BadRequestException(
        `Invalid status '${dto.status}'. Valid: ${VALID_STATUS_INPUTS.join(', ')}`,
      );
    }

    const assignment = await this.prisma.deliveryAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        order: {
          include: { pickupSlot: true },
        },
      },
    });

    if (!assignment) throw new NotFoundException(`Assignment #${assignmentId} not found`);

    if (user.role === 'DRIVER' && assignment.driverId !== user.userId) {
      throw new ForbiddenException('You are not assigned to this delivery');
    }

    // ── 2-hour start-trip restriction (PICKUP assignments only) ──────────────
    // Only enforce when driver tries to transition to IN_PROGRESS
    if (
      statusUpper === 'IN_PROGRESS' &&
      assignment.assignmentType === 'PICKUP' &&
      assignment.order?.pickupSlot
    ) {
      const slot = assignment.order.pickupSlot;
      const slotDateStr = new Date(slot.slotDate).toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
      });
      // Build slot start datetime in IST
      const slotStartIST = new Date(`${slotDateStr}T${slot.startTime}:00+05:30`);
      const earliest = new Date(slotStartIST.getTime() - 2 * 60 * 60 * 1000); // 2hr before
      const nowUTC = new Date();

      if (nowUTC < earliest) {
        const istStr = earliest.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        throw new BadRequestException(
          `Trip cannot be started yet. You can start at ${istStr} IST (2 hours before the ${slot.startTime} slot).`,
        );
      }
    }

    // Resolve the correct transition set based on assignment type (PICKUP vs DELIVERY)
    const typeKey = (assignment.assignmentType ?? 'DELIVERY').toUpperCase();
    const typeMap = STATUS_TRANSITIONS[typeKey] ?? STATUS_TRANSITIONS['DELIVERY'];
    const { assignmentStatus, orderStatus } = typeMap[statusUpper];
    const isCompleted = assignmentStatus === 'COMPLETED';

    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryAssignment.update({
        where: { id: assignmentId },
        data: {
          status: assignmentStatus,
          notes: dto.notes ?? assignment.notes,
          ...(isCompleted && { completedAt: new Date() }),
        },
      });

      if (orderStatus) {
        await tx.order.update({
          where: { id: assignment.orderId },
          data: { currentStatus: orderStatus },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: assignment.orderId,
            status: orderStatus,
            changedByUserId: user.userId,
            notes: dto.notes ?? `Delivery status: ${assignmentStatus}`,
          },
        });
      }
    });

    this.logger.log(`📦 Assignment #${assignmentId} → ${assignmentStatus} by #${user.userId}`);

    return { message: `Assignment updated to ${assignmentStatus}`, assignmentId, newOrderStatus: orderStatus };
  }

  // ============================================================
  // GET ASSIGNMENTS FOR AN ORDER
  // ============================================================

  async getOrderAssignments(orderId: number, user: CurrentUser) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order #${orderId} not found`);

    if (user.role === 'CUSTOMER' && order.customerId !== user.userId) {
      throw new ForbiddenException('You do not own this order');
    }

    return this.prisma.deliveryAssignment.findMany({
      where: { orderId },
      orderBy: { assignedAt: 'desc' },
      include: {
        driver: { select: { id: true, name: true, mobileNumber: true } },
      },
    });
  }

  // ============================================================
  // REASSIGN DRIVER (Admin only)
  // ============================================================

  async reassignDriver(assignmentId: number, dto: ReassignDriverDto, admin: CurrentUser) {
    const assignment = await this.prisma.deliveryAssignment.findUnique({
      where: { id: assignmentId },
      include: { order: true },
    });

    if (!assignment) throw new NotFoundException(`Assignment #${assignmentId} not found`);

    // FACILITY_STAFF can only reassign orders at their own facility
    if (admin.role === 'FACILITY_STAFF') {
      const order = await this.prisma.order.findUnique({ where: { id: assignment.orderId }, select: { facilityId: true } });
      if (!order || order.facilityId !== admin.facilityId) {
        throw new ForbiddenException('You can only reassign drivers for orders at your facility');
      }
    }

    if (assignment.status === 'COMPLETED') {
      throw new BadRequestException('Cannot reassign a completed delivery');
    }

    const newDriver = await this.prisma.user.findUnique({
      where: { id: dto.newDriverId },
      include: { role: true },
    });

    if (!newDriver || newDriver.role.name !== 'DRIVER') {
      throw new NotFoundException('New driver not found or is not a driver');
    }

    if (!newDriver.isActive) {
      throw new BadRequestException('New driver account is inactive');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryAssignment.update({
        where: { id: assignmentId },
        data: { status: 'FAILED', notes: dto.reason ?? 'Superseded by reassignment' },
      });

      await tx.deliveryAssignment.create({
        data: {
          orderId: assignment.orderId,
          driverId: dto.newDriverId,
          assignmentType: assignment.assignmentType,
          assignedByUserId: admin.userId,
          status: 'ASSIGNED',
          notes: `Reassigned from driver #${assignment.driverId}. ${dto.reason ?? ''}`.trim(),
          assignedAt: new Date(),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: assignment.orderId,
          // Use the correct status for the assignment type being reassigned
          status: assignment.assignmentType === 'PICKUP'
            ? OrderStatus.PICKUP_ASSIGNED
            : OrderStatus.DELIVERY_ASSIGNED,
          changedByUserId: admin.userId,
          notes: dto.reason
            ? `Reassigned to driver #${dto.newDriverId}: ${dto.reason}`
            : `Reassigned to driver #${dto.newDriverId}`,
        },
      });
    });

    this.logger.log(
      `🔄 Order #${assignment.order.orderNumber}: driver #${assignment.driverId} → #${dto.newDriverId}`,
    );
    return { message: `Order reassigned to driver #${dto.newDriverId}` };
  }

  // ============================================================
  // ADMIN / FACILITY STAFF: LIST ALL ASSIGNMENTS
  // ============================================================

  async listAll(user: CurrentUser, page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status.toUpperCase();
    if (user.role === 'FACILITY_STAFF' && user.facilityId) {
      where.order = { facilityId: user.facilityId };
    }

    const [assignments, total] = await Promise.all([
      this.prisma.deliveryAssignment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { assignedAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              currentStatus: true,
              customer: { select: { id: true, name: true } },
            },
          },
          driver: { select: { id: true, name: true, mobileNumber: true } },
        },
      }),
      this.prisma.deliveryAssignment.count({ where }),
    ]);

    return {
      data: assignments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
