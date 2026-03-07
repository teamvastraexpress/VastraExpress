import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FcmMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Firebase Cloud Messaging service.
 * Uses dynamic import to avoid crashing if firebase-admin is not installed.
 * In dev mode (FIREBASE_SERVICE_ACCOUNT not set), all calls are logged but NOT sent.
 */
@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private app: any = null;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const serviceAccount = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT');
    this.isConfigured = !!serviceAccount;

    if (this.isConfigured) {
      this.initFirebase(serviceAccount!);
    } else {
      this.logger.warn(
        '⚠️  FIREBASE_SERVICE_ACCOUNT not set — FCM running in mock mode (notifications logged only)',
      );
    }
  }

  private async initFirebase(serviceAccountJson: string) {
    try {
      const admin = await import('firebase-admin');
      if (!admin.default.apps.length) {
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.default.initializeApp({
          credential: admin.default.credential.cert(serviceAccount),
        });
      }
      this.app = admin.default.app();
      this.logger.log('✅ Firebase Admin SDK initialized');
    } catch (err) {
      this.logger.error('Failed to initialize Firebase Admin SDK', err);
    }
  }

  /**
   * Send a push notification to a single device token.
   * Returns true on success, false on failure.
   */
  async sendToToken(message: FcmMessage): Promise<boolean> {
    if (!this.isConfigured || !this.app) {
      this.logger.debug(
        `[MOCK FCM] → ${message.token.slice(0, 20)}... | "${message.title}": ${message.body}`,
      );
      return true; // Pretend success in dev
    }

    try {
      const admin = await import('firebase-admin');
      await admin.default.messaging(this.app).send({
        token: message.token,
        notification: { title: message.title, body: message.body },
        data: message.data ?? {},
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
      });
      return true;
    } catch (err: any) {
      this.logger.error(`FCM send failed for token ${message.token.slice(0, 20)}…: ${err.message}`);
      return false;
    }
  }

  /**
   * Send to multiple tokens at once (multicast).
   * Returns { successCount, failureCount }.
   */
  async sendMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!tokens.length) return { successCount: 0, failureCount: 0 };

    if (!this.isConfigured || !this.app) {
      this.logger.debug(`[MOCK FCM MULTICAST] ${tokens.length} tokens | "${title}": ${body}`);
      return { successCount: tokens.length, failureCount: 0 };
    }

    try {
      const admin = await import('firebase-admin');
      const response = await admin.default.messaging(this.app).sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: data ?? {},
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
      });
      return { successCount: response.successCount, failureCount: response.failureCount };
    } catch (err: any) {
      this.logger.error(`FCM multicast failed: ${err.message}`);
      return { successCount: 0, failureCount: tokens.length };
    }
  }
}
