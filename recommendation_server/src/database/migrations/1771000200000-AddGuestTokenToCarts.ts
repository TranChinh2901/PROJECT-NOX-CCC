import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddGuestTokenToCarts1771000200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('carts');
    if (!table) return;

    const hasGuestToken = table.columns.some(column => column.name === 'guest_token');
    if (!hasGuestToken) {
      await queryRunner.addColumn(
        'carts',
        new TableColumn({
          name: 'guest_token',
          type: 'varchar',
          length: '64',
          isNullable: true,
        })
      );
    }

    const refreshedTable = await queryRunner.getTable('carts');
    if (!refreshedTable) return;

    const hasGuestTokenUnique = refreshedTable.indices.some(index =>
      index.isUnique && index.columnNames.length === 1 && index.columnNames[0] === 'guest_token'
    );
    if (!hasGuestTokenUnique) {
      await queryRunner.createIndex(
        'carts',
        new TableIndex({
          name: 'UQ_carts_guest_token',
          columnNames: ['guest_token'],
          isUnique: true,
        })
      );
    }

    const hasGuestTokenIndex = refreshedTable.indices.some(index => index.name === 'IDX_carts_guest_token');
    if (!hasGuestTokenIndex) {
      await queryRunner.createIndex(
        'carts',
        new TableIndex({
          name: 'IDX_carts_guest_token',
          columnNames: ['guest_token'],
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('carts');
    if (!table) return;

    const guestTokenIndex = table.indices.find(index => index.name === 'IDX_carts_guest_token');
    if (guestTokenIndex) {
      await queryRunner.dropIndex('carts', guestTokenIndex);
    }

    const guestTokenUnique = table.indices.find(index => index.name === 'UQ_carts_guest_token');
    if (guestTokenUnique) {
      await queryRunner.dropIndex('carts', guestTokenUnique);
    }

    const hasGuestToken = table.columns.some(column => column.name === 'guest_token');
    if (hasGuestToken) {
      await queryRunner.dropColumn('carts', 'guest_token');
    }
  }
}
