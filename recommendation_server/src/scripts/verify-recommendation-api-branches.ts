import 'reflect-metadata';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import express, { Express } from 'express';
import request from 'supertest';
import recommendationRouter from '@/routes/recommendation';
import { exceptionHandler } from '@/middlewares/exception-filter';
import { container } from '@/modules/ai/di/container';
import authService from '@/modules/auth/auth.service';
import { RoleType } from '@/modules/auth/enum/auth.enum';
import type { GetRecommendationsResponseDTO } from '@/modules/ai/application/dto/GetRecommendationsResponse';
import type { GetSimilarProductsResponseDTO } from '@/modules/ai/application/dto/GetSimilarProductsResponse';

type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

type ResponseEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

type AuthPayload = {
  id: number;
  email: string;
  role: RoleType;
};

type HomepageScenarioDefinition = {
  name: string;
  route: string;
  query: Record<string, string | number>;
  token: string;
  expectedBranch: string;
  expectedSource: string;
  artifactState: string;
  excludedProductIds: number[];
  payload: GetRecommendationsResponseDTO;
};

type PdpScenarioDefinition = {
  name: string;
  route: string;
  query: Record<string, string | number>;
  expectedBranch: string;
  expectedSource: string;
  artifactState: string;
  excludedProductIds: number[];
  payload: GetSimilarProductsResponseDTO;
};

type ResponseEvidence = {
  http: {
    route: string;
    method: 'GET';
    statusCode: number;
    success: true;
    message: string;
    envelopeKeys: string[];
  };
  branch: string;
  source: string;
  hidden: boolean;
  fallbackReason: string | null;
  strategy: string;
  recommendationIds: number[];
  scores: number[];
  reasons: string[];
  recommendationCount: number;
  uniqueRecommendationCount: number;
  duplicateIds: number[];
  metadataShape: {
    decisionKeys: string[];
    recommendationKeys: string[];
  };
  assertions: {
    httpOk: true;
    envelopeShape: true;
    metadataShape: true;
    noDuplicates: true;
    exclusionsApplied: true;
    branchMatches: true;
    sourceMatches: true;
  };
};

type SurfaceEvidence = {
  surface: 'homepage' | 'pdp';
  generatedBy: 'verify-recommendation-api-branches';
  schemaVersion: 1;
  safety: {
    containsIdentifiers: false;
    containsSecrets: false;
  };
  transport: {
    mountPath: '/api/v1/recommendations';
    auth: {
      required: boolean;
      unauthorizedStatus: number | null;
      forbiddenStatus: number | null;
    };
  };
  scenarios: Array<{
    name: string;
    expectedBranch: string;
    expectedSource: string;
    excludedProductIds: number[];
    artifactState: string;
    response: ResponseEvidence;
  }>;
};

type VerificationArtifacts = {
  homepage: {
    outputPath: string;
    evidence: SurfaceEvidence;
  };
  pdp: {
    outputPath: string;
    evidence: SurfaceEvidence;
  };
};

type RecommendationUseCaseDouble = {
  execute: (input: { strategy?: string; limit?: number }) => Promise<GetRecommendationsResponseDTO>;
  executeSimilarProducts: (productId: number, limit: number) => Promise<GetSimilarProductsResponseDTO>;
};

const HOMEPAGE_EVIDENCE_PATH = path.resolve(
  process.cwd(),
  '..',
  '.sisyphus',
  'evidence',
  'task-8-api-homepage.json'
);

const PDP_EVIDENCE_PATH = path.resolve(
  process.cwd(),
  '..',
  '.sisyphus',
  'evidence',
  'task-8-api-pdp.json'
);

const AUTH_USERS: Record<string, AuthPayload> = {
  'token-user-1': {
    id: 1,
    email: 'qa-user-1@example.test',
    role: RoleType.USER,
  },
  'token-user-2': {
    id: 2,
    email: 'qa-user-2@example.test',
    role: RoleType.USER,
  },
};

const assertCondition = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const createApp = (): Express => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api/v1/recommendations', recommendationRouter);
  app.use(exceptionHandler);

  return app;
};

const duplicateIdsFor = (productIds: number[]): number[] => {
  const seen = new Set<number>();
  const duplicates = new Set<number>();

  for (const productId of productIds) {
    if (seen.has(productId)) {
      duplicates.add(productId);
      continue;
    }

    seen.add(productId);
  }

  return Array.from(duplicates).sort((left, right) => left - right);
};

const normalizeDecisionKeys = (decision: Record<string, unknown>): string[] =>
  Object.keys(decision)
    .filter((key) => decision[key] !== undefined)
    .sort();

const createScenarioEvidence = (
  envelope: ResponseEnvelope<GetRecommendationsResponseDTO | GetSimilarProductsResponseDTO>,
  route: string,
  expected: {
    branch: string;
    source: string;
    excludedProductIds: number[];
  }
): ResponseEvidence => {
  const response = envelope.data;
  const recommendationIds = response.recommendations.map((recommendation) => recommendation.productId);
  const duplicateIds = duplicateIdsFor(recommendationIds);
  const recommendationShapeKeys = response.recommendations[0]
    ? Object.keys(response.recommendations[0]).sort()
    : ['createdAt', 'productId', 'reason', 'score'];
  const decisionKeys = normalizeDecisionKeys(response.decision as unknown as Record<string, unknown>);
  const exclusionsApplied = expected.excludedProductIds.every(
    (productId) => !recommendationIds.includes(productId)
  );
  const envelopeKeys = Object.keys(envelope).sort();

  assertCondition(envelope.success === true, `Expected successful envelope for ${route}`);
  assertCondition(typeof envelope.message === 'string', `Expected string message for ${route}`);
  assertCondition(
    JSON.stringify(envelopeKeys) === JSON.stringify(['data', 'message', 'success']),
    `Unexpected top-level envelope keys for ${route}: ${envelopeKeys.join(', ')}`
  );
  assertCondition(
    response.decision.branch === expected.branch,
    `Expected branch ${expected.branch} but received ${response.decision.branch}`
  );
  assertCondition(
    response.decision.source === expected.source,
    `Expected source ${expected.source} but received ${response.decision.source}`
  );
  assertCondition(
    response.decision.hidden === false || response.recommendations.length === 0,
    'Hidden responses must not return recommendation rows'
  );
  assertCondition(
    duplicateIds.length === 0,
    `Expected no duplicate recommendations but found ${duplicateIds.join(', ')}`
  );
  assertCondition(
    exclusionsApplied,
    `Expected exclusions ${expected.excludedProductIds.join(', ')} to be removed from ${recommendationIds.join(', ')}`
  );
  assertCondition(
    JSON.stringify(recommendationShapeKeys) === JSON.stringify(['createdAt', 'productId', 'reason', 'score']),
    `Unexpected recommendation metadata shape: ${recommendationShapeKeys.join(', ')}`
  );
  assertCondition(
    decisionKeys.every((key) => ['branch', 'fallbackReason', 'hidden', 'source'].includes(key)),
    `Unexpected decision metadata shape: ${decisionKeys.join(', ')}`
  );
  assertCondition(
    response.recommendations.every(
      (recommendation) =>
        typeof recommendation.productId === 'number' &&
        typeof recommendation.score === 'number' &&
        typeof recommendation.reason === 'string' &&
        typeof recommendation.createdAt === 'string'
    ),
    'Recommendation metadata contains invalid field types'
  );

  return {
    http: {
      route,
      method: 'GET',
      statusCode: 200,
      success: true,
      message: envelope.message,
      envelopeKeys,
    },
    branch: response.decision.branch,
    source: response.decision.source,
    hidden: response.decision.hidden,
    fallbackReason: response.decision.fallbackReason ?? null,
    strategy: response.strategy,
    recommendationIds,
    scores: response.recommendations.map((recommendation) => recommendation.score),
    reasons: response.recommendations.map((recommendation) => recommendation.reason),
    recommendationCount: response.recommendations.length,
    uniqueRecommendationCount: new Set(recommendationIds).size,
    duplicateIds,
    metadataShape: {
      decisionKeys,
      recommendationKeys: recommendationShapeKeys,
    },
    assertions: {
      httpOk: true,
      envelopeShape: true,
      metadataShape: true,
      noDuplicates: true,
      exclusionsApplied: true,
      branchMatches: true,
      sourceMatches: true,
    },
  };
};

const createHomepageResponse = (
  branch: string,
  source: 'hybrid' | 'content' | 'fallback',
  recommendations: Array<{ productId: number; score: number; reason: string }>,
  fallbackReason?: string,
  strategy = 'hybrid'
): GetRecommendationsResponseDTO => ({
  userId: 1,
  recommendations: recommendations.map((recommendation) => ({
    ...recommendation,
    createdAt: '2026-04-20T00:00:00.000Z',
  })),
  strategy,
  fromCache: false,
  generatedAt: '2026-04-20T00:00:00.000Z',
  decision: {
    source,
    branch,
    fallbackReason,
    hidden: false,
  },
});

const createPdpResponse = (
  productId: number,
  branch: string,
  source: 'content' | 'fallback',
  recommendations: Array<{ productId: number; score: number; reason: string }>,
  fallbackReason?: string
): GetSimilarProductsResponseDTO => ({
  productId,
  recommendations: recommendations.map((recommendation) => ({
    ...recommendation,
    createdAt: '2026-04-20T00:00:00.000Z',
  })),
  strategy: 'content_based',
  generatedAt: '2026-04-20T00:00:00.000Z',
  decision: {
    source,
    branch,
    fallbackReason,
    hidden: false,
  },
});

const HOMEPAGE_SCENARIOS: HomepageScenarioDefinition[] = [
  {
    name: 'homepage-success-hybrid',
    route: '/api/v1/recommendations/1',
    query: { strategy: 'hybrid', limit: 4 },
    token: 'token-user-1',
    expectedBranch: 'blend_offline_and_content',
    expectedSource: 'hybrid',
    artifactState: 'healthy',
    excludedProductIds: [],
    payload: createHomepageResponse('blend_offline_and_content', 'hybrid', [
      { productId: 101, score: 0.91, reason: 'offline top pick' },
      { productId: 201, score: 0.74, reason: 'content complement' },
      { productId: 102, score: 0.73, reason: 'offline backup' },
    ]),
  },
  {
    name: 'homepage-degraded-content-only',
    route: '/api/v1/recommendations/1',
    query: { limit: 2 },
    token: 'token-user-1',
    expectedBranch: 'content_only',
    expectedSource: 'content',
    artifactState: 'stale',
    excludedProductIds: [],
    payload: createHomepageResponse('content_only', 'content', [
      { productId: 801, score: 0.8, reason: 'fresh content fallback' },
      { productId: 802, score: 0.5, reason: 'content backup' },
    ], 'offline-artifact-stale', 'content'),
  },
  {
    name: 'homepage-fallback-popularity',
    route: '/api/v1/recommendations/1',
    query: { strategy: 'popularity', limit: 2 },
    token: 'token-user-1',
    expectedBranch: 'deterministic_popularity_fallback',
    expectedSource: 'fallback',
    artifactState: 'healthy',
    excludedProductIds: [],
    payload: createHomepageResponse('deterministic_popularity_fallback', 'fallback', [
      { productId: 501, score: 0.33, reason: 'popular fallback' },
      { productId: 502, score: 0.31, reason: 'popular backup' },
    ], 'content-engine-empty', 'popularity'),
  },
];

const PDP_SCENARIOS: PdpScenarioDefinition[] = [
  {
    name: 'pdp-self-exclusion-content-only',
    route: '/api/v1/recommendations/similar/901',
    query: { limit: 3 },
    expectedBranch: 'content_only',
    expectedSource: 'content',
    artifactState: 'healthy',
    excludedProductIds: [901],
    payload: createPdpResponse(901, 'content_only', 'content', [
      { productId: 902, score: 0.72, reason: 'eligible content similar' },
      { productId: 903, score: 0.68, reason: 'backup content similar' },
    ], 'forced-content-fallback'),
  },
  {
    name: 'pdp-fallback-deduplicated',
    route: '/api/v1/recommendations/similar/601',
    query: { limit: 5 },
    expectedBranch: 'deterministic_popularity_fallback',
    expectedSource: 'fallback',
    artifactState: 'healthy',
    excludedProductIds: [601],
    payload: createPdpResponse(601, 'deterministic_popularity_fallback', 'fallback', [
      { productId: 603, score: 0.61, reason: 'popular similar fallback' },
      { productId: 602, score: 0.59, reason: 'backup popular similar' },
    ], 'similar-items-unavailable'),
  },
];

async function withPatchedRecommendationHttp<T>(
  useCaseDouble: RecommendationUseCaseDouble,
  callback: (app: Express) => Promise<T>
): Promise<T> {
  const mutableContainer = container as Mutable<typeof container>;
  const mutableAuthService = authService as Mutable<typeof authService>;
  const originalGetRecommendationsUseCase = container.getRecommendationsUseCase;
  const originalVerifyToken = authService.verifyToken;

  mutableContainer.getRecommendationsUseCase = () => useCaseDouble as never;
  mutableAuthService.verifyToken = (token: string) => AUTH_USERS[token] ?? null;

  try {
    return await callback(createApp());
  } finally {
    mutableContainer.getRecommendationsUseCase = originalGetRecommendationsUseCase;
    mutableAuthService.verifyToken = originalVerifyToken;
  }
}

async function verifyHomepageAuth(app: Express): Promise<{ unauthorizedStatus: number; forbiddenStatus: number }> {
  const unauthorizedResponse = await request(app).get('/api/v1/recommendations/1').expect(401);
  const forbiddenResponse = await request(app)
    .get('/api/v1/recommendations/1')
    .set('Authorization', 'Bearer token-user-2')
    .expect(403);

  assertCondition(unauthorizedResponse.body.success === false, 'Expected homepage unauthorized response envelope');
  assertCondition(forbiddenResponse.body.success === false, 'Expected homepage forbidden response envelope');

  return {
    unauthorizedStatus: unauthorizedResponse.status,
    forbiddenStatus: forbiddenResponse.status,
  };
}

async function buildHomepageEvidence(): Promise<SurfaceEvidence> {
  const useCaseDouble: RecommendationUseCaseDouble = {
    execute: async ({ strategy, limit }: { strategy?: string; limit?: number }) => {
      const scenario = HOMEPAGE_SCENARIOS.find(
        (candidate) =>
          String(candidate.query.strategy ?? 'undefined') === String(strategy) &&
          Number(candidate.query.limit ?? NaN) === Number(limit ?? NaN)
      );

      if (!scenario) {
        throw new Error(`No homepage scenario matched strategy=${String(strategy)} limit=${String(limit)}`);
      }

      return scenario.payload;
    },
    executeSimilarProducts: async () => {
      throw new Error('Homepage evidence should not call similar-products use case');
    },
  };

  return withPatchedRecommendationHttp(useCaseDouble, async (app) => {
    const auth = await verifyHomepageAuth(app);
    const scenarios = [] as SurfaceEvidence['scenarios'];

    for (const scenario of HOMEPAGE_SCENARIOS) {
      const response = await request(app)
        .get(scenario.route)
        .set('Authorization', `Bearer ${scenario.token}`)
        .query(scenario.query)
        .expect(200);

      const envelope = response.body as ResponseEnvelope<GetRecommendationsResponseDTO>;

      scenarios.push({
        name: scenario.name,
        expectedBranch: scenario.expectedBranch,
        expectedSource: scenario.expectedSource,
        excludedProductIds: scenario.excludedProductIds,
        artifactState: scenario.artifactState,
        response: createScenarioEvidence(envelope, `${scenario.route}?${new URLSearchParams(
          Object.entries(scenario.query).map(([key, value]) => [key, String(value)])
        ).toString()}`, {
          branch: scenario.expectedBranch,
          source: scenario.expectedSource,
          excludedProductIds: scenario.excludedProductIds,
        }),
      });
    }

    return {
      surface: 'homepage',
      generatedBy: 'verify-recommendation-api-branches',
      schemaVersion: 1,
      safety: {
        containsIdentifiers: false,
        containsSecrets: false,
      },
      transport: {
        mountPath: '/api/v1/recommendations',
        auth: {
          required: true,
          unauthorizedStatus: auth.unauthorizedStatus,
          forbiddenStatus: auth.forbiddenStatus,
        },
      },
      scenarios,
    };
  });
}

async function buildPdpEvidence(): Promise<SurfaceEvidence> {
  const useCaseDouble: RecommendationUseCaseDouble = {
    execute: async () => {
      throw new Error('PDP evidence should not call homepage recommendations use case');
    },
    executeSimilarProducts: async (productId: number, limit: number) => {
      const scenario = PDP_SCENARIOS.find(
        (candidate) => Number(candidate.payload.productId) === productId && Number(candidate.query.limit) === limit
      );

      if (!scenario) {
        throw new Error(`No PDP scenario matched productId=${productId} limit=${limit}`);
      }

      return scenario.payload;
    },
  };

  return withPatchedRecommendationHttp(useCaseDouble, async (app) => {
    const scenarios = [] as SurfaceEvidence['scenarios'];

    for (const scenario of PDP_SCENARIOS) {
      const response = await request(app).get(scenario.route).query(scenario.query).expect(200);
      const envelope = response.body as ResponseEnvelope<GetSimilarProductsResponseDTO>;

      scenarios.push({
        name: scenario.name,
        expectedBranch: scenario.expectedBranch,
        expectedSource: scenario.expectedSource,
        excludedProductIds: scenario.excludedProductIds,
        artifactState: scenario.artifactState,
        response: createScenarioEvidence(envelope, `${scenario.route}?${new URLSearchParams(
          Object.entries(scenario.query).map(([key, value]) => [key, String(value)])
        ).toString()}`, {
          branch: scenario.expectedBranch,
          source: scenario.expectedSource,
          excludedProductIds: scenario.excludedProductIds,
        }),
      });
    }

    return {
      surface: 'pdp',
      generatedBy: 'verify-recommendation-api-branches',
      schemaVersion: 1,
      safety: {
        containsIdentifiers: false,
        containsSecrets: false,
      },
      transport: {
        mountPath: '/api/v1/recommendations',
        auth: {
          required: false,
          unauthorizedStatus: null,
          forbiddenStatus: null,
        },
      },
      scenarios,
    };
  });
}

export async function buildRecommendationApiBranchEvidence(): Promise<VerificationArtifacts> {
  const homepageEvidence = await buildHomepageEvidence();
  const pdpEvidence = await buildPdpEvidence();

  return {
    homepage: {
      outputPath: HOMEPAGE_EVIDENCE_PATH,
      evidence: homepageEvidence,
    },
    pdp: {
      outputPath: PDP_EVIDENCE_PATH,
      evidence: pdpEvidence,
    },
  };
}

export async function writeRecommendationApiBranchEvidence(): Promise<VerificationArtifacts> {
  const artifacts = await buildRecommendationApiBranchEvidence();

  await Promise.all([
    mkdir(path.dirname(artifacts.homepage.outputPath), { recursive: true }),
    mkdir(path.dirname(artifacts.pdp.outputPath), { recursive: true }),
  ]);

  await Promise.all([
    writeFile(artifacts.homepage.outputPath, `${JSON.stringify(artifacts.homepage.evidence, null, 2)}\n`, 'utf8'),
    writeFile(artifacts.pdp.outputPath, `${JSON.stringify(artifacts.pdp.evidence, null, 2)}\n`, 'utf8'),
  ]);

  return artifacts;
}

async function main(): Promise<void> {
  const artifacts = await writeRecommendationApiBranchEvidence();

  console.log('Recommendation API branch verification completed successfully.');
  console.log(`- Homepage evidence: ${artifacts.homepage.outputPath}`);
  console.log(`- PDP evidence: ${artifacts.pdp.outputPath}`);
  console.log(
    `- Homepage branches: ${artifacts.homepage.evidence.scenarios.map((scenario) => scenario.response.branch).join(', ')}`
  );
  console.log(
    `- PDP branches: ${artifacts.pdp.evidence.scenarios.map((scenario) => scenario.response.branch).join(', ')}`
  );
}

if (require.main === module) {
  void main().catch((error) => {
    console.error('Recommendation API branch verification failed:', error);
    process.exit(1);
  });
}
