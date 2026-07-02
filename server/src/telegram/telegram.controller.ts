import { Controller, Post, Get, Body, Param, Res, Req, Logger } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { SocialAccountsService } from '../social-accounts/social-accounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { timingSafeEqual } from 'crypto';
import type { Request, Response } from 'express';

interface TgUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; first_name?: string; username?: string };
    chat: { id: number; type: string; title?: string; username?: string };
    text?: string;
  };
  my_chat_member?: {
    chat: { id: number; type: string; title?: string; username?: string };
    from: { id: number; first_name?: string; username?: string };
    new_chat_member: { status: string };
  };
}

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);
  private avatarCache = new Map<string, { data: Buffer; mime: string; ts: number }>();

  constructor(
    private readonly socialAccounts: SocialAccountsService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Post('webhook')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async handleWebhook(@Req() req: Request, @Body() update: TgUpdate) {
    const secret = this.config.get<string>('TG_WEBHOOK_SECRET');
    if (secret) {
      const headerSecret = (req.headers as unknown as Record<string, string>)['x-telegram-bot-api-secret-token'];
      if (!headerSecret) return { ok: false };
      const a = Buffer.from(headerSecret);
      const b = Buffer.from(secret);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        return { ok: false };
      }
    }

    if (update.my_chat_member) {
      await this.handleChatMember(update.my_chat_member);
    } else if (update.message) {
      await this.handleMessage(update.message);
    }

    return { ok: true };
  }

  private async handleMessage(msg: NonNullable<TgUpdate['message']>) {
    const text = msg.text?.trim();
    if (!text) return;

    const startMatch = /^\/start\s+(\w+)/i.exec(text);
    if (!startMatch) return;

    const code = startMatch[1].toUpperCase();
    const chatId = msg.chat.id;
    const from = msg.from;

    this.logger.log(`Bot /start code=${code} from chat=${chatId}`);

    const entry = await this.socialAccounts.validateLinkCode(code);
    if (!entry) {
      await this.sendTelegramMessage(chatId, '❌ Код недействителен или истёк. Сгенерируйте новый в панели управления.');
      return;
    }

    await this.socialAccounts.storePendingLink(entry.userId, chatId, from?.id);

    await this.sendTelegramMessage(
      chatId,
      '✅ Код принят! Теперь добавьте меня администратором в нужный канал с правом публикации сообщений.\n\n' +
      'Как только вы назначите меня админом — канал автоматически привяжется к вашему аккаунту.',
    );
  }

  private async handleChatMember(
    member: NonNullable<TgUpdate['my_chat_member']>,
  ) {
    const chat = member.chat;
    const newStatus = member.new_chat_member.status;

    this.logger.log(`my_chat_member: chat=${chat.id} title=${chat.title} status=${newStatus}`);

    if (newStatus !== 'administrator' && newStatus !== 'member') {
      if (newStatus === 'left' || newStatus === 'kicked') {
        await this.socialAccounts.revokeByExternalId(String(chat.id));
      }
      return;
    }

    const pending = await this.socialAccounts.findPendingLinkByTelegramUserId(member.from.id);
    if (!pending) {
      this.logger.log(`No pending link for user ${member.from.id} (chat ${chat.id})`);
      return;
    }

    try {
      const botToken = this.config.get<string>('TG_BOT_TOKEN');
      let memberCount: number | undefined;
      if (botToken && botToken !== 'REPLACE_WITH_REAL_TOKEN') {
        try {
          const res = await fetch(`https://api.telegram.org/bot${botToken}/getChatMemberCount`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chat.id }),
          });
          const data = await res.json() as { result?: number };
          memberCount = data.result;
        } catch { /* ignore */ }
      }

      await this.socialAccounts.addChannel(pending.userId, {
        externalId: String(chat.id),
        title: chat.title || `Channel ${chat.id}`,
        username: chat.username,
        memberCount,
      });

      await this.socialAccounts.clearPendingLink(chat.id);

      await this.sendTelegramMessage(
        chat.id,
        `🎉 Канал «${chat.title}» успешно привязан!\n\nТеперь вы можете планировать публикации через панель управления.`,
      );

      this.logger.log(`Channel linked: ${chat.title} (${chat.id}) → user ${pending.userId}`);
    } catch (err) {
      this.logger.error(`Failed to link channel: ${err}`);
      await this.sendTelegramMessage(
        chat.id,
        '❌ Не удалось привязать канал. Попробуйте ещё раз или обратитесь в поддержку.',
      );
    }
  }

  @Get('channel-photo/:chatId')
  async getChannelPhoto(@Param('chatId') chatId: string, @Res() res: Response) {
    const botToken = this.config.get<string>('TG_BOT_TOKEN');
    if (!botToken) return res.status(503).json({ error: 'Bot token not set' });

    const cached = this.avatarCache.get(chatId);
    if (cached && Date.now() - cached.ts < 3600000) {
      res.setHeader('Content-Type', cached.mime);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(cached.data);
    }

    try {
      const chatRes = await fetch(`https://api.telegram.org/bot${botToken}/getChat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
      });
      const chatData = await chatRes.json() as any;
      if (!chatData.ok || !chatData.result?.photo) {
        return res.status(404).json({ error: 'No photo' });
      }

      const fileId = chatData.result.photo.big_file_id || chatData.result.photo.small_file_id;
      const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId }),
      });
      const fileData = await fileRes.json() as any;
      if (!fileData.ok || !fileData.result?.file_path) {
        return res.status(404).json({ error: 'File not found' });
      }

      const imgRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`);
      if (!imgRes.ok) return res.status(502).json({ error: 'Download failed' });

      const buf = Buffer.from(await imgRes.arrayBuffer());
      const mime = fileData.result.file_path.endsWith('.png') ? 'image/png' : 'image/jpeg';

      this.avatarCache.set(chatId, { data: buf, mime, ts: Date.now() });

      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(buf);
    } catch (err: any) {
      this.logger.warn(`Avatar fetch failed for ${chatId}: ${err.message}`);
      res.status(500).json({ error: 'Failed' });
    }
  }

  private async sendTelegramMessage(chatId: number, text: string) {
    const botToken = this.config.get<string>('TG_BOT_TOKEN');
    if (!botToken || botToken === 'REPLACE_WITH_REAL_TOKEN') {
      this.logger.warn(`TG_BOT_TOKEN not set, cannot send message to ${chatId}`);
      return;
    }

    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      });
    } catch (err) {
      this.logger.error(`Failed to send TG message: ${err}`);
    }
  }
}
