import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { PricingService } from './pricing.service';
import { GenerateBillDto, UpdatePricingDto } from './dto/billing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('billing')
@ApiBearerAuth('JWT')
@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly pricingService: PricingService,
  ) {}

  /**
   * POST /billing/generate/:orderId
   * [Facility Staff / Admin] Generate the final bill for an order.
   * Order must be in PACKING status.
   * Advances order to BILL_GENERATED and creates a Payment record.
   */
  @Post('generate/:orderId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'FACILITY_STAFF')
  @HttpCode(HttpStatus.CREATED)
  generateBill(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: GenerateBillDto,
    @CurrentUser() user: any,
  ) {
    return this.billingService.generateBill(orderId, user, dto.useItemBilling);
  }

  /**
   * GET /billing/preview/:orderId?useItemBilling=true
   * [Facility Staff / Admin] Preview the bill without saving.
   * Useful for reviewing charges before finalising.
   */
  @Get('preview/:orderId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'FACILITY_STAFF')
  previewBill(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Query('useItemBilling') useItemBillingStr: string,
    @CurrentUser() user: any,
  ) {
    const useItemBilling = useItemBillingStr === 'true';
    return this.billingService.previewBill(orderId, user, useItemBilling);
  }

  /**
   * GET /billing/invoice/:orderId
   * Get the GST invoice for a billed order.
   * Accessible by: Customer (own orders), Facility Staff (facility orders), Admin (all).
   */
  @Get('invoice/:orderId')
  getInvoice(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() user: any,
  ) {
    return this.billingService.getInvoice(orderId, user);
  }

  /**
   * GET /billing/pricing?serviceType=WASH_FOLD
   * Get current pricing configuration.
   * Optional query param to filter by service type.
   * Public — used by the customer landing page without auth.
   */
  @Get('pricing')
  @Public()
  getPricing(@Query('serviceType') serviceType?: string) {
    return this.pricingService.getPricing(serviceType);
  }

  /**
   * PUT /billing/pricing
   * [Admin] Create or update a pricing configuration.
   * If a config for the same serviceType + cityId + itemName exists, it's updated.
   * Otherwise a new record is created.
   */
  @Put('pricing')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  upsertPricing(@Body() dto: UpdatePricingDto) {
    return this.pricingService.upsertPricing(dto);
  }
}
