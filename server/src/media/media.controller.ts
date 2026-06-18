import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  Res,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];

@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('upload/:postId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024, files: 1 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
          cb(new BadRequestException('Неподдерживаемый формат файла'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Param('postId') postId: string,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('Файл не загружен');

    const userId = (req as any).user?.id;
    const assets = await this.media.listByPost(postId);
    if (assets.length >= 10) {
      throw new BadRequestException('Максимум 10 медиафайлов на пост');
    }

    return this.media.upload(file, postId, assets.length, userId);
  }

  @Get('file/:id')
  async getFile(@Param('id') id: string, @Res() res: Response) {
    const file = await this.media.getFile(id);
    if (!file) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.filename)}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(file.buffer);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user?.id;
    await this.media.deleteFile(id, userId);
    return { success: true };
  }
}
