import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SocialAccountsModule } from './social-accounts/social-accounts.module';
import { TelegramModule } from './telegram/telegram.module';
import { PostsModule } from './posts/posts.module';
import { MediaModule } from './media/media.module';
import { EmailModule } from './email/email.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ChannelAnalyticsModule } from './analytics/channel-analytics.module';
import { PinterestModule } from './pinterest/pinterest.module';
import { YouTubeModule } from './youtube/youtube.module';
import { InstagramModule } from './instagram/instagram.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL') ?? 60000,
            limit: config.get<number>('THROTTLE_LIMIT') ?? 60,
          },
        ],
      }),
    }),
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    SocialAccountsModule,
    TelegramModule,
    PostsModule,
    MediaModule,
    EmailModule,
    AnalyticsModule,
    ChannelAnalyticsModule,
    PinterestModule,
    YouTubeModule,
    InstagramModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
