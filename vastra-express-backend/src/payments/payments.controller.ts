import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Headers,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import {
  CodPaymentDto,
  CreatePaymentOrderDto,
  VerifyPaymentDto,
} from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('payments')
@ApiBearerAuth('JWT')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /api/payments/create-order
   * Customer creates a Razorpay order; returns credentials for frontend SDK.
   */
  @Post('create-order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  createPaymentOrder(
    @Body() dto: CreatePaymentOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.createPaymentOrder(dto, user);
  }

  /**
   * POST /api/payments/verify
   * Customer verifies payment after Razorpay frontend SDK callback.
   */
  @Post('verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  verifyPayment(
    @Body() dto: VerifyPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.verifyPayment(dto, user);
  }

  /**
   * POST /api/payments/webhook
   * Razorpay webhook — no JWT auth; verified using HMAC on raw body.
   * NOTE: requires rawBody enabled in NestJS app bootstrap (app.useRawBody()).
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
    return this.paymentsService.handleWebhook(rawBody, signature ?? '');
  }

  /**
   * POST /api/payments/cod
   * Driver marks cash-on-delivery as collected.
   */
  @Post('cod')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  markCodPaid(
    @Body() dto: CodPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.markCodPaid(dto, user);
  }

  /**
   * GET /api/payments/stats
   * Returns aggregate payment statistics (admin only).
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  getStats() {
    return this.paymentsService.getStats();
  }

  /**
   * GET /api/payments/history
   * Role-scoped: CUSTOMER → own orders, FACILITY_STAFF → their facility, ADMIN → all.
   */
  @Get('history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER', 'FACILITY_STAFF', 'ADMIN')
  getHistory(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.paymentsService.getHistory(user, page, limit);
  }

  /**
   * POST /api/payments/refund/:id
   * Admin initiates a refund for a specific payment.
   */
  @Post('refund/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  processRefund(
    @Param('id', ParseIntPipe) paymentId: number,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.processRefund(paymentId, reason ?? '', user.userId);
  }
}
