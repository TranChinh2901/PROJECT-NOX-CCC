import { buildRecommendationApiBranchEvidence } from './verify-recommendation-api-branches';

describe('verify-recommendation-api-branches', () => {
  it('builds stable homepage and PDP branch evidence for launch review', async () => {
    const artifacts = await buildRecommendationApiBranchEvidence();

    expect(artifacts.homepage.outputPath).toContain('.sisyphus/evidence/task-8-api-homepage.json');
    expect(artifacts.pdp.outputPath).toContain('.sisyphus/evidence/task-8-api-pdp.json');

    expect(artifacts.homepage.evidence).toEqual(
      expect.objectContaining({
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
            unauthorizedStatus: 401,
            forbiddenStatus: 403,
          },
        },
      })
    );

    expect(artifacts.pdp.evidence.transport).toEqual({
      mountPath: '/api/v1/recommendations',
      auth: {
        required: false,
        unauthorizedStatus: null,
        forbiddenStatus: null,
      },
    });

    expect(artifacts.homepage.evidence.scenarios.map((scenario) => scenario.name)).toEqual([
      'homepage-success-hybrid',
      'homepage-degraded-content-only',
      'homepage-fallback-popularity',
    ]);
    expect(artifacts.homepage.evidence.scenarios.map((scenario) => scenario.response.branch)).toEqual([
      'blend_offline_and_content',
      'content_only',
      'deterministic_popularity_fallback',
    ]);
    expect(artifacts.pdp.evidence.scenarios.map((scenario) => scenario.name)).toEqual([
      'pdp-self-exclusion-content-only',
      'pdp-fallback-deduplicated',
    ]);
    expect(artifacts.pdp.evidence.scenarios.map((scenario) => scenario.response.branch)).toEqual([
      'content_only',
      'deterministic_popularity_fallback',
    ]);

    for (const surface of [artifacts.homepage.evidence, artifacts.pdp.evidence]) {
      for (const scenario of surface.scenarios) {
        expect(scenario.response.metadataShape).toEqual({
          decisionKeys: expect.any(Array),
          recommendationKeys: ['createdAt', 'productId', 'reason', 'score'],
        });
        expect(scenario.response.http).toEqual(
          expect.objectContaining({
            method: 'GET',
            statusCode: 200,
            success: true,
            envelopeKeys: ['data', 'message', 'success'],
          })
        );
        expect(scenario.response.duplicateIds).toEqual([]);
        expect(scenario.response.assertions).toEqual({
          httpOk: true,
          envelopeShape: true,
          metadataShape: true,
          noDuplicates: true,
          exclusionsApplied: true,
          branchMatches: true,
          sourceMatches: true,
        });
      }
    }
  });
});
