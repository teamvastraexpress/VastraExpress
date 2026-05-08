import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { FcmService } from './fcm.service';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

/**
 * @Global() so NotificationsService can be injected anywhere
 * without re-importing the module.
 */
@Global()
@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [NotificationsController],
  providers: [FcmService, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
