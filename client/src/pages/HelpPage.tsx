import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

const FAQ = [
  {
    q: 'Как подключить Telegram-канал?',
    a: 'Зарегистрируйтесь в Neonix, перейдите в раздел «Каналы» и нажмите «Подключить канал». Бот пришлёт вам одноразовый код. Отправьте боту команду /start <код>, затем добавьте бота администратором в канал с правом публикации сообщений.',
  },
  {
    q: 'Сколько каналов можно подключить?',
    a: 'На бесплатном тарифе — 1 канал. На Pro — до 5 каналов. На Business — до 30 каналов.',
  },
  {
    q: 'Как работает автоматическая публикация?',
    a: 'Вы создаёте пост, выбираете каналы и указываете дату/время публикации. Neonix автоматически отправит пост в указанное время с учётом вашего часового пояса.',
  },
  {
    q: 'Что будет, если публикация не удалась?',
    a: 'Neonix автоматически повторит попытку до 3 раз с увеличением задержки. Если все попытки неудачны, вы получите уведомление об ошибке.',
  },
  {
    q: 'Как отключить канал?',
    a: 'В разделе «Каналы» нажмите «Отключить» напротив нужного канала. Доступ бота будет отзыв мгновенно.',
  },
  {
    q: 'Безопасны ли мои данные?',
    a: 'Да. Токены шифруются и хранятся в зашифрованном виде. Мы не имеем доступа к содержимому ваших каналов и не публикуем ничего без вашего явного указания.',
  },
];

export function HelpPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">Помощь и поддержка</h1>
          <p className="mt-4 text-graphite-300">
            Ответы на частые вопросы. Не нашли свой? Напишите на{' '}
            <a href="mailto:support@neonix.app" className="text-lime hover:underline">support@neonix.app</a>
          </p>

          <div className="mt-10 space-y-4">
            {FAQ.map((item) => (
              <details key={item.q} className="card group">
                <summary className="flex cursor-pointer items-center justify-between p-5 text-sm font-semibold text-graphite-100 list-none">
                  {item.q}
                  <span className="text-graphite-400 group-open:rotate-180 transition">▼</span>
                </summary>
                <div className="px-5 pb-5 text-sm text-graphite-300 leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>

          <div className="mt-12 card p-8 text-center">
            <h2 className="font-display text-xl font-bold text-white">Нужна помощь?</h2>
            <p className="mt-2 text-sm text-graphite-300">
              Напишите нам на <a href="mailto:support@neonix.app" className="text-lime hover:underline">support@neonix.app</a>
            </p>
            <p className="mt-1 text-xs text-graphite-400">Отвечаем в течение 24 часов в рабочие дни.</p>
          </div>
        </div>
      </main>
      <FooterSimple />
    </div>
  );
}

function FooterSimple() {
  return (
    <footer className="border-t border-graphite-800 bg-graphite-950">
      <div className="container-app flex flex-col items-center justify-between gap-2 py-6 text-xs text-graphite-500 sm:flex-row">
        <span>© 2026 Neonix. Все права защищены.</span>
        <div className="flex gap-4">
          <Link to="/terms" className="hover:text-lime transition">Условия</Link>
          <Link to="/privacy" className="hover:text-lime transition">Конфиденциальность</Link>
          <Link to="/" className="hover:text-lime transition">На главную</Link>
        </div>
      </div>
    </footer>
  );
}
