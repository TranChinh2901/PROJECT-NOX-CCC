import { MigrationInterface, QueryRunner } from 'typeorm';

export class WidenOrderAmountPrecision1775700000000 implements MigrationInterface {
  name = 'WidenOrderAmountPrecision1775700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('carts')) {
      await queryRunner.query(`
        ALTER TABLE \`carts\`
        MODIFY \`total_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0
      `);
    }

    if (await queryRunner.hasTable('orders')) {
      await queryRunner.query(`
        ALTER TABLE \`orders\`
        MODIFY \`subtotal\` DECIMAL(12,2) NOT NULL,
        MODIFY \`discount_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0,
        MODIFY \`shipping_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0,
        MODIFY \`tax_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0,
        MODIFY \`total_amount\` DECIMAL(12,2) NOT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('orders')) {
      await queryRunner.query(`
        ALTER TABLE \`orders\`
        MODIFY \`subtotal\` DECIMAL(10,2) NOT NULL,
        MODIFY \`discount_amount\` DECIMAL(10,2) NOT NULL DEFAULT 0,
        MODIFY \`shipping_amount\` DECIMAL(10,2) NOT NULL DEFAULT 0,
        MODIFY \`tax_amount\` DECIMAL(10,2) NOT NULL DEFAULT 0,
        MODIFY \`total_amount\` DECIMAL(10,2) NOT NULL
      `);
    }

    if (await queryRunner.hasTable('carts')) {
      await queryRunner.query(`
        ALTER TABLE \`carts\`
        MODIFY \`total_amount\` DECIMAL(10,2) NOT NULL DEFAULT 0
      `);
    }
  }
}
