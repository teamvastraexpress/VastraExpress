import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FacilityAllocatorController } from './facility-allocator.controller';
import { FacilityAllocatorService } from './facility-allocator.service';

@Module({
  imports: [PrismaModule],
  controllers: [FacilityAllocatorController],
  providers: [FacilityAllocatorService],
  exports: [FacilityAllocatorService],
})
export class FacilityAllocatorModule {}
