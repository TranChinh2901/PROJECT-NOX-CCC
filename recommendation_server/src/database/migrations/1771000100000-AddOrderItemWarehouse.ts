import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderItemWarehouse1771000100000 implements MigrationInterface {
  name = 'AddOrderItemWarehouse1771000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`order_items\`
      ADD COLUMN \`warehouse_id\` INT NULL AFTER \`variant_id\`
    `);

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

    await queryRunner.query(`
      CREATE INDEX \`IDX_order_items_warehouse_id\`
      ON \`order_items\` (\`warehouse_id\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`order_items\`
      ADD CONSTRAINT \`FK_order_items_warehouse\`
      FOREIGN KEY (\`warehouse_id\`) REFERENCES \`warehouses\`(\`id\`)
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`order_items\`
      DROP FOREIGN KEY \`FK_order_items_warehouse\`
    `);

    await queryRunner.query(`
      DROP INDEX \`IDX_order_items_warehouse_id\`
      ON \`order_items\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`order_items\`
      DROP COLUMN \`warehouse_id\`
    `);
  }
}
