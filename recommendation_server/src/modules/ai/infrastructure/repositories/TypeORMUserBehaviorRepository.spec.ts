import { AppDataSource } from '@/config/database.config';
import { TypeORMUserBehaviorRepository } from './TypeORMUserBehaviorRepository';
import { UserActionType } from '../../enum/user-behavior.enum';
import { BehaviorType } from '../../domain/repositories/IUserBehaviorRepository';

jest.mock('@/config/database.config', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

const createQueryBuilderMock = () => {
  const builder: any = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getRawMany: jest.fn(),
  };

  return builder;
};

describe('TypeORMUserBehaviorRepository', () => {
  const behaviorRepositoryMock = {
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const sessionRepositoryMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce(behaviorRepositoryMock)
      .mockReturnValueOnce(sessionRepositoryMock);
  });

  it('filters out unsupported negative actions from behavior history', async () => {
    const queryBuilder = createQueryBuilderMock();
    queryBuilder.getMany.mockResolvedValue([
      {
        user_id: 7,
        product_id: 101,
        action_type: UserActionType.CLICK,
        metadata: null,
        created_at: new Date('2026-04-01T10:00:00.000Z'),
      },
      {
        user_id: 7,
        product_id: 202,
        action_type: UserActionType.REMOVE_FROM_CART,
        metadata: null,
        created_at: new Date('2026-04-01T10:05:00.000Z'),
      },
      {
        user_id: 7,
        product_id: 303,
        action_type: UserActionType.PURCHASE,
        metadata: null,
        created_at: new Date('2026-04-01T10:10:00.000Z'),
      },
    ]);
    behaviorRepositoryMock.createQueryBuilder.mockReturnValue(queryBuilder);

    const repository = new TypeORMUserBehaviorRepository();
    const history = await repository.getBehaviorHistory(7, 10);

    expect(history).toEqual([
      expect.objectContaining({
        productId: 101,
        behaviorType: BehaviorType.VIEW,
      }),
      expect.objectContaining({
        productId: 303,
        behaviorType: BehaviorType.PURCHASE,
      }),
    ]);
  });

  it('weights stronger actions higher when deriving user preferences', async () => {
    const queryBuilder = createQueryBuilderMock();
    queryBuilder.getMany.mockResolvedValue([
      {
        action_type: UserActionType.VIEW,
        product: {
          category_id: 10,
          brand_id: 100,
          base_price: 100,
        },
      },
      {
        action_type: UserActionType.PURCHASE,
        product: {
          category_id: 20,
          brand_id: 200,
          base_price: 1000,
        },
      },
    ]);
    behaviorRepositoryMock.createQueryBuilder.mockReturnValue(queryBuilder);

    const repository = new TypeORMUserBehaviorRepository();
    const preference = await repository.deriveUserPreferences(9);

    expect(preference.preferredCategories[0]).toBe(20);
    expect(preference.preferredBrands[0]).toBe(200);
    expect(preference.priceRangeMin).toBe(1000);
    expect(preference.priceRangeMax).toBe(1000);
  });
});
