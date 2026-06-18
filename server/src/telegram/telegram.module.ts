import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramPollingService } from './telegram-polling.service';
import { TelegramStatsService } from './telegram-stats.service';
import { MtprotoService } from './mtproto.service';
import { MtprotoController } from './mtproto.controller';
import { ChannelStatsController } from './channel-stats.controller';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [SocialAccountsModule, PrismaModule],
  controllers: [TelegramController, ChannelStatsController, MtprotoController],
  providers: [TelegramPollingService, TelegramStatsService, MtprotoService],
  exports: [TelegramStatsService, MtprotoService],
})
export class TelegramModule {}
