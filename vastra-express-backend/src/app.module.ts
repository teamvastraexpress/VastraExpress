import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AddressesModule } from './addresses/addresses.module';
import { PickupSlotsModule } from './pickup-slots/pickup-slots.module';
import { OrdersModule } from './orders/orders.module';
import { DeliveryModule } from './delivery/delivery.module';
import { InventoryModule } from './inventory/inventory.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { FacilityAllocatorModule } from './facility-allocator/facility-allocator.module';

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Rate limiting — generous in dev, strict in prod
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = config.get<string>('NODE_ENV') === 'development';
        return [{ ttl: isDev ? 60000 : 900000, limit: isDev ? 10000 : 300 }];
      },
    }),
    ScheduleModule.forRoot(),
    // Core modules
    PrismaModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    AddressesModule,
    PickupSlotsModule,
    OrdersModule,
    DeliveryModule,
    InventoryModule,
    ReportsModule,
    FacilitiesModule,
    FacilityAllocatorModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // CRITICAL: Apply ThrottlerGuard globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
