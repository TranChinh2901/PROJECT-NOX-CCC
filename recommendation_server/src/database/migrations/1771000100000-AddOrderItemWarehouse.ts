import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderItemWarehouse1771000100000 implements MigrationInterface {
  name = 'AddOrderItemWarehouse1771000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('order_items');
    if (!table) return;

    const hasWarehouseColumn = table.columns.some(column => column.name === 'warehouse_id');
    if (!hasWarehouseColumn) {
      await queryRunner.query(`
        ALTER TABLE \`order_items\`
        ADD COLUMN \`warehouse_id\` INT NULL AFTER \`variant_id\`
      `);
    }

    await queryRunner.query(`
      UPDATE \`order_items\` oi
      LEFT JOIN (
        SELECT \`variant_id\`, MIN(\`warehouse_id\`) AS \`warehouse_id\`, COUNT(*) AS \`inventory_rows\`
        FROM \`inventory\`
        GROUP BY \`variant_id\`
      ) inv ON inv.\`variant_id\` = oi.\`variant_id\`
      SET oi.\`warehouse_id\` = CASE
        WHEN inv.\`inventory_rows\` = 1 THEN inv.\`warehouse_id\`
        ELSE NULL
      END
      WHERE oi.\`warehouse_id\` IS NULL
    `);

    const refreshedTable = await queryRunner.getTable('order_items');
    if (!refreshedTable) return;

    const hasWarehouseIndex = refreshedTable.indices.some(index => index.name === 'IDX_order_items_warehouse_id');
    if (!hasWarehouseIndex) {
      await queryRunner.query(`
        CREATE INDEX \`IDX_order_items_warehouse_id\`
        ON \`order_items\` (\`warehouse_id\`)
      `);
    }

    const hasWarehouseFk = refreshedTable.foreignKeys.some(foreignKey => foreignKey.name === 'FK_order_items_warehouse');
    if (!hasWarehouseFk) {
      await queryRunner.query(`
        ALTER TABLE \`order_items\`
        ADD CONSTRAINT \`FK_order_items_warehouse\`
        FOREIGN KEY (\`warehouse_id\`) REFERENCES \`warehouses\`(\`id\`)
        ON DELETE SET NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('order_items');
    if (!table) return;

    const warehouseFk = table.foreignKeys.find(foreignKey => foreignKey.name === 'FK_order_items_warehouse');
    if (warehouseFk) {
      await queryRunner.query(`
        ALTER TABLE \`order_items\`
        DROP FOREIGN KEY \`FK_order_items_warehouse\`
      `);
    }

    const warehouseIndex = table.indices.find(index => index.name === 'IDX_order_items_warehouse_id');
    if (warehouseIndex) {
      await queryRunner.query(`
        DROP INDEX \`IDX_order_items_warehouse_id\`
        ON \`order_items\`
      `);
    }

    const hasWarehouseColumn = table.columns.some(column => column.name === 'warehouse_id');
    if (hasWarehouseColumn) {
      await queryRunner.query(`
        ALTER TABLE \`order_items\`
        DROP COLUMN \`warehouse_id\`
      `);
    }
  }
}
