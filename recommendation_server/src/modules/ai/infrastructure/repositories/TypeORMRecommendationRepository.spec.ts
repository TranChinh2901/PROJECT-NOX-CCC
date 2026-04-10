import { AppDataSource } from '@/config/database.config';
import { Recommendation } from '../../domain/entities/Recommendation';
import { RecommendationType } from '../../enum/recommendation.enum';
import { TypeORMRecommendationRepository } from './TypeORMRecommendationRepository';

jest.mock('@/config/database.config', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('TypeORMRecommendationRepository', () => {
  const repositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(repositoryMock);
  });

  it('upserts by cache_key when saving personalized recommendations', async () => {
    repositoryMock.update.mockResolvedValue({ affected: 1 });
    repositoryMock.upsert.mockResolvedValue({ identifiers: [], generatedMaps: [], raw: {} });

    const recommendationRepository = new TypeORMRecommendationRepository();
    const recommendations = [
      Recommendation.create(60, 0.92, 'matches your preferred category'),
    ];

    await recommendationRepository.save(102, recommendations);

    expect(repositoryMock.update).toHaveBeenCalledWith(
      {
        user_id: 102,
        is_active: true,
        recommendation_type: RecommendationType.PERSONALIZED,
        algorithm: 'content_based',
      },
      { is_active: false }
    );
    expect(repositoryMock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        cache_key: 'user:102:type:personalized:algo:content_based',
        user_id: 102,
        recommendation_type: RecommendationType.PERSONALIZED,
        algorithm: 'content_based',
        recommended_products: [
          expect.objectContaining({
            productId: 60,
            score: 0.92,
            reason: 'matches your preferred category',
          }),
        ],
        is_active: true,
        cache_hit_count: 0,
        generated_at: expect.any(Date),
        expires_at: expect.any(Date),
      }),
      ['cache_key']
    );
  });

  it('only checks fresh active content-based personalized cache entries', async () => {
    repositoryMock.findOne.mockResolvedValue({
      generated_at: new Date(),
      expires_at: new Date(Date.now() + 60_000),
    });

    const recommendationRepository = new TypeORMRecommendationRepository();

    await expect(recommendationRepository.hasFreshRecommendations(55, 60)).resolves.toBe(true);
    expect(repositoryMock.findOne).toHaveBeenCalledWith({
      where: {
        user_id: 55,
        is_active: true,
        recommendation_type: RecommendationType.PERSONALIZED,
        algorithm: 'content_based',
      },
      order: {
        generated_at: 'DESC',
      },
    });
  });
});
