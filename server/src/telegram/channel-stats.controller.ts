import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';
import { TelegramStatsService } from './telegram-stats.service';

@Controller('channel-stats')
@UseGuards(JwtAuthGuard)
export class ChannelStatsController {
  constructor(private readonly stats: TelegramStatsService) {}

  @Get()
  getStats(@Req() req: Request & { user: RequestUser }) {
    return this.stats.getChannelStats(req.user.id);
  }

  @Post('collect')
  collectNow(@Req() req: Request & { user: RequestUser }) {
    return this.stats.collectAll();
  }
}
