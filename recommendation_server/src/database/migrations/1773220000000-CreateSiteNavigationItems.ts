import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSiteNavigationItems1773220000000 implements MigrationInterface {
  name = 'CreateSiteNavigationItems1773220000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`site_navigation_items\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`location\` varchar(50) NOT NULL DEFAULT 'header_primary',
        \`label\` varchar(100) NOT NULL,
        \`href\` varchar(255) NOT NULL,
        \`target\` varchar(20) NOT NULL DEFAULT '_self',
        \`sort_order\` int NOT NULL DEFAULT '0',
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_site_navigation_location_active_sort\` (\`location\`, \`is_active\`, \`sort_order\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      INSERT INTO \`site_navigation_items\`
        (\`location\`, \`label\`, \`href\`, \`target\`, \`sort_order\`, \`is_active\`)
      VALUES
        ('header_primary', 'Khuyến Mãi Hôm Nay', '/deals', '_self', 1, 1),
        ('header_primary', 'Dịch Vụ Khách Hàng', '/service', '_self', 2, 1),
        ('header_primary', 'Thẻ Quà Tặng', '/giftcards', '_self', 3, 1),
        ('header_primary', 'Bán Hàng', '/sell', '_self', 4, 1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `site_navigation_items`');
  }
}
