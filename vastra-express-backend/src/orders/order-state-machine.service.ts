import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus } from './enums/order-status.enum';

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'FACILITY_STAFF' | 'DRIVER';

interface Transition {
  to: OrderStatus;
  allowedRoles: UserRole[];
}

@Injectable()
export class OrderStateMachineService {
  /**
   * STRICT state machine: every (from, to) pair declares exactly which roles
   * are permitted to make that transition. Any unlisted transition is blocked.
   *
   * Main flow:
   * ORDER_CREATED → ORDER_CONFIRMED → PICKUP_SCHEDULED → PICKUP_ASSIGNED
   *   → OUT_FOR_PICKUP → PICKUP_ARRIVED → PICKED_UP → RECEIVED_AT_FACILITY
   *   → SORTING → WASHING → IRONING → PACKING → READY_FOR_DISPATCH
   *   → DELIVERY_ASSIGNED → OUT_FOR_DELIVERY
   *   → DELIVERY_ARRIVED → DELIVERED
   *
   * Exception flows (branching from main flow):
   *   - CANCELLED          : before PICKED_UP (role-dependent)
   *   - PICKUP_FAILED      : OUT_FOR_PICKUP or PICKUP_ARRIVED
   *   - PROCESSING_ISSUE   : any facility-processing state
   *   - DELIVERY_FAILED    : OUT_FOR_DELIVERY or DELIVERY_ARRIVED
   */
  private readonly transitions: Map<OrderStatus, Transition[]> = new Map([
    [
      OrderStatus.ORDER_CREATED,
      [
        { to: OrderStatus.ORDER_CONFIRMED, allowedRoles: ['ADMIN', 'FACILITY_STAFF'] },
        { to: OrderStatus.CANCELLED, allowedRoles: ['CUSTOMER', 'ADMIN', 'FACILITY_STAFF'] },
      ],
    ],
    [
      OrderStatus.ORDER_CONFIRMED,
      [
        { to: OrderStatus.PICKUP_SCHEDULED, allowedRoles: ['ADMIN', 'FACILITY_STAFF'] },
        { to: OrderStatus.PICKUP_ASSIGNED, allowedRoles: ['ADMIN', 'FACILITY_STAFF'] },
        { to: OrderStatus.CANCELLED, allowedRoles: ['CUSTOMER', 'ADMIN', 'FACILITY_STAFF'] },
      ],
    ],
    [
      OrderStatus.PICKUP_SCHEDULED,
      [
        { to: OrderStatus.PICKUP_ASSIGNED, allowedRoles: ['ADMIN', 'FACILITY_STAFF'] },
        { to: OrderStatus.CANCELLED, allowedRoles: ['CUSTOMER', 'ADMIN', 'FACILITY_STAFF'] },
      ],
    ],
    [
      OrderStatus.PICKUP_ASSIGNED,
      [
        { to: OrderStatus.OUT_FOR_PICKUP, allowedRoles: ['DRIVER', 'ADMIN'] },
        { to: OrderStatus.CANCELLED, allowedRoles: ['CUSTOMER', 'ADMIN', 'FACILITY_STAFF'] },
      ],
    ],
    [
      OrderStatus.OUT_FOR_PICKUP,
      [
        { to: OrderStatus.PICKUP_ARRIVED, allowedRoles: ['DRIVER', 'ADMIN'] },
        { to: OrderStatus.PICKUP_FAILED, allowedRoles: ['DRIVER', 'ADMIN'] },
        // Customer can no longer cancel once driver is en-route; staff/admin can
        { to: OrderStatus.CANCELLED, allowedRoles: ['ADMIN', 'FACILITY_STAFF'] },
      ],
    ],
    [
      OrderStatus.PICKUP_ARRIVED,
      [
        { to: OrderStatus.PICKED_UP, allowedRoles: ['DRIVER', 'ADMIN'] },
        { to: OrderStatus.PICKUP_FAILED, allowedRoles: ['DRIVER', 'ADMIN'] },
        { to: OrderStatus.CANCELLED, allowedRoles: ['ADMIN'] },
      ],
    ],
    [
      OrderStatus.PICKED_UP,
      [
        // No cancellation after this point
        { to: OrderStatus.RECEIVED_AT_FACILITY, allowedRoles: ['FACILITY_STAFF', 'ADMIN'] },
      ],
    ],
    [
      OrderStatus.RECEIVED_AT_FACILITY,
      [
        { to: OrderStatus.SORTING, allowedRoles: ['FACILITY_STAFF', 'ADMIN'] },
        { to: OrderStatus.PROCESSING_ISSUE, allowedRoles: ['FACILITY_STAFF', 'ADMIN'] },
      ],
    ],
    [
      OrderStatus.SORTING,
      [
        { to: OrderStatus.WASHING, allowedRoles: ['FACILITY_STAFF', 'ADMIN'] },
        { to: OrderStatus.PROCESSING_ISSUE, allowedRoles: ['FACILITY_STAFF', 'ADMIN'] },
      ],
    ],
    [
      OrderStatus.WASHING,
      [
        { to: OrderStatus.IRONING, allowedRoles: ['FACILITY_STAFF', 'ADMIN'] },
        { to: OrderStatus.READY_FOR_DISPATCH, allowedRoles: ['FACILITY_STAFF', 'ADMIN'] },
        { to: OrderStatus.PROCESSING_ISSUE, allowedRoles: ['FACILITY_STAFF', 'ADMIN'] },
      ],
    ],
    [
      OrderStatus.IRONING,
      [
        { to: OrderStatus.PACKING, allowedRoles: ['FACILITY_STAFF', 'ADMIN'] },
        { to: OrderStatus.READY_FOR_DISPATCH, allowedRoles: ['FACILITY_STAFF', 'ADMIN'] },
        { to: OrderStatus.PROCESSING_ISSUE, allowedRoles: ['FACILITY_STAFF', 'ADMIN'] },
      ],
    ],
    [
      OrderStatus.PACKING,
      [
        { to: OrderStatus.READY_FOR_DISPATCH, allowedRoles: ['FACILITY_STAFF', 'ADMIN'] },
        { to: OrderStatus.PROCESSING_ISSUE, allowedRoles: ['FACILITY_STAFF', 'ADMIN'] },
      ],
    ],
    [
      OrderStatus.READY_FOR_DISPATCH,
      [
        { to: OrderStatus.DELIVERY_ASSIGNED, allowedRoles: ['FACILITY_STAFF', 'ADMIN'] },
      ],
    ],
    [
      OrderStatus.DELIVERY_ASSIGNED,
      [
        { to: OrderStatus.OUT_FOR_DELIVERY, allowedRoles: ['DRIVER', 'ADMIN'] },
      ],
    ],
    [
      OrderStatus.OUT_FOR_DELIVERY,
      [
        { to: OrderStatus.DELIVERY_ARRIVED, allowedRoles: ['DRIVER', 'ADMIN'] },
        { to: OrderStatus.DELIVERY_FAILED, allowedRoles: ['DRIVER', 'ADMIN'] },
      ],
    ],
    [
      OrderStatus.DELIVERY_ARRIVED,
      [
        { to: OrderStatus.DELIVERED, allowedRoles: ['DRIVER', 'ADMIN'] },
        { to: OrderStatus.DELIVERY_FAILED, allowedRoles: ['DRIVER', 'ADMIN'] },
      ],
    ],
    // Recovery flows from exception states
    [
      OrderStatus.PICKUP_FAILED,
      [
        { to: OrderStatus.PICKUP_SCHEDULED, allowedRoles: ['ADMIN', 'FACILITY_STAFF'] },
        { to: OrderStatus.CANCELLED, allowedRoles: ['ADMIN', 'FACILITY_STAFF'] },
      ],
    ],
    [
      OrderStatus.DELIVERY_FAILED,
      [
        { to: OrderStatus.READY_FOR_DISPATCH, allowedRoles: ['ADMIN', 'FACILITY_STAFF'] },
        { to: OrderStatus.DELIVERY_ASSIGNED, allowedRoles: ['ADMIN', 'FACILITY_STAFF'] },
      ],
    ],
    [
      OrderStatus.PROCESSING_ISSUE,
      [
        { to: OrderStatus.SORTING, allowedRoles: ['FACILITY_STAFF', 'ADMIN'] },
        { to: OrderStatus.CANCELLED, allowedRoles: ['ADMIN'] },
      ],
    ],
  ]);

  /**
   * Validate that the transition from currentStatus → newStatus is permitted
   * for the given role. Throws BadRequestException with a clear message on failure.
   */
  validateTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
    userRole: UserRole,
  ): void {
    const allowedTransitions = this.transitions.get(currentStatus);

    if (!allowedTransitions) {
      throw new BadRequestException(
        `No further transitions are allowed from status: ${currentStatus}`,
      );
    }

    const transition = allowedTransitions.find((t) => t.to === newStatus);

    if (!transition) {
      const possible = allowedTransitions.map((t) => t.to).join(', ');
      throw new BadRequestException(
        `Invalid transition: ${currentStatus} → ${newStatus}. Allowed next statuses: ${possible}`,
      );
    }

    if (!transition.allowedRoles.includes(userRole)) {
      throw new BadRequestException(
        `Role '${userRole}' cannot transition ${currentStatus} → ${newStatus}. ` +
          `Allowed roles: ${transition.allowedRoles.join(', ')}`,
      );
    }
  }

  /**
   * Returns all statuses a given role can transition to from currentStatus.
   * Useful for building dynamic action menus on the frontend.
   */
  getAllowedTransitions(currentStatus: OrderStatus, userRole: UserRole): OrderStatus[] {
    const transitions = this.transitions.get(currentStatus) ?? [];
    return transitions.filter((t) => t.allowedRoles.includes(userRole)).map((t) => t.to);
  }
}
