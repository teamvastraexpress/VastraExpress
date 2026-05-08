import {
  Body,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FacilitiesService } from './facilities.service';
import {
  CreateCityDto,
  UpdateCityDto,
  CreateFacilityDto,
  UpdateFacilityDto,
} from './dto/facility.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('facilities')
@ApiBearerAuth('JWT')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  // ─── CITIES ─────────────────────────────────────────────────────────────────

  /**
   * GET /cities?includeInactive=true
   * List all cities. Readable by all authenticated staff.
   */
  @Get('cities')
  @Public()
  getCities(@Query('includeInactive') includeInactiveStr?: string) {
    return this.facilitiesService.getCities(includeInactiveStr === 'true');
  }

  /**
   * POST /cities
   * Create a new city. Admin only.
   */
  @Post('cities')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  createCity(@Body() dto: CreateCityDto) {
    return this.facilitiesService.createCity(dto);
  }

  /**
   * PUT /cities/:id
   * Update a city. Admin only.
   */
  @Put('cities/:id')
  @Roles('ADMIN')
  updateCity(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCityDto,
  ) {
    return this.facilitiesService.updateCity(id, dto);
  }

  // ─── FACILITIES ──────────────────────────────────────────────────────────────

  /**
   * GET /facilities
   * List all facilities. Readable by all authenticated staff.
   */
  @Get('facilities')
  @Roles('ADMIN', 'FACILITY_STAFF', 'DRIVER')
  getFacilities(@Query('includeInactive') includeInactiveStr?: string) {
    return this.facilitiesService.getFacilities(includeInactiveStr === 'true');
  }

  /**
   * GET /facilities/staff
    * List all FACILITY_STAFF + DRIVER users for admin dropdown assignment.
   */
  @Get('facilities/staff')
  @Roles('ADMIN')
  getFacilityStaff() {
    return this.facilitiesService.getFacilityStaff();
  }

  /**
   * POST /facilities
   * Create a new facility. Admin only.
   */
  @Post('facilities')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  createFacility(@Body() dto: CreateFacilityDto) {
    return this.facilitiesService.createFacility(dto);
  }

  /**
   * PUT /facilities/:id
   * Update a facility. Admin only.
   */
  @Put('facilities/:id')
  @Roles('ADMIN')
  updateFacility(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFacilityDto,
  ) {
    return this.facilitiesService.updateFacility(id, dto);
  }

  /**
   * PATCH /facilities/:id/status
   * Toggle facility active status. Admin only.
   */
  @Patch('facilities/:id/status')
  @Roles('ADMIN')
  toggleFacilityStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive', ParseBoolPipe) isActive: boolean,
  ) {
    return this.facilitiesService.toggleFacilityStatus(id, isActive);
  }
}
