import {
  calculateCosineSimilarity,
  isUsableEmbeddingVector,
} from './recommendation-embedding-similarity';

describe('recommendation embedding similarity', () => {
  it('calculates cosine similarity for normalized and non-normalized vectors', () => {
    expect(calculateCosineSimilarity([1, 0], [2, 0])).toBe(1);
    expect(calculateCosineSimilarity([1, 0], [0, 1])).toBe(0);
    expect(calculateCosineSimilarity([1, 1], [1, 0])).toBeCloseTo(0.707106, 5);
  });

  it('returns zero for unusable vector pairs', () => {
    expect(calculateCosineSimilarity([], [])).toBe(0);
    expect(calculateCosineSimilarity([1, 2], [1])).toBe(0);
    expect(calculateCosineSimilarity([0, 0], [1, 1])).toBe(0);
    expect(calculateCosineSimilarity([1, Number.NaN], [1, 1])).toBe(0);
  });

  it('recognizes usable embedding vectors', () => {
    expect(isUsableEmbeddingVector([0.1, 0.2])).toBe(true);
    expect(isUsableEmbeddingVector([])).toBe(false);
    expect(isUsableEmbeddingVector(undefined)).toBe(false);
    expect(isUsableEmbeddingVector([0.1, Number.POSITIVE_INFINITY])).toBe(false);
  });
});
