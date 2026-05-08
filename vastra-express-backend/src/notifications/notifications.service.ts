import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FcmService } from './fcm.service';
import {
  BroadcastNotificationDto,
  SendNotificationDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fcm: FcmService,
  ) {}

  // ============================================================
  // SEND TO ONE USER
  // ============================================================

  /**
   * Look up the user's FCM token and send a push notification.
   * Silently skips if the user has no FCM token registered.
   */
  async sendToUser(dto: SendNotificationDto): Promise<{ sent: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, fcmToken: true },
    });

    if (!user || !user.fcmToken) {
      this.logger.debug(`User #${dto.userId} has no FCM token — skipping notification`);
      return { sent: false };
    }

    const ok = await this.fcm.sendToToken({
      token: user.fcmToken,
      title: dto.title,
      body: dto.body,
      data: {
        ...(dto.type && { type: dto.type }),
        ...dto.data,
      },
    });

    return { sent: ok };
  }

  // ============================================================
  // ORDER STATUS NOTIFICATION (called by other services)
  // ============================================================

  /**
   * Convenience method used by Orders, Payments, Delivery, etc.
   * to push an order-status update to the customer.
   */
  async notifyOrderStatus(
    customerId: number,
    orderNumber: string,
    newStatus: string,
    extraBody?: string,
  ): Promise<void> {
    const statusLabels: Record<string, string> = {
      ORDER_CONFIRMED: 'Your order has been confirmed! 🧺',
      PICKUP_SCHEDULED: 'Pickup has been scheduled',
      DRIVER_ASSIGNED: 'A driver has been assigned for pickup',
      OUT_FOR_PICKUP: 'Driver is on the way to pick up your laundry 🚚',
      PICKED_UP: 'Your laundry has been picked up ✅',
      RECEIVED_AT_FACILITY: 'Your clothes arrived at our facility 🏭',
      WASHING: 'Washing in progress 🧼',
      IRONING: 'Ironing in progress 👔',
      PACKING: 'Packing your clothes',
      READY_FOR_DISPATCH: 'Your order is ready for delivery!',
      DELIVERY_ASSIGNED: 'A driver has been assigned for delivery',
      OUT_FOR_DELIVERY: 'Your laundry is out for delivery 🚗',
      DELIVERED: 'Your laundry has been delivered! ✨',
      CANCELLED: 'Your order has been cancelled',
      DELIVERY_FAILED: 'Delivery attempt failed. We will retry soon.',
    };

    const body = statusLabels[newStatus] ?? `Order status updated to ${newStatus}`;

    await this.sendToUser({
      userId: customerId,
      title: `Order #${orderNumber}`,
      body: extraBody ?? body,
      type: 'ORDER_UPDATE',
      data: { orderNumber, status: newStatus },
    });
  }

  // ============================================================
  // BROADCAST (Admin → group of users)
  // ============================================================

  async broadcast(dto: BroadcastNotificationDto): Promise<{
    totalTargeted: number;
    successCount: number;
    failureCount: number;
  }> {
    // Build the where clause for role-filtered query
    const whereRole = dto.targetRole && dto.targetRole !== 'all'
      ? { role: { name: dto.targetRole } }
      : {};

    const users = await this.prisma.user.findMany({
      where: { ...whereRole, fcmToken: { not: null }, isActive: true },
      select: { id: true, fcmToken: true },
    });

    const tokens = users
      .map((u) => u.fcmToken)
      .filter((t): t is string => !!t);

    if (!tokens.length) {
      return { totalTargeted: 0, successCount: 0, failureCount: 0 };
    }

    const { successCount, failureCount } = await this.fcm.sendMulticast(
      tokens,
      dto.title,
      dto.body,
      dto.type ? { type: dto.type } : undefined,
    );

    this.logger.log(
      `📢 Broadcast "${dto.title}" to ${tokens.length} users — ✅ ${successCount}, ❌ ${failureCount}`,
    );

    return { totalTargeted: tokens.length, successCount, failureCount };
  }

  // ============================================================
  // UPDATE FCM TOKEN (called after login / app open)
  // ============================================================

  async updateToken(userId: number, fcmToken: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });
    this.logger.debug(`FCM token updated for user #${userId}`);
  }
}
