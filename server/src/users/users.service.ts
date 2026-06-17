import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, ChangePasswordDto, UpdateNotificationsDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { notificationSettings: true, socialAccounts: true },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return this.publicUser(user);
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
      if (existing && existing.id !== userId) {
        throw new BadRequestException('Этот email уже занят');
      }
    }
    const data: Record<string, unknown> = { ...dto };
    if (dto.email) data.email = dto.email.toLowerCase();
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: { notificationSettings: true, socialAccounts: true },
    });
    return this.publicUser(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Неверный текущий пароль');

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });

    return { success: true };
  }

  async deleteMe(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { success: true };
  }

  async getNotifications(userId: string) {
    let settings = await this.prisma.notificationSettings.findUnique({ where: { userId } });
    if (!settings) {
      settings = await this.prisma.notificationSettings.create({ data: { userId } });
    }
    return settings;
  }

  async updateNotifications(userId: string, dto: UpdateNotificationsDto) {
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) data[key] = value;
    }
    return this.prisma.notificationSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  private publicUser(user: {
    id: string;
    email: string;
    name: string | null;
    timezone: string;
    language: string;
    createdAt: Date;
    socialAccounts?: { id: string; platform: string; title: string; username: string | null; status: string }[];
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
      language: user.language,
      createdAt: user.createdAt,
      channelsCount: user.socialAccounts?.length ?? 0,
    };
  }
}
