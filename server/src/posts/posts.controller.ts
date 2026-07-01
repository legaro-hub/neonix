import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Get()
  list(
    @Req() req: Request & { user: RequestUser },
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('socialAccountId') socialAccountId?: string,
  ) {
    return this.posts.list(req.user.id, from, to, socialAccountId);
  }

  @Get('calendar')
  calendar(
    @Req() req: Request & { user: RequestUser },
    @Query('month') month: string,
  ) {
    return this.posts.getCalendar(req.user.id, month);
  }

  @Get(':id')
  getOne(
    @Req() req: Request & { user: RequestUser },
    @Param('id') id: string,
  ) {
    return this.posts.getOne(req.user.id, id);
  }

  @Post()
  create(
    @Req() req: Request & { user: RequestUser },
    @Body() body: { title?: string; body: string; buttons?: Array<{ text: string; url: string }>; scheduledAt?: string; socialAccountIds: string[] },
  ) {
    return this.posts.create(req.user.id, body);
  }

  @Post('bulk')
  createBulk(
    @Req() req: Request & { user: RequestUser },
    @Body() body: { posts: Array<{ title?: string; body: string; scheduledAt: string; channelTitles: string[] }> },
  ) {
    return this.posts.createBulk(req.user.id, body.posts);
  }

  @Patch(':id')
  update(
    @Req() req: Request & { user: RequestUser },
    @Param('id') id: string,
    @Body() body: { title?: string; body?: string; buttons?: Array<{ text: string; url: string }> | null; scheduledAt?: string | null; socialAccountIds?: string[] },
  ) {
    return this.posts.update(req.user.id, id, body);
  }

  @Delete(':id')
  delete(
    @Req() req: Request & { user: RequestUser },
    @Param('id') id: string,
  ) {
    return this.posts.delete(req.user.id, id);
  }
}
