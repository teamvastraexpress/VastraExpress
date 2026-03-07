import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface SmsPayload {
  mobile: string;
  variables: Record<string, string>;
  templateId?: string;
}

/**
 * MSG91 SMS Service.
 * In dev mode (MSG91_AUTH_KEY not set), messages are logged but NOT sent.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly authKey: string;
  private readonly defaultTemplateIds: Record<string, string>;
  private readonly isConfigured: boolean;
  private readonly senderId: string;

  constructor(private readonly configService: ConfigService) {
    this.authKey = this.configService.get<string>('MSG91_AUTH_KEY', '');
    this.senderId = this.configService.get<string>('MSG91_SENDER_ID', 'VASTRA');
    this.isConfigured = !!this.authKey;

    // Template IDs from .env — each event has its own MSG91 template
    this.defaultTemplateIds = {
      OTP: this.configService.get('MSG91_TEMPLATE_OTP', ''),
      PICKUP_SCHEDULED: this.configService.get('MSG91_TEMPLATE_PICKUP_SCHEDULED', ''),
      PICKED_UP: this.configService.get('MSG91_TEMPLATE_PICKED_UP', ''),
      RECEIVED_AT_FACILITY: this.configService.get('MSG91_TEMPLATE_RECEIVED', ''),
      BILL_GENERATED: this.configService.get('MSG91_TEMPLATE_BILL', ''),
      OUT_FOR_DELIVERY: this.configService.get('MSG91_TEMPLATE_OFD', ''),
      DELIVERED: this.configService.get('MSG91_TEMPLATE_DELIVERED', ''),
    };

    if (!this.isConfigured) {
      this.logger.warn(
        '⚠️  MSG91_AUTH_KEY not set — SMS running in mock mode (messages logged only)',
      );
    }
  }

  // ============================================================
  // SEND OTP SMS
  // ============================================================

  /**
   * Send OTP via MSG91's dedicated OTP API endpoint.
   * Template: "Your Vastra Express OTP is {otp}. Valid for 5 minutes."
   */
  async sendOtp(mobile: string, otp: string): Promise<boolean> {
    return this.send({
      mobile,
      templateId: this.defaultTemplateIds.OTP,
      variables: { otp },
    });
  }

  // ============================================================
  // ORDER STATUS SMS NOTIFICATIONS
  // ============================================================

  async sendPickupScheduled(
    mobile: string,
    orderNumber: string,
    date: string,
    timeSlot: string,
  ): Promise<boolean> {
    return this.send({
      mobile,
      templateId: this.defaultTemplateIds.PICKUP_SCHEDULED,
      variables: { order_number: orderNumber, date, time: timeSlot },
    });
  }

  async sendPickedUp(
    mobile: string,
    orderNumber: string,
    weight: string,
  ): Promise<boolean> {
    return this.send({
      mobile,
      templateId: this.defaultTemplateIds.PICKED_UP,
      variables: { order_number: orderNumber, weight },
    });
  }

  async sendReceivedAtFacility(mobile: string, orderNumber: string): Promise<boolean> {
    return this.send({
      mobile,
      templateId: this.defaultTemplateIds.RECEIVED_AT_FACILITY,
      variables: { order_number: orderNumber },
    });
  }

  async sendBillGenerated(
    mobile: string,
    orderNumber: string,
    amount: string,
  ): Promise<boolean> {
    return this.send({
      mobile,
      templateId: this.defaultTemplateIds.BILL_GENERATED,
      variables: { order_number: orderNumber, amount },
    });
  }

  async sendOutForDelivery(
    mobile: string,
    orderNumber: string,
    estimatedTime: string,
  ): Promise<boolean> {
    return this.send({
      mobile,
      templateId: this.defaultTemplateIds.OUT_FOR_DELIVERY,
      variables: { order_number: orderNumber, time: estimatedTime },
    });
  }

  async sendDelivered(mobile: string, orderNumber: string): Promise<boolean> {
    return this.send({
      mobile,
      templateId: this.defaultTemplateIds.DELIVERED,
      variables: { order_number: orderNumber },
    });
  }

  // ============================================================
  // INTERNAL SEND
  // ============================================================

  private async send(payload: SmsPayload): Promise<boolean> {
    // Sanitise: strip non-digits, ensure 10-digit Indian number
    const mobile = payload.mobile.replace(/\D/g, '');

    if (!this.isConfigured || !payload.templateId) {
      this.logger.debug(
        `[MOCK SMS] → ${mobile} | template: ${payload.templateId ?? 'none'} | vars: ${JSON.stringify(payload.variables)}`,
      );
      return true; // Pretend success in dev mode
    }

    try {
      const response = await axios.post(
        'https://api.msg91.com/api/v5/flow/',
        {
          template_id: payload.templateId,
          sender: this.senderId,
          short_url: '0',
          mobiles: `91${mobile}`, // Prefix with India country code
          ...payload.variables,
        },
        {
          headers: {
            authkey: this.authKey,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        },
      );

      if (response.data?.type === 'success') {
        this.logger.debug(`SMS sent to ${mobile} (template: ${payload.templateId})`);
        return true;
      } else {
        this.logger.warn(
          `SMS failed for ${mobile}: ${JSON.stringify(response.data)}`,
        );
        return false;
      }
    } catch (err: any) {
      this.logger.error(`MSG91 API error for ${mobile}: ${err.message}`);
      return false; // Never throw — SMS failure must not block business logic
    }
  }
}
