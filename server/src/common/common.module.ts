import { Module, Global } from '@nestjs/common';
import { DriverRegistry } from './drivers/driver-registry';

@Global()
@Module({
  providers: [DriverRegistry],
  exports: [DriverRegistry],
})
export class CommonModule {}
