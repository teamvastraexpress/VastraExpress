import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  CreateInventoryItemDto,
  LogInventoryTransactionDto,
  UpdateInventoryItemDto,
} from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('inventory')
@ApiBearerAuth('JWT')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'FACILITY_STAFF')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * POST /api/inventory
   * Create a new inventory item (with optional opening stock).
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateInventoryItemDto, @CurrentUser() user: any) {
    return this.inventoryService.create(dto, user);
  }

  /**
   * GET /api/inventory?facilityId=1&category=DETERGENT&lowStockOnly=true&page=1&limit=20
   * List all inventory items with optional filters.
   */
  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('facilityId') facilityId?: string,
    @Query('category') category?: string,
    @Query('lowStockOnly') lowStockOnly = 'false',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.inventoryService.findAll(
      user,
      facilityId ? +facilityId : undefined,
      category,
      lowStockOnly === 'true',
      +page,
      +limit,
    );
  }

  /**
   * GET /api/inventory/low-stock
   * Get a low-stock alert report for admin/facility dashboard.
   */
  @Get('low-stock')
  getLowStockReport(@CurrentUser() user: any) {
    return this.inventoryService.getLowStockReport(user);
  }

  /**
   * GET /api/inventory/:id
   * Get a single inventory item with its recent transaction log.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.inventoryService.findOne(id, user);
  }

  /**
   * PATCH /api/inventory/:id
   * Update item metadata (name, category, unit, threshold).
   * Does NOT change quantity — use /transaction for that.
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryItemDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.update(id, dto, user);
  }

  /**
   * POST /api/inventory/transaction
   * Log a stock transaction: ADDITION | CONSUMPTION | ADJUSTMENT.
   */
  @Post('transaction')
  @HttpCode(HttpStatus.OK)
  logTransaction(@Body() dto: LogInventoryTransactionDto, @CurrentUser() user: any) {
    return this.inventoryService.logTransaction(dto, user);
  }

  /**
   * GET /api/inventory/:id/logs?page=1&limit=20
   * Get the full transaction log for an inventory item.
   */
  @Get(':id/logs')
  getLogs(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.inventoryService.getLogs(id, user, +page, +limit);
  }
}
