import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('addresses')
@ApiBearerAuth('JWT')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  /**
   * POST /addresses
   * Add a new address
   */
  @Post()
  create(
    @CurrentUser('userId') userId: number,
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressesService.create(userId, dto);
  }

  /**
   * GET /addresses
   * Get all addresses for current user
   */
  @Get()
  findAll(@CurrentUser('userId') userId: number) {
    return this.addressesService.findAll(userId);
  }

  /**
   * GET /addresses/:id
   * Get a specific address
   */
  @Get(':id')
  findOne(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.addressesService.findOne(userId, id);
  }

  /**
   * PUT /addresses/:id
   * Update an address
   */
  @Put(':id')
  update(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(userId, id, dto);
  }

  /**
   * DELETE /addresses/:id
   * Delete an address
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.addressesService.remove(userId, id);
  }

  /**
   * PATCH /addresses/:id/default
   * Set address as default
   */
  @Patch(':id/default')
  setDefault(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.addressesService.setDefault(userId, id);
  }
}
