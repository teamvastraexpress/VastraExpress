import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PickupSlotsService } from './pickup-slots.service';
import { SlotSchedulerService } from './slot-scheduler.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { GetAvailableSlotsDto } from './dto/get-available-slots.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('pickup-slots')
@ApiBearerAuth('JWT')
@Controller('pickup-slots')
export class PickupSlotsController {
  constructor(
    private readonly pickupSlotsService: PickupSlotsService,
    private readonly slotScheduler: SlotSchedulerService,
  ) {}

  /**
   * GET /pickup-slots/available?date=YYYY-MM-DD&facilityId=1
   * Get available slots for customers (public, no auth needed)
   */
  @Get('available')
  getAvailable(@Query() query: GetAvailableSlotsDto) {
    return this.pickupSlotsService.getAvailable(query);
  }

  /**
   * POST /pickup-slots/generate?date=YYYY-MM-DD
   * Manually trigger slot generation for a date (Admin only)
   */
  @Post('generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async generateSlots(@Query('date') date?: string) {
    const target = date ? new Date(date) : new Date();
    target.setHours(0, 0, 0, 0);
    const result = await this.slotScheduler.generateSlotsForDate(target);
    return { message: `Slot generation complete for ${target.toISOString().split('T')[0]}`, ...result };
  }

  /**
   * POST /pickup-slots
   * Create a new slot (Admin / Facility Staff only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'FACILITY_STAFF')
  create(
    @Body() dto: CreateSlotDto,
    @CurrentUser('role') role: string,
    @CurrentUser() user: any,
  ) {
    return this.pickupSlotsService.create(dto, role, user?.facilityId);
  }

  /**
   * GET /pickup-slots
   * List all slots (Admin / Facility Staff only)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'FACILITY_STAFF')
  findAll(
    @CurrentUser('role') role: string,
    @CurrentUser() user: any,
    @Query('facilityId', new ParseIntPipe({ optional: true })) facilityId?: number,
    @Query('date') date?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.pickupSlotsService.findAll(role, user?.facilityId, facilityId, date, page, limit);
  }

  /**
   * PUT /pickup-slots/:id
   * Update a slot (Admin / Facility Staff only)
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'FACILITY_STAFF')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSlotDto,
    @CurrentUser('role') role: string,
    @CurrentUser() user: any,
  ) {
    return this.pickupSlotsService.update(id, dto, role, user?.facilityId);
  }

  /**
   * PATCH /pickup-slots/block-day
   * Block or unblock ALL slots for a specific date (Admin / Facility Staff only)
   */
  @Patch('block-day')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'FACILITY_STAFF')
  @ApiOperation({ summary: 'Block or unblock all slots for a specific date' })
  blockDay(
    @Body() body: { date: string; facilityId?: number; block: boolean },
    @CurrentUser('role') role: string,
    @CurrentUser() user: any,
  ) {
    return this.pickupSlotsService.blockDay(
      body.date,
      body.facilityId,
      body.block,
      role,
      user?.facilityId,
    );
  }

  /**
   * PATCH /pickup-slots/:id/toggle
   * Quickly toggle a slot's isActive status (Admin / Facility Staff only)
   */
  @Patch(':id/toggle')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'FACILITY_STAFF')
  toggle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('role') role: string,
    @CurrentUser() user: any,
  ) {
    return this.pickupSlotsService.toggleStatus(id, role, user?.facilityId);
  }

  /**
   * DELETE /pickup-slots/:id
   * Delete a slot (Admin / Facility Staff only)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'FACILITY_STAFF')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('role') role: string,
    @CurrentUser() user: any,
  ) {
    return this.pickupSlotsService.remove(id, role, user?.facilityId);
  }
}
