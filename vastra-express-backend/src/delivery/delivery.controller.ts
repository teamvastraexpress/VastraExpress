import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import {
  AssignDriverDto,
  ReassignDriverDto,
  UpdateAssignmentStatusDto,
} from './dto/delivery.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('delivery')
@ApiBearerAuth('JWT')
@Controller('delivery')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  /**
   * POST /api/delivery/assign
   * [Admin / Facility Staff] Assign a driver to a ready-for-dispatch order.
   */
  @Post('assign')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'FACILITY_STAFF')
  @HttpCode(HttpStatus.CREATED)
  assignDriver(@Body() dto: AssignDriverDto, @CurrentUser() user: any) {
    return this.deliveryService.assignDriver(dto, user);
  }

  /**
   * GET /api/delivery/my-assignments?page=1&limit=10&type=PICKUP&status=ASSIGNED
   * [Driver] Get all assignments for the current driver.
   * type: PICKUP | DELIVERY (optional filter for Pickup/Delivery tabs)
   * status: ASSIGNED | IN_PROGRESS | COMPLETED | FAILED (optional filter)
   */
  @Get('my-assignments')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  getMyAssignments(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.deliveryService.getMyAssignments(user, page, limit, type, status);
  }

  /**
   * PATCH /api/delivery/:id/status
   * [Driver / Admin] Update delivery assignment status.
   * Flow: ASSIGNED → IN_PROGRESS → ARRIVED → COMPLETED | FAILED
   * IN_PROGRESS: driver has started (OUT_FOR_PICKUP / OUT_FOR_DELIVERY)
   * ARRIVED:     driver is at location (PICKUP_ARRIVED / DELIVERY_ARRIVED)
   * COMPLETED:   pickup/delivery confirmed (PICKED_UP / DELIVERED)
   * FAILED:      could not complete (PICKUP_FAILED / DELIVERY_FAILED)
   */
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('DRIVER', 'ADMIN')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssignmentStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.deliveryService.updateStatus(id, dto, user);
  }

  /**
   * GET /api/delivery/orders/:orderId
   * [Admin / Facility Staff / Customer (own orders)] Get all assignments for an order.
   */
  @Get('orders/:orderId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'FACILITY_STAFF', 'CUSTOMER')
  getOrderAssignments(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() user: any,
  ) {
    return this.deliveryService.getOrderAssignments(orderId, user);
  }

  /**
   * POST /api/delivery/:id/reassign
   * [Admin / Facility Staff] Reassign an ongoing delivery to a different driver.
   */
  @Post(':id/reassign')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'FACILITY_STAFF')
  @HttpCode(HttpStatus.OK)
  reassignDriver(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReassignDriverDto,
    @CurrentUser() user: any,
  ) {
    return this.deliveryService.reassignDriver(id, dto, user);
  }

  /**
   * GET /api/delivery?page=1&limit=20&status=ASSIGNED
   * [Admin / Facility Staff] List all assignments with optional status filter.
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'FACILITY_STAFF')
  listAll(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.deliveryService.listAll(user, page, limit, status);
  }
}
