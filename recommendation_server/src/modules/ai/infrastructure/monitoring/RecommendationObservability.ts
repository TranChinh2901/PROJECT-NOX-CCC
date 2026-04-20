export type RecommendationSurface = 'homepage' | 'similar';

export type RecommendationCacheStatus = 'hit' | 'miss';

export type RecommendationArtifactState = 'healthy' | 'stale' | 'missing' | 'invalid';

export interface RecommendationTraceInput {
  surface: RecommendationSurface;
  source: string;
  branch: string;
  fallbackReason?: string;
  cacheStatus: RecommendationCacheStatus;
  artifactState: RecommendationArtifactState;
  resultCount: number;
}

export interface RecommendationTrace extends RecommendationTraceInput {
  generatedAt: string;
  decisionPath: string;
}

const SENSITIVE_PATTERN = /(token|secret|password|api[_-]?key|bearer|session|cookie|@|:\/\/)/i;

export function sanitizeRecommendationText(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return SENSITIVE_PATTERN.test(value) ? '[redacted]' : value;
}

export function buildRecommendationTrace(
  input: RecommendationTraceInput,
  now: Date = new Date()
): RecommendationTrace {
  const trace = {
    ...input,
    fallbackReason: sanitizeRecommendationText(input.fallbackReason),
    generatedAt: now.toISOString(),
    decisionPath: `${input.surface}:${input.source}/${input.branch}`,
  };

  return trace;
}

export function logRecommendationTrace(
  input: RecommendationTraceInput,
  now: Date = new Date()
): RecommendationTrace {
  const trace = buildRecommendationTrace(input, now);
  const message = JSON.stringify(trace);

  if (trace.cacheStatus === 'hit') {
    console.info('[recommendation] request-resolved', message);
  } else {
    console.warn('[recommendation] request-resolved', message);
  }

  return trace;
}
