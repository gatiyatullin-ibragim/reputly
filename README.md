# RepMonitor — Репутационный мониторинг для бизнеса

SaaS-платформа для мониторинга отзывов с Google Maps, 2GIS, Яндекс.Карты.  
AI-генерация ответов + Telegram уведомления + аналитика.

## Стек

- **Frontend:** React 18 + Vite + Tailwind CSS + Zustand + TanStack Query + Recharts
- **Backend:** Node.js + Express.js + MongoDB (Mongoose) + JWT
- **AI:** OpenAI GPT-4o-mini
- **Парсинг:** Playwright (Google) + Axios (2GIS API)
- **Фоновые задачи:** node-cron

---

## Быстрый старт

### 1. Клонировать и установить зависимости

```bash
git clone <repo>
cd reputly
npm run install:all
```

### 2. Настроить переменные окружения

```bash
cp server/.env.example server/.env
# Отредактируй server/.env — заполни все поля
```

Что нужно заполнить:
- `MONGODB_URI` — строка подключения MongoDB Atlas (бесплатно на cloud.mongodb.com)
- `JWT_SECRET` и `JWT_REFRESH_SECRET` — любые длинные случайные строки
- `OPENAI_API_KEY` — ключ от platform.openai.com
- `TELEGRAM_BOT_TOKEN` — создай бота через @BotFather в Telegram

### 3. Запустить в режиме разработки

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:5000
- API docs: http://localhost:5000/api/health

---

## Структура проекта

```
repmonitor/
├── client/                  # React приложение (Vite)
│   └── src/
│       ├── api/             # Axios + API вызовы
│       ├── components/      # UI компоненты
│       ├── pages/           # Страницы
│       └── store/           # Zustand стейт
│
└── server/                  # Node.js + Express
    └── src/
        ├── config/          # БД подключение
        ├── controllers/     # Обработчики роутов
        ├── jobs/            # Cron задачи
        ├── middleware/      # Auth и др.
        ├── models/          # Mongoose схемы
        ├── routes/          # Express роуты
        └── services/        # AI, Telegram, парсеры
```

---

## API эндпоинты

### Auth
```
POST /api/auth/register    — регистрация
POST /api/auth/login       — вход
POST /api/auth/refresh     — обновить токен
POST /api/auth/logout      — выход
GET  /api/auth/me          — текущий пользователь
```

### Businesses
```
GET    /api/businesses     — список бизнесов
POST   /api/businesses     — создать бизнес
PATCH  /api/businesses/:id — обновить
DELETE /api/businesses/:id — удалить
```

### Locations
```
GET    /api/locations         — список точек
POST   /api/locations         — добавить точку
POST   /api/locations/:id/sync — запустить синхронизацию
DELETE /api/locations/:id     — удалить
```

### Reviews
```
GET   /api/reviews              — список отзывов (filter, page, platform, sentiment)
GET   /api/reviews/:id          — один отзыв
POST  /api/reviews/:id/generate — сгенерировать AI ответ
PATCH /api/reviews/:id/reply    — отметить как отвеченный
```

### Analytics
```
GET /api/analytics/dashboard — статистика дашборда
```

---

## Парсер Google Maps

Для парсинга Google нужен Playwright:

```bash
cd server
npm install playwright-core
npx playwright install chromium
```

**Рекомендация для продакшна:** используй [Google Places API](https://developers.google.com/maps/documentation/places/web-service) — стабильнее, ~$2 за 1000 запросов.

---

## Деплой

### Railway (проще всего)
```bash
npm i -g @railway/cli
railway login && railway init && railway up
```

### VPS (Timeweb, REG.RU)
```bash
# На сервере
npm i -g pm2
pm2 start server/index.js --name repmonitor
pm2 save && pm2 startup
```

---

## Тарифные планы

| Тариф    | Цена/мес  | Точек | AI ответов |
|----------|-----------|-------|------------|
| START    | 2 990 ₽   | 1     | 20         |
| BUSINESS | 6 990 ₽   | 5     | 100        |
| PRO      | 14 990 ₽  | 20    | 500        |

---

## Переменные окружения

| Переменная           | Описание                          |
|----------------------|-----------------------------------|
| `PORT`               | Порт сервера (default: 5000)      |
| `MONGODB_URI`        | Строка подключения MongoDB        |
| `JWT_SECRET`         | Секрет для access токенов         |
| `JWT_REFRESH_SECRET` | Секрет для refresh токенов        |
| `OPENAI_API_KEY`     | Ключ OpenAI API                   |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота               |
| `CLIENT_URL`         | URL фронтенда                     |
