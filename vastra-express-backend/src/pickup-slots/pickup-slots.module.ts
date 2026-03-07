import { Module } from '@nestjs/common';
import { PickupSlotsController } from './pickup-slots.controller';
import { PickupSlotsService } from './pickup-slots.service';
import { SlotSchedulerService } from './slot-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PickupSlotsController],
  providers: [PickupSlotsService, SlotSchedulerService],
  exports: [PickupSlotsService, SlotSchedulerService],
})
export class PickupSlotsModule {}
