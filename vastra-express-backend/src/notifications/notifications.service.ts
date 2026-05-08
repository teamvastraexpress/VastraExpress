import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BroadcastNotificationDto,
  SendNotificationDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ============================================================
  // SEND TO ONE USER
  // ============================================================

  /**
   * Log a notification attempt. Silently skips if user not found.
   */
  async sendToUser(dto: SendNotificationDto): Promise<{ sent: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, name: true },
    });

    if (!user) {
      this.logger.debug(`User #${dto.userId} not found — skipping notification`);
      return { sent: false };
    }

    this.logger.log(`[NOTIFICATION] To User #${user.id} (${user.name}): "${dto.title}" - ${dto.body}`);
    
    return { sent: true };
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
    this.logger.log(`[BROADCAST] Target: ${dto.targetRole || 'all'} | "${dto.title}": ${dto.body}`);
    return { totalTargeted: 0, successCount: 0, failureCount: 0 };
  }

  // ============================================================
  // UPDATE FCM TOKEN (REMOVED - NO LONGER USED)
  // ============================================================

  async updateToken(userId: number, fcmToken: string): Promise<void> {
    this.logger.debug(`FCM tokens are disabled. Ignoring token update for user #${userId}`);
  }
}
