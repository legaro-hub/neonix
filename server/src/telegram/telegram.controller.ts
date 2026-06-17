import { Controller, Post, Body, Req, Logger } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { SocialAccountsService } from '../social-accounts/social-accounts.service';
import { PrismaService } from '../prisma/prisma.service';

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
      const headerSecret = req.headers.get('x-telegram-bot-api-secret-token');
      if (headerSecret !== secret) {
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

    const pending = await this.socialAccounts.findPendingLinkByChatId(chat.id);
    if (!pending) {
      this.logger.log(`No pending link for chat ${chat.id}, skipping`);
      return;
    }

    try {
      const botToken = this.config.get<string>('TG_BOT_TOKEN');
      let memberCount: number | undefined;
      if (botToken && botToken !== 'REPLACE_WITH_REAL_TOKEN') {
        try {
          const res = await fetch(`https://api.telegram.org/bot${botToken}/getChatMemberCount?chat_id=${chat.id}`);
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
