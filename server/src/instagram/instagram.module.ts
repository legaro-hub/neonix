import { Module, OnModuleInit } from '@nestjs/common';
import { InstagramController } from './instagram.controller';
import { InstagramAuthService } from './instagram-auth.service';
import { InstagramPublisher } from './instagram-publisher';
import { DriverRegistry } from '../common/drivers/driver-registry';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InstagramController],
  providers: [InstagramAuthService, InstagramPublisher],
  exports: [InstagramAuthService, InstagramPublisher],
})
export class InstagramModule implements OnModuleInit {
  constructor(
    private readonly driverRegistry: DriverRegistry,
    private readonly publisher: InstagramPublisher,
  ) {}

  onModuleInit() {
    this.driverRegistry.register(this.publisher);
  }
}
