import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const SESSION_DIR = join(process.cwd(), 'sessions');
const SESSION_FILE = join(SESSION_DIR, 'neonix_user.session');

interface PendingAuth {
  client: TelegramClient;
  phoneCodeHash?: string;
  phoneNumber?: string;
  step: 'phone' | 'code' | 'password' | 'done';
}

@Injectable()
export class MtprotoService implements OnModuleDestroy {
  private readonly logger = new Logger(MtprotoService.name);
  private client: TelegramClient | null = null;
  private authorized = false;
  private pendingAuth: PendingAuth | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private createClient(session?: StringSession): TelegramClient | null {
    const apiId = this.config.get<number>('TG_API_ID');
    const apiHash = this.config.get<string>('TG_API_HASH');
    if (!apiId || !apiHash) return null;

    const sess = session || this.loadSession();
    return new TelegramClient(sess, apiId, apiHash, {
      connectionRetries: 3,
      retryDelay: 2000,
    });
  }

  private async getAuthorizedClient(): Promise<TelegramClient | null> {
    if (this.client && this.authorized) return this.client;

    const client = this.createClient();
    if (!client) return null;

    try {
      await client.connect();
      if (await client.isUserAuthorized()) {
        this.client = client;
        this.authorized = true;
        this.logger.log('MTProto client connected and authorized');
        return client;
      }
      await client.disconnect();
      return null;
    } catch (err: any) {
      this.logger.warn(`MTProto connection failed: ${err.message}`);
      try { await client.disconnect(); } catch {}
      return null;
    }
  }

  private loadSession(): StringSession {
    if (!existsSync(SESSION_DIR)) mkdirSync(SESSION_DIR, { recursive: true });
    if (existsSync(SESSION_FILE)) {
      try {
        const encrypted = readFileSync(SESSION_FILE);
        const decrypted = this.decrypt(encrypted);
        return new StringSession(decrypted);
      } catch {
        this.logger.warn('Failed to decrypt session, trying plaintext');
        return new StringSession(readFileSync(SESSION_FILE, 'utf-8'));
      }
    }
    return new StringSession('');
  }

  private saveSession(session: StringSession) {
    if (!existsSync(SESSION_DIR)) mkdirSync(SESSION_DIR, { recursive: true });
    const data = session.save();
    const encrypted = this.encrypt(data);
    writeFileSync(SESSION_FILE, encrypted);
  }

  private getKey(): Buffer {
    const secret = this.config.get<string>('MTPROTO_SESSION_SECRET');
    if (secret) {
      return scryptSync(secret, 'neonix-mtproto-salt', 32);
    }
    const defaultKey = randomBytes(32);
    this.logger.warn('MTPROTO_SESSION_SECRET not set — using random key (will not survive restart)');
    return defaultKey;
  }

  private encrypt(data: string): Buffer {
    const key = this.getKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]);
  }

  private decrypt(buffer: Buffer): string {
    const key = this.getKey();
    const iv = buffer.subarray(0, 16);
    const tag = buffer.subarray(16, 32);
    const encrypted = buffer.subarray(32);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
  }

  async getStatus() {
    const client = await this.getAuthorizedClient();
    return {
      authorized: !!client,
      configured: !!(this.config.get<number>('TG_API_ID') && this.config.get<string>('TG_API_HASH')),
      pendingStep: this.pendingAuth?.step || null,
    };
  }

  async startAuth(phoneNumber: string) {
    const apiId = this.config.get<number>('TG_API_ID');
    const apiHash = this.config.get<string>('TG_API_HASH');
    if (!apiId || !apiHash) {
      return { error: 'TG_API_ID or TG_API_HASH not set' };
    }

    if (this.authorized) {
      return { error: 'Already authorized. Logout first.' };
    }

    const client = this.createClient(new StringSession(''));
    if (!client) return { error: 'Failed to create client' };

    try {
      await client.connect();

      const result = await client.invoke(
        new Api.auth.SendCode({
          phoneNumber,
          apiId,
          apiHash,
          settings: new Api.CodeSettings({
            allowFlashcall: false,
            currentNumber: false,
            allowAppHash: false,
          }),
        }),
      ) as any;

      this.pendingAuth = {
        client,
        phoneCodeHash: result.phoneCodeHash,
        phoneNumber,
        step: 'code',
      };

      return { step: 'code', message: `Код отправлен на ${phoneNumber}` };
    } catch (err: any) {
      try { await client.disconnect(); } catch {}
      return { error: err.message || 'Failed to send code' };
    }
  }

  async submitCode(code: string) {
    if (!this.pendingAuth || this.pendingAuth.step !== 'code') {
      return { error: 'No pending auth. Start with phone number first.' };
    }

    const { client, phoneNumber, phoneCodeHash } = this.pendingAuth;

    try {
      const result = await client.invoke(
        new Api.auth.SignIn({
          phoneNumber,
          phoneCodeHash,
          phoneCode: code,
        }),
      );

      if (result instanceof Api.auth.Authorization) {
        this.saveSession(client.session as StringSession);
        this.client = client;
        this.authorized = true;
        this.pendingAuth = null;
        this.logger.log('MTProto authorized successfully');
        return { step: 'done', message: 'Авторизация успешна!' };
      }

      if (result instanceof Api.auth.AuthorizationSignUpRequired) {
        this.pendingAuth.step = 'password';
        return { step: 'registration', message: 'Требуется регистрация. Введите пароль.' };
      }

      return { error: 'Unexpected response' };
    } catch (err: any) {
      const msg = err.message || '';

      if (msg.includes('SESSION_PASSWORD_NEEDED') || msg.includes('two-factor')) {
        if (this.pendingAuth) this.pendingAuth.step = 'password';
        return { step: 'password', message: 'Требуется двухфакторная аутентификация. Введите пароль.' };
      }

      if (msg.includes('PHONE_CODE_INVALID')) {
        return { error: 'Неверный код. Попробуйте ещё раз.' };
      }

      if (msg.includes('PHONE_CODE_EXPIRED')) {
        this.pendingAuth = null;
        try { await client.disconnect(); } catch {}
        return { error: 'Код истёк. Начните заново.' };
      }

      return { error: msg || 'Failed to sign in' };
    }
  }

  async submitPassword(password: string) {
    if (!this.pendingAuth || this.pendingAuth.step !== 'password') {
      return { error: 'No pending password step.' };
    }

    const { client } = this.pendingAuth;

    try {
      const result = await (client as any).checkPassword(password);

      if (result instanceof Api.auth.Authorization) {
        this.saveSession(client.session as StringSession);
        this.client = client;
        this.authorized = true;
        this.pendingAuth = null;
        this.logger.log('MTProto authorized with 2FA');
        return { step: 'done', message: 'Авторизация успешна (2FA)!' };
      }

      return { error: 'Unexpected response' };
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('PASSWORD_HASH_INVALID')) {
        return { error: 'Неверный пароль. Попробуйте ещё раз.' };
      }
      return { error: msg || 'Failed to verify password' };
    }
  }

  async logout() {
    if (this.client) {
      try {
        await this.client.invoke(new Api.auth.LogOut());
      } catch {}
      await this.client.disconnect();
    }

    this.client = null;
    this.authorized = false;
    this.pendingAuth = null;

    if (existsSync(SESSION_FILE)) {
      try { require('fs').unlinkSync(SESSION_FILE); } catch {}
    }

    return { message: 'Выполнено' };
  }

  async getChannelPostStats(channelUsername: string, limit: number = 20) {
    const client = await this.getAuthorizedClient();
    if (!client) return null;

    try {
      const channel = await client.getEntity(channelUsername);
      const messages = await client.getMessages(channel, { limit });

      return messages.map((msg) => {
        if (!msg || !(msg instanceof Api.Message)) return null;
        const dateMs = msg.date ? Number(msg.date) * 1000 : null;
        return {
          id: msg.id,
          date: dateMs ? new Date(dateMs).toISOString() : null,
          text: (msg.message || '').slice(0, 200),
          views: msg.views || 0,
          forwards: msg.forwards || 0,
          replies: msg.replies?.replies || 0,
          reactions: this.extractReactions(msg),
        };
      }).filter(Boolean);
    } catch (err) {
      this.logger.error(`Failed to get channel stats: ${err}`);
      return null;
    }
  }

  private extractReactions(msg: Api.Message): Record<string, number> {
    const reactions: Record<string, number> = {};
    if (!msg.reactions || !(msg.reactions as any).results) return reactions;

    for (const r of (msg.reactions as any).results) {
      const reaction = r.reaction;
      let emoji = 'unknown';
      if (reaction?.emoticon) emoji = reaction.emoticon;
      else if (reaction?.documentId) emoji = `custom:${reaction.documentId}`;
      reactions[emoji] = r.count;
    }
    return reactions;
  }

  async collectPostStats(userId: string) {
    const client = await this.getAuthorizedClient();
    if (!client) return { error: 'MTProto not authorized' };

    const channels = await this.prisma.socialAccount.findMany({
      where: { userId, platform: 'telegram', status: 'active' },
    });

    const results = [];
    for (const ch of channels) {
      if (!ch.username) continue;

      try {
        const stats = await this.getChannelPostStats(`@${ch.username}`, 30);
        if (!stats) continue;

        for (const stat of stats) {
          if (!stat) continue;
          const existing = await this.prisma.postPublication.findFirst({
            where: { socialAccountId: ch.id, externalId: String(stat.id) },
          });

          if (existing) {
            await this.prisma.postPublication.update({
              where: { id: existing.id },
              data: {
                errorCode: JSON.stringify({
                  views: stat.views,
                  forwards: stat.forwards,
                  replies: stat.replies,
                  reactions: stat.reactions,
                }),
              },
            });
          }
        }

        results.push({
          channel: ch.title,
          username: ch.username,
          postsFound: stats.length,
          totalViews: stats.reduce((sum, s) => sum + (s?.views || 0), 0),
        });
      } catch (err) {
        this.logger.warn(`Failed to collect stats for @${ch.username}: ${err}`);
      }
    }

    return { results };
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }
}
