import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string;
  private readonly appName = 'Neonix';

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('EMAIL_FROM') ?? 'Neonix <no-reply@neonix.online>';
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT') ?? 587;
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (host) {
      const isDev = this.config.get<string>('NODE_ENV') !== 'production';
      const transportOptions: any = {
        host,
        port,
        secure: port === 465,
        tls: { rejectUnauthorized: false },
        requireTLS: false,
        ignoreTLS: true,
      };
      if (user && pass) {
        transportOptions.auth = { user, pass };
      }
      this.transporter = nodemailer.createTransport(transportOptions);
      this.logger.log(`Email transporter initialized (${host}:${port})`);
    } else {
      this.logger.warn('SMTP not configured — emails will be logged only');
    }
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err}`);
    }
  }

  async sendWelcome(to: string, name: string) {
    const safeName = this.escapeHtml(name || 'коллега');
    await this.send(to, `Добро пожаловать в ${this.appName}!`, `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h1 style="color:#d4ff3a;font-size:24px;">Добро пожаловать в ${this.appName}! 🎉</h1>
        <p>Привет, ${safeName}!</p>
        <p>Вы успешно зарегистрировались. Теперь вы можете:</p>
        <ul>
          <li>Подключить Telegram-каналы</li>
          <li>Создавать и планировать посты</li>
          <li>Публиковать автоматически</li>
        </ul>
        <a href="${this.config.get('APP_URL') ?? 'https://neonix.online'}/app" style="display:inline-block;background:#d4ff3a;color:#0a0b0d;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Перейти в кабинет</a>
        <p style="color:#666;margin-top:24px;font-size:12px;">Это автоматическое письмо. Не отвечайте на него.</p>
      </div>
    `);
  }

  async sendPasswordReset(to: string, name: string, resetUrl: string) {
    const safeName = this.escapeHtml(name || 'коллега');
    await this.send(to, `Сброс пароля — ${this.appName}`, `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h1 style="color:#d4ff3a;font-size:24px;">Сброс пароля</h1>
        <p>Привет, ${safeName}!</p>
        <p>Мы получили запрос на сброс пароля для вашего аккаунта.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#d4ff3a;color:#0a0b0d;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Сбросить пароль</a>
        <p style="color:#666;margin-top:16px;font-size:12px;">Ссылка действительна 1 час. Если вы не запрашивали сброс — просто проигнорируйте это письмо.</p>
      </div>
    `);
  }

  async sendPublicationSuccess(to: string, name: string, postTitle: string, channelName: string, postUrl: string) {
    const safeName = this.escapeHtml(name || 'коллега');
    const safeTitle = this.escapeHtml(postTitle || 'Без заголовка');
    const safeChannel = this.escapeHtml(channelName);
    await this.send(to, `Пост опубликован — ${this.appName}`, `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h1 style="color:#4fae4e;font-size:24px;">✅ Пост опубликован</h1>
        <p>Привет, ${safeName}!</p>
        <p>Ваш пост <strong>${safeTitle}</strong> успешно опубликован в канал <strong>${safeChannel}</strong>.</p>
        <a href="${postUrl}" style="display:inline-block;background:#d4ff3a;color:#0a0b0d;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Посмотреть</a>
      </div>
    `);
  }

  async sendPublicationFailed(to: string, name: string, postTitle: string, channelName: string, error: string) {
    const safeName = this.escapeHtml(name || 'коллега');
    const safeTitle = this.escapeHtml(postTitle || 'Без заголовка');
    const safeChannel = this.escapeHtml(channelName);
    const safeError = this.escapeHtml(error);
    await this.send(to, `Ошибка публикации — ${this.appName}`, `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h1 style="color:#e53935;font-size:24px;">❌ Ошибка публикации</h1>
        <p>Привет, ${safeName}!</p>
        <p>Не удалось опубликовать пост <strong>${safeTitle}</strong> в канал <strong>${safeChannel}</strong>.</p>
        <p style="color:#666;font-size:12px;">Ошибка: ${safeError}</p>
        <p>Пост будет повторён автоматически. Если ошибка повторяется — проверьте права бота в канале.</p>
      </div>
    `);
  }

  async sendSupportReply(to: string, name: string, subject: string, message: string) {
    const safeName = this.escapeHtml(name || 'коллега');
    const safeSubject = this.escapeHtml(subject);
    const safeMessage = this.escapeHtml(message);
    await this.send(to, `Ответ поддержки — ${this.appName}`, `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h1 style="color:#d4ff3a;font-size:24px;">Ответ поддержки</h1>
        <p>Привет, ${safeName}!</p>
        <p><strong>Тема:</strong> ${safeSubject}</p>
        <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;">
          ${safeMessage}
        </div>
        <p style="color:#666;font-size:12px;">Если у вас есть дополнительные вопросы — просто ответьте на это письмо.</p>
      </div>
    `);
  }

  async sendDigest(to: string, name: string, stats: { published: number; failed: number; scheduled: number; channels: number }) {
    const safeName = this.escapeHtml(name || 'коллега');
    await this.send(to, `Дайджест за неделю — ${this.appName}`, `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h1 style="color:#d4ff3a;font-size:24px;">📊 Дайджест за неделю</h1>
        <p>Привет, ${safeName}!</p>
        <p>Вот как прошла ваша неделя в ${this.appName}:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="background:#f5f5f5;">
            <td style="padding:12px;border:1px solid #ddd;"><strong>Опубликовано</strong></td>
            <td style="padding:12px;border:1px solid #ddd;text-align:center;font-size:20px;color:#4fae4e;">${stats.published}</td>
          </tr>
          <tr>
            <td style="padding:12px;border:1px solid #ddd;"><strong>Ошибок</strong></td>
            <td style="padding:12px;border:1px solid #ddd;text-align:center;font-size:20px;color:#e53935;">${stats.failed}</td>
          </tr>
          <tr style="background:#f5f5f5;">
            <td style="padding:12px;border:1px solid #ddd;"><strong>Запланировано</strong></td>
            <td style="padding:12px;border:1px solid #ddd;text-align:center;font-size:20px;color:#eab308;">${stats.scheduled}</td>
          </tr>
          <tr>
            <td style="padding:12px;border:1px solid #ddd;"><strong>Активных каналов</strong></td>
            <td style="padding:12px;border:1px solid #ddd;text-align:center;font-size:20px;">${stats.channels}</td>
          </tr>
        </table>
        <a href="${this.config.get('APP_URL') ?? 'https://neonix.online'}/app" style="display:inline-block;background:#d4ff3a;color:#0a0b0d;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Открыть кабинет</a>
      </div>
    `);
  }

  async sendInvoice(to: string, name: string, amount: string, period: string, plan: string) {
    const safeName = this.escapeHtml(name || 'коллега');
    const safeAmount = this.escapeHtml(amount);
    const safePeriod = this.escapeHtml(period);
    const safePlan = this.escapeHtml(plan);
    await this.send(to, `Счёт за ${safePeriod} — ${this.appName}`, `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h1 style="color:#d4ff3a;font-size:24px;">💳 Счёт за ${safePeriod}</h1>
        <p>Привет, ${safeName}!</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="background:#f5f5f5;">
            <td style="padding:12px;border:1px solid #ddd;"><strong>Тариф</strong></td>
            <td style="padding:12px;border:1px solid #ddd;">${safePlan}</td>
          </tr>
          <tr>
            <td style="padding:12px;border:1px solid #ddd;"><strong>Период</strong></td>
            <td style="padding:12px;border:1px solid #ddd;">${safePeriod}</td>
          </tr>
          <tr style="background:#f5f5f5;">
            <td style="padding:12px;border:1px solid #ddd;"><strong>Сумма</strong></td>
            <td style="padding:12px;border:1px solid #ddd;font-size:18px;font-weight:bold;">${safeAmount}</td>
          </tr>
        </table>
        <a href="${this.config.get('APP_URL') ?? 'https://neonix.online'}/app/settings" style="display:inline-block;background:#d4ff3a;color:#0a0b0d;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Управление подпиской</a>
      </div>
    `);
  }
}
