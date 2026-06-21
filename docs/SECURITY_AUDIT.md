# Аудит безопасности Neonix

> Дата: 21 июня 2026 · Аудитор: MiMo Code Agent

## Исправленные уязвимости

| ID | Уровень | Описание | Статус |
|----|---------|----------|--------|
| S-01 | HIGH | `GET /api/media/file/:id` — неаутентифицированный доступ к медиа | ✅ Исправлено |
| S-02 | HIGH | XSS в markdown renderer — кавычки не экранировались в URL | ✅ Исправлено |
| S-03 | MEDIUM | CSP отключён (`contentSecurityPolicy: false`) | ✅ Исправлено |
| S-04 | MEDIUM | CORS включал HTTP для production | ✅ Исправлено |
| S-05 | LOW | PostgreSQL порт открыт на все интерфейсы в dev | ✅ Исправлено |

## Исправлено в коде

### 1. Media Controller — аутентификация + ownership
- `GET /api/media/file/:id` теперь требует JWT
- Проверяется `userId` владельца поста

### 2. XSS — markdown renderer
- Экранирование `"` и `'` в URL ссылок
- Защита от атрибутных инъекций

### 3. Content Security Policy
- Включён через Helmet
- Директивы: `self` для scripts, `unsafe-inline` для стилей
- `frame-src: none`, `object-src: none`

### 4. CORS
- Убран `http://neonix.online` из production
- Оставлен только `https://neonix.online`

### 5. PostgreSQL port
- Ограничен `127.0.0.1:5432:5432` в dev

## Оставшиеся рекомендации (LOW priority)

1. Ротация Telegram bot token, SMTP пароля
2. Обновление xlsx (SheetJS) до последней версии
3. Account lockout после N неудачных попыток входа
4. Очистка отозванных refresh-токенов из БД
5. Ограничение `collectAll` для admin-only
