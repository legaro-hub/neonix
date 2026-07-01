import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

const CONFIG_FILE = path.join(process.cwd(), '.postpin-config.json');

@Injectable()
export class PostpinConfigService {
  private readonly logger = new Logger(PostpinConfigService.name);
  private email = '';

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.email = this.config.get<string>('POSTPIN_EMAIL') ?? '';
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        if (data.email) this.email = data.email;
      }
    } catch {}
  }

  getEmail(): string {
    return this.email;
  }

  setEmail(email: string): void {
    this.email = email;
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({ email }, null, 2));
    } catch (err) {
      this.logger.error('Failed to save postpin config', err);
    }
  }
}
