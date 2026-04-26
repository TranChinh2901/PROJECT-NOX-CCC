# Recommendation System Improvement Research Brief

Use this brief as context for a ChatGPT Deep Research request about improving the
recommendation feature in `recommendation_server`.

## Project Context

The backend is an Express + TypeScript + TypeORM API for an e-commerce app.
The recommendation system lives mainly under:

- `src/modules/ai`
- `src/routes/recommendation.ts`
- `src/scripts/export-recommendation-dataset.ts`
- `src/scripts/train-recommendation-baseline.ts`
- `src/scripts/precompute-recommendation-cache.ts`
- `src/scripts/evaluate-recommendation-baseline.ts`
- `src/scripts/refresh-recommendation-pipeline.ts`
- `src/modules/ai/infrastructure/jobs/RecommendationRefreshScheduler.ts`
- `src/modules/ai/infrastructure/runtime/RecommendationArtifactHealth.ts`

The recommendation API is mounted at `/api/v1/recommendations`.

## Current API Surface

`src/routes/recommendation.ts` exposes:

- `GET /api/v1/recommendations/status`
  - Public operational status endpoint.
  - Reports configured/effective engine, artifact readiness, rollback status,
    cache counts, cache summary, behavior log totals, and scheduler settings.

- `POST /api/v1/recommendations/track`
  - Authenticated endpoint.
  - Tracks behavior types: `view`, `add_to_cart`, `purchase`, `review`,
    `wishlist`, `search`.
  - Authenticated user ID wins over body `userId`.
  - Rejects cross-user behavior tracking.

- `GET /api/v1/recommendations/similar/:productId`
  - Public endpoint for product detail page similar-product rail.
  - Uses offline precomputed similar items when healthy, otherwise content
    similarity and fallback.

- `GET /api/v1/recommendations/:userId`
  - Authenticated personalized recommendations.
  - Rejects cross-user access.
  - Optional query: `strategy`, `limit`, `categoryId`.

## Current Runtime Flow

`src/modules/ai/presentation/RecommendationController.ts` is thin:

- validates params/query/body,
- enforces auth ownership,
- delegates to use cases,
- wraps use-case output in `AppResponse`.

`src/modules/ai/application/use-cases/GetRecommendationsUseCase.ts` is the core
online coordinator.

For personalized recommendations:

1. Build an exclusion set:
   - explicit request exclusions,
   - purchased products,
   - add-to-cart products,
   - wishlist products,
   - products viewed repeatedly in recent history.
2. Inspect offline artifact health.
3. Try fresh active offline cache rows from `recommendation_cache` using
   algorithm `offline_model`.
4. If valid offline cache exists, finalize and return it immediately.
5. Otherwise derive user preferences from behavior logs.
6. Load candidate products from popular products and user browsing history.
7. Load fallback products.
8. Run the offline model engine and content-based engine in parallel.
9. Resolve the decision tree:
   - fresh offline cache,
   - hybrid blend,
   - offline only,
   - content only,
   - deterministic popularity fallback,
   - hidden module if no candidates remain.
10. Finalize homepage recommendations:
    - validate products are active and not deleted,
    - de-dupe,
    - limit,
    - diversify the first 4 cards by category and brand.
11. Save generated recommendations back to cache with algorithm based on source:
    `offline_model`, `hybrid`, `content_based`, or `fallback`.

For similar products:

1. Load the target product feature.
2. If the target product is unavailable, return a hidden decision.
3. Try healthy offline precomputed similar items from the JSON artifact.
4. If unavailable, run offline and content similar-product engines.
5. Validate final products are eligible and not the current product.
6. Resolve using the same decision tree.

## Current Engines

### ContentBasedEngine

File: `src/modules/ai/infrastructure/ml-engines/ContentBasedEngine.ts`

Personalized score:

- category preference: 0.40
- brand preference: 0.20
- price range match: 0.20
- rating: 0.20

Similar-product score:

- same category: 0.45
- same brand: 0.20
- price similarity: 0.20
- rating: 0.10
- review count: 0.05

### OfflineModelRecommendationEngine

File: `src/modules/ai/infrastructure/ml-engines/OfflineModelRecommendationEngine.ts`

Reads `exports/recommendation-baseline-model.json` or
`RECOMMENDATION_MODEL_PATH`.

Expected artifact fields:

- `metadata`
- `recommendationsByUser`
- `similarItemsByProduct`

It normalizes all scores into `0..1`, filters excluded products, supports
category filtering, and can report artifact freshness.

## Current Data and Persistence

Key entities:

- `UserBehaviorLog`
  - table: `user_behavior_logs`
  - indexed by session, user, action type, product, variant.
  - contains action type, product, variant, metadata, device type, page URL,
    referrer, IP, session duration, timestamp.

- `RecommendationCache`
  - table: `recommendation_cache`
  - unique `cache_key`.
  - stores `recommended_products` JSON, optional `context_data`,
    `generated_at`, `expires_at`, `cache_hit_count`, `is_active`.

- `ProductFeature`
  - table: `product_features`
  - exists but current serving repository mostly derives features directly from
    `products`, `category`, `brand`, and `reviews`.

`TypeORMProductFeatureRepository` currently maps active, non-deleted products to
feature objects:

- product ID,
- category ID,
- brand ID,
- base price,
- average rating,
- review count,
- purchase count currently hardcoded to `0`.

This means popularity fallback has a purchase-count term, but current product
feature extraction does not actually calculate purchase count.

## Current Behavior Data Processing

`TypeORMUserBehaviorRepository`:

- ignores impression-only views in behavior history, preferences, and popularity,
- derives preferences from the last 90 days,
- uses top 5 preferred categories and brands,
- calculates price range from weighted behavior prices using 25th and 75th
  percentile,
- gets popular products from the last 30 days.

Preference weights in repository:

- view: 1
- click: 2
- review view: 3
- add to cart: 4
- wishlist add: 5
- purchase: 6

Offline dataset export weights in `export-recommendation-dataset.ts`:

- view/click: 1
- review: 2
- add_to_cart: 3
- wishlist_add: 4
- purchase: 6

There is a mismatch between repository preference weights and offline export
weights. This may be intentional, but it is a candidate for review.

## Current Offline Pipeline

The full refresh pipeline:

1. `export-recommendation-dataset.ts`
   - reads `user_behavior_logs` joined with products,
   - default lookback: 180 days,
   - ignores impression-only views,
   - aggregates one row per user/product,
   - exports `exports/recommendation-training-data.csv`.

2. `train-recommendation-baseline.ts`
   - loads CSV,
   - builds item vectors from user interaction scores,
   - computes item-item cosine similarity,
   - writes top-K similar products per item,
   - generates top-N recommendations per user by walking similar items from
     products the user has interacted with,
   - excludes already-seen products,
   - normalizes scores,
   - writes `exports/recommendation-baseline-model.json`.

3. `precompute-recommendation-cache.ts`
   - loads model JSON,
   - deactivates old active personalized cache rows for affected users and
     algorithm,
   - upserts new active personalized rows,
   - stores model metadata in `context_data`,
   - writes `exports/recommendation-cache-summary.json`.

The in-process scheduler can run this pipeline on startup and/or interval.
It avoids overlapping refreshes.

## Current Evaluation

`src/scripts/evaluate-recommendation-baseline.ts`:

- loads CSV dataset,
- loads offline model,
- splits each eligible user into training rows and holdout rows,
- rebuilds recommendations from `similarItemsByProduct`,
- computes:
  - Precision@K,
  - Recall@K,
  - HitRate@K,
  - MRR@K,
  - Coverage@K.

Output:

- `exports/recommendation-evaluation.json`

This is a good base, but currently focused on offline ranking quality. It does
not appear to evaluate:

- revenue impact,
- conversion uplift,
- diversity/novelty/serendipity,
- cold-start quality,
- category/brand fairness,
- live click-through rate,
- cache hit rate impact,
- latency impact.

## Existing Embedding Capability

`src/scripts/generate-product-embeddings.ts` exists.

It:

- reads products missing embeddings,
- builds text from product name, category, brand, and description,
- calls Gemini embedding utilities,
- stores vectors on `Product.embedding`.

This suggests a future improvement path: vector-based product similarity or
hybrid retrieval. Current recommendation serving does not appear to use product
embeddings.

## Operational Controls

Important environment variables:

- `RECOMMENDATION_ENGINE`
  - `offline_model` or content-based fallback mode.

- `RECOMMENDATION_MODEL_PATH`
  - model JSON path.

- `RECOMMENDATION_CACHE_SUMMARY_PATH`
  - cache summary JSON path.

- `RECOMMENDATION_ENGINE_FORCE_CONTENT_FALLBACK`
  - forces rollback to content-based behavior.

- `RECOMMENDATION_OFFLINE_FRESHNESS_MINUTES`
  - explicit offline model freshness window.

- `RECOMMENDATION_PIPELINE_SCHEDULER_ENABLED`
- `RECOMMENDATION_PIPELINE_RUN_ON_START`
- `RECOMMENDATION_PIPELINE_REFRESH_INTERVAL_MINUTES`
- `RECOMMENDATION_PIPELINE_LOOKBACK_DAYS`
- `RECOMMENDATION_PIPELINE_TOP_K`
- `RECOMMENDATION_PIPELINE_TOP_N`
- `RECOMMENDATION_PIPELINE_TTL_HOURS`
- `RECOMMENDATION_PIPELINE_ALGORITHM`

## Current Strengths

- Clean architecture shape: controller, use case, repositories, engines.
- Runtime has explicit decision metadata.
- Safe fallback behavior: failures become fallback reasons instead of hard API
  failures.
- Offline artifact health inspection and rollback behavior already exist.
- Offline training, precompute, and evaluation scripts already exist.
- Cache summary provides coverage metadata.
- Recommendation endpoints already separate homepage personalized and PDP
  similar products.
- Existing product embeddings script creates an obvious path toward semantic
  retrieval.

## Known Weaknesses and Improvement Opportunities

1. Better feature quality
   - `purchaseCount` in product features is currently hardcoded to `0`.
   - Product metadata could include inventory, margin, discount, availability,
     category hierarchy, image quality, price buckets, and recency.
   - `product_features` table exists but is not central to serving.

2. Weight consistency
   - Online preference weights and offline export weights are different.
   - Need decide whether this is intentional and tune with evaluation.

3. Hybrid retrieval
   - Current offline model is item-item collaborative filtering.
   - Current content engine is hand-weighted heuristics.
   - Product embeddings exist but are not used for recommendation retrieval.
   - A hybrid retrieval stack could combine collaborative, content, embedding,
     popularity, business rules, and personalization.

4. Ranking model
   - Current hybrid blend is a fixed 60% offline + 40% content normalized blend.
   - Could add a learned re-ranker or rule-based re-ranker using features such
     as score source, price match, recency, rating, availability, and diversity.

5. Cold-start strategy
   - New users and products likely fall back to popularity or content.
   - Could improve with onboarding preferences, session-only behavior,
     trending-by-category, semantic similarity, and new-product exploration.

6. Diversity and business constraints
   - Homepage first 4 cards are diversified by category/brand.
   - Could add category quota, price-band diversity, novelty, inventory rules,
     margin-aware ranking, and duplicate suppression across rails.

7. Real-time behavior
   - Current offline pipeline is batch-oriented.
   - Online tracking writes logs, but model updates depend on scheduled refresh.
   - Could add session-based real-time recommendations or short-term user intent
     overlay.

8. Evaluation and experimentation
   - Offline metrics exist.
   - Need online metrics: CTR, add-to-cart rate, purchase conversion, revenue per
     visitor, coverage, diversity, latency, cache hit rate, and fallback rate.
   - Need A/B testing plan and guardrail metrics.

9. Observability
   - Decision trace logging exists.
   - Could aggregate source distribution, branch distribution, fallback reasons,
     artifact freshness, cache hit/miss, and per-rail performance.

10. Performance and storage
    - Cache uses DB JSON rows.
    - Could evaluate Redis or materialized recommendation tables for high-traffic
      paths.
    - Similar-products are served from artifact or generated online, not clearly
      persisted in DB cache as similar rows.

11. Data governance and safety
    - Behavior logs include IP and user/session data.
    - Improvements should consider privacy, retention, opt-out, and minimizing
      sensitive fields in analytics.

## Suggested Deep Research Prompt

Use the following prompt in ChatGPT Deep Research:

```text
I have an Express + TypeScript + TypeORM e-commerce backend with a recommendation
system under recommendation_server/src/modules/ai. Please research and propose a
practical improvement roadmap for this recommendation feature.

Current system summary:
- API endpoints:
  - GET /api/v1/recommendations/:userId for authenticated personalized homepage recommendations
  - GET /api/v1/recommendations/similar/:productId for public PDP similar products
  - POST /api/v1/recommendations/track for authenticated behavior logging
  - GET /api/v1/recommendations/status for operational health
- Online flow:
  - RecommendationController validates input and auth ownership.
  - GetRecommendationsUseCase builds exclusions, checks offline artifact health,
    attempts fresh offline cache, derives user preferences, loads candidates,
    runs offline and content engines in parallel, resolves a decision tree, and
    finalizes active/de-duped/diversified recommendations.
- Current engines:
  - OfflineModelRecommendationEngine reads recommendation-baseline-model.json
    with recommendationsByUser and similarItemsByProduct.
  - ContentBasedEngine uses hand-weighted category, brand, price, rating, and
    review-count scoring.
- Offline pipeline:
  - export-recommendation-dataset.ts aggregates user_behavior_logs into CSV.
  - train-recommendation-baseline.ts builds item-item cosine similarity and
    per-user unseen recommendations.
  - precompute-recommendation-cache.ts upserts personalized offline_model rows
    into recommendation_cache and writes recommendation-cache-summary.json.
  - RecommendationRefreshScheduler can run the pipeline on startup/interval.
- Evaluation exists:
  - evaluate-recommendation-baseline.ts computes Precision@K, Recall@K,
    HitRate@K, MRR@K, Coverage@K.
- Existing product embeddings script:
  - generate-product-embeddings.ts stores embeddings on Product.embedding, but
    recommendation serving does not currently use embeddings.
- Known issues:
  - ProductFeatureRepository currently hardcodes purchaseCount to 0.
  - Online preference weights and offline export weights differ.
  - Hybrid blend is fixed at 60% offline / 40% content.
  - Cold-start handling is mostly popularity/content fallback.
  - Online metrics and A/B testing are not yet implemented.

Please produce:
1. A prioritized technical roadmap from low-risk improvements to advanced ML.
2. Recommended algorithms suitable for this codebase and data volume:
   collaborative filtering, content-based, embedding similarity, hybrid retrieval,
   learning-to-rank, session-based recommendations.
3. Concrete schema/data changes needed.
4. How to use existing Product.embedding safely and effectively.
5. Better evaluation metrics and an A/B testing plan.
6. Operational/observability improvements.
7. Risks, tradeoffs, and what not to implement yet.
8. A suggested implementation sequence with tests for each phase.
```

## Recommended First Implementation Phases

Phase 1: Data correctness and observability

- Calculate real `purchaseCount` or remove it from fallback scoring.
- Align or document online/offline behavior weights.
- Add source/branch/fallback aggregation from decision logs.
- Add cache hit/miss and latency metrics per recommendation surface.

Phase 2: Evaluation expansion

- Add diversity, novelty, catalog coverage by category, and cold-start metrics.
- Store evaluation history so model changes can be compared over time.
- Add tests that verify offline pipeline outputs and status endpoint behavior.

Phase 3: Better retrieval

- Use existing product embeddings to support semantic similar-products retrieval.
- Blend embedding similarity with category/brand/price constraints.
- Add a session-intent overlay for recent views/searches.

Phase 4: Better ranking

- Replace fixed 60/40 hybrid blend with a configurable feature-based re-ranker.
- Later consider learning-to-rank if there is enough traffic and labeled outcomes.

Phase 5: Online experimentation

- Add A/B test bucketing.
- Track recommendation impressions, clicks, add-to-cart, purchases, and revenue.
- Compare current baseline vs improved hybrid/embedding model.
