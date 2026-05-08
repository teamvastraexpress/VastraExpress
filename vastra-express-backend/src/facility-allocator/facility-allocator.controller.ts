import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FacilityAllocatorService } from './facility-allocator.service';
import { GetFacilityOptionsDto } from './dto/get-facility-options.dto';

@ApiTags('facility-allocator')
@ApiBearerAuth('JWT')
@Controller('facility-allocator')
@UseGuards(JwtAuthGuard)
export class FacilityAllocatorController {
  constructor(private readonly allocator: FacilityAllocatorService) {}

  /**
  * GET /facility-allocator/options?addressId=1&pickupDate=YYYY-MM-DD
  * Returns nearby facilities with available slots for the date.
   */
  @Get('options')
  getOptions(
    @CurrentUser('userId') userId: number,
    @Query() query: GetFacilityOptionsDto,
  ) {
    return this.allocator.getFacilityOptions(userId, query.addressId, query.pickupDate);
  }
}
