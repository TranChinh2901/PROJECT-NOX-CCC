import 'reflect-metadata';
import { Product } from '@/modules/products/entity/product';
import { TypeORMProductFeatureRepository } from './TypeORMProductFeatureRepository';

describe('TypeORMProductFeatureRepository', () => {
  describe('toDomainFeature', () => {
    it('maps base_price and loaded reviews into the domain feature', () => {
      const repository = Object.create(TypeORMProductFeatureRepository.prototype) as any;

      const product = Object.assign(new Product(), {
        id: 7,
        category_id: 12,
        brand_id: 3,
        base_price: '1599.50' as unknown as number,
        reviews: [{ rating: 5 }, { rating: 4 }, { rating: 3 }],
      });

      const feature = repository.toDomainFeature(product);

      expect(feature).toEqual({
        productId: 7,
        categoryId: 12,
        brandId: 3,
        price: 1599.5,
        avgRating: 4,
        reviewCount: 3,
        purchaseCount: 0,
      });
    });
  });

  describe('findSimilar', () => {
    it('queries against base_price instead of non-existent legacy price columns', async () => {
      const getMany = jest.fn().mockResolvedValue([]);
      const setParameter = jest.fn().mockReturnThis();
      const orderBy = jest.fn().mockReturnValue({ getMany, setParameter });
      const andWhere = jest.fn().mockReturnThis();
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere,
        orderBy,
        setParameter,
        limit: jest.fn().mockReturnThis(),
        getMany,
      };

      const repository = Object.create(TypeORMProductFeatureRepository.prototype) as any;

      repository.repository = {
        findOne: jest.fn().mockResolvedValue({
          id: 5,
          category_id: 9,
          base_price: 1000,
          reviews: [],
        }),
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      };

      await repository.findSimilar(5, 6);

      expect(andWhere).toHaveBeenCalledWith('product.base_price BETWEEN :priceMin AND :priceMax', {
        priceMin: 700,
        priceMax: 1300,
      });
      expect(orderBy).toHaveBeenCalledWith('ABS(product.base_price - :targetPrice)', 'ASC');
      expect(setParameter).toHaveBeenCalledWith('targetPrice', 1000);
    });
  });
});
