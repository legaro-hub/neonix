import { useState } from 'react';
import { Navbar } from '../components/Navbar';

const RU = {
  title: 'Политика конфиденциальности',
  updated: 'Последнее обновление: 21 июня 2026 г.',
  sections: [
    {
      heading: '1. Введение',
      body: `Neonix ("Мы", "Наш сервис") — это веб-платформа для планирования и автоматической публикации контента в социальных сетях. Мы серьёзно относимся к защите ваших персональных данных. Данная Политика описывает, какие данные мы собираем, как используем и защищаем их.`,
    },
    {
      heading: '2. Какие данные мы собираем',
      body: `<strong>Данные аккаунта:</strong> email-адрес, имя, часовой пояс, язык интерфейса.
<strong>Данные аутентификации:</strong> хеш пароля (bcrypt), JWT-токены сессий.
<strong>Данные подключения соцсетей:</strong> токены доступа к Telegram (шифруются AES-256-GCM), information о подключённых каналах (название, username, количество подписчиков). При подключении Pinterest — OAuth-токены доступа к аккаунту.
<strong>Данные контента:</strong> тексты постов, загруженные медиафайлы (изображения, видео).
<strong>Данные использования:</strong> статусы публикаций, метрики (просмотры, реакции — если доступно API), журнал действий и ошибок.
<strong>Данные технические:</strong> IP-адрес, тип браузера, язык — для обеспечения безопасности и предотвращения злоупотреблений.`,
    },
    {
      heading: '3. Как мы используем данные',
      body: `Ваши данные используются исключительно для:
<ul><li>Предоставления услуги планирования и публикации контента</li>
<li>Аутентификации и обеспечения безопасности аккаунта</li>
<li>Отправки уведомлений о статусе публикаций (email)</li>
<li>Технической поддержки и улучшения Сервиса</li>
<li>Соблюдения правовых обязательств</li></ul>`,
    },
    {
      heading: '4. Хранение и защита данных',
      body: `Данные хранятся на серверах в надёжных дата-центрах. Мы применяем следующие меры защиты:
<ul><li><strong>Шифрование в покое:</strong> токены соцсетей — AES-256-GCM</li>
<li><strong>Шифрование при передаче:</strong> TLS 1.2+ на всех соединениях</li>
<li><strong>Аутентификация:</strong> JWT access + refresh токены с ротацией</li>
<li><strong>Хеширование паролей:</strong> bcrypt (cost 12)</li>
<li><strong>Ограничение доступа:</strong> ролевая модель (RBAC)</li>
<li><strong>Защита от атак:</strong> rate-limiting, капча при регистрации</li></ul>`,
    },
    {
      heading: '5. Передача данных третьим лицам',
      body: `Мы не продаём и не передаём ваши данные третьим лицам. Передача осуществляется только:
<ul><li><strong>Telegram:</strong> для публикации контента в ваши каналы (Bot API)</li>
<li><strong>Pinterest:</strong> для публикации пинов на ваших досках (API v5)</li>
<li><strong>Платёжные системы:</strong> для обработки подписок (когда будет подключён биллинг)</li>
<li><strong>SMTP-сервер:</strong> для доставки email-уведомлений</li>
<li><strong>По требованию закона:</strong> если этого требует действующее законодательство</li></ul>`,
    },
    {
      heading: '6. Cookies',
      body: `Сервис использует httpOnly cookie (SameSite=Lax) для хранения refresh-токена. Эти cookie:
<ul><li>Недоступны из JavaScript (защита от XSS)</li>
<li>Используются исключительно для аутентификации</li>
<li>Не хранят персональные данные</li>
<li>Срок действия — 30 дней</li></ul>`,
    },
    {
      heading: '7. Ваши права',
      body: `Вы имеете право:
<ul><li><strong>Доступ:</strong> запросить информацию о ваших данных</li>
<li><strong>Исправление:</strong> изменить неточные данные в профиле</li>
<li><strong>Удаление:</strong> удалить аккаунт и все связанные данные</li>
<li><strong>Экспорт:</strong> получить копию данных в машиночитаемом формате</li>
<li><strong>Отзыв согласия:</strong> прекратить обработку данных</li></ul>
Для реализации этих прав свяжитесь с нами: <a href="mailto:privacy@neonix.online" className="text-lime hover:underline">privacy@neonix.online</a>`,
    },
    {
      heading: '8. Срок хранения',
      body: `Данные хранятся до момента удаления вашего аккаунта.
<ul><li><strong>После удаления аккаунта:</strong> данные удаляются в течение 30 дней</li>
<li><strong>Медиафайлы:</strong> автоматически удаляются через 90 дней после публикации</li>
<li><strong>Логи ошибок:</strong> хранятся до 12 месяцев</li>
<li><strong>Данные, обязательные по закону:</strong> могут храниться дольше в соответствии с требованиями</li></ul>`,
    },
    {
      heading: '9. Cookies и аналитика',
      body: `Мы не используем сторонние трекеры (Google Analytics, Facebook Pixel и т.д.). Единственные cookie — это аутентификационные httpOnly cookie, необходимые для работы сервиса.`,
    },
    {
      heading: '10. Дети',
      body: `Сервис не предназначен для лиц младше 16 лет. Мы не собираем данные лиц, не достигших 16-летнего возраста.`,
    },
    {
      heading: '11. Изменения в политике',
      body: `Мы можем обновлять данную Политику. При существенных изменениях мы уведомим вас по email. Актуальная версия всегда доступна на этой странице.`,
    },
    {
      heading: '12. Контакты',
      body: `По вопросам конфиденциальности обращайтесь:
<strong>Email:</strong> <a href="mailto:privacy@neonix.online" className="text-lime hover:underline">privacy@neonix.online</a>
<strong>Сайт:</strong> <a href="https://neonix.online" className="text-lime hover:underline">neonix.online</a>`,
    },
  ],
};

const EN = {
  title: 'Privacy Policy',
  updated: 'Last updated: June 21, 2026',
  sections: [
    {
      heading: '1. Introduction',
      body: `Neonix ("We", "Our Service") is a web platform for planning and automatic publishing of content on social networks. We take the protection of your personal data seriously. This Policy describes what data we collect, how we use and protect it.`,
    },
    {
      heading: '2. What data we collect',
      body: `<strong>Account data:</strong> email address, name, timezone, interface language.
<strong>Authentication data:</strong> password hash (bcrypt), JWT session tokens.
<strong>Social media connection data:</strong> Telegram access tokens (encrypted with AES-256-GCM), information about connected channels (title, username, subscriber count). When connecting Pinterest — OAuth access tokens for your account.
<strong>Content data:</strong> post texts, uploaded media files (images, videos).
<strong>Usage data:</strong> publication statuses, metrics (views, reactions — where API allows), activity and error logs.
<strong>Technical data:</strong> IP address, browser type, language — for security and abuse prevention.`,
    },
    {
      heading: '3. How we use data',
      body: `Your data is used exclusively for:
<ul><li>Providing content planning and publishing services</li>
<li>Authentication and account security</li>
<li>Sending email notifications about publication statuses</li>
<li>Technical support and service improvement</li>
<li>Compliance with legal obligations</li></ul>`,
    },
    {
      heading: '4. Data storage and protection',
      body: `Data is stored on servers in reliable data centers. We apply the following security measures:
<ul><li><strong>Encryption at rest:</strong> social tokens — AES-256-GCM</li>
<li><strong>Encryption in transit:</strong> TLS 1.2+ on all connections</li>
<li><strong>Authentication:</strong> JWT access + refresh tokens with rotation</li>
<li><strong>Password hashing:</strong> bcrypt (cost 12)</li>
<li><strong>Access control:</strong> role-based model (RBAC)</li>
<li><strong>Attack protection:</strong> rate limiting, captcha on registration</li></ul>`,
    },
    {
      heading: '5. Data sharing with third parties',
      body: `We do not sell or share your data with third parties. Data sharing occurs only:
<ul><li><strong>Telegram:</strong> for publishing content to your channels (Bot API)</li>
<li><strong>Pinterest:</strong> for publishing pins to your boards (API v5)</li>
<li><strong>Payment systems:</strong> for subscription processing (when billing is enabled)</li>
<li><strong>SMTP server:</strong> for delivering email notifications</li>
<li><strong>By legal requirement:</strong> when required by applicable law</li></ul>`,
    },
    {
      heading: '6. Cookies',
      body: `The service uses httpOnly cookies (SameSite=Lax) to store the refresh token. These cookies:
<ul><li>Are not accessible from JavaScript (XSS protection)</li>
<li>Are used exclusively for authentication</li>
<li>Do not store personal data</li>
<li>Have a 30-day expiration period</li></ul>`,
    },
    {
      heading: '7. Your rights',
      body: `You have the right to:
<ul><li><strong>Access:</strong> request information about your data</li>
<li><strong>Correction:</strong> change inaccurate profile data</li>
<li><strong>Deletion:</strong> delete your account and all related data</li>
<li><strong>Export:</strong> receive a copy of your data in machine-readable format</li>
<li><strong>Withdraw consent:</strong> stop data processing</li></ul>
To exercise these rights, contact us: <a href="mailto:privacy@neonix.online" className="text-lime hover:underline">privacy@neonix.online</a>`,
    },
    {
      heading: '8. Data retention',
      body: `Data is stored until you delete your account.
<ul><li><strong>After account deletion:</strong> data is deleted within 30 days</li>
<li><strong>Media files:</strong> automatically deleted 90 days after publication</li>
<li><strong>Error logs:</strong> stored for up to 12 months</li>
<li><strong>Legally required data:</strong> may be retained longer as required by law</li></ul>`,
    },
    {
      heading: '9. Cookies and analytics',
      body: `We do not use third-party trackers (Google Analytics, Facebook Pixel, etc.). The only cookies are authentication httpOnly cookies required for the service to function.`,
    },
    {
      heading: '10. Children',
      body: `The service is not intended for persons under 16 years of age. We do not collect data from individuals under 16.`,
    },
    {
      heading: '11. Policy changes',
      body: `We may update this Policy. In case of significant changes, we will notify you by email. The current version is always available on this page.`,
    },
    {
      heading: '12. Contact',
      body: `For privacy-related questions:
<strong>Email:</strong> <a href="mailto:privacy@neonix.online" className="text-lime hover:underline">privacy@neonix.online</a>
<strong>Website:</strong> <a href="https://neonix.online" className="text-lime hover:underline">neonix.online</a>`,
    },
  ],
};

export function PrivacyPage() {
  const [lang, setLang] = useState<'ru' | 'en'>('ru');
  const t = lang === 'ru' ? RU : EN;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app py-16">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-white">{t.title}</h1>
              <p className="mt-2 text-sm text-graphite-400">{t.updated}</p>
            </div>
            <button
              onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
              className="rounded-lg border border-graphite-700 bg-graphite-900 px-4 py-2 text-sm font-semibold text-graphite-300 transition hover:border-lime hover:text-lime"
            >
              {lang === 'ru' ? 'EN' : 'RU'}
            </button>
          </div>

          <div className="prose-invert mt-8 space-y-6 text-sm leading-relaxed text-graphite-300">
            {t.sections.map((s, i) => (
              <section key={i}>
                <h2 className="font-display text-lg font-semibold text-white mb-2">{s.heading}</h2>
                <div dangerouslySetInnerHTML={{ __html: s.body }} />
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
