import { Controller, Get, Post, Param, UseGuards, Req, Body } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';
import { MtprotoService } from './mtproto.service';

@Controller('mtproto')
@UseGuards(JwtAuthGuard)
export class MtprotoController {
  constructor(private readonly mtproto: MtprotoService) {}

  @Get('status')
  status() {
    return this.mtproto.getStatus();
  }

  @Post('auth/phone')
  async authPhone(@Body() body: { phone: string }) {
    if (!body.phone) return { error: 'Phone number required' };
    return this.mtproto.startAuth(body.phone);
  }

  @Post('auth/code')
  async authCode(@Body() body: { code: string }) {
    if (!body.code) return { error: 'Code required' };
    return this.mtproto.submitCode(body.code);
  }

  @Post('auth/password')
  async authPassword(@Body() body: { password: string }) {
    if (!body.password) return { error: 'Password required' };
    return this.mtproto.submitPassword(body.password);
  }

  @Post('auth/logout')
  logout() {
    return this.mtproto.logout();
  }

  @Get('channel/:username/stats')
  async getChannelStats(@Param('username') username: string) {
    const stats = await this.mtproto.getChannelPostStats(`@${username}`, 30);
    if (!stats) return { error: 'Failed to get stats or MTProto not configured' };
    return stats;
  }

  @Post('collect')
  async collect(@Req() req: Request & { user: RequestUser }) {
    return this.mtproto.collectPostStats(req.user.id);
  }
}
