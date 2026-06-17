import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [SocialAccountsModule, PrismaModule],
  controllers: [TelegramController],
})
export class TelegramModule {}
