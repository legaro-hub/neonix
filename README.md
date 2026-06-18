# Neonix

Веб-приложение для планирования и автоматической публикации постов в Telegram (SaaS).
Тёмный премиум-дизайн: графит + неоновый лайм.

> MVP-этап. Реализованы: лендинг, регистрация/авторизация, личный кабинет, календарь, редактор постов, массовая загрузка, подключение Telegram-каналов через бота, публикация постов через Bot API, email-уведомления, восстановление пароля.
>
> **Домен:** [neonix.online](https://neonix.online) · **Email:** no-reply@neonix.online

## Стек

| Слой | Технологии |
|------|-----------|
| Backend | Node.js 20+, NestJS 10, TypeScript, Prisma ORM |
| БД | PostgreSQL 16 |
| Auth | JWT access + refresh (httpOnly cookie), bcrypt, капча |
| Frontend | React 18, TypeScript, Vite, TailwindCSS, React Router |
| Telegram | Bot API, webhook, автопривязка каналов |
| Безопасность | валидация DTO, guards, ротация refresh-токенов, webhook secret |
| Инфраструктура | Docker Compose, nginx (reverse proxy) |

## Структура

```
neonix/
├── server/                  # NestJS API
│   ├── prisma/              # схема БД + миграции
│   ├── uploads/             # хранилище медиафайлов
│   └── src/
│       ├── auth/            # регистрация, вход, JWT, guards, капча
│       ├── users/           # профиль пользователя, настройки
│       ├── social-accounts/ # управление каналами Telegram
│       ├── posts/           # CRUD постов, календарь, массовая загрузка
│       ├── media/           # загрузка и хранение медиафайлов
│       ├── telegram/        # webhook + polling бота, привязка каналов
│       ├── common/          # утилиты (parseTtl)
│       └── prisma/          # обёртка над PrismaClient
├── client/                  # Vite + React SPA
│   └── src/
│       ├── components/      # Navbar, Sidebar, Logo, AuthLayout, иконки
│       ├── lib/             # api-клиент, auth-context, ProtectedRoute, типы
│       └── pages/           # все страницы приложения
├── docker-compose.yml       # production: PostgreSQL + server + client
├── docker-compose.dev.yml   # development с hot-reload
└── docs/                    # план проекта и ТЗ
```

## Быстрый старт

### Требования
- Node.js 20+
- Docker + Docker Compose

### Запуск (Docker)

```bash
docker compose up --build
```

- **Сайт:** http://localhost:3080
- **API:** http://localhost:4000/api
- **PostgreSQL:** localhost:5432 (neonix/neonix_dev)

### Development (hot-reload)

```bash
docker compose -f docker-compose.dev.yml up
```

- **Сайт:** http://localhost:5173
- **API:** http://localhost:4000

## API

### Аутентификация

| Метод | Эндпоинт | Описание | Auth |
|-------|----------|----------|------|
| GET | `/api/auth/captcha` | Получить капчу (id + вопрос) | — |
| POST | `/api/auth/register` | Регистрация (с капчей) | — |
| POST | `/api/auth/login` | Вход, выдаёт access + refresh cookie | — |
| POST | `/api/auth/refresh` | Обновление access по refresh cookie | cookie |
| POST | `/api/auth/logout` | Отзыв refresh, очистка cookie | cookie |
| GET | `/api/auth/me` | Текущий пользователь (по access) | Bearer |
| POST | `/api/auth/forgot-password` | Запрос сброса пароля (отправляет email) | — |
| POST | `/api/auth/reset-password` | Сброс пароля по токену | — |

### Пользователь

| Метод | Эндпоинт | Описание | Auth |
|-------|----------|----------|------|
| GET | `/api/users/me` | Профиль пользователя | Bearer |
| PATCH | `/api/users/me` | Обновление профиля (name, email, timezone, language) | Bearer |
| POST | `/api/users/me/change-password` | Смена пароля (отзывает все токены) | Bearer |
| DELETE | `/api/users/me` | Удаление аккаунта | Bearer |
| GET | `/api/users/me/notifications` | Настройки уведомлений | Bearer |
| PATCH | `/api/users/me/notifications` | Обновление настроек уведомлений | Bearer |

### Telegram-каналы

| Метод | Эндпоинт | Описание | Auth |
|-------|----------|----------|------|
| POST | `/api/social-accounts/link` | Генерация кода привязки | Bearer |
| GET | `/api/social-accounts` | Список подключённых каналов | Bearer |
| GET | `/api/social-accounts/:id` | Информация о канале | Bearer |
| PATCH | `/api/social-accounts/:id` | Обновление канала | Bearer |
| DELETE | `/api/social-accounts/:id` | Отключение канала | Bearer |
| POST | `/api/telegram/webhook` | Webhook от Telegram Bot API | secret header |

### Посты

| Метод | Эндпоинт | Описание | Auth |
|-------|----------|----------|------|
| GET | `/api/posts` | Список постов (фильтры: from, to, socialAccountId) | Bearer |
| GET | `/api/posts/calendar?month=YYYY-MM` | Данные для календаря | Bearer |
| GET | `/api/posts/:id` | Один пост | Bearer |
| POST | `/api/posts` | Создание поста | Bearer |
| POST | `/api/posts/bulk` | Массовая загрузка постов | Bearer |
| PATCH | `/api/posts/:id` | Редактирование поста | Bearer |
| DELETE | `/api/posts/:id` | Удаление поста | Bearer |

### Медиа

| Метод | Эндпоинт | Описание | Auth |
|-------|----------|----------|------|
| POST | `/api/media/upload/:postId` | Загрузка файла (multipart) | Bearer |
| GET | `/api/media/file/:id` | Получение файла | Bearer |
| DELETE | `/api/media/:id` | Удаление файла | Bearer |

### Health

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/health` | Проверка работоспособности |

## Маршруты приложения

| Путь | Доступ | Описание |
|------|--------|----------|
| `/` | публичный | Лендинг |
| `/login` | публичный | Вход |
| `/register` | публичный | Регистрация (с капчей) |
| `/forgot-password` | публичный | Восстановление пароля |
| `/reset-password?token=...` | публичный | Установка нового пароля |
| `/help` | публичный | Помощь и FAQ |
| `/terms` | публичный | Условия использования |
| `/privacy` | публичный | Политика конфиденциальности |
| `/blog` | публичный | Блог |
| `/blog/:slug` | публичный | Статья блога |
| `/app` | защищённый | Дашборд |
| `/app/calendar` | защищённый | Календарь публикаций |
| `/app/posts/new` | защищённый | Создание поста |
| `/app/posts/:id` | защищённый | Редактирование поста |
| `/app/bulk-upload` | защищённый | Массовая загрузка |
| `/app/channels` | защищённый | Управление каналами |
| `/app/posts` | защищённый | Список постов |
| `/app/analytics` | защищённый | Аналитика |
| `/app/profile` | защищённый | Профиль |
| `/app/settings` | защищённый | Настройки уведомлений |

## Поток аутентификации

```
[Лендинг] → /register или /login
    │  GET /api/auth/captcha → ответ: { id, question }
    │  POST /api/auth/register|login → ответ: accessToken
    ▼
API возвращает accessToken (в теле) + ставит refreshToken в httpOnly cookie
    │
    ▼
Frontend сохраняет accessToken в памяти, пользователь → /app (ProtectedRoute)
    │  при 401 — авто-вызов /api/auth/refresh по cookie
    ▼
/api/users/me — данные профиля
```

## Поток привязки Telegram-канала

```
[Dashboard] → «Подключить канал»
    │  POST /api/social-accounts/link → { code, botName }
    ▼
Пользователь пишет боту: /start <code>
    │  POST /api/telegram/webhook (от Telegram)
    ▼
Бот связывает userId с chatId, просит добавить бота в канал
    │
    ▼
Пользователь добавляет бота @manager_neonix_bot админом в канал
    │  my_chat_member update → webhook
    ▼
Бот проверяет права, сохраняет канал → канал появляется в панели
```

## Календарь и посты

- **Календарь** — отображает месяц, фильтр по каналам
  - 1 пост на день → превью (заголовок + кол-во каналов)
  - Несколько постов → заголовки (до 3), остальные свёрнуты
  - Клик по дню → модальное окно со списком постов
- **Редактор поста** — заголовок, текст (Markdown), до 10 медиа, дата/время, выбор каналов
- **Массовая загрузка** — TSV-шаблон с примерами, загрузка файла, пакетная отправка

## Роли

| Роль | Описание | Лимит каналов |
|------|----------|---------------|
| `user` | Обычный пользователь | 1 |
| `admin` | Администратор | без ограничений |
| `superadmin` | Суперадминистратор | без ограничений |

## Безопасность

- **JWT access** (15 мин) хранится в памяти (не в localStorage)
- **Refresh token** в httpOnly cookie, path=/api/auth, SameSite=Lax
- **Ротация refresh** — при каждом обновлении старый токен отзывается
- **Смена пароля** — автоматически отзывает все refresh-токены
- **Капча** — математический пример при регистрации
- **Webhook secret** — проверяется через HTTP header `X-Telegram-Bot-Api-Secret-Token`
- **Валидация DTO** — class-validator с whitelist и forbidNonWhitelisted
- **Токены соцсетей** — шифруются при хранении

## Переключение на PostgreSQL (локальная разработка)

1. Установите PostgreSQL
2. В `server/.env` замените `DATABASE_URL`:
   ```
   DATABASE_URL="postgresql://user:pass@localhost:5432/neonix?schema=public"
   ```
3. `npx prisma migrate deploy`
4. `npm run start:dev`

## Roadmap

### Готово (R0) ✅
- Лендинг (Hero, фичи, тарифы, CTA)
- Регистрация / вход (JWT + капча)
- Личный кабинет
- Профиль пользователя

### Готово (R1) ✅
- Подключение Telegram-каналов через бота
- Флоу привязки: код → /start → добавление бота → автопривязка

### Готово (R2) ✅
- Редактор поста: текст (Markdown) + медиа (до 10 файлов)
- Выбор каналов, дата/время публикации

### Готово (R3) ✅
- Календарь с фильтром по каналам
- Превью постов, модальное окно дня

### Готово (R4) ✅
- Массовая загрузка постов (TSV-шаблон)
- API: CRUD постов, календарь, bulk
- Публикация через Telegram Bot API (sendMessage, sendPhoto, sendVideo, sendMediaGroup)
- Очередь публикаций с retry (3 попытки, exponential backoff)
- Email-уведомления об успешной/неуспешной публикации

### В планах
- WebSocket для статусов в реальном времени
- Аналитика (просмотры, реакции)
- Биллинг и тарифы (ЮKassa)
- Мобильная навигация (hamburger menu)

## Исправленные уязвимости (аудит)

| ID | Уровень | Описание |
|----|---------|----------|
| S-01 | CRITICAL | Webhook secret проверялся из тела, а не из HTTP header |
| S-03 | CRITICAL | CAPTCHA возвращала ответ клиенту |
| S-08 | HIGH | parseTtlSeconds дублировался с разными дефолтами (15мин vs 30дн) |
| S-18 | MEDIUM | Токены не отзывались при смене пароля |
| B-01 | MEDIUM | Бесконечный цикл retry при невалидном токене |
| B-02 | MEDIUM | UTC/local mismatch в календаре |
| B-04 | MEDIUM | socialAccountId не проверялся на принадлежность пользователю |
| B-05 | HIGH | Publication worker retry backoff игнорировался (scheduledAt не обновлялся) |
| B-06 | HIGH | sendMediaGroup отправлял caption на FormData уровне вместо первого элемента медиа |
| B-07 | MEDIUM | HTML-инъекция в email-шаблонах (user-controlled строки без escape) |
| B-08 | MEDIUM | Отсутствие проверки ownership при загрузке/удалении медиафайлов |
| B-09 | MEDIUM | Динамический import('fs') блокировал event loop в async контексте |
| B-10 | LOW | Email-уведомления о публикации не были подключены к воркеру |

## Скрипты

### Backend (`server/`)
| Команда | Действие |
|---------|----------|
| `npm run start:dev` | Запуск с hot-reload |
| `npm run build` | Сборка в `dist/` |
| `npm run start:prod` | Запуск собранного |
| `npx prisma migrate dev` | Создать/применить миграции |
| `npx prisma studio` | GUI для БД |
| `npx jest` | Запуск unit-тестов (78 тестов) |
| `npx tsc --noEmit` | Проверка типов TypeScript |

### Frontend (`client/`)
| Команда | Действие |
|---------|----------|
| `npm run dev` | Dev-сервер |
| `npm run build` | Production-сборка в `dist/` |
| `npm run preview` | Превью сборки |
