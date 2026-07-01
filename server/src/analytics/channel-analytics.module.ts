import { Module } from '@nestjs/common';
import { ChannelAnalyticsController } from './channel-analytics.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PinterestModule } from '../pinterest/pinterest.module';
import { YouTubeModule } from '../youtube/youtube.module';
import { InstagramModule } from '../instagram/instagram.module';

@Module({
  imports: [PrismaModule, PinterestModule, YouTubeModule, InstagramModule],
  controllers: [ChannelAnalyticsController],
})
export class ChannelAnalyticsModule {}
