# AI/Recommendation Module - Clean Architecture Implementation

This module implements a recommendation system following **Clean Architecture** (Uncle Bob), **Hexagonal Architecture** (Ports and Adapters), and **Domain-Driven Design** principles.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Directory Structure](#directory-structure)
- [Layer Responsibilities](#layer-responsibilities)
- [Dependency Flow](#dependency-flow)
- [Key Design Patterns](#key-design-patterns)
- [API Endpoints](#api-endpoints)
- [ML Pipeline](#ml-pipeline)
- [Offline Evaluation](#offline-evaluation)
- [Testing Strategy](#testing-strategy)
- [Future Enhancements](#future-enhancements)

---

## Architecture Overview

This module demonstrates **Clean Architecture** principles by separating concerns into distinct layers:

```
┌─────────────────────────────────────────────────────┐
│            Presentation Layer                       │
│  (Controllers - HTTP/REST concerns)                 │
└──────────────▲──────────────────────────────────────┘
               │
┌──────────────┴──────────────────────────────────────┐
│           Application Layer                         │
│  (Use Cases - orchestration logic)                  │
└──────────────▲──────────────────────────────────────┘
               │
┌──────────────┴──────────────────────────────────────┐
│             Domain Layer                            │
│  (Entities, Value Objects, Interfaces)              │
│  - NO infrastructure dependencies                   │
│  - Pure business logic                              │
└──────────────▲──────────────────────────────────────┘
               │
┌──────────────┴──────────────────────────────────────┐
│         Infrastructure Layer                        │
│  (Repositories, ML Engines, External Services)      │
│  - Implements domain interfaces                     │
│  - Contains framework/library code                  │
└─────────────────────────────────────────────────────┘
```

### Why Clean Architecture?

✅ **Testability**: Business logic can be tested without databases or HTTP
✅ **Flexibility**: Swap ML models, databases, or frameworks easily
✅ **Maintainability**: Clear separation of concerns
✅ **Independence**: Domain logic is framework-agnostic

---

## Directory Structure

```
src/modules/ai/
├── domain/                         # Core business logic (no dependencies)
│   ├── entities/                   # Pure domain entities
│   │   ├── Recommendation.ts       # Recommendation with business rules
│   │   └── UserPreference.ts       # User preference model
│   ├── value-objects/              # Immutable value objects
│   │   ├── RecommendationScore.ts  # Score with validation
│   │   └── UserId.ts               # Type-safe user ID
│   ├── repositories/               # Repository interfaces (PORTS)
│   │   ├── IRecommendationRepository.ts
│   │   ├── IUserBehaviorRepository.ts
│   │   └── IProductFeatureRepository.ts
│   └── services/                   # Domain service interfaces
│       └── IRecommendationEngine.ts # ML engine contract
│
├── application/                    # Use cases (orchestration)
│   ├── use-cases/
│   │   ├── GetRecommendationsUseCase.ts  # Main recommendation logic
│   │   └── TrackUserBehaviorUseCase.ts   # Behavior tracking
│   └── dto/                        # Data transfer objects
│       ├── GetRecommendationsRequest.ts
│       └── GetRecommendationsResponse.ts
│
├── infrastructure/                 # External concerns (ADAPTERS)
│   ├── repositories/               # TypeORM implementations
│   │   ├── TypeORMRecommendationRepository.ts
│   │   ├── TypeORMUserBehaviorRepository.ts
│   │   └── TypeORMProductFeatureRepository.ts
│   └── ml-engines/                 # ML model implementations
│       ├── ContentBasedEngine.ts   # Feature similarity algorithm
│       ├── CollaborativeFilteringEngine.ts  # (TODO)
│       └── HybridEngine.ts         # (TODO)
│
├── presentation/                   # Controllers (HTTP layer)
│   └── RecommendationController.ts
│
└── di/                             # Dependency injection
    └── container.ts                # Wires up dependencies
```

---

## Layer Responsibilities

### 1. Domain Layer (Core)

**Location**: `src/modules/ai/domain/`

**Responsibilities**:
- Define business entities and value objects
- Define repository and service interfaces (ports)
- Contain business rules and domain logic
- **ZERO dependencies** on infrastructure

**Example - Value Object**:
```typescript
// RecommendationScore.ts - Enforces domain constraints
export class RecommendationScore {
  private readonly value: number;

  static create(value: number): RecommendationScore {
    if (value < 0 || value > 1) {
      throw new Error(`Invalid score: ${value}`);
    }
    return new RecommendationScore(value);
  }

  isAboveThreshold(threshold: number): boolean {
    return this.value >= threshold;
  }
}
```

**Example - Repository Interface (Port)**:
```typescript
// IRecommendationRepository.ts - Contract, not implementation
export interface IRecommendationRepository {
  findByUserId(userId: number): Promise<Recommendation[]>;
  save(userId: number, recommendations: Recommendation[]): Promise<void>;
  hasFreshRecommendations(userId: number, maxAge: number): Promise<boolean>;
}
```

### 2. Application Layer (Use Cases)

**Location**: `src/modules/ai/application/`

**Responsibilities**:
- Orchestrate business workflows
- Depend ONLY on domain interfaces (not implementations)
- Coordinate repositories and services
- Transform DTOs to domain entities

**Example - Use Case**:
```typescript
export class GetRecommendationsUseCase {
  constructor(
    private readonly recommendationRepo: IRecommendationRepository,
    private readonly behaviorRepo: IUserBehaviorRepository,
    private readonly productRepo: IProductFeatureRepository,
    private readonly mlEngine: IRecommendationEngine
  ) {}

  async execute(request: GetRecommendationsRequestDTO) {
    // 1. Check cache
    const hasFreshCache = await this.recommendationRepo.hasFreshRecommendations(...);

    // 2. Get user preferences from behavior
    const userPrefs = await this.behaviorRepo.deriveUserPreferences(userId);

    // 3. Generate recommendations using ML
    const recommendations = await this.mlEngine.generateRecommendations(...);

    // 4. Cache results
    await this.recommendationRepo.save(userId, recommendations);

    return recommendations;
  }
}
```

### 3. Infrastructure Layer (Adapters)

**Location**: `src/modules/ai/infrastructure/`

**Responsibilities**:
- Implement domain interfaces
- Handle TypeORM, database queries
- Integrate with ML models, external APIs
- Map between domain entities and persistence models

**Example - Repository Adapter**:
```typescript
export class TypeORMRecommendationRepository implements IRecommendationRepository {
  private repository: Repository<RecommendationCache>;

  async findByUserId(userId: number): Promise<Recommendation[]> {
    const cacheEntries = await this.repository.find({ where: { user_id: userId } });

    // Map ORM entities to domain entities
    return cacheEntries.map(entry => Recommendation.create(...));
  }
}
```

**Example - ML Engine Adapter**:
```typescript
export class ContentBasedEngine implements IRecommendationEngine {
  async generateRecommendations(...): Promise<Recommendation[]> {
    // Content-based filtering algorithm
    const scoredProducts = productFeatures.map(product => {
      const score = this.calculateContentScore(product, userPreference);
      return Recommendation.create(product.id, score, reason);
    });

    return scoredProducts.sort(...).slice(0, limit);
  }
}
```

### 4. Presentation Layer (Controllers)

**Location**: `src/modules/ai/presentation/`

**Responsibilities**:
- Handle HTTP requests/responses
- Validate input
- Delegate to use cases
- Map domain responses to HTTP responses

**Example**:
```typescript
export class RecommendationController {
  async getRecommendations(req: Request, res: Response) {
    const userId = parseInt(req.params.userId);

    // Get use case from DI container
    const useCase = container.getRecommendationsUseCase();

    // Execute use case
    const result = await useCase.execute({ userId, ... });

    return successResponse(res, StatusCode.OK, result);
  }
}
```

---

## Dependency Flow

**Dependency Rule**: Dependencies point INWARD only.

```
Presentation Layer
       ↓ depends on
Application Layer (Use Cases)
       ↓ depends on
Domain Layer (Interfaces)
       ↑ implemented by

---

## Offline Evaluation

To support thesis reporting and model comparison, the recommendation baseline now includes an
offline evaluation step.

### Available script

```bash
npm run evaluate:recommendation-baseline
```

### What it does

- Loads the exported recommendation dataset CSV
- Loads the baseline collaborative model JSON
- Splits each eligible user into:
  - training interactions
  - holdout interactions (latest interactions)
- Rebuilds top-K recommendations from `similarItemsByProduct`
- Computes ranking metrics

### Reported metrics

- `Precision@K`: among recommended items, how many are actually relevant
- `Recall@K`: among held-out relevant items, how many are recovered
- `HitRate@K`: percentage of evaluated users receiving at least one correct recommendation
- `MRR@K`: how early the first correct recommendation appears
- `Coverage@K`: how much of the catalog appears in recommendations

### Example

```bash
npm run export:recommendation-dataset
npm run train:recommendation-baseline
npm run evaluate:recommendation-baseline -- --top-k=10 --holdout-count=1
```

The evaluation result is written to:

```text
exports/recommendation-evaluation.json
```

### Suggested thesis interpretation

- If `HitRate@K` is acceptable but `Coverage@K` is low:
  the system is relevant but not diverse enough.
- If `Coverage@K` is high but `Precision@K` is low:
  the system explores widely but recommends too much noise.
- If `MRR@K` is high:
  relevant products appear early, improving practical user experience.
Infrastructure Layer

---

## ML Pipeline

The project now supports an end-to-end offline recommendation pipeline:

1. Export interaction data from `user_behavior_logs`
2. Train an offline baseline model from CSV
3. Precompute personalized recommendations into `recommendation_cache`
4. Serve recommendations through the existing API

### Commands

Export training dataset:

```bash
npm run export:recommendation-dataset
```

Train the baseline model:

```bash
npm run train:recommendation-baseline
```

Precompute cache into the database:

```bash
npm run precompute:recommendation-cache
```

Run the full refresh pipeline in one command:

```bash
npm run refresh:recommendation-pipeline
```

Enable automatic periodic refresh inside the backend process:

```bash
RECOMMENDATION_PIPELINE_SCHEDULER_ENABLED=true
RECOMMENDATION_PIPELINE_REFRESH_INTERVAL_MINUTES=360
RECOMMENDATION_PIPELINE_RUN_ON_START=true
```

### Useful Flags

```bash
npm run refresh:recommendation-pipeline -- --days=90 --top-k=30 --top-n=12 --ttl-hours=12
```

- `--days`: dataset lookback window
- `--dataset-out`: custom CSV output path
- `--model-out`: custom model JSON output path
- `--summary-out`: custom cache summary output path
- `--top-k`: number of similar items per product
- `--top-n`: number of recommendations per user
- `--ttl-hours`: recommendation cache lifetime
- `--algorithm`: cache algorithm tag, default `offline_model`

### Scheduler Environment Variables

- `RECOMMENDATION_PIPELINE_SCHEDULER_ENABLED`: enable/disable in-process scheduler
- `RECOMMENDATION_PIPELINE_REFRESH_INTERVAL_MINUTES`: refresh interval in minutes
- `RECOMMENDATION_PIPELINE_RUN_ON_START`: run one refresh immediately after server boot
- `RECOMMENDATION_PIPELINE_LOOKBACK_DAYS`: dataset export lookback window
- `RECOMMENDATION_PIPELINE_TOP_K`: similar-item count during training
- `RECOMMENDATION_PIPELINE_TOP_N`: recommendation count per user
- `RECOMMENDATION_PIPELINE_TTL_HOURS`: cache TTL for precomputed recommendations
- `RECOMMENDATION_PIPELINE_ALGORITHM`: algorithm tag stored in `recommendation_cache`

### Serving From the Offline Model

To serve recommendations directly from the offline model artifact instead of the content-based engine:

```bash
RECOMMENDATION_ENGINE=offline_model
RECOMMENDATION_MODEL_PATH=exports/recommendation-baseline-model.json
```

This gives the project two valid runtime modes:

- `content_based`: heuristic/content-based fallback
- `offline_model`: ML-style offline artifact inference
```

### Dependency Injection

The DI container (`src/modules/ai/di/container.ts`) is the ONLY place that knows about concrete implementations:

```typescript
export class AIModuleContainer {
  getRecommendationsUseCase(): GetRecommendationsUseCase {
    return new GetRecommendationsUseCase(
      this.getRecommendationRepository(),  // Inject IRecommendationRepository
      this.getUserBehaviorRepository(),    // Inject IUserBehaviorRepository
      this.getProductFeatureRepository(),  // Inject IProductFeatureRepository
      this.getRecommendationEngine()       // Inject IRecommendationEngine
    );
  }
}
```

**Benefits**:
- Easy to swap implementations (e.g., Redis cache instead of DB)
- Easy to test (inject mocks)
- No circular dependencies

---

## Key Design Patterns

### 1. Repository Pattern
- **Domain**: Defines `IRecommendationRepository` interface
- **Infrastructure**: Implements with `TypeORMRecommendationRepository`
- **Benefit**: Can swap databases without changing business logic

### 2. Strategy Pattern (Hexagonal Architecture)
- **Domain**: Defines `IRecommendationEngine` interface
- **Infrastructure**: Multiple implementations:
  - `ContentBasedEngine` (feature similarity)
  - `CollaborativeFilteringEngine` (user similarity)
  - `HybridEngine` (combines multiple strategies)
- **Benefit**: Can A/B test different algorithms

### 3. Value Objects
- `RecommendationScore`: Validates score is 0.0-1.0
- `UserId`: Type-safe user identifier
- **Benefit**: Domain constraints enforced in types

### 4. Dependency Inversion Principle
- High-level use cases depend on abstractions (interfaces)
- Low-level repositories implement those interfaces
- **Benefit**: Business logic doesn't know about TypeORM

---

## API Endpoints

### 1. Get Personalized Recommendations

```http
GET /api/v1/recommendations/:userId?strategy=hybrid&limit=10&categoryId=5
```

**Response**:
```json
{
  "statusCode": 200,
  "message": "Recommendations retrieved successfully",
  "data": {
    "userId": 123,
    "recommendations": [
      {
        "productId": 456,
        "score": 0.85,
        "reason": "matches your preferred category, highly rated",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "strategy": "hybrid",
    "fromCache": false,
    "generatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Track User Behavior

```http
POST /api/v1/recommendations/track

{
  "userId": 123,
  "behaviorType": "view",
  "productId": 456,
  "metadata": { "source": "homepage" }
}
```

### 3. Get Similar Products

```http
GET /api/v1/recommendations/similar/:productId?limit=5
```

---

## Testing Strategy

### Unit Tests (Domain Layer)

Test business rules in isolation:

```typescript
describe('Recommendation', () => {
  it('should identify high confidence recommendations', () => {
    const rec = Recommendation.create(1, 0.85, 'test');
    expect(rec.isHighConfidence()).toBe(true);
  });

  it('should reject invalid scores', () => {
    expect(() => Recommendation.create(1, 1.5, 'test')).toThrow();
  });
});
```

### Integration Tests (Use Cases)

Test with mocked repositories:

```typescript
describe('GetRecommendationsUseCase', () => {
  it('should return cached recommendations if fresh', async () => {
    const mockRepo = {
      hasFreshRecommendations: jest.fn().mockResolvedValue(true),
      findByUserId: jest.fn().mockResolvedValue([...]),
    };

    const useCase = new GetRecommendationsUseCase(mockRepo, ...);
    const result = await useCase.execute({ userId: 1 });

    expect(result.fromCache).toBe(true);
  });
});
```

### E2E Tests (API Layer)

Test full HTTP flow:

```typescript
describe('GET /api/v1/recommendations/:userId', () => {
  it('should return recommendations for valid user', async () => {
    const response = await request(app)
      .get('/api/v1/recommendations/123')
      .expect(200);

    expect(response.body.data.recommendations).toBeDefined();
  });
});
```

---

## Future Enhancements

### 1. Advanced ML Engines

#### Collaborative Filtering
```typescript
export class CollaborativeFilteringEngine implements IRecommendationEngine {
  // User-based or item-based collaborative filtering
  // Uses user similarity or item similarity matrices
}
```

#### Neural Network Engine
```typescript
export class NeuralNetworkEngine implements IRecommendationEngine {
  // TensorFlow.js or external Python API
  // Deep learning for personalization
}
```

### 2. Event-Driven Architecture

```typescript
// Domain Events
export class RecommendationGeneratedEvent {
  constructor(
    public readonly userId: number,
    public readonly recommendations: Recommendation[],
    public readonly occurredAt: Date
  ) {}
}

// Event Handler
export class UpdateUserProfileOnRecommendationGenerated {
  async handle(event: RecommendationGeneratedEvent) {
    // Update user profile with latest preferences
  }
}
```

### 3. CQRS (Command Query Responsibility Segregation)

Separate read and write models:

```typescript
// Command: Track behavior (write)
export class TrackBehaviorCommand {
  constructor(public readonly userId: number, ...) {}
}

// Query: Get recommendations (read)
export class GetRecommendationsQuery {
  constructor(public readonly userId: number, ...) {}
}
```

### 4. Caching Layer

```typescript
export class RedisRecommendationCache implements IRecommendationRepository {
  // Use Redis for faster cache lookups
  // TTL-based expiration
}
```

### 5. A/B Testing Framework

```typescript
export class ABTestingEngine implements IRecommendationEngine {
  // Randomly assign users to different strategies
  // Track conversion metrics
  // Automatically promote best-performing algorithm
}
```

---

## Comparison with Existing Codebase

| Aspect | Old Pattern (Cart/Order modules) | New Pattern (AI module) |
|--------|----------------------------------|-------------------------|
| **Architecture** | MVC (tightly coupled) | Clean Architecture (layered) |
| **Dependencies** | Direct TypeORM usage | Interface-based (ports) |
| **Testing** | Hard to test (DB required) | Easy to mock repositories |
| **Flexibility** | Hard to swap implementations | Easy to swap (DI) |
| **Business Logic** | Mixed in services/controllers | Isolated in domain layer |
| **DI** | Manual instantiation | DI container |

---

## Learning Resources

- **Clean Architecture**: Robert C. Martin (Uncle Bob)
- **Hexagonal Architecture**: Alistair Cockburn
- **Domain-Driven Design**: Eric Evans
- **Dependency Inversion Principle**: SOLID principles

---

## Contributors

This module was built as a **reference implementation** of Clean Architecture for the recommendation server project.

For questions or suggestions, please create an issue or PR.

---

**🎯 Key Takeaway**: This module demonstrates how to build maintainable, testable, and flexible backend code by separating business logic from infrastructure concerns.
