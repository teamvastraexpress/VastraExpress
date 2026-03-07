import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  BroadcastNotificationDto,
  SendNotificationDto,
} from './dto/notification.dto';
import { IsNotEmpty, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

class UpdateFcmTokenDto {
  @IsString()
  @IsNotEmpty()
  fcmToken: string;
}

@ApiTags('notifications')
@ApiBearerAuth('JWT')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * POST /api/notifications/token
   * Any authenticated user updates their FCM device token (called on app startup).
   */
  @Post('token')
  @HttpCode(HttpStatus.OK)
  updateToken(
    @CurrentUser('userId') userId: number,
    @Body() body: UpdateFcmTokenDto,
  ) {
    return this.notificationsService.updateToken(userId, body.fcmToken).then(() => ({
      message: 'FCM token updated',
    }));
  }

  /**
   * POST /api/notifications/send
   * [Admin] Send a push notification to a specific user.
   */
  @Post('send')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  sendToUser(@Body() dto: SendNotificationDto) {
    return this.notificationsService.sendToUser(dto);
  }

  /**
   * POST /api/notifications/broadcast
   * [Admin] Broadcast a push notification to all (or role-filtered) users.
   */
  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  broadcast(@Body() dto: BroadcastNotificationDto) {
    return this.notificationsService.broadcast(dto);
  }
}
