import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostpinConfigService } from './postpin-config.service';

@Injectable()
export class PostpinService implements OnModuleInit {
  private readonly logger = new Logger(PostpinService.name);
  private apiUrl = '';
  private email = '';

  constructor(
    private readonly config: ConfigService,
    private readonly postpinConfig: PostpinConfigService,
  ) {}

  onModuleInit() {
    this.apiUrl = this.config.get<string>('POSTPIN_API_URL') ?? 'https://api.postpin.app';
    this.email = this.postpinConfig.getEmail();
  }

  private getEmail(): string {
    return this.postpinConfig.getEmail() || this.email;
  }

  isConfigured(): boolean {
    return !!(this.apiUrl && this.getEmail());
  }

  private async api(path: string, body: any, headers: Record<string, string> = {}) {
    const res = await fetch(`${this.apiUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Email': this.getEmail(),
        ...headers,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`PostPin API ${res.status}: ${err}`);
    }
    return res.json();
  }

  async addAccount(cookies: any[], proxy: string) {
    return this.api('/account/add', cookies, { 'X-Proxy': proxy });
  }

  async getAccountToken(username: string) {
    return this.api('/account/token', { login: username });
  }

  async getAccountInfo(username: string, token: string, proxy: string) {
    return this.api('/account/info', { login: username, token }, { 'X-Proxy': proxy });
  }

  async deleteAccount(username: string, token: string) {
    return this.api('/account/delete', { login: username, token });
  }

  async createPin(data: {
    username: string;
    token: string;
    board_id: string;
    title: string;
    description?: string;
    image: string;
    link?: string;
    alt_text?: string;
    proxy: string;
  }) {
    return this.api('/pin/create', data, { timeout: '30000' });
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiUrl}/health`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  }
}
