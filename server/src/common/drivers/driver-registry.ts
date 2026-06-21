import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import type { SocialDriver } from '../interfaces/social-driver.interface';

@Injectable()
export class DriverRegistry {
  private readonly logger = new Logger(DriverRegistry.name);
  private readonly drivers = new Map<string, SocialDriver>();

  register(driver: SocialDriver) {
    this.drivers.set(driver.platform, driver);
    this.logger.log(`Driver registered: ${driver.platform}`);
  }

  get(platform: string): SocialDriver {
    const driver = this.drivers.get(platform);
    if (!driver) {
      throw new BadRequestException(`Платформа не поддерживается: ${platform}`);
    }
    return driver;
  }

  has(platform: string): boolean {
    return this.drivers.has(platform);
  }

  listPlatforms(): string[] {
    return Array.from(this.drivers.keys());
  }
}
