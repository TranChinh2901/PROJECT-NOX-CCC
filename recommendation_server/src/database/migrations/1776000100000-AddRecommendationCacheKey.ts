import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecommendationCacheKey1776000100000 implements MigrationInterface {
  name = 'AddRecommendationCacheKey1776000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('recommendation_cache'))) {
      return;
    }

    const hasCacheKey = await queryRunner.hasColumn('recommendation_cache', 'cache_key');

    if (!hasCacheKey) {
      await queryRunner.query(`
        ALTER TABLE \`recommendation_cache\`
        ADD \`cache_key\` VARCHAR(191) NULL AFTER \`id\`
      `);
    }

    await queryRunner.query(`
      UPDATE \`recommendation_cache\`
      SET \`cache_key\` = CONCAT('legacy:', \`id\`, ':type:', \`recommendation_type\`, ':algo:', \`algorithm\`)
      WHERE \`cache_key\` IS NULL OR \`cache_key\` = ''
    `);

    await queryRunner.query(`
      ALTER TABLE \`recommendation_cache\`
      MODIFY \`cache_key\` VARCHAR(191) NOT NULL
    `);

    const table = await queryRunner.getTable('recommendation_cache');
    const hasCacheKeyUnique = table?.indices.some(
      (index) => index.name === 'UQ_recommendation_cache_cache_key'
    );

    if (!hasCacheKeyUnique) {
      await queryRunner.query(`
        ALTER TABLE \`recommendation_cache\`
        ADD UNIQUE KEY \`UQ_recommendation_cache_cache_key\` (\`cache_key\`)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('recommendation_cache'))) {
      return;
    }

    const table = await queryRunner.getTable('recommendation_cache');
    const hasCacheKeyUnique = table?.indices.some(
      (index) => index.name === 'UQ_recommendation_cache_cache_key'
    );

    if (hasCacheKeyUnique) {
      await queryRunner.query(`
        ALTER TABLE \`recommendation_cache\`
        DROP INDEX \`UQ_recommendation_cache_cache_key\`
      `);
    }

    if (await queryRunner.hasColumn('recommendation_cache', 'cache_key')) {
      await queryRunner.query(`
        ALTER TABLE \`recommendation_cache\`
        DROP COLUMN \`cache_key\`
      `);
    }
  }
}
