import { Navbar } from '../components/Navbar';

export function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-bold text-white">Политика конфиденциальности</h1>
          <p className="mt-2 text-sm text-graphite-400">Последнее обновление: 16 июня 2026 г.</p>

          <div className="prose-invert mt-8 space-y-6 text-sm leading-relaxed text-graphite-300">
            <section>
              <h2 className="font-display text-lg font-semibold text-white mb-2">1. Какие данные мы собираем</h2>
              <p>
                <strong>Данные аккаунта:</strong> email, имя, часовой пояс, язык интерфейса.
              </p>
              <p className="mt-2">
                <strong>Данные подключения:</strong> токены доступа к Telegram (шифруются при хранении), информация о подключённых каналах (название, username, количество подписчиков).
              </p>
              <p className="mt-2">
                <strong>Данные использования:</strong> статусы публикаций, метрики (просмотры, реакции — если доступно API), журнал действий.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white mb-2">2. Как мы используем данные</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Для предоставления услуги планирования и публикации контента</li>
                <li>Для технической поддержки и улучшения Сервиса</li>
                <li>Для отправки уведомлений о статусе публикаций и безопасности аккаунта</li>
                <li>Для соблюдения правовых обязательств</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white mb-2">3. Хранение и защита данных</h2>
              <p>
                Данные хранятся на серверах в соответствии с выбранной юрисдикцией. Токены социальных сетей шифруются алгоритмом AES-256-GCM. Мы применяем меры технической и организационной защиты: HTTPS, аутентификация по JWT, ограничение доступа.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white mb-2">4. Передача данных третьим лицам</h2>
              <p>
                Мы не продаём и не передаём ваши данные третьим лицам, за исключением:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Платёжных систем (ЮKassa, Stripe) — для обработки платежей</li>
                <li>Сервисов доставки email (Postmark, SendGrid) — для отправки уведомлений</li>
                <li>По требованию законодательства</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white mb-2">5. Ваши права</h2>
              <p>
                Вы имеете право: запросить доступ к вашим данным, исправить или удалить их, получить копию в машиночитаемом формате, отозвать согласие на обработку.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white mb-2">6. Cookies</h2>
              <p>
                Сервис использует httpOnly cookie для хранения refresh-токена. Эти cookie недоступны из JavaScript и используются исключительно для аутентификации.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white mb-2">7. Срок хранения</h2>
              <p>
                Данные хранятся до удаления аккаунта. После удаления аккаунта данные удаляются в течение 30 дней, за исключением данных, которые мы обязаны хранить по закону.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white mb-2">8. Контакты</h2>
              <p>
                По вопросам конфиденциальности: <a href="mailto:privacy@neonix.online" className="text-lime hover:underline">privacy@neonix.online</a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
