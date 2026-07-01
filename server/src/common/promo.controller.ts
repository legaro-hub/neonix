import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';
import { PromoService } from './promo.service';

@Controller('promo')
export class PromoController {
  constructor(private readonly promoService: PromoService) {}

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  async applyCode(
    @Req() req: Request & { user: RequestUser },
    @Body() body: { code: string },
  ) {
    return this.promoService.applyPromoCode(req.user.id, body.code);
  }

  @Get('plan')
  @UseGuards(JwtAuthGuard)
  async getPlan(@Req() req: Request & { user: RequestUser }) {
    return this.promoService.getUserPlan(req.user.id);
  }

  @Get('active')
  async listActive() {
    return this.promoService.listActivePromos();
  }
}
