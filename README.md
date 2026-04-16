# PROJECT-NOX-CCC

Monorepo for a fashion e-commerce application with:

- `recommendation_server`: Express + TypeScript + TypeORM + MySQL/MariaDB backend
- `recommendation_client`: Next.js frontend

## Prerequisites

- Node.js 20+
- npm
- MySQL 8+ or MariaDB

## Project Structure

```text
PROJECT-NOX-CCC/
├── recommendation_server/
└── recommendation_client/
```

## 1. Backend Setup

Open a terminal in [recommendation_server](/home/voducchinh/github/PROJECT-NOX-CCC/recommendation_server).

### Install dependencies

```bash
npm install
```

### Create `.env`

Use a real `.env` file in `recommendation_server` with at least:

```env
# app
PORT=5000

# database
DATABASE_TYPE=mariadb
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=project-ccc

# jwt
JWT_SECRET=your_access_secret
REFRESH_SECRET=your_refresh_secret
ACCESS_EXPIRES_IN=1h
REFRESH_EXPIRES_IN=5d

# cloudinary
CLOUD_NAME=your_cloud_name
CLOUD_KEY=your_cloud_key
CLOUD_SECRET=your_cloud_secret
CLOUDINARY_PRODUCT_IMAGES_FOLDER=products

# MoMo Sandbox Config
MOMO_PARTNER_CODE=
MOMO_ACCESS_KEY=
MOMO_SECRET_KEY=
MOMO_ENDPOINT=
MOMO_REDIRECT_URL=
MOMO_IPN_URL=

# Telegram Bot
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Gemini Chatbot
GEMINI_API_KEY=
# Optional fallback alias supported by the SDK/server loader.
GOOGLE_API_KEY=
GEMINI_MODEL=
GEMINI_EMBEDDING_MODEL=

GEMINI_EMBEDDING_OUTPUT_DIMENSIONALITY=
GEMINI_BASE_URL=
GEMINI_CHATBOT_INSTRUCTIONS=
GEMINI_STOREFRONT_SEARCH_ENABLED=
GEMINI_STOREFRONT_SEARCH_TIMEOUT_MS=
GEMINI_STOREFRONT_SEARCH_MIN_CONFIDENCE=

# Recommendation System
RECOMMENDATION_ENGINE=
RECOMMENDATION_MODEL_PATH=
RECOMMENDATION_PIPELINE_SCHEDULER_ENABLED=
RECOMMENDATION_PIPELINE_REFRESH_INTERVAL_MINUTES=
RECOMMENDATION_PIPELINE_RUN_ON_START=
RECOMMENDATION_PIPELINE_LOOKBACK_DAYS=
RECOMMENDATION_PIPELINE_TOP_K=
RECOMMENDATION_PIPELINE_TOP_N=
RECOMMENDATION_PIPELINE_TTL_HOURS=
RECOMMENDATION_PIPELINE_ALGORITHM=

```

Notes:

- The backend also accepts `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET`.
- `DB_HOST` and `DB_PORT` must be real values. Placeholders like `....` will fail.
- Set `DATABASE_TYPE=mariadb` when the server is MariaDB. Use `mysql` only for MySQL servers.
- Product image uploads now use Cloudinary by default. `CLOUDINARY_PRODUCT_IMAGES_FOLDER` controls the product image folder prefix.

### Create the database

Run this in MySQL if the database does not already exist:

```sql
CREATE DATABASE IF NOT EXISTS `project-ccc`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### Run migrations

```bash
npm run migration:run
```

### Inspect schema drift

```bash
npm run schema:drift
```

### Seed data

Run the seed scripts in this order:

```bash
npm run seed
npm run seed:ecommerce
```

### Run the backend in development

```bash
npm run dev
```

Backend base URL:

```text
http://localhost:5000
```

### Build and run the backend in production mode

```bash
npm run build
npm run start
```

## 2. Frontend Setup

Open a second terminal in [recommendation_client](/home/voducchinh/github/PROJECT-NOX-CCC/recommendation_client).

### Install dependencies

```bash
npm install
```

### Optional frontend `.env.local`

Create `recommendation_client/.env.local` if you want to point the client at a custom backend:

```env
NEXT_PUBLIC_API_BASE=http://localhost:5000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

If omitted, the client already defaults to those local URLs.

### Run the frontend in development

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

### Build and run the frontend in production mode

```bash
npm run build
npm run start
```

## 3. Recommended Local Startup Order

From `recommendation_server`:

```bash
npm install
npm run migration:run
npm run seed
npm run seed:ecommerce
npm run dev
```

From `recommendation_client`:

```bash
npm install
npm run dev
```

Then open:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:5000
```

## 4. Useful Commands

### Backend

```bash
npm run migration:run
npm run migration:revert
npm run build
npm test
```

### Frontend

```bash
npm run build
npm run lint
npm run test:e2e
```

## 5. Troubleshooting

### `getaddrinfo ENOTFOUND`

Your `DB_HOST` is not a real hostname. Use something like:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
```

### `Unknown database`

Create the database first:

```sql
CREATE DATABASE `project-ccc`;
```

### Migration succeeds but seed fails

Use the exact error output. Most seed failures are data-shape or uniqueness issues and can be fixed in the seed script without resetting the schema.
