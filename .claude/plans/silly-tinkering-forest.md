# Express.js Recommendation Engine Microservice - Implementation Plan

## Overview

A standalone hybrid recommendation engine microservice for the e-commerce frontend.

| Aspect | Choice |
|--------|--------|
| Location | `/home/voducchinh/github/PROJECT-NOX-CCC/recommendation-service/` |
| Language | TypeScript (strict mode) |
| Framework | Express.js + Apollo Server (GraphQL) |
| Database | PostgreSQL |
| Cache | Redis |
| Auth | API keys (service-to-service) + JWT (user context) |
| Package Manager | pnpm |
| Deployment | Docker/Docker Compose |

---

## Phase 1: Project Initialization

### Step 1.1: Create project structure

```bash
cd /home/voducchinh/github/PROJECT-NOX-CCC
mkdir -p recommendation-service/{src/{config,graphql/{schema/{typeDefs,resolvers},plugins},services/recommendation,repositories,middleware,cache,db/{migrations,seeds},types,utils,jobs},tests/{unit,integration},docker/{postgres,redis},scripts}
cd recommendation-service
```

### Step 1.2: Initialize package.json

```bash
pnpm init
```

Edit `package.json`:
```json
{
  "name": "recommendation-service",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint .",
    "test": "vitest",
    "migrate": "tsx scripts/migrate.ts",
    "seed": "tsx scripts/seed.ts"
  }
}
```

### Step 1.3: Install dependencies

```bash
# Core dependencies
pnpm add express @apollo/server graphql @graphql-tools/load-files @graphql-tools/merge pg ioredis jsonwebtoken zod pino pino-http dotenv uuid bcrypt

# Dev dependencies
pnpm add -D typescript tsx vitest @types/express @types/node @types/pg @types/jsonwebtoken @types/bcrypt @types/uuid eslint @eslint/js typescript-eslint
```

### Step 1.4: Create tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Step 1.5: Create eslint.config.mjs

```javascript
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import eslint from "@eslint/js";

export default defineConfig([
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  globalIgnores(["dist/**", "node_modules/**", "*.config.mjs"]),
]);
```

### Step 1.6: Create .env.example

```bash
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL=postgresql://recommendation:recommendation_password@localhost:5432/recommendation_db

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-jwt-secret-change-in-production
```

---

## Phase 2: Database Schema

### Step 2.1: Create migration file `src/db/migrations/001_initial_schema.sql`

```sql
-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    category_id UUID,
    price DECIMAL(10, 2) NOT NULL,
    brand VARCHAR(255),
    tags TEXT[],
    attributes JSONB DEFAULT '{}',
    image_url VARCHAR(1000),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES categories(id),
    path VARCHAR(1000),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE NOT NULL,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Interactions table (core for collaborative filtering)
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL, -- 'view', 'cart', 'purchase', 'rating', 'wishlist'
    value DECIMAL(3, 2),                   -- Rating value (1-5) or null
    weight DECIMAL(3, 2) NOT NULL DEFAULT 1.0,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- API Keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    permissions TEXT[] DEFAULT '{}',
    rate_limit INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Foreign key for products.category_id
ALTER TABLE products ADD CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id);
```

### Step 2.2: Create indexes `src/db/migrations/002_indexes.sql`

```sql
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_products_tags ON products USING GIN(tags);

CREATE INDEX idx_interactions_user ON interactions(user_id);
CREATE INDEX idx_interactions_product ON interactions(product_id);
CREATE INDEX idx_interactions_type ON interactions(interaction_type);
CREATE INDEX idx_interactions_created ON interactions(created_at DESC);
CREATE INDEX idx_interactions_user_type ON interactions(user_id, interaction_type);
```

### Step 2.3: Create similarity tables `src/db/migrations/003_similarity_tables.sql`

```sql
-- Pre-computed user similarities
CREATE TABLE user_similarities (
    user_id_a UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id_b UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    similarity_score DECIMAL(5, 4) NOT NULL,
    algorithm VARCHAR(50) NOT NULL,
    computed_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id_a, user_id_b, algorithm),
    CHECK (user_id_a < user_id_b)
);

-- Pre-computed product similarities
CREATE TABLE product_similarities (
    product_id_a UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_id_b UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    similarity_score DECIMAL(5, 4) NOT NULL,
    algorithm VARCHAR(50) NOT NULL,
    computed_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (product_id_a, product_id_b, algorithm),
    CHECK (product_id_a < product_id_b)
);

-- Product feature vectors
CREATE TABLE product_vectors (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    vector REAL[] NOT NULL,
    dimensions INTEGER NOT NULL,
    computed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_sim_a ON user_similarities(user_id_a, similarity_score DESC);
CREATE INDEX idx_product_sim_a ON product_similarities(product_id_a, similarity_score DESC);
```

---

## Phase 3: Core Infrastructure

### Step 3.1: Create `src/config/env.ts` - Environment validation

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
});

export const env = envSchema.parse(process.env);
```

### Step 3.2: Create `src/config/database.ts` - PostgreSQL pool

```typescript
import pg from 'pg';
import { env } from './env.js';

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
});
```

### Step 3.3: Create `src/config/redis.ts` - Redis client

```typescript
import Redis from 'ioredis';
import { env } from './env.js';

export const redis = new Redis(env.REDIS_URL);
```

### Step 3.4: Create `src/app.ts` - Express setup

```typescript
import express from 'express';
import { pinoHttp } from 'pino-http';
import { createCombinedAuthMiddleware } from './middleware/combined-auth.middleware.js';
import { pool } from './config/database.js';
import { env } from './config/env.js';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(pinoHttp());

  // Health check (no auth)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth middleware for GraphQL
  app.use('/graphql', createCombinedAuthMiddleware({
    db: pool,
    jwtSecret: env.JWT_SECRET,
  }));

  return app;
}
```

### Step 3.5: Create `src/index.ts` - Entry point

```typescript
import 'dotenv/config';
import { createApp } from './app.js';
import { createApolloServer } from './graphql/index.js';
import { pool } from './config/database.js';
import { redis } from './config/redis.js';
import { env } from './config/env.js';

async function main() {
  const app = createApp();
  const apolloServer = await createApolloServer({ db: pool, redis });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/graphql' });

  app.listen(env.PORT, () => {
    console.log(`Server running at http://localhost:${env.PORT}/graphql`);
  });
}

main().catch(console.error);
```

---

## Phase 4: Authentication Middleware

### Step 4.1: Create `src/middleware/api-key-auth.middleware.ts`

Validate `X-API-Key` header against hashed keys in database.

**Key logic:**
1. Extract API key from header
2. Query `api_keys` table for active, non-expired keys
3. Compare with bcrypt
4. Attach key info to request

### Step 4.2: Create `src/middleware/jwt-auth.middleware.ts`

Validate `Authorization: Bearer <token>` header.

**Key logic:**
1. Extract JWT from Authorization header
2. Verify with `jsonwebtoken`
3. Attach user info (sub, roles) to request

### Step 4.3: Create `src/middleware/combined-auth.middleware.ts`

Chain both middlewares:
- API key: Required (service auth)
- JWT: Optional (user context for personalization)

---

## Phase 5: GraphQL Schema

### Step 5.1: Create `src/graphql/schema/typeDefs/recommendation.graphql`

```graphql
scalar DateTime
scalar JSON

enum RecommendationStrategy {
  COLLABORATIVE
  CONTENT_BASED
  HYBRID
}

enum InteractionType {
  VIEW
  CART
  PURCHASE
  RATING
  WISHLIST
}

type Product {
  id: ID!
  externalId: String!
  name: String!
  price: Float!
  category: Category
  brand: String
  tags: [String!]!
}

type ProductRecommendation {
  product: Product!
  score: Float!
  rank: Int!
}

type RecommendationResult {
  recommendations: [ProductRecommendation!]!
  strategy: RecommendationStrategy!
  fromCache: Boolean!
}

type Query {
  # Personalized recommendations
  recommendations(
    userId: ID!
    limit: Int = 10
    strategy: RecommendationStrategy = HYBRID
  ): RecommendationResult!

  # Similar products
  similarProducts(productId: ID!, limit: Int = 10): [ProductRecommendation!]!

  # Trending products
  trendingProducts(categoryId: ID, limit: Int = 10): [ProductRecommendation!]!

  # Health check
  health: HealthStatus!
}

type Mutation {
  # Record user interaction
  recordInteraction(
    userId: ID!
    productId: ID!
    interactionType: InteractionType!
    value: Float
  ): Boolean!

  # Sync product from external system
  syncProduct(externalId: String!, data: JSON!): Product!

  # Sync user from external system
  syncUser(externalId: String!): User!
}
```

### Step 5.2: Create `src/graphql/index.ts` - Apollo Server setup

```typescript
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';

export async function createApolloServer(deps) {
  const typeDefs = mergeTypeDefs(loadFilesSync('./src/graphql/schema/typeDefs'));
  const resolvers = mergeResolvers(loadFilesSync('./src/graphql/schema/resolvers'));

  return new ApolloServer({
    typeDefs,
    resolvers,
  });
}
```

---

## Phase 6: Recommendation Services

### Step 6.1: Create `src/services/recommendation/collaborative-filtering.service.ts`

**Algorithm:**
1. Build user-item interaction matrix from `interactions` table
2. Weight interactions: purchase=5, cart=3, wishlist=2, view=1
3. Find similar users using cosine similarity
4. Predict scores for unseen items based on similar users' interactions
5. Cache user vectors in Redis (1 hour TTL)

**Key methods:**
- `getRecommendations(userId, limit, excludeIds)` → `ProductScore[]`
- `getUserInteractionVector(userId)` → `Map<productId, score>`
- `getSimilarUsers(userId, limit)` → `{userId, similarity}[]`

### Step 6.2: Create `src/services/recommendation/content-based-filtering.service.ts`

**Algorithm:**
1. Build product feature vectors from: category, price, brand, tags
2. Normalize vectors
3. For similar products: compute cosine similarity between vectors
4. For user recommendations: build user preference profile from interaction history, match against products
5. Cache product vectors in Redis (24 hour TTL)

**Key methods:**
- `getSimilarProducts(productId, limit)` → `ProductScore[]`
- `getRecommendationsForUser(userId, limit)` → `ProductScore[]`
- `buildUserPreferenceProfile(userId)` → `number[]`

### Step 6.3: Create `src/services/recommendation/hybrid-scoring.service.ts`

**Algorithm:**
1. Check user interaction count
2. If < 5 interactions (cold start): use content-based + popular items
3. If >= 5 interactions: combine collaborative (60%) + content-based (40%)
4. Apply consensus boost (1.1x) for items appearing in both lists
5. Normalize final scores to 0-1 range

**Key methods:**
- `getRecommendations(userId, limit, filters?)` → `RecommendationResult`
- `getHybridRecommendations(userId, limit, excludeIds, interactionCount)`
- `getColdStartRecommendations(userId, limit, excludeIds)`

### Step 6.4: Create `src/services/recommendation/trending.service.ts`

**Algorithm:**
1. Query recent interactions (last 7 days)
2. Score by interaction count and recency
3. Group by product, sum weighted scores
4. Cache results (15 min TTL)

---

## Phase 7: Caching Strategy

### Cache Keys

| Pattern | Purpose | TTL |
|---------|---------|-----|
| `rec:hybrid:{userId}:{limit}` | User recommendations | 1 hour |
| `rec:similar:{productId}` | Similar products | 24 hours |
| `rec:trending:{categoryId}` | Trending products | 15 min |
| `user:{userId}:vector` | User interaction vector | 1 hour |
| `product:{productId}:vector` | Product feature vector | 24 hours |

### Invalidation

- On new interaction: invalidate `rec:hybrid:{userId}:*` and `user:{userId}:vector`
- On product update: invalidate `rec:similar:{productId}` and `product:{productId}:vector`

---

## Phase 8: Docker Setup

### Step 8.1: Create `Dockerfile`

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
RUN pnpm prune --prod

FROM node:22-alpine
WORKDIR /app
RUN adduser --system recommendation
COPY --from=builder --chown=recommendation /app/dist ./dist
COPY --from=builder --chown=recommendation /app/node_modules ./node_modules
COPY --from=builder --chown=recommendation /app/package.json ./
USER recommendation
ENV NODE_ENV=production PORT=4000
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

### Step 8.2: Create `docker-compose.yml`

```yaml
version: '3.8'
services:
  recommendation-service:
    build: .
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://recommendation:password@postgres:5432/recommendation_db
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=recommendation
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=recommendation_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## Phase 9: Testing & Verification

### Step 9.1: Start services

```bash
docker-compose up -d postgres redis
pnpm run migrate
pnpm run dev
```

### Step 9.2: Test health endpoint

```bash
curl http://localhost:4000/health
```

### Step 9.3: Test GraphQL

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"query": "{ health { status } }"}'
```

### Step 9.4: Test recommendations

```graphql
query {
  recommendations(userId: "user-123", limit: 5) {
    recommendations {
      product { id name price }
      score
      rank
    }
    strategy
    fromCache
  }
}
```

---

## File Summary

| File | Purpose |
|------|---------|
| `src/index.ts` | Entry point |
| `src/app.ts` | Express setup |
| `src/config/env.ts` | Environment validation |
| `src/config/database.ts` | PostgreSQL connection |
| `src/config/redis.ts` | Redis connection |
| `src/middleware/api-key-auth.middleware.ts` | API key auth |
| `src/middleware/jwt-auth.middleware.ts` | JWT auth |
| `src/graphql/index.ts` | Apollo Server |
| `src/graphql/schema/typeDefs/*.graphql` | GraphQL types |
| `src/graphql/schema/resolvers/*.ts` | GraphQL resolvers |
| `src/services/recommendation/collaborative-filtering.service.ts` | CF algorithm |
| `src/services/recommendation/content-based-filtering.service.ts` | CB algorithm |
| `src/services/recommendation/hybrid-scoring.service.ts` | Hybrid scoring |
| `src/db/migrations/*.sql` | Database schema |
| `Dockerfile` | Container build |
| `docker-compose.yml` | Local dev stack |
