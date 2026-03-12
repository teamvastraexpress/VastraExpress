import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AssignOrderDriverDto } from './dto/assign-driver.dto';
import { UpdateWeightDto, CancelOrderDto } from './dto/update-weight.dto';
import { ChangePickupSlotDto } from './dto/change-slot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('orders')
@ApiBearerAuth('JWT')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * POST /orders
   * Place a new laundry order. Authenticated customers only.
   * The facility is auto-derived from the chosen pickup slot.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.create(dto, user);
  }

  /**
   * GET /orders?page=1&limit=10&status=ORDER_CREATED
   * List orders scoped by the caller's role:
   *   CUSTOMER      → own orders only
   *   DRIVER        → orders they are assigned to
   *   FACILITY_STAFF → orders at their facility
   *   ADMIN         → all orders globally
   */
  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('status') status?: string,
  ) {
    return this.ordersService.findAll(user, page, limit, status);
  }

  /**
   * GET /orders/:id
   * Get full order detail. Access is role-scoped (same rules as findAll).
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.ordersService.findOne(id, user);
  }

  /**
   * PATCH /orders/:id/status
   * Advance or branch the order state machine.
   * The state machine validates:
   *   1. That the transition is a defined allowed transition.
   *   2. That the caller's role is permitted to make that specific transition.
   * All roles can call this endpoint; invalid attempts are rejected with 400.
   */
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateStatus(id, dto, user);
  }

  /**
   * PATCH /orders/:id/weight
   * [Driver / Facility Staff / Admin] Update order weight.
   *   - Driver updates initialWeight (measured at pickup)
   *   - Facility staff updates finalWeight (after sorting)
   */
  @Patch(':id/weight')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'FACILITY_STAFF', 'DRIVER')
  updateWeight(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWeightDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateWeight(id, dto, user);
  }

  /**
   * POST /orders/:id/assign-driver
   * [Facility Staff / Admin] Assign a DRIVER to an order for pickup or delivery.
   * Creates a DeliveryAssignment record with type PICKUP or DELIVERY.
   */
  @Post(':id/assign-driver')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'FACILITY_STAFF')
  @HttpCode(HttpStatus.CREATED)
  assignDriver(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignOrderDriverDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.assignDriver(id, dto, user);
  }

  /**
   * GET /orders/:id/history
   * Get the full chronological status change history for an order.
   * Access is role-scoped (same as findOne).
   */
  @Get(':id/history')
  getStatusHistory(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.getStatusHistory(id, user);
  }

  /**
   * PATCH /orders/:id/slot
   * [Customer] Change the pickup slot up to 2 hours before the current slot starts.
   * If a driver was already assigned (PICKUP_ASSIGNED), the assignment is cancelled
   * and the order reverts to PICKUP_SCHEDULED — facility will see it in pending pickups.
   */
  @Patch(':id/slot')
  @HttpCode(HttpStatus.OK)
  changePickupSlot(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangePickupSlotDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.changePickupSlot(id, dto.newSlotId, user);
  }

  /**
   * PATCH /orders/:id/cancel
   * Cancel an order.
   *   - CUSTOMER can cancel up to PICKUP_ASSIGNED status
   *   - FACILITY_STAFF / ADMIN can cancel up to PICKUP_ARRIVED
   *   - Drivers cannot cancel orders
   * On cancel, the pickup slot booking is automatically released.
   */
  @Patch(':id/cancel')
  cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CancelOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.cancelOrder(id, user, body?.notes);
  }
}
