import { Module, OnModuleInit } from '@nestjs/common';
import { YouTubeController } from './youtube.controller';
import { YouTubeAuthService } from './youtube-auth.service';
import { YouTubePublisher } from './youtube-publisher';
import { DriverRegistry } from '../common/drivers/driver-registry';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [YouTubeController],
  providers: [YouTubeAuthService, YouTubePublisher],
  exports: [YouTubeAuthService, YouTubePublisher],
})
export class YouTubeModule implements OnModuleInit {
  constructor(
    private readonly driverRegistry: DriverRegistry,
    private readonly publisher: YouTubePublisher,
  ) {}

  onModuleInit() {
    this.driverRegistry.register(this.publisher);
  }
}
