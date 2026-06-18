import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  overview(@Req() req: Request & { user: RequestUser }) {
    return this.analytics.getOverview(req.user.id);
  }

  @Get('timeline')
  timeline(
    @Req() req: Request & { user: RequestUser },
    @Query('days') days?: string,
  ) {
    const d = days ? parseInt(days, 10) : 30;
    return this.analytics.getTimeline(req.user.id, isNaN(d) ? 30 : d);
  }

  @Get('channels')
  channels(@Req() req: Request & { user: RequestUser }) {
    return this.analytics.getByChannel(req.user.id);
  }

  @Get('posts')
  posts(
    @Req() req: Request & { user: RequestUser },
    @Query('limit') limit?: string,
  ) {
    const l = limit ? parseInt(limit, 10) : 10;
    return this.analytics.getRecentPosts(req.user.id, isNaN(l) ? 10 : l);
  }
}
