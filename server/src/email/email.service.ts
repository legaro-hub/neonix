import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string;
  private readonly appName = 'Neonix';
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('EMAIL_FROM') ?? 'Neonix <no-reply@neonix.online>';
    this.appUrl = this.config.get<string>('APP_URL') ?? 'https://neonix.online';
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
      const transportOptions: any = {
        host,
        port,
        secure: port === 465,
        tls: { rejectUnauthorized: false },
        requireTLS: port === 587,
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

  private wrap(title: string, content: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0b0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0b0d;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Header -->
  <tr><td style="padding:0 0 32px 0;text-align:center;">
    <a href="${this.appUrl}" style="text-decoration:none;">
      <span style="font-size:28px;font-weight:800;color:#d4ff3a;letter-spacing:-0.5px;">NEO</span><span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">NIX</span>
    </a>
  </td></tr>

  <!-- Card -->
  <tr><td style="background:#12131a;border-radius:16px;border:1px solid #1e1f2e;overflow:hidden;">
    <!-- Accent bar -->
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="height:3px;background:linear-gradient(90deg,#d4ff3a,#00e5ff);font-size:0;line-height:0;">&nbsp;</td>
    </tr></table>
    <!-- Content -->
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:40px 36px;">
      ${content}
    </td></tr></table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:32px 0 0 0;text-align:center;">
    <p style="margin:0 0 8px 0;font-size:13px;color:#4a4b5e;">${this.appName} &mdash; планирование постов в Telegram</p>
    <p style="margin:0 0 8px 0;"><a href="${this.appUrl}" style="color:#d4ff3a;text-decoration:none;font-size:13px;">neonix.online</a></p>
    <p style="margin:0;font-size:11px;color:#2a2b3e;">Это автоматическое письмо. Не отвечайте на него.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
  }

  private btn(text: string, url: string, color = '#d4ff3a', textColor = '#0a0b0d'): string {
    return `<a href="${url}" style="display:inline-block;background:${color};color:${textColor};padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;margin-top:24px;letter-spacing:0.3px;">${text}</a>`;
  }

  private heading(text: string, color = '#d4ff3a'): string {
    return `<h1 style="margin:0 0 20px 0;font-size:26px;font-weight:800;color:${color};letter-spacing:-0.3px;">${text}</h1>`;
  }

  private paragraph(text: string, color = '#c0c1d0'): string {
    return `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:${color};">${text}</p>`;
  }

  private divider(): string {
    return `<hr style="border:none;border-top:1px solid #1e1f2e;margin:28px 0;">`;
  }

  async sendVerificationEmail(to: string, name: string, verifyUrl: string) {
    const safeName = this.escapeHtml(name || 'коллега');
    const content = `
      ${this.heading('Подтвердите email')}
      ${this.paragraph(`Привет, <strong style="color:#fff;">${safeName}</strong>!`)}
      ${this.paragraph('Вы зарегистрировались в Neonix. Чтобы активировать аккаунт, подтвердите ваш email:')}
      ${this.btn('Подтвердить email', verifyUrl)}
      ${this.divider()}
      ${this.paragraph('Ссылка действительна 24 часа. Если вы не регистрировались — просто проигнорируйте это письмо.', '#4a4b5e')}
    `;
    await this.send(to, `Подтвердите email — ${this.appName}`, this.wrap('Подтверждение', content));
  }

  async sendWelcome(to: string, name: string) {
    const safeName = this.escapeHtml(name || 'коллега');
    const content = `
      ${this.heading('Добро пожаловать в Neonix!')}
      ${this.paragraph(`Привет, <strong style="color:#fff;">${safeName}</strong>!`)}
      ${this.paragraph('Аккаунт создан. Теперь у вас есть всё для автоматических публикаций:')}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        <tr><td style="padding:12px 16px;background:#1a1b2e;border-radius:10px;border-left:3px solid #d4ff3a;margin-bottom:8px;font-size:14px;color:#c0c1d0;">Подключение Telegram-каналов</td></tr>
        <tr><td style="height:8px;"></td></tr>
        <tr><td style="padding:12px 16px;background:#1a1b2e;border-radius:10px;border-left:3px solid #00e5ff;font-size:14px;color:#c0c1d0;">Создание и планирование постов</td></tr>
        <tr><td style="height:8px;"></td></tr>
        <tr><td style="padding:12px 16px;background:#1a1b2e;border-radius:10px;border-left:3px solid #d4ff3a;font-size:14px;color:#c0c1d0;">Автоматическая публикация по расписанию</td></tr>
      </table>
      ${this.btn('Перейти в кабинет', `${this.appUrl}/app`)}
    `;
    await this.send(to, `Добро пожаловать в ${this.appName}!`, this.wrap('Добро пожаловать', content));
  }

  async sendPasswordReset(to: string, name: string, resetUrl: string) {
    const safeName = this.escapeHtml(name || 'коллега');
    const content = `
      ${this.heading('Сброс пароля')}
      ${this.paragraph(`Привет, <strong style="color:#fff;">${safeName}</strong>!`)}
      ${this.paragraph('Мы получили запрос на сброс пароля для вашего аккаунта. Нажмите кнопку ниже, чтобы задать новый пароль:')}
      ${this.btn('Сбросить пароль', resetUrl)}
      ${this.divider()}
      ${this.paragraph('Ссылка действительна в течение 1 часа. Если вы не запрашивали сброс — просто проигнорируйте это письмо, ваш пароль останется прежним.', '#4a4b5e')}
    `;
    await this.send(to, `Сброс пароля — ${this.appName}`, this.wrap('Сброс пароля', content));
  }

  async sendPublicationSuccess(to: string, name: string, postTitle: string, channelName: string, postUrl: string) {
    const safeName = this.escapeHtml(name || 'коллега');
    const safeTitle = this.escapeHtml(postTitle || 'Без заголовка');
    const safeChannel = this.escapeHtml(channelName);
    const content = `
      ${this.heading('Пост опубликован', '#4fae4e')}
      ${this.paragraph(`Привет, <strong style="color:#fff;">${safeName}</strong>!`)}
      ${this.paragraph('Ваш пост успешно опубликован:')}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        <tr>
          <td style="padding:16px 20px;background:#1a1b2e;border-radius:10px;border-left:3px solid #4fae4e;">
            <p style="margin:0 0 6px 0;font-size:15px;font-weight:700;color:#fff;">${safeTitle}</p>
            <p style="margin:0;font-size:13px;color:#8a8b9e;">${safeChannel}</p>
          </td>
        </tr>
      </table>
      ${this.btn('Посмотреть', postUrl)}
    `;
    await this.send(to, `Пост опубликован — ${this.appName}`, this.wrap('Публикация', content));
  }

  async sendPublicationFailed(to: string, name: string, postTitle: string, channelName: string, error: string) {
    const safeName = this.escapeHtml(name || 'коллега');
    const safeTitle = this.escapeHtml(postTitle || 'Без заголовка');
    const safeChannel = this.escapeHtml(channelName);
    const safeError = this.escapeHtml(error);
    const content = `
      ${this.heading('Ошибка публикации', '#e53935')}
      ${this.paragraph(`Привет, <strong style="color:#fff;">${safeName}</strong>!`)}
      ${this.paragraph('Не удалось опубликовать пост:')}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        <tr>
          <td style="padding:16px 20px;background:#1a1b2e;border-radius:10px;border-left:3px solid #e53935;">
            <p style="margin:0 0 6px 0;font-size:15px;font-weight:700;color:#fff;">${safeTitle}</p>
            <p style="margin:0 0 8px 0;font-size:13px;color:#8a8b9e;">${safeChannel}</p>
            <p style="margin:0;font-size:13px;color:#e53935;font-family:monospace;">${safeError}</p>
          </td>
        </tr>
      </table>
      ${this.paragraph('Пост будет повторён автоматически. Если ошибка повторяется — проверьте права бота в канале.', '#4a4b5e')}
    `;
    await this.send(to, `Ошибка публикации — ${this.appName}`, this.wrap('Ошибка', content));
  }

  async sendSupportReply(to: string, name: string, subject: string, message: string) {
    const safeName = this.escapeHtml(name || 'коллега');
    const safeSubject = this.escapeHtml(subject);
    const safeMessage = this.escapeHtml(message);
    const content = `
      ${this.heading('Ответ поддержки')}
      ${this.paragraph(`Привет, <strong style="color:#fff;">${safeName}</strong>!`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        <tr><td style="padding:6px 0;font-size:13px;color:#4a4b5e;text-transform:uppercase;letter-spacing:1px;">Тема</td></tr>
        <tr><td style="padding:0 0 16px 0;font-size:15px;color:#fff;font-weight:600;">${safeSubject}</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;color:#4a4b5e;text-transform:uppercase;letter-spacing:1px;">Сообщение</td></tr>
        <tr><td style="padding:16px 20px;background:#1a1b2e;border-radius:10px;font-size:15px;line-height:1.65;color:#c0c1d0;">${safeMessage}</td></tr>
      </table>
      ${this.divider()}
      ${this.paragraph('Если у вас есть дополнительные вопросы — просто ответьте на это письмо.', '#4a4b5e')}
    `;
    await this.send(to, `Ответ поддержки — ${this.appName}`, this.wrap('Поддержка', content));
  }

  async sendDigest(to: string, name: string, stats: { published: number; failed: number; scheduled: number; channels: number }) {
    const safeName = this.escapeHtml(name || 'коллега');
    const statRow = (label: string, value: string, color: string) =>
      `<tr>
        <td style="padding:14px 20px;background:#1a1b2e;border-radius:8px;border-left:3px solid ${color};">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:14px;color:#8a8b9e;">${label}</td>
            <td align="right" style="font-size:22px;font-weight:800;color:${color};">${value}</td>
          </tr></table>
        </td>
      </tr><tr><td style="height:8px;"></td></tr>`;

    const content = `
      ${this.heading('Дайджест за неделю')}
      ${this.paragraph(`Привет, <strong style="color:#fff;">${safeName}</strong>! Вот как прошла ваша неделя:`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        ${statRow('Опубликовано', String(stats.published), '#4fae4e')}
        ${statRow('Ошибок', String(stats.failed), '#e53935')}
        ${statRow('Запланировано', String(stats.scheduled), '#eab308')}
        ${statRow('Активных каналов', String(stats.channels), '#d4ff3a')}
      </table>
      ${this.btn('Открыть кабинет', `${this.appUrl}/app`)}
    `;
    await this.send(to, `Дайджест за неделю — ${this.appName}`, this.wrap('Дайджест', content));
  }

  async sendInvoice(to: string, name: string, amount: string, period: string, plan: string) {
    const safeName = this.escapeHtml(name || 'коллега');
    const safeAmount = this.escapeHtml(amount);
    const safePeriod = this.escapeHtml(period);
    const safePlan = this.escapeHtml(plan);
    const content = `
      ${this.heading('Счёт за подписку')}
      ${this.paragraph(`Привет, <strong style="color:#fff;">${safeName}</strong>!`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
        <tr>
          <td style="padding:20px;background:#1a1b2e;border-radius:12px;border:1px solid #1e1f2e;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 0 16px 0;">
                  <p style="margin:0;font-size:13px;color:#4a4b5e;text-transform:uppercase;letter-spacing:1px;">Тариф</p>
                  <p style="margin:4px 0 0 0;font-size:16px;color:#fff;font-weight:700;">${safePlan}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 0 16px 0;">
                  <p style="margin:0;font-size:13px;color:#4a4b5e;text-transform:uppercase;letter-spacing:1px;">Период</p>
                  <p style="margin:4px 0 0 0;font-size:16px;color:#fff;font-weight:700;">${safePeriod}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 0 0 0;border-top:1px solid #1e1f2e;">
                  <p style="margin:0;font-size:13px;color:#4a4b5e;text-transform:uppercase;letter-spacing:1px;">К оплате</p>
                  <p style="margin:4px 0 0 0;font-size:28px;font-weight:800;color:#d4ff3a;">${safeAmount}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      ${this.btn('Управление подпиской', `${this.appUrl}/app/settings`)}
    `;
    await this.send(to, `Счёт за ${safePeriod} — ${this.appName}`, this.wrap('Счёт', content));
  }
}
