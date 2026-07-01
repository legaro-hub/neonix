import { Module, Global } from '@nestjs/common';
import { DriverRegistry } from './drivers/driver-registry';
import { PromoService } from './promo.service';
import { PromoController } from './promo.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [PromoController],
  providers: [DriverRegistry, PromoService],
  exports: [DriverRegistry, PromoService],
})
export class CommonModule {}
