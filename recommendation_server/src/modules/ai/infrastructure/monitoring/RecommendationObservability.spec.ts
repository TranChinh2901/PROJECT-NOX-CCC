import {
  buildRecommendationTrace,
  logRecommendationTrace,
  sanitizeRecommendationText,
} from './RecommendationObservability';

describe('RecommendationObservability', () => {
  it('builds trace metadata with source, fallback reason, cache status, and result count', () => {
    const trace = buildRecommendationTrace(
      {
        surface: 'homepage',
        source: 'offline',
        branch: 'active_offline_precomputed',
        fallbackReason: 'offline-cache-missing-or-stale',
        cacheStatus: 'hit',
        artifactState: 'healthy',
        resultCount: 4,
      },
      new Date('2026-04-20T00:00:00.000Z')
    );

    expect(trace).toEqual({
      surface: 'homepage',
      source: 'offline',
      branch: 'active_offline_precomputed',
      fallbackReason: 'offline-cache-missing-or-stale',
      cacheStatus: 'hit',
      artifactState: 'healthy',
      resultCount: 4,
      generatedAt: '2026-04-20T00:00:00.000Z',
      decisionPath: 'homepage:offline/active_offline_precomputed',
    });
  });

  it('redacts sensitive fallback text before logging', () => {
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const trace = logRecommendationTrace({
      surface: 'similar',
      source: 'content',
      branch: 'content_only',
      fallbackReason: 'secret-token=abc123@example.com',
      cacheStatus: 'miss',
      artifactState: 'stale',
      resultCount: 2,
    }, new Date('2026-04-20T00:00:00.000Z'));

    expect(trace.fallbackReason).toBe('[redacted]');
    expect(warnSpy).toHaveBeenCalledWith(
      '[recommendation] request-resolved',
      expect.stringContaining('"resultCount":2')
    );
    expect(warnSpy).toHaveBeenCalledWith(
      '[recommendation] request-resolved',
      expect.stringContaining('"decisionPath":"similar:content/content_only"')
    );

    const loggedPayload = JSON.parse((warnSpy.mock.calls[0] as unknown[])[1] as string);
    expect(loggedPayload).toEqual(
      expect.objectContaining({
        source: 'content',
        fallbackReason: '[redacted]',
        cacheStatus: 'miss',
        artifactState: 'stale',
        resultCount: 2,
      })
    );
    expect(JSON.stringify(loggedPayload)).not.toContain('abc123');
    expect(JSON.stringify(loggedPayload)).not.toContain('@example.com');

    infoSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('leaves safe non-sensitive text unchanged', () => {
    expect(sanitizeRecommendationText('offline-cache-missing-or-stale')).toBe(
      'offline-cache-missing-or-stale'
    );
  });
});
