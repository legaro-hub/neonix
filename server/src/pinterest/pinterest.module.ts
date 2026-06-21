import { Module, OnModuleInit } from '@nestjs/common';
import { PinterestController } from './pinterest.controller';
import { PinterestAuthService } from './pinterest-auth.service';
import { PinterestPublisher } from './pinterest-publisher';
import { DriverRegistry } from '../common/drivers/driver-registry';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PinterestController],
  providers: [PinterestAuthService, PinterestPublisher],
  exports: [PinterestAuthService, PinterestPublisher],
})
export class PinterestModule implements OnModuleInit {
  constructor(
    private readonly driverRegistry: DriverRegistry,
    private readonly publisher: PinterestPublisher,
  ) {}

  onModuleInit() {
    this.driverRegistry.register(this.publisher);
  }
}
