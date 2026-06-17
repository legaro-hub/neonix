import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { SocialAccountsService } from './social-accounts.service';
import { LinkChannelDto } from './dto/link-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';

@Controller('social-accounts')
@UseGuards(JwtAuthGuard)
export class SocialAccountsController {
  constructor(private readonly svc: SocialAccountsService) {}

  @Post('link')
  async generateLinkCode(@Req() req: Request & { user: RequestUser }) {
    return this.svc.generateLinkCode(req.user.id);
  }

  @Get()
  async list(@Req() req: Request & { user: RequestUser }) {
    return this.svc.listChannels(req.user.id);
  }

  @Get(':id')
  async getOne(
    @Req() req: Request & { user: RequestUser },
    @Param('id') id: string,
  ) {
    return this.svc.getChannel(req.user.id, id);
  }

  @Patch(':id')
  async update(
    @Req() req: Request & { user: RequestUser },
    @Param('id') id: string,
    @Body() dto: UpdateChannelDto,
  ) {
    return this.svc.updateChannel(req.user.id, id, dto);
  }

  @Delete(':id')
  async remove(
    @Req() req: Request & { user: RequestUser },
    @Param('id') id: string,
  ) {
    return this.svc.removeChannel(req.user.id, id);
  }
}
