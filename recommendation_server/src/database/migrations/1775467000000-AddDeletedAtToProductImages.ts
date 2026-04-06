import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDeletedAtToProductImages1775467000000 implements MigrationInterface {
  name = 'AddDeletedAtToProductImages1775467000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasDeletedAt = await queryRunner.hasColumn('product_images', 'deleted_at');

    if (!hasDeletedAt) {
      await queryRunner.addColumn(
        'product_images',
        new TableColumn({
          name: 'deleted_at',
          type: 'datetime',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasDeletedAt = await queryRunner.hasColumn('product_images', 'deleted_at');

    if (hasDeletedAt) {
      await queryRunner.dropColumn('product_images', 'deleted_at');
    }
  }
}
