import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private readonly keyId: string;
  private readonly keySecret: string;

  constructor(private readonly configService: ConfigService) {
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID', '');
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET', '');
  }

  get isConfigured(): boolean {
    return !!(this.keyId && this.keySecret);
  }

  /**
   * Creates a Razorpay order via the Razorpay API.
   * Amount must be in the smallest currency unit (paise).
   */
  async createOrder(
    amountInRupees: number,
    receipt: string,
  ): Promise<RazorpayOrder> {
    if (!this.isConfigured) {
      this.logger.warn('⚠️  Razorpay not configured — returning mock order (dev only)');
      // Return a mock order so development works without real credentials
      return {
        id: `rzp_mock_${Date.now()}`,
        amount: Math.round(amountInRupees * 100),
        currency: 'INR',
        receipt,
      };
    }

    try {
      // Dynamic import to avoid hard dependency at startup
      const Razorpay = (await import('razorpay')).default;
      const instance = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });

      const order = await instance.orders.create({
        amount: Math.round(amountInRupees * 100), // paise
        currency: 'INR',
        receipt,
      });

      return order as unknown as RazorpayOrder;
    } catch (error) {
      this.logger.error('Razorpay createOrder failed:', error.message);
      throw new InternalServerErrorException('Payment gateway error. Please try again.');
    }
  }

  /**
   * Verifies the HMAC-SHA256 signature returned by Razorpay after payment.
   * SECURITY: Never skip this — it proves payment was not tampered with.
   */
  verifySignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string,
  ): boolean {
    if (!this.isConfigured) {
      // DEV mode: skip verification for mock orders
      this.logger.warn('⚠️  Razorpay not configured — skipping signature verification (dev only)');
      return true;
    }

    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(body)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex'),
      );
    } catch {
      return false;
    }
  }
}
