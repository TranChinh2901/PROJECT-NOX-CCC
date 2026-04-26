import 'reflect-metadata';
import { Product } from '../../../products/entity/product';
import { OrderStatus } from '../../../orders/enum/order.enum';
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
        embedding: [0.1, '0.2', 0.3],
        reviews: [{ rating: 5 }, { rating: 4 }, { rating: 3 }],
      });

      const feature = repository.toDomainFeature(product, 9);

      expect(feature).toEqual({
        productId: 7,
        categoryId: 12,
        brandId: 3,
        price: 1599.5,
        avgRating: 4,
        reviewCount: 3,
        purchaseCount: 9,
        featureVector: [0.1, 0.2, 0.3],
      });
    });

    it('omits unusable embedding values from the domain feature', () => {
      const repository = Object.create(TypeORMProductFeatureRepository.prototype) as any;

      const product = Object.assign(new Product(), {
        id: 7,
        category_id: 12,
        base_price: 100,
        embedding: '[0.1,"bad"]',
        reviews: [],
      });

      const feature = repository.toDomainFeature(product, 0);

      expect(feature).not.toHaveProperty('featureVector');
    });
  });

  describe('eligibility filters', () => {
    it('filters inactive and deleted products in getById', async () => {
      const getOne = jest.fn().mockResolvedValue(null);
      const queryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne,
      };

      const repository = Object.create(TypeORMProductFeatureRepository.prototype) as any;
      repository.repository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      };

      const result = await repository.getById(11);

      expect(result).toBeNull();
      expect(queryBuilder.where).toHaveBeenCalledWith('product.id = :productId', {
        productId: 11,
      });
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        1,
        'product.is_active = :isActive',
        { isActive: true }
      );
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(2, 'product.deleted_at IS NULL');
    });

    it('filters inactive and deleted products in getByIds', async () => {
      const getMany = jest.fn().mockResolvedValue([]);
      const queryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        whereInIds: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany,
      };

      const repository = Object.create(TypeORMProductFeatureRepository.prototype) as any;
      repository.repository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      };

      await repository.getByIds([2, 4, 6]);

      expect(queryBuilder.whereInIds).toHaveBeenCalledWith([2, 4, 6]);
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        1,
        'product.is_active = :isActive',
        { isActive: true }
      );
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(2, 'product.deleted_at IS NULL');
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

      expect(repository.repository.findOne).toHaveBeenCalledWith({
        where: { id: 5, is_active: true, deleted_at: expect.anything() },
        relations: ['category', 'brand', 'reviews'],
      });
      expect(andWhere).toHaveBeenCalledWith('product.base_price BETWEEN :priceMin AND :priceMax', {
        priceMin: 700,
        priceMax: 1300,
      });
      expect(andWhere).toHaveBeenCalledWith('product.is_active = :isActive', { isActive: true });
      expect(andWhere).toHaveBeenCalledWith('product.deleted_at IS NULL');
      expect(orderBy).toHaveBeenCalledWith('ABS(product.base_price - :targetPrice)', 'ASC');
      expect(setParameter).toHaveBeenCalledWith('targetPrice', 1000);
    });
  });

  describe('loadPurchaseCountsByProductIds', () => {
    it('sums eligible order item quantities by product id', async () => {
      const getRawMany = jest.fn().mockResolvedValue([
        { product_id: '7', purchase_count: '12' },
        { product_id: '8', purchase_count: '3' },
      ]);
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany,
      };

      const repository = Object.create(TypeORMProductFeatureRepository.prototype) as any;
      repository.orderItemRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      };

      const counts = await repository.loadPurchaseCountsByProductIds([7, 8]);

      expect(counts).toEqual(
        new Map([
          [7, 12],
          [8, 3],
        ])
      );
      expect(repository.orderItemRepository.createQueryBuilder).toHaveBeenCalledWith('orderItem');
      expect(queryBuilder.select).toHaveBeenCalledWith('variant.product_id', 'product_id');
      expect(queryBuilder.addSelect).toHaveBeenCalledWith(
        'COALESCE(SUM(orderItem.quantity), 0)',
        'purchase_count'
      );
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        expect.any(Function),
        'variant',
        'variant.id = orderItem.variant_id'
      );
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        expect.any(Function),
        'order',
        'order.id = orderItem.order_id AND order.deleted_at IS NULL AND order.status IN (:...eligibleStatuses)',
        {
          eligibleStatuses: [
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
          ],
        }
      );
      expect(queryBuilder.where).toHaveBeenCalledWith('variant.product_id IN (:...productIds)', {
        productIds: [7, 8],
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('variant.deleted_at IS NULL');
      expect(queryBuilder.groupBy).toHaveBeenCalledWith('variant.product_id');
    });
  });
});
