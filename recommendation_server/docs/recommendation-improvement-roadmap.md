# Recommendation System Improvement Roadmap

This roadmap converts the Deep Research findings into implementation work for
`recommendation_server`. The direction is incremental modernization: preserve
the current resilient hybrid recommendation system, fix data and measurement
first, then add embedding retrieval and better ranking.

## Target Architecture

Move toward a clear multi-stage recommendation stack:

1. Candidate generation
   - offline item-item collaborative filtering,
   - content-based candidates,
   - embedding-neighbor candidates,
   - session-intent candidates,
   - popularity/business-rule candidates.

2. Scoring
   - replace the fixed 60 percent offline / 40 percent content blend with a
     common feature-based scorer.

3. Re-ranking
   - apply diversity, freshness, inventory, duplicate suppression, price-band,
     and business constraints after scoring.

4. Measurement
   - log impressions and outcomes for online metrics and A/B testing.

## Phase 1: Data Correctness and Observability

Goal: make current recommendations trustworthy before adding more algorithms.

### Work

- Fix `purchaseCount` in `TypeORMProductFeatureRepository`.
  - Either calculate it from order/order-item tables or remove it from
    fallback scoring until it can be computed correctly.

- Align behavior weights.
  - Current online preference derivation and offline dataset export use
    different weights for review, add-to-cart, and wishlist actions.
  - Decide one canonical weight table and reuse it from a shared module.

- Add recommendation impression tracking.
  - Track when a recommendation card is shown, not only clicked or acted on.
  - Include surface: homepage, PDP similar rail, cart, or other future surfaces.

- Extend decision observability.
  - Aggregate source distribution, branch distribution, fallback reasons,
    cache hit/miss, artifact state, and result count.

### Code Areas

- `src/modules/ai/infrastructure/repositories/TypeORMProductFeatureRepository.ts`
- `src/modules/ai/infrastructure/repositories/TypeORMUserBehaviorRepository.ts`
- `src/scripts/export-recommendation-dataset.ts`
- `src/modules/ai/application/use-cases/GetRecommendationsUseCase.ts`
- `src/modules/ai/infrastructure/monitoring/RecommendationObservability.ts`
- `src/modules/ai/presentation/RecommendationController.ts`

### Tests

- Unit test real purchase-count extraction or verify fallback no longer depends
  on unavailable purchase data.
- Unit test canonical behavior weights.
- Integration test `POST /api/v1/recommendations/track` for impression events.
- Unit test decision trace logging on cache hit, hybrid, content-only, fallback,
  and hidden branches.

### Acceptance Criteria

- No scoring term relies on hardcoded fake purchase counts.
- Online preference and offline export weights cannot drift silently.
- Status or logs can answer:
  - how often each decision branch is used,
  - how often fallback is used,
  - how often cache hits occur,
  - whether artifact degradation is affecting serving.

## Phase 2: Evaluation Expansion

Goal: evaluate recommendation quality beyond basic accuracy.

### Work

- Extend `evaluate-recommendation-baseline.ts` with:
  - nDCG@K,
  - MAP@K,
  - category coverage,
  - brand coverage,
  - novelty,
  - intra-list diversity,
  - cold-start user/product slices.

- Store evaluation history.
  - Write timestamped evaluation outputs or append to a history file.
  - Include model metadata, topK, topN, lookback window, and algorithm tag.

- Add launch/readiness evidence for current vs proposed models.

### Code Areas

- `src/scripts/evaluate-recommendation-baseline.ts`
- `src/scripts/generate-recommendation-launch-readiness-evidence.ts`
- `exports/recommendation-evaluation.json`

### Tests

- Golden dataset tests for all new metrics.
- Regression tests for zero-recommendation and single-user edge cases.
- Snapshot-style test for evaluation output shape.

### Acceptance Criteria

- Offline model changes can be compared across time.
- Evaluation separates relevance, coverage, diversity, and cold-start behavior.
- A model is not considered better only because one metric improved.

## Phase 3: Embedding Retrieval

Goal: use the existing `Product.embedding` asset for semantic retrieval.

### Work

- Add an embedding-based similar-products candidate source.
  - Start with PDP similar products because it is item-centric and lower risk.
  - Normalize vectors and use cosine-style similarity unless a deliberate
    popularity-weighted dot-product behavior is desired.

- Add filtering constraints after semantic retrieval:
  - active product,
  - not deleted,
  - not current product,
  - optional category compatibility,
  - optional price band.

- Decide serving shape:
  - simple database precompute table or JSON artifact first,
  - vector database / ANN only if catalog size or latency requires it.

### Code Areas

- `src/scripts/generate-product-embeddings.ts`
- `src/modules/ai/infrastructure/ml-engines/ContentBasedEngine.ts`
- new embedding candidate engine under `src/modules/ai/infrastructure/ml-engines/`
- `src/modules/ai/di/container.ts`
- `src/modules/ai/application/use-cases/GetRecommendationsUseCase.ts`

### Tests

- Unit test cosine similarity calculation.
- Unit test filtering constraints.
- Integration test `GET /api/v1/recommendations/similar/:productId`.
- Shadow comparison evidence against current similar-product behavior.

### Acceptance Criteria

- Similar-product rail can use semantic candidates without breaking current
  content/offline fallback behavior.
- Embedding candidates are explainable enough for product pages.
- Latency remains within the current API budget.

## Phase 4: Session-Intent Overlay

Goal: account for short-term user intent that batch offline models miss.

### Work

- Add a session-intent profile from recent views/searches.
- Boost candidate products matching recent categories, brands, price bands, or
  semantic neighbors.
- Keep boosts bounded so one accidental click does not dominate results.

### Code Areas

- `src/modules/ai/infrastructure/repositories/TypeORMUserBehaviorRepository.ts`
- `src/modules/ai/application/use-cases/GetRecommendationsUseCase.ts`
- possible new domain object for session intent.

### Tests

- Unit test recent-intent extraction.
- Unit test boost caps.
- Regression test that strong exclusions still win over session boosts.

### Acceptance Criteria

- Sparse users receive more context-aware recommendations.
- Session overlay does not recommend excluded products.
- Behavior remains stable when session data is missing.

## Phase 5: Unified Scoring and Re-ranking

Goal: replace the fixed hybrid blend with a comparable scoring layer.

### Work

- Create a candidate object that preserves:
  - product ID,
  - candidate source,
  - source score,
  - reason,
  - feature metadata.

- Build a feature-based scorer using:
  - normalized source score,
  - candidate source,
  - category/brand match,
  - price distance,
  - rating/review count,
  - popularity,
  - recency,
  - session intent,
  - inventory/availability when available.

- Move diversity and business constraints into a re-ranker.

### Code Areas

- `src/modules/ai/domain/entities/Recommendation.ts`
- `src/modules/ai/domain/services/IRecommendationEngine.ts`
- `src/modules/ai/application/use-cases/GetRecommendationsUseCase.ts`
- new scorer/re-ranker application services.

### Tests

- Unit tests for scorer feature handling.
- Unit tests for diversity and quota behavior.
- Regression tests for existing cache/offline/content/fallback branches.
- Offline evaluation comparing fixed blend vs scorer.

### Acceptance Criteria

- Candidate sources no longer require ad hoc score blending.
- Re-ranking rules are explicit and testable.
- Existing fallback safety is preserved.

## Phase 6: Online Experimentation

Goal: prove lift before broader rollout.

### Work

- Add persistent user-level experiment bucketing.
- Add A/A test mode to validate randomization and metrics.
- Add staged ramp support:
  - 1 percent,
  - 5 percent,
  - 25 percent,
  - 50 percent,
  - 100 percent.

- Track outcome metrics:
  - recommendation impression,
  - click-through rate,
  - add-to-cart rate,
  - purchase conversion,
  - revenue per exposed user,
  - fallback rate,
  - cache hit rate,
  - p95/p99 latency.

### Code Areas

- recommendation tracking endpoint,
- user/session model or experiment assignment table,
- observability and analytics scripts.

### Tests

- Unit test stable assignment.
- A/A sample-ratio validation.
- Integration test event linkage from impression to click/add-to-cart/purchase.

### Acceptance Criteria

- Recommendation variants can be compared safely.
- Metrics include both business outcomes and guardrails.
- Rollback is possible without code deploy.

## Deferred Work

Do not start these until earlier phases prove the need:

- two-tower retrieval with ANN serving,
- full learning-to-rank model,
- LLM-native/generative recommendation,
- causal recommendation / counterfactual policy learning,
- managed vector database migration.

These may become valuable later, but they require stronger traffic volume,
labels, experimentation discipline, and operational maturity than the current
brief proves.

## Immediate Next PR Candidate

Start with a narrow PR:

1. Extract canonical recommendation action weights.
2. Reuse them in both online preference derivation and offline dataset export.
3. Add tests proving the two paths share the same weights.
4. Decide what to do with `purchaseCount`:
   - compute it from order items, or
   - remove it from fallback scoring until available.

This is the lowest-risk improvement and removes train/serve ambiguity before
larger model changes.
