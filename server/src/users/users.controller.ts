import { Controller, Get, Patch, Post, Delete, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateProfileDto, ChangePasswordDto, UpdateNotificationsDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@Req() req: Request & { user: RequestUser }) {
    return this.users.getMe(req.user.id);
  }

  @Patch('me')
  updateMe(
    @Req() req: Request & { user: RequestUser },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.users.updateMe(req.user.id, dto);
  }

  @Post('me/change-password')
  changePassword(
    @Req() req: Request & { user: RequestUser },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.users.changePassword(req.user.id, dto);
  }

  @Delete('me')
  deleteMe(@Req() req: Request & { user: RequestUser }) {
    return this.users.deleteMe(req.user.id);
  }

  @Get('me/notifications')
  getNotifications(@Req() req: Request & { user: RequestUser }) {
    return this.users.getNotifications(req.user.id);
  }

  @Patch('me/notifications')
  updateNotifications(
    @Req() req: Request & { user: RequestUser },
    @Body() dto: UpdateNotificationsDto,
  ) {
    return this.users.updateNotifications(req.user.id, dto);
  }
}
