import { QueryRunner, TableColumn } from 'typeorm';

import { V2BaselineSchema1771000000000 } from '@/database/migrations/1771000000000-V2BaselineSchema';
import { AddDeletedAtToProductImages1775467000000 } from '@/database/migrations/1775467000000-AddDeletedAtToProductImages';

describe('product_images deleted_at migrations', () => {
  it('adds deleted_at to the baseline product_images schema', async () => {
    const queryRunner = {
      hasTable: jest.fn().mockResolvedValue(false),
      query: jest.fn().mockResolvedValue(undefined),
    } as unknown as QueryRunner;

    await new V2BaselineSchema1771000000000().up(queryRunner);

    const createProductImagesSql = (queryRunner.query as jest.Mock).mock.calls
      .map(([sql]) => String(sql))
      .find((sql) => sql.includes('CREATE TABLE `product_images`'));

    expect(createProductImagesSql).toBeDefined();
    expect(createProductImagesSql).toContain('`deleted_at` DATETIME NULL');
  });

  it('patches existing databases that are missing product_images.deleted_at', async () => {
    const queryRunner = {
      hasColumn: jest.fn().mockResolvedValue(false),
      addColumn: jest.fn().mockResolvedValue(undefined),
    } as unknown as QueryRunner;

    await new AddDeletedAtToProductImages1775467000000().up(queryRunner);

    expect(queryRunner.hasColumn).toHaveBeenCalledWith('product_images', 'deleted_at');
    expect(queryRunner.addColumn).toHaveBeenCalledTimes(1);
    expect((queryRunner.addColumn as jest.Mock).mock.calls[0][0]).toBe('product_images');

    const addedColumn = (queryRunner.addColumn as jest.Mock).mock.calls[0][1] as TableColumn;
    expect(addedColumn.name).toBe('deleted_at');
    expect(addedColumn.type).toBe('datetime');
    expect(addedColumn.isNullable).toBe(true);
  });

  it('skips the patch when product_images.deleted_at already exists', async () => {
    const queryRunner = {
      hasColumn: jest.fn().mockResolvedValue(true),
      addColumn: jest.fn().mockResolvedValue(undefined),
    } as unknown as QueryRunner;

    await new AddDeletedAtToProductImages1775467000000().up(queryRunner);

    expect(queryRunner.addColumn).not.toHaveBeenCalled();
  });
});
