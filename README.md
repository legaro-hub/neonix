# Neonix

SaaS-платформа для планирования и автоматической публикации контента в **Telegram** и **Pinterest**.
Тёмный премиум-дизайн: графит + неоновый лайм.

> **Домен:** [neonix.online](https://neonix.online) · **Email:** no-reply@neonix.online

## Стек

| Слой | Технологии |
|------|-----------|
| Backend | Node.js 20+, NestJS 10, TypeScript, Prisma ORM |
| БД | PostgreSQL 16 |
| Auth | JWT access + refresh (httpOnly cookie), bcrypt, капча, подтверждение email |
| Frontend | React 18, TypeScript, Vite, TailwindCSS, React Router |
| Telegram | Bot API, webhook, автопривязка каналов, MTProto аналитика |
| Pinterest | OAuth 2.0, API v5 (доски, пины, аналитика, bulk-загрузка) |
| Безопасность | CSP, валидация DTO, guards, ротация refresh-токенов, rate limiting |
| Инфраструктура | Docker Compose, Caddy (reverse proxy), email (docker-mailserver) |

## Структура

```
neonix/
├── server/                  # NestJS API
│   ├── prisma/              # схема БД + миграции
│   ├── uploads/             # хранилище медиафайлов
│   └── src/
│       ├── auth/            # регистрация, вход, JWT, guards, капча, подтверждение email
│       ├── users/           # профиль пользователя, настройки
│       ├── social-accounts/ # управление каналами (Telegram + Pinterest)
│       ├── posts/           # CRUD постов, календарь, массовая загрузка, воркер публикаций
│       ├── media/           # загрузка и хранение медиафайлов (аутентифицированный доступ)
│       ├── telegram/        # webhook + polling бота, привязка каналов, MTProto
│       ├── pinterest/       # OAuth, доски, пины, аналитика, bulk-создание
│       ├── email/           # шаблоны писем ( Neonix-стиль, тёмный + лайм)
│       ├── common/          # DriverRegistry, SocialDriver interface
│       └── prisma/          # обёртка над PrismaClient
├── client/                  # Vite + React SPA
│   └── src/
│       ├── components/      # DateTimePicker, CookieBanner, Sidebar, AuthLayout
│       ├── lib/             # api-клиент, auth-context, ProtectedRoute, типы
│       └── pages/           # Dashboard, Channels, PostEditor, Calendar, Analytics, Pinterest
├── docker-compose.yml       # production: PostgreSQL + server + client + Caddy + Mailpit
├── docker-compose.dev.yml   # development с hot-reload
├── mailserver.env           # настройки почтового сервера
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

### Development (hot-reload)
```bash
docker compose -f docker-compose.dev.yml up
```
- **Сайт:** http://localhost:5173
- **API:** http://localhost:4000

## Функционал

### Telegram
- Подключение каналов через бота (автопривязка)
- Публикация текста, фото, видео, альбомов
- Планирование по календарю
- Массовая загрузка постов (TSV)
- MTProto аналитика (просмотры, реакции)
- Статистика каналов (подписчики, динамика)

### Pinterest (полная интеграция)
- OAuth-авторизация (Trial/Standard Access)
- Управление досками (CRUD, секции)
- Создание пинов (image, video, multi-image)
- Массовая загрузка пинов (до 50 за раз)
- Аналитика (показы, сохранения, клики, переходы)
- Топ пинов по метрикам

### Безопасность
- **CSP** (Content Security Policy) — защита от XSS
- **JWT** access (15мин) + refresh (30дн) с ротацией
- **Аутентифицированный доступ к медиа** — проверка ownership
- **Rate limiting** — глобальный + per-endpoint
- **Валидация DTO** — class-validator на всех входах
- **Подтверждение email** — верификация при регистрации
- **Куки-баннер** — информирование пользователей

## API

### Аутентификация
| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/auth/captcha` | Капча |
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/refresh` | Обновление токена |
| POST | `/api/auth/logout` | Выход |
| GET | `/api/auth/me` | Текущий пользователь |
| POST | `/api/auth/forgot-password` | Сброс пароля |
| POST | `/api/auth/reset-password` | Новый пароль |
| GET | `/api/auth/verify-email` | Подтверждение email |

### Посты
| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/posts` | Список постов |
| POST | `/api/posts` | Создание поста |
| POST | `/api/posts/bulk` | Массовая загрузка |
| PATCH | `/api/posts/:id` | Редактирование |
| DELETE | `/api/posts/:id` | Удаление |

### Pinterest
| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/pinterest/auth-url` | URL для OAuth |
| GET | `/api/pinterest/boards` | Список досок |
| POST | `/api/pinterest/boards` | Создать доску |
| GET | `/api/pinterest/pins` | Список пинов |
| POST | `/api/pinterest/pins` | Создать пин |
| POST | `/api/pinterest/pins/bulk` | Массовая загрузка пинов |
| GET | `/api/pinterest/analytics/account` | Аналитика аккаунта |
| GET | `/api/pinterest/analytics/pins` | Топ пинов |

## Маршруты

| Путь | Доступ | Описание |
|------|--------|----------|
| `/` | публичный | Лендинг |
| `/login`, `/register` | публичный | Авторизация |
| `/verify-email` | публичный | Подтверждение email |
| `/privacy` | публичный | Политика конфиденциальности (RU/EN) |
| `/app` | защищённый | Дашборд |
| `/app/channels` | защищённый | Каналы и аккаунты (TG + Pinterest) |
| `/app/posts/new` | защищённый | Создание поста (с TG-кнопками) |
| `/app/calendar` | защищённый | Календарь публикаций |
| `/app/analytics` | защищённый | Аналитика (Telegram + Pinterest) |

## Роли

| Роль | Лимит каналов |
|------|---------------|
| `user` | 5 |
| `admin` | без ограничений |
| `superadmin` | без ограничений |

## Инфраструктура

- **Продукт (85.137.95.223)** — Neonix: Caddy + React + NestJS + PostgreSQL
- **Почта (62.109.7.162)** — docker-mailserver: no-reply, support, info, news @neonix.online
- **DNS (Reg.ru)** — A, MX, SPF, DKIM, DMARC записи

## Деплой

```bash
# На сервере 85.137.95.223
cd /root/neonix
docker compose build
docker compose up -d
```

## Аудит безопасности

Последний аудит: 21 июня 2026.
Исправлены: CSP, аутентификация медиа, XSS в markdown renderer, CORS.

См. `docs/SECURITY_AUDIT.md` для деталей.
