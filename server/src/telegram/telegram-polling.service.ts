import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialAccountsService } from '../social-accounts/social-accounts.service';

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

@Injectable()
export class TelegramPollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramPollingService.name);
  private offset = 0;
  private polling = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly socialAccounts: SocialAccountsService,
  ) {}

  onModuleInit() {
    const token = this.config.get<string>('TG_BOT_TOKEN');
    if (!token || token === 'REPLACE_WITH_REAL_TOKEN') {
      this.logger.warn('TG_BOT_TOKEN not set, polling disabled');
      return;
    }
    this.logger.log('Starting Telegram polling...');
    this.startPolling();
  }

  onModuleDestroy() {
    this.polling = false;
    if (this.timer) clearTimeout(this.timer);
  }

  private async startPolling() {
    this.polling = true;
    while (this.polling) {
      try {
        await this.poll();
      } catch (err) {
        this.logger.error(`Polling error: ${err}`);
        await this.sleep(5000);
      }
    }
  }

  private async poll() {
    const token = this.config.get<string>('TG_BOT_TOKEN');
    const res = await fetch(
      `https://api.telegram.org/bot${token}/getUpdates?offset=${this.offset}&timeout=30`,
    );
    const data = await res.json() as { ok: boolean; result: TgUpdate[] };

    if (!data.ok || !data.result) {
      await this.sleep(1000);
      return;
    }

    for (const update of data.result) {
      this.offset = update.update_id + 1;

      if (update.my_chat_member) {
        await this.handleChatMember(update.my_chat_member);
      } else if (update.message) {
        await this.handleMessage(update.message);
      }
    }
  }

  private async handleMessage(msg: NonNullable<TgUpdate['message']>) {
    const text = msg.text?.trim();
    if (!text) return;

    const startMatch = /^\/start\s+(\w+)/i.exec(text);
    if (!startMatch) return;

    const code = startMatch[1].toUpperCase();
    const chatId = msg.chat.id;

    this.logger.log(`Polling /start code=${code} from chat=${chatId}`);

    const entry = await this.socialAccounts.validateLinkCode(code);
    if (!entry) {
      await this.sendMessage(chatId, '❌ Код недействителен или истёк. Сгенерируйте новый в панели управления.');
      return;
    }

    await this.socialAccounts.storePendingLink(entry.userId, chatId, msg.from?.id);

    await this.sendMessage(
      chatId,
      '✅ Код принят! Теперь добавьте меня администратором в нужный канал с правом публикации сообщений.\n\n' +
      'Как только вы назначите меня админом — канал автоматически привяжется к вашему аккаунту.',
    );
  }

  private async handleChatMember(member: NonNullable<TgUpdate['my_chat_member']>) {
    const chat = member.chat;
    const newStatus = member.new_chat_member.status;

    this.logger.log(`Polling my_chat_member: chat=${chat.id} title=${chat.title} status=${newStatus}`);

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
      try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/getChatMemberCount`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chat.id }),
        });
        const data = await res.json() as { result?: number };
        memberCount = data.result;
      } catch { /* ignore */ }

      await this.socialAccounts.addChannel(pending.userId, {
        externalId: String(chat.id),
        title: chat.title || `Channel ${chat.id}`,
        username: chat.username,
        memberCount,
      });

      await this.socialAccounts.clearPendingLink(chat.id);

      await this.sendMessage(
        chat.id,
        `🎉 Канал «${chat.title}» успешно привязан!\n\nТеперь вы можете планировать публикации через панель управления.`,
      );

      this.logger.log(`Channel linked: ${chat.title} (${chat.id}) → user ${pending.userId}`);
    } catch (err) {
      this.logger.error(`Failed to link channel: ${err}`);
      await this.sendMessage(chat.id, '❌ Не удалось привязать канал. Попробуйте ещё раз.');
    }
  }

  private async sendMessage(chatId: number, text: string) {
    const token = this.config.get<string>('TG_BOT_TOKEN');
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    } catch (err) {
      this.logger.error(`Failed to send message: ${err}`);
    }
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
