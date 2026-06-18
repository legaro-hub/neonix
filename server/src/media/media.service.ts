import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { unlink, writeFile, readFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR') ?? join(process.cwd(), 'uploads');
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(file: Express.Multer.File, postId: string, ord: number, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Пост не найден');
    if (post.userId !== userId) throw new ForbiddenException('Нет доступа к этому посту');

    const ext = this.getExtension(file.originalname);
    const filename = `${randomBytes(12).toString('hex')}.${ext}`;
    const filepath = join(this.uploadDir, filename);

    try {
      await writeFile(filepath, file.buffer);
    } catch (err) {
      this.logger.error(`Failed to write file: ${err}`);
      throw new Error('Ошибка сохранения файла');
    }

    const kind = file.mimetype.startsWith('video/') ? 'video'
      : file.mimetype === 'image/gif' ? 'gif'
      : 'image';

    try {
      const asset = await this.prisma.mediaAsset.create({
        data: {
          postId,
          kind,
          filename: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          storageKey: filename,
          ord,
        },
      });

      this.logger.log(`Media uploaded: ${filename} (${file.size} bytes) for post ${postId}`);

      return {
        id: asset.id,
        kind: asset.kind,
        filename: asset.filename,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        url: `/api/media/file/${asset.id}`,
      };
    } catch (err) {
      await unlink(filepath).catch(() => {});
      throw err;
    }
  }

  async getFile(assetId: string): Promise<{ buffer: Buffer; mimeType: string; filename: string } | null> {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id: assetId } });
    if (!asset) return null;

    const filepath = join(this.uploadDir, asset.storageKey);
    try {
      const buffer = await readFile(filepath);
      return {
        buffer,
        mimeType: asset.mimeType || 'application/octet-stream',
        filename: asset.filename,
      };
    } catch {
      return null;
    }
  }

  async deleteFile(assetId: string, userId: string) {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id: assetId },
      include: { post: true },
    });
    if (!asset) return;
    if (asset.post.userId !== userId) throw new ForbiddenException('Нет доступа к этому файлу');

    const filepath = join(this.uploadDir, asset.storageKey);
    await unlink(filepath).catch(() => {});

    await this.prisma.mediaAsset.delete({ where: { id: assetId } });
  }

  async listByPost(postId: string) {
    return this.prisma.mediaAsset.findMany({
      where: { postId },
      orderBy: { ord: 'asc' },
    });
  }

  private getExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : 'bin';
  }
}
