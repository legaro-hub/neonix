import {
  Controller, Get, Post, Patch, Delete,
  Body, Query, Param, Req, UseGuards,
  BadRequestException, Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';
import { PinterestAuthService } from './pinterest-auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('pinterest')
export class PinterestController {
  private readonly logger = new Logger(PinterestController.name);

  constructor(
    private readonly pinterestAuth: PinterestAuthService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveToken(userId: string, accountId: string): Promise<string> {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id: accountId, userId, platform: 'pinterest' },
    });
    if (!account) throw new BadRequestException('Аккаунт не найден');
    const meta = (account.metadata as Record<string, unknown>) ?? {};
    return this.pinterestAuth.resolveToken(
      meta.accessToken as string | undefined,
      meta.refreshToken as string | undefined,
    );
  }

  // ─── AUTH ───

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@Req() req: Request & { user: RequestUser }) {
    if (!this.pinterestAuth.isConfigured()) {
      throw new BadRequestException('Pinterest не подключён');
    }
    const state = this.pinterestAuth.generateState(req.user.id);
    return { url: this.pinterestAuth.getAuthUrl(state) };
  }

  @Get('callback')
  async handleCallback(@Query('code') code: string, @Query('state') state: string) {
    if (!code || !state) throw new BadRequestException('Отсутствуют параметры');
    const userId = this.pinterestAuth.verifyState(state);
    if (!userId) throw new BadRequestException('Невалидная ссылка');

    const tokenData = await this.pinterestAuth.exchangeCode(code);
    const existing = await this.prisma.socialAccount.findFirst({
      where: { userId, platform: 'pinterest', externalId: tokenData.userId },
    });

    if (existing) {
      await this.prisma.socialAccount.update({
        where: { id: existing.id },
        data: { status: 'active', metadata: { accessToken: tokenData.accessToken, refreshToken: tokenData.refreshToken, expiresAt: tokenData.expiresAt?.toISOString() } as any },
      });
    } else {
      await this.prisma.socialAccount.create({
        data: {
          userId, platform: 'pinterest', externalId: tokenData.userId,
          title: tokenData.username || 'Pinterest', username: tokenData.username,
          metadata: { accessToken: tokenData.accessToken, refreshToken: tokenData.refreshToken, expiresAt: tokenData.expiresAt?.toISOString() } as any,
          status: 'active',
        },
      });
    }

    return { redirect: `${process.env.APP_URL ?? 'https://neonix.online'}/app/channels?pinterest=linked` };
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  async getUser(@Req() req: Request & { user: RequestUser }, @Query('accountId') accountId: string) {
    const token = await this.resolveToken(req.user.id, accountId);
    return this.pinterestAuth.getUserAccount(token);
  }

  // ─── BOARDS ───

  @Get('boards')
  @UseGuards(JwtAuthGuard)
  async listBoards(@Req() req: Request & { user: RequestUser }, @Query('accountId') accountId: string, @Query('bookmark') bookmark?: string) {
    const token = await this.resolveToken(req.user.id, accountId);
    return this.pinterestAuth.listBoards(token, bookmark);
  }

  @Post('boards')
  @UseGuards(JwtAuthGuard)
  async createBoard(
    @Req() req: Request & { user: RequestUser },
    @Query('accountId') accountId: string,
    @Body() body: { name: string; description?: string; privacy?: string },
  ) {
    const token = await this.resolveToken(req.user.id, accountId);
    return this.pinterestAuth.createBoard(token, body);
  }

  @Get('boards/:boardId')
  @UseGuards(JwtAuthGuard)
  async getBoard(@Req() req: Request & { user: RequestUser }, @Query('accountId') accountId: string, @Param('boardId') boardId: string) {
    const token = await this.resolveToken(req.user.id, accountId);
    return this.pinterestAuth.getBoard(token, boardId);
  }

  @Patch('boards/:boardId')
  @UseGuards(JwtAuthGuard)
  async updateBoard(
    @Req() req: Request & { user: RequestUser },
    @Query('accountId') accountId: string,
    @Param('boardId') boardId: string,
    @Body() body: { name?: string; description?: string; privacy?: string },
  ) {
    const token = await this.resolveToken(req.user.id, accountId);
    return this.pinterestAuth.updateBoard(token, boardId, body);
  }

  @Delete('boards/:boardId')
  @UseGuards(JwtAuthGuard)
  async deleteBoard(@Req() req: Request & { user: RequestUser }, @Query('accountId') accountId: string, @Param('boardId') boardId: string) {
    const token = await this.resolveToken(req.user.id, accountId);
    return this.pinterestAuth.deleteBoard(token, boardId);
  }

  @Get('boards/:boardId/pins')
  @UseGuards(JwtAuthGuard)
  async listBoardPins(
    @Req() req: Request & { user: RequestUser },
    @Query('accountId') accountId: string,
    @Param('boardId') boardId: string,
    @Query('bookmark') bookmark?: string,
  ) {
    const token = await this.resolveToken(req.user.id, accountId);
    return this.pinterestAuth.listBoardPins(token, boardId, bookmark);
  }

  @Get('boards/:boardId/sections')
  @UseGuards(JwtAuthGuard)
  async listBoardSections(@Req() req: Request & { user: RequestUser }, @Query('accountId') accountId: string, @Param('boardId') boardId: string) {
    const token = await this.resolveToken(req.user.id, accountId);
    return this.pinterestAuth.listBoardSections(token, boardId);
  }

  @Post('boards/:boardId/sections')
  @UseGuards(JwtAuthGuard)
  async createBoardSection(
    @Req() req: Request & { user: RequestUser },
    @Query('accountId') accountId: string,
    @Param('boardId') boardId: string,
    @Body() body: { name: string },
  ) {
    const token = await this.resolveToken(req.user.id, accountId);
    return this.pinterestAuth.createBoardSection(token, boardId, body.name);
  }

  @Delete('boards/:boardId/sections/:sectionId')
  @UseGuards(JwtAuthGuard)
  async deleteBoardSection(
    @Req() req: Request & { user: RequestUser },
    @Query('accountId') accountId: string,
    @Param('boardId') boardId: string,
    @Param('sectionId') sectionId: string,
  ) {
    const token = await this.resolveToken(req.user.id, accountId);
    return this.pinterestAuth.deleteBoardSection(token, boardId, sectionId);
  }

  // ─── BOARDS: SELECT ───

  @Get('select-board')
  @UseGuards(JwtAuthGuard)
  async selectBoard(
    @Req() req: Request & { user: RequestUser },
    @Query('accountId') accountId: string,
    @Query('boardId') boardId: string,
  ) {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id: accountId, userId: req.user.id, platform: 'pinterest' },
    });
    if (!account) throw new BadRequestException('Аккаунт не найден');
    const meta = (account.metadata as Record<string, unknown>) ?? {};
    await this.prisma.socialAccount.update({
      where: { id: accountId },
      data: { metadata: { ...meta, boardId } as any },
    });
    return { success: true };
  }

  // ─── PINS ───

  @Get('pins')
  @UseGuards(JwtAuthGuard)
  async listPins(@Req() req: Request & { user: RequestUser }, @Query('accountId') accountId: string, @Query('bookmark') bookmark?: string) {
    const token = await this.resolveToken(req.user.id, accountId);
    return this.pinterestAuth.listPins(token, bookmark);
  }

  @Post('pins')
  @UseGuards(JwtAuthGuard)
  async createPin(
    @Req() req: Request & { user: RequestUser },
    @Query('accountId') accountId: string,
    @Body() body: {
      board_id: string;
      title?: string;
      description?: string;
      link?: string;
      alt_text?: string;
      image_base64?: string;
      image_content_type?: string;
      image_url?: string;
      board_section_id?: string;
    },
  ) {
    const token = await this.resolveToken(req.user.id, accountId);

    const pinBody: Record<string, unknown> = {
      board_id: body.board_id,
      title: body.title,
      description: body.description,
      link: body.link,
      alt_text: body.alt_text,
      board_section_id: body.board_section_id,
    };

    if (body.image_base64) {
      pinBody.media_source = {
        source_type: 'image_base64',
        content_type: body.image_content_type ?? 'image/jpeg',
        data: body.image_base64,
      };
    } else if (body.image_url) {
      pinBody.media_source = {
        source_type: 'image_url',
        url: body.image_url,
      };
    } else {
      throw new BadRequestException('Нужно указать image_base64 или image_url');
    }

    return this.pinterestAuth.createPin(token, pinBody as any);
  }

  @Get('pins/:pinId')
  @UseGuards(JwtAuthGuard)
  async getPin(@Req() req: Request & { user: RequestUser }, @Query('accountId') accountId: string, @Param('pinId') pinId: string) {
    const token = await this.resolveToken(req.user.id, accountId);
    return this.pinterestAuth.getPin(token, pinId);
  }

  @Patch('pins/:pinId')
  @UseGuards(JwtAuthGuard)
  async updatePin(
    @Req() req: Request & { user: RequestUser },
    @Query('accountId') accountId: string,
    @Param('pinId') pinId: string,
    @Body() body: { title?: string; description?: string; link?: string; board_id?: string },
  ) {
    const token = await this.resolveToken(req.user.id, accountId);
    return this.pinterestAuth.updatePin(token, pinId, body);
  }

  @Delete('pins/:pinId')
  @UseGuards(JwtAuthGuard)
  async deletePin(@Req() req: Request & { user: RequestUser }, @Query('accountId') accountId: string, @Param('pinId') pinId: string) {
    const token = await this.resolveToken(req.user.id, accountId);
    return this.pinterestAuth.deletePin(token, pinId);
  }

  // ─── BULK CREATE PINS ───

  @Post('pins/bulk')
  @UseGuards(JwtAuthGuard)
  async bulkCreatePins(
    @Req() req: Request & { user: RequestUser },
    @Query('accountId') accountId: string,
    @Body() body: {
      board_id: string;
      pins: Array<{
        title?: string;
        description?: string;
        link?: string;
        image_base64?: string;
        image_content_type?: string;
        image_url?: string;
      }>;
    },
  ) {
    if (!body.pins || body.pins.length === 0) {
      throw new BadRequestException('Список пуст');
    }
    if (body.pins.length > 50) {
      throw new BadRequestException('Максимум 50 пинов за раз');
    }

    const token = await this.resolveToken(req.user.id, accountId);
    const results: Array<{ index: number; pinId?: string; url?: string; error?: string }> = [];

    for (let i = 0; i < body.pins.length; i++) {
      const pin = body.pins[i];
      try {
        const pinBody: Record<string, unknown> = {
          board_id: body.board_id,
          title: pin.title,
          description: pin.description,
          link: pin.link,
        };

        if (pin.image_base64) {
          pinBody.media_source = {
            source_type: 'image_base64',
            content_type: pin.image_content_type ?? 'image/jpeg',
            data: pin.image_base64,
          };
        } else if (pin.image_url) {
          pinBody.media_source = { source_type: 'image_url', url: pin.image_url };
        } else {
          results.push({ index: i, error: 'Нет изображения' });
          continue;
        }

        const result = await this.pinterestAuth.createPin(token, pinBody as any);
        results.push({ index: i, pinId: result.id, url: `https://pinterest.com/pin/${result.id}` });
      } catch (err: any) {
        results.push({ index: i, error: err.message });
      }

      if (i < body.pins.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return {
      total: body.pins.length,
      success: results.filter((r) => r.pinId).length,
      failed: results.filter((r) => r.error).length,
      results,
    };
  }

  // ─── ANALYTICS ───

  @Get('analytics/account')
  @UseGuards(JwtAuthGuard)
  async getAccountAnalytics(
    @Req() req: Request & { user: RequestUser },
    @Query('accountId') accountId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const token = await this.resolveToken(req.user.id, accountId);
    const end = endDate ?? new Date().toISOString().split('T')[0];
    const start = startDate ?? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    return this.pinterestAuth.getAccountAnalytics(token, start, end);
  }

  @Get('analytics/pins')
  @UseGuards(JwtAuthGuard)
  async getTopPins(
    @Req() req: Request & { user: RequestUser },
    @Query('accountId') accountId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('limit') limit?: string,
  ) {
    const token = await this.resolveToken(req.user.id, accountId);
    const end = endDate ?? new Date().toISOString().split('T')[0];
    const start = startDate ?? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    return this.pinterestAuth.getTopPins(token, start, end, sortBy ?? 'IMPRESSIONS', Number(limit) || 10);
  }

  @Get('analytics/pin/:pinId')
  @UseGuards(JwtAuthGuard)
  async getPinAnalytics(
    @Req() req: Request & { user: RequestUser },
    @Query('accountId') accountId: string,
    @Param('pinId') pinId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('metrics') metrics?: string,
  ) {
    const token = await this.resolveToken(req.user.id, accountId);
    const end = endDate ?? new Date().toISOString().split('T')[0];
    const start = startDate ?? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    return this.pinterestAuth.getPinAnalytics(token, pinId, start, end, metrics?.split(','));
  }
}
