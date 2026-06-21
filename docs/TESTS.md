# Тесты — Neonix

> 79 unit-тестов / 6 suites · Jest + ts-jest
> Запуск: `npx jest` (из папки `server/`)

---

## Обзор покрытия

| Модуль | Тестов | Статус |
|--------|--------|--------|
| Auth / CaptchaService | 6 | ✅ |
| Common / parseTtlSeconds | 7 | ✅ |
| Email / EmailService | 7 | ✅ |
| Posts / PostsService | 15 | ✅ |
| SocialAccounts / SocialAccountsService | 24 | ✅ |
| Users / UsersService | 20 | ✅ |
| **Итого** | **79** | |

Не покрыты: `PublicationWorkerService`, `TelegramController`, `TelegramPollingService`, `AuthService` (register/login/refresh — сложные зависимости от JWT/bcrypt).

---

## Auth / CaptchaService

**Файл:** `src/auth/__tests__/captcha.service.spec.ts`

| # | Тест | Что проверяет |
|---|------|---------------|
| 1 | `should return id and question` | `generate()` возвращает `{ id, question }` с математическим примером |
| 2 | `should generate unique ids` | 100 генераций → 100 уникальных id |
| 3 | `should verify correct answer` | Парсит пример из question, вычисляет ответ, `verify()` возвращает `true` |
| 4 | `should reject wrong answer` | Неверный ответ → `false` |
| 5 | `should reject invalid id` | Несуществующий id → `false` |
| 6 | `should be single-use` | Повторный `verify()` после успешного → `false` |

---

## Common / parseTtlSeconds

**Файл:** `src/common/__tests__/parse-ttl.spec.ts`

| # | Тест | Что проверяет |
|---|------|---------------|
| 1 | `should parse seconds` | `'30s'` → `30` |
| 2 | `should parse minutes` | `'15m'` → `900` |
| 3 | `should parse hours` | `'2h'` → `7200` |
| 4 | `should parse days` | `'7d'` → `604800` |
| 5 | `should return default for invalid input` | `'invalid'`, `''`, `'abc'` → `900` (дефолт) |
| 6 | `should use custom default` | `'invalid'` с кастомным дефолтом `3600` → `3600` |
| 7 | `should handle whitespace` | `' 15m '` → `900` (тримминг) |

---

## Email / EmailService

**Файл:** `src/email/__tests__/email.service.spec.ts`

| # | Тест | Что проверяет |
|---|------|---------------|
| 1 | `sendWelcome — not throw` | Без SMTP — не бросает исключение |
| 2 | `sendPasswordReset — not throw` | Без SMTP — не бросает исключение |
| 3 | `sendPublicationSuccess — not throw` | Без SMTP — не бросает исключение |
| 4 | `sendPublicationFailed — not throw` | Без SMTP — не бросает исключение |
| 5 | `sendDigest — not throw` | Без SMTP — не бросает исключение |
| 6 | `sendInvoice — not throw` | Без SMTP — не бросает исключение |

Все тесты проверяют graceful fallback: если SMTP не настроен, методы логируют в консоль и не падают.

---

## Posts / PostsService

**Файл:** `src/posts/__tests__/posts.service.spec.ts`

| # | Тест | Что проверяет |
|---|------|---------------|
| **list** | | |
| 1 | `should return posts for user` | Возвращает посты по `userId` |
| 2 | `should filter by date range` | Фильтр `from/to` → `scheduledAt.gte/lte` |
| 3 | `should filter by socialAccountId` | Фильтр по каналу → `publications.some` |
| **getOne** | | |
| 4 | `should return a post by id and userId` | Поиск по `id + userId` |
| 5 | `should throw NotFoundException` | Несуществующий пост → 404 |
| 6 | `should not return other users posts` | `userId` другого пользователя → 404 |
| **create** | | |
| 7 | `should create a post with body only` | Черновик: `status: 'draft'`, нет публикаций |
| 8 | `should create a scheduled post` | С `scheduledAt`: `status: 'scheduled'`, публикации `queued` |
| 9 | `should throw if body empty and no channels` | Запланированный пост без текста и каналов → 400 |
| 10 | `should throw if channels not owned` | Каналы другого пользователя → 400 |
| **update** | | |
| 11 | `should update post fields` | Обновление `body` |
| 12 | `should throw if post not found` | Несуществующий пост → 404 |
| 13 | `should update socialAccountIds` | Транзакция `deleteMany + createMany` для каналов |
| 14 | `should throw if updated channels not owned` | Новые каналы другого пользователя → 400 |
| **delete** | | |
| 15 | `should delete a post` | Удаление по `id` |
| 16 | `should throw if post not found` | Несуществующий пост → 404 |
| 17 | `should not delete other users posts` | `userId` другого → 404 |
| **getCalendar** | | |
| 18 | `should return posts for a given month` | Фильтр по `scheduledAt` в диапазоне месяца |
| **createBulk** | | |
| 19 | `should create multiple posts` | Маппинг `channelTitles` → `socialAccountIds`, создание постов |
| 20 | `should return error for unmatched channels` | Не найденные каналы → `{ error: ... }` |

---

## SocialAccounts / SocialAccountsService

**Файл:** `src/social-accounts/__tests__/social-accounts.service.spec.ts`

| # | Тест | Что проверяет |
|---|------|---------------|
| **generateLinkCode** | | |
| 1 | `should generate a link code` | Возвращает `{ code, botName, expiresAt }` |
| 2 | `should generate unique codes` | 20 генераций → 20 уникальных кодов |
| 3 | `should throw if too many active codes` | 5+ активных кодов → 400 |
| **validateLinkCode** | | |
| 4 | `should validate correct code` | Валидный код → `{ userId }` |
| 5 | `should return null for invalid code` | Неверный код → `null` |
| 6 | `should be single-use` | Повторная валидация → `null` |
| 7 | `should be case-insensitive` | Код в нижнем регистре → работает |
| **addChannel** | | |
| 8 | `should create a new channel` | Создание нового канала |
| 9 | `should re-activate existing channel` | Тот же `externalId` + тот же `userId` → обновление |
| 10 | `should throw if channel belongs to another user` | `externalId` занят → 400 |
| 11 | `should enforce channel limit` | Лимит 1 канал для `user` → 400 |
| 12 | `should not enforce limit for admins` | `role: 'admin'` → без лимита |
| 13 | `should throw if user not found` | Несуществующий пользователь → 404 |
| **CRUD** | | |
| 14 | `listChannels — return channels` | Список каналов пользователя |
| 15 | `getChannel — return by id` | Получение канала по `id + userId` |
| 16 | `getChannel — throw if not found` | Несуществующий канал → 404 |
| 17 | `updateChannel — update title` | Обновление `title` и `username` |
| 18 | `updateChannel — throw if not found` | Несуществующий канал → 404 |
| 19 | `removeChannel — revoke` | `status: 'revoked'` |
| 20 | `removeChannel — throw if not found` | Несуществующий канал → 404 |
| **Pending Links** | | |
| 21 | `storePendingLink — by chatId` | Сохранение и поиск по `chatId` |
| 22 | `storePendingLink — by telegramUserId` | Сохранение и поиск по `telegramUserId` |
| 23 | `clearPendingLink — remove` | Удаление pending link |
| **Revoke** | | |
| 24 | `revokeByExternalId` | `updateMany` по `externalId` → `status: 'revoked'` |

---

## Users / UsersService

**Файл:** `src/users/__tests__/users.service.spec.ts`

| # | Тест | Что проверяет |
|---|------|---------------|
| **getMe** | | |
| 1 | `should return profile with channelsCount` | Профиль + подсчёт каналов |
| 2 | `should throw if user not found` | Несуществующий пользователь → 404 |
| **updateMe** | | |
| 3 | `should update profile fields` | Обновление `name`, `email`, `timezone`, `language` |
| 4 | `should lowercase email` | `TEST@TEST.COM` → `test@test.com` |
| 5 | `should throw if email taken` | Email занят другим → 400 |
| 6 | `should allow keeping own email` | Свой email → ОК |
| **changePassword** | | |
| 7 | `should change password` | Хэш нового пароля + отзыв всех refresh-токенов |
| 8 | `should throw if wrong password` | Неверный текущий пароль → 400 |
| 9 | `should throw if user not found` | Несуществующий пользователь → 404 |
| **deleteMe** | | |
| 10 | `should delete user` | Каскадное удаление |
| **Notifications** | | |
| 11 | `getNotifications — return existing` | Возврат существующих настроек |
| 12 | `getNotifications — create defaults` | Автосоздание при отсутствии |
| 13 | `updateNotifications — upsert` | Upsert настроек |
| 14 | `updateNotifications — skip undefined` | `undefined` значения не отправляются в запрос |

---

## Как запускать

```bash
cd server/

# Все тесты
npx jest

# Один модуль
npx jest src/posts

# С verbose
npx jest --verbose

# С coverage
npx jest --coverage
```
