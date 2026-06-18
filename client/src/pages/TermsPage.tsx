import { Navbar } from '../components/Navbar';

export function TermsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-bold text-white">Условия использования</h1>
          <p className="mt-2 text-sm text-graphite-400">Последнее обновление: 16 июня 2026 г.</p>

          <div className="prose-invert mt-8 space-y-6 text-sm leading-relaxed text-graphite-300">
            <section>
              <h2 className="font-display text-lg font-semibold text-white mb-2">1. Общие положения</h2>
              <p>
                Настоящие Условия использования (далее — «Условия») регулируют отношения между вами (далее — «Пользователь») и сервисом Neonix (далее — «Сервис») при использовании веб-приложения для планирования и автоматической публикации контента в социальных сетях.
              </p>
              <p className="mt-2">
                Используя Сервис, вы подтверждаете, что ознакомились с настоящими Условиями и согласны с ними.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white mb-2">2. Описание сервиса</h2>
              <p>
                Neonix предоставляет возможность планировать и автоматически публиковать контент в Telegram-каналы. Сервис работает на условиях SaaS (Program as a Service) с тарифными планами Free, Pro и Business.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white mb-2">3. Регистрация и аккаунт</h2>
              <p>
                Для использования Сервиса необходимо зарегистрировать аккаунт, указав действительный email и пароль. Пользователь несёт ответственность за конфиденциальность своих учётных данных и за все действия, совершённые под его аккаунтом.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white mb-2">4. Тарифы и оплата</h2>
              <p>
                Сервис предлагает тарифные планы Free (бесплатный), Pro и Business. Описание тарифов и их стоимость указаны на странице «Тарифы». Оплата осуществляется через платёжные системы ЮKassa и/или Stripe. Все цены указаны в российских рублях и включают НДС (если применимо).
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white mb-2">5. Интеллектуальная собственность</h2>
              <p>
                Все права на Сервис, включая дизайн, код, графические элементы и тексты, принадлежат Neonix. Пользователь сохраняет все права на размещаемый контент.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white mb-2">6. Отказ от ответственности</h2>
              <p>
                Сервис предоставляется «как есть». Мы не гарантируем бесперебойную работу и не несём ответственности за действия сторонних платформ (Telegram, VK и др.), включая ограничения API, блокировку аккаунтов или изменение политик.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white mb-2">7. Изменение условий</h2>
              <p>
                Мы оставляем за собой право изменять настоящие Условия. Об существенных изменениях уведомляем по email за 7 дней до их вступления в силу.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white mb-2">8. Контакты</h2>
              <p>
                По вопросам, связанным с условиями использования, обращайтесь: <a href="mailto:support@neonix.online" className="text-lime hover:underline">support@neonix.online</a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
