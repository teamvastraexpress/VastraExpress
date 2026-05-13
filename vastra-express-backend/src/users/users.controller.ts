import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
  ParseBoolPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth('JWT')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── CUSTOMER ROUTES ──────────────────────────────────────────────────────

  /**
   * GET /users/profile
   * Get current user's full profile
   */
  @Get('profile')
  getProfile(@CurrentUser('userId') userId: number) {
    return this.usersService.getProfile(userId);
  }

  /**
   * PUT /users/profile
   * Update current user's profile (name, email, fcmToken)
   */
  @Put('profile')
  updateProfile(
    @CurrentUser('userId') userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  // ─── ADMIN ROUTES ─────────────────────────────────────────────────────────

  /**
   * GET /users
   * List all users with pagination (Admin only)
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('role') role?: string,
  ) {
    return this.usersService.findAll(page, limit, role);
  }

  /**
   * GET /users/drivers
   * List all drivers — accessible by Admin AND Facility Staff (for assignment dropdowns)
   */
  @Get('drivers')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'FACILITY_STAFF')
  getDrivers(@CurrentUser() user: any) {
    return this.usersService.getDrivers(user);
  }

  /**
   * GET /users/:id
   * Get specific user by ID (Admin only)
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  /**
   * POST /users
   * Create a driver or staff account (Admin only)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  createStaff(@Body() dto: CreateStaffDto) {
    return this.usersService.createStaff(dto);
  }

  /**
   * PATCH /users/:id/status
   * Activate or deactivate a user (Admin only)
   */
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive', ParseBoolPipe) isActive: boolean,
  ) {
    return this.usersService.toggleStatus(id, isActive);
  }

  /**
   * PATCH /users/:id/role
   * Change a user's role (Admin only — DRIVER or FACILITY_STAFF)
   */
  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Change a user role (DRIVER or FACILITY_STAFF only)' })
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body('role') role: string,
  ) {
    return this.usersService.updateRole(id, role);
  }
}
