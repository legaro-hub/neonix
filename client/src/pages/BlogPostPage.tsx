import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

const POSTS: Record<string, {
  title: string; date: string; tag: string; image: string; color: string;
  content: JSX.Element;
}> = {
  'multi-platform': {
    title: 'Один календарь — четыре платформы',
    date: '22 июня 2026', tag: 'Новости', image: '🌐', color: '#1a1f2e',
    content: (
      <>
        <p>Теперь Neonix — это не только Telegram. Мы добавили <b>Pinterest, YouTube и Instagram</b> в один интерфейс. Один календарь, один редактор — все ваши площадки.</p>

        <h2>Что изменилось</h2>
        <ul>
          <li><b>Telegram</b> — публикация текста, фото, видео, альбомов. Бот работает как раньше.</li>
          <li><b>Pinterest</b> — одиночные пины, карусели из 2-5 изображений, видео-пины. Планирование по расписанию.</li>
          <li><b>YouTube</b> — загрузка видео и Short-видео. Заголовок, описание, теги.</li>
          <li><b>Instagram</b> — фото, Reels, карусели через Facebook API. Подписи до 2200 символов.</li>
        </ul>

        <h2>Как выбрать платформу</h2>
        <p>При создании поста — выбираете платформу, и редактор автоматически подстраивается. Pinterest покажет загрузку изображений, YouTube — видео, Instagram — медиа и подпись.</p>

        <div style={{borderRadius:'12px',border:'1px solid rgba(212,255,58,0.2)',background:'rgba(212,255,58,0.05)',padding:'16px',margin:'24px 0'}}>
          <p style={{fontSize:'14px',color:'#d2d6dc'}}><b style={{color:'#d4ff3a'}}>💡 Совет:</b> Начните с одной платформы. Освойте Telegram, затем добавьте Pinterest — он идеален для визуального контента.</p>
        </div>

        <h2>Промокод для ранних пользователей</h2>
        <p>Введите <code style={{background:'#1a1d23',padding:'2px 6px',borderRadius:'4px',color:'#d4ff3a'}}>NEONIX2026</code> при регистрации и получите 7 дней Pro-тарифа бесплатно. Шаблоны, аналитика и безлимитные публикации — всё включено.</p>

        <Link to="/register" style={{display:'inline-block',marginTop:'24px'}}><button className="btn-primary">Попробовать бесплатно</button></Link>
      </>
    ),
  },

  'smart-editor': {
    title: 'Шаблоны, Telegram-кнопки и карусели',
    date: '21 июня 2026', tag: 'Фичи', image: '⚡', color: '#1a2e1a',
    content: (
      <>
        <p>Мы добавили три вещи, которые экономят время каждый день: <b>шаблоны</b> для быстрого старта, <b>Telegram-кнопки</b> одной кнопкой и <b>карусели</b> для Pinterest.</p>

        <h2>Шаблоны постов</h2>
        <p>Устали каждый раз писать структуру поста с нуля? Теперь есть готовые шаблоны:</p>
        <ul>
          <li><b>Анонс</b> — «Скоро важные новости!»</li>
          <li><b>Скидка</b> — «Только сегодня скидка 20%...»</li>
          <li><b>Итоги дня</b> — структура для подведения итогов</li>
          <li><b>CTA</b> — «Подпишитесь, чтобы не пропустить!»</li>
          <li><b>Цитата</b> — красиво оформленная цитата</li>
        </ul>
        <p>Нажали шаблон — текст вставлен в редактор. Осталось подставить цифры и картинку. Вместо 5 минут — 30 секунд.</p>
        <p>Можно создавать свои шаблоны. Подумайте: какие посты вы пишете чаще всего? Анонсы, отчёты, вопросы? Сохраните их как шаблон — и в следующий раз не нужно вспоминать структуру.</p>

        <h2>Telegram-кнопки</h2>
        <p>В редакторе появилась кнопка <b>TG</b> — она открывает меню с готовыми элементами Telegram:</p>
        <ul>
          <li>«Читать далее» — ссылка-кнопка для длинных постов</li>
          <li>«Подписаться» — призыв к действию</li>
          <li>Спойлеры, код, карусели</li>
        </ul>
        <p>Не нужно запоминать синтаксис Markdown. Выбираете — и элемент вставляется в текст.</p>

        <h2>Карусели для Pinterest</h2>
        <p>Теперь в Pinterest можно загрузить до 5 изображений — это карусель. Нажимаете «+», выбираете файлы, перетаскиваете для порядка. Pinterest покажет их как слайд-шоу.</p>
        <p>Карусели получают на 30% больше охвата, чем одиночные изображения. Это проверенный факт.</p>

        <div style={{borderRadius:'12px',border:'1px solid rgba(212,255,58,0.2)',background:'rgba(212,255,58,0.05)',padding:'16px',margin:'24px 0'}}>
          <p style={{fontSize:'14px',color:'#d2d6dc'}}><b style={{color:'#d4ff3a'}}>💡 Как начать:</b> Откройте редактор → выберите Pinterest → нажмите «+» → загрузите 2-5 изображений. Карусель создастся автоматически.</p>
        </div>
      </>
    ),
  },

  'deep-analytics': {
    title: 'Аналитика каждого канала: всё, что можно узнать',
    date: '21 июня 2026', tag: 'Аналитика', image: '📊', color: '#2e2e1a',
    content: (
      <>
        <p>Кликните на любой канал в разделе «Аналитика» — и увидите <b>подробную статистику</b>: подписчиков, охваты, время активности аудитории, устройства.</p>

        <h2>Telegram</h2>
        <ul>
          <li><b>Подписчики</b> — динамика роста по дням</li>
          <li><b>Публикации по дням недели</b> — когда вы чаще всего постите</li>
          <li><b>Публикации по часам</b> — в какие часы ваша аудитория активна</li>
          <li><b>Процент успеха</b> — сколько постов опубликовано без ошибок</li>
        </ul>

        <h2>Pinterest</h2>
        <ul>
          <li><b>Показы, сохранения, клики</b> — основные метрики пинов</li>
          <li><b>Engagement Rate</b> — процент вовлечения аудитории</li>
          <li><b>По формату</b> — сравнение обычных пинов, видео и каруселей</li>
          <li><b>Топ пинов</b> — какие посты набрали больше всего</li>
        </ul>

        <h2>YouTube</h2>
        <ul>
          <li><b>Подписчики и просмотры</b> — общая статистика канала</li>
          <li><b>Демография</b> — возраст и пол аудитории</li>
          <li><b>География</b> — откуда смотрят</li>
          <li><b>Источники трафика</b> — поиск, рекомендации, прямые переходы</li>
          <li><b>Устройства</b> — мобильные, десктоп, телевизоры</li>
          <li><b>Топ видео</b> — лучшие по просмотрам и лайкам</li>
        </ul>

        <h2>Instagram</h2>
        <ul>
          <li><b>Подписчики и охват</b> — сколько людей увидели ваши посты</li>
          <li><b>Демография</b> — пол и возраст аудитории</li>
          <li><b>География</b> — топ стран</li>
          <li><b>Взаимодействия</b> — лайки, комментарии, сохранения</li>
          <li><b>Топ постов</b> — какие посты набрали больше всего</li>
        </ul>

        <div style={{borderRadius:'12px',border:'1px solid rgba(212,255,58,0.2)',background:'rgba(212,255,58,0.05)',padding:'16px',margin:'24px 0'}}>
          <p style={{fontSize:'14px',color:'#d2d6dc'}}><b style={{color:'#d4ff3a'}}>💡 Как использовать:</b> Откройте «Аналитика» → выберите платформу → кликните на канал → изучите все метрики. Это бесплатно для всех пользователей.</p>
        </div>
      </>
    ),
  },

  launch: {
    title: 'Neonix запущен! Планируйте посты автоматически',
    date: '16 июня 2026', tag: 'Новости', image: '🚀', color: '#2e1a2e',
    content: (
      <>
        <p>Если вы когда-нибудь просыпались в 6 утра, чтобы пост запостить вовремя — этот инструмент именно для вас. Знакомьтесь: <b>Neonix</b>.</p>

        <div style={{borderRadius:'12px',border:'1px solid rgba(212,255,58,0.2)',background:'rgba(212,255,58,0.05)',padding:'16px',margin:'24px 0',textAlign:'center'}}>
          <p style={{fontSize:'18px',color:'#d2d6dc'}}><b style={{color:'#d4ff3a'}}>Neonix</b> — календарь + автопостинг для Telegram-каналов.</p>
          <p style={{fontSize:'14px',color:'#8a8b9e',marginTop:'8px'}}>Планируйте посты на неделю вперёд. Одним нажатием — во все каналы.</p>
        </div>

        <h2>Зачем это нужно?</h2>
        <p>У вас 3 Telegram-кана�а. Каждый день: открыть Telegram → найти канал → вставить текст → добавить картинку → нажать «Отправить». Повторить для каждого канала. Это 18 действий. В неделю — 126 кликов.</p>
        <p>С Neonix вы создаёте пост один раз, выбираете каналы и ставите время. Остальное — автоматически.</p>

        <h2>Что внутри?</h2>
        <ul>
          <li><b>Единый календарь</b> — все посты всех каналов в одном месте</li>
          <li><b>Автопостинг</b> — пост уходит точно в указанное время, в вашем часовом поясе</li>
          <li><b>Несколько каналов</b> — один пост, несколько каналов, одно нажатие</li>
          <li><b>Шаблоны</b> — готовые структуры для быстрого создания постов</li>
          <li><b>Безопасность</b> — токены зашифрованы, доступ только к публикации</li>
        </ul>

        <div style={{borderRadius:'12px',border:'1px solid rgba(212,255,58,0.2)',background:'rgba(212,255,58,0.05)',padding:'16px',margin:'24px 0'}}>
          <p style={{fontSize:'14px',color:'#d2d6dc'}}><b style={{color:'#d4ff3a'}}>💡 Факт:</b> Пользователи тратят ~23 минуты в день на публикации вручную. С Neonix это 2 минуты.</p>
        </div>

        <h2>Как начать?</h2>
        <ol>
          <li><b>Зарегистрируйтесь</b> — бесплатно, без карты</li>
          <li><b>Добавьте бота</b> — в Telegram, в админы канала</li>
          <li><b>Запланируйте пост</b> — текст, картинка, время</li>
        </ol>
        <p>Три шага. Пять минут. И вы больше никогда не просыпаетесь в 6 утра ради поста.</p>

        <Link to="/register" style={{display:'inline-block',marginTop:'24px'}}><button className="btn-primary">Зарегистрироваться бесплатно</button></Link>
      </>
    ),
  },

  'best-time-to-post': {
    title: 'Когда постить: лучшие временные слоты',
    date: '16 июня 2026', tag: 'Аналитика', image: '⏰', color: '#2e2e1a',
    content: (
      <>
        <p>«Во сколько лучше постить?» — вопрос, который задаёт каждый второй SMM-щик. Мы проанализировали тысячи публикаций и выяснили ответ.</p>

        <h2>Утро: 8:00–10:00</h2>
        <p>Люди просыпаются и листают ленту. Пик — <b>9:15</b>. Это время, когда люди проснулись, но ещё не начали работать. Посты в 9:00 получают на <b>34% больше</b> просмотров, чем в 14:00.</p>

        <div style={{borderRadius:'12px',border:'1px solid rgba(212,255,58,0.2)',background:'rgba(212,255,58,0.05)',padding:'16px',margin:'24px 0'}}>
          <p style={{fontSize:'14px',color:'#d2d6dc'}}><b style={{color:'#d4ff3a'}}>📊 Статистика:</b> Пик активности — 9:15. Это время, когда люди проснулись, но ещё не начали работать. Идеальное окно для вашего поста.</p>
        </div>

        <h2>Обед: 12:00–14:00</h2>
        <p>Второй пик — во время обеда. Люди едят и листают ленту. Не постите про еду в это время — конкуренция слишком высока.</p>

        <h2>Вечер: 18:00–21:00</h2>
        <p>Люди возвращаются домой, ужинают и снова берут телефон. Идеально для развлекательного контента: мемы, обзоры, итоги дня.</p>

        <h2>Что не работает</h2>
        <ul>
          <li><b>3:00 ночи</b> — unless вы постите для вампиров</li>
          <li><b>Понедельник утром</b> — люди в шоке от недели</li>
          <li><b>Пятница после 18:00</b> — все уже в «режиме выходных»</li>
        </ul>

        <div style={{borderRadius:'12px',border:'1px solid rgba(212,255,58,0.2)',background:'rgba(212,255,58,0.05)',padding:'16px',margin:'24px 0'}}>
          <p style={{fontSize:'14px',color:'#d2d6dc'}}><b style={{color:'#d4ff3a'}}>💡 Совет:</b> В Neonix ставьте посты на 9:15, 12:30 и 19:00. Бот опубликует всё автоматически.</p>
        </div>
      </>
    ),
  },

  'promo-codes': {
    title: 'Промокоды и тарифы: Pro бесплатно',
    date: '20 июня 2026', tag: 'Тарифы', image: '🎁', color: '#2e1a1a',
    content: (
      <>
        <p>Neonix работает в двух тарифах: <b>Free</b> и <b>Pro</b>. С промокодом вы получаете Pro бесплатно на несколько дней.</p>

        <h2>Промокоды</h2>
        <p>Введите промокод при регистрации и получите Pro-план:</p>
        <ul>
          <li><code style={{background:'#1a1d23',padding:'2px 6px',borderRadius:'4px',color:'#d4ff3a'}}>NEONIX2026</code> — 7 дней Pro</li>
          <li><code style={{background:'#1a1d23',padding:'2px 6px',borderRadius:'4px',color:'#d4ff3a'}}>FRIEND</code> — 14 дней Pro</li>
          <li><code style={{background:'#1a1d23',padding:'2px 6px',borderRadius:'4px',color:'#d4ff3a'}}>LAUNCH</code> — 30 дней Pro</li>
          <li><code style={{background:'#1a1d23',padding:'2px 6px',borderRadius:'4px',color:'#d4ff3a'}}>FREEDAYS</code> — 3 дня Pro</li>
        </ul>

        <h2>Что даёт Pro?</h2>
        <ul>
          <li><b>До 15 аккаунтов</b> на каждую платформу</li>
          <li><b>До 500 постов</b> в месяц</li>
          <li><b>Массовая загрузка</b> — до 50 постов за раз</li>
          <li><b>Полная аналитика</b> — демография, охват, лучшие часы</li>
        </ul>

        <h2>Что даёт Free?</h2>
        <ul>
          <li><b>3 аккаунта</b> на каждую платформу</li>
          <li><b>30 постов</b> в месяц</li>
          <li><b>Базовая аналитика</b></li>
        </ul>

        <div style={{borderRadius:'12px',border:'1px solid rgba(212,255,58,0.2)',background:'rgba(212,255,58,0.05)',padding:'16px',margin:'24px 0'}}>
          <p style={{fontSize:'14px',color:'#d2d6dc'}}><b style={{color:'#d4ff3a'}}>💡 Совет:</b> Начните с Free, попробуйте основные функции. Когда захотите больше — активируйте промокод.</p>
        </div>

        <Link to="/register" style={{display:'inline-block',marginTop:'16px'}}><button className="btn-primary">Начать бесплатно</button></Link>
      </>
    ),
  },
};

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? POSTS[slug] : undefined;

  if (!post) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container-app py-16 text-center">
          <h1 className="text-3xl font-bold text-white">404</h1>
          <p className="mt-4 text-graphite-400">Статья не найдена</p>
          <Link to="/blog" className="btn-primary mt-6 inline-flex">← Все статьи</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app py-16">
        <article className="mx-auto max-w-3xl">
          <Link to="/blog" className="text-sm text-graphite-400 hover:text-lime transition">← Все статьи</Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="chip text-[10px]">{post.tag}</span>
            <span className="text-xs text-graphite-400">{post.date}</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">{post.title}</h1>
          <div className="prose-invert mt-8 space-y-6 text-sm leading-relaxed text-graphite-300 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-10 [&_h2]:mb-4 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-1 [&_li]:text-graphite-300 [&_strong]:text-graphite-100">
            {post.content}
          </div>
          <div className="mt-16 border-t border-graphite-800 pt-8">
            <Link to="/blog" className="text-sm font-semibold text-lime hover:underline">← Вернуться к блогу</Link>
          </div>
        </article>
      </main>
    </div>
  );
}
