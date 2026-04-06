import { MigrationInterface, QueryRunner } from 'typeorm';

export class V2BaselineSchema1771000000000 implements MigrationInterface {
  name = 'V2BaselineSchema1771000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasUsersTable = await queryRunner.hasTable('users');
    if (hasUsersTable) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`fullname\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(150) NOT NULL,
        \`phone_number\` VARCHAR(20) NOT NULL,
        \`address\` VARCHAR(255) NULL,
        \`avatar\` VARCHAR(255) NULL,
        \`password\` VARCHAR(255) NOT NULL,
        \`gender\` ENUM('male', 'female') NULL,
        \`date_of_birth\` DATE NULL,
        \`is_verified\` TINYINT(1) NOT NULL DEFAULT 0,
        \`role\` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_users_email\` (\`email\`),
        UNIQUE KEY \`UQ_users_phone_number\` (\`phone_number\`),
        KEY \`IDX_users_email\` (\`email\`)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`user_sessions\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`user_id\` INT NULL,
        \`session_token\` VARCHAR(255) NOT NULL,
        \`ip_address\` VARCHAR(45) NULL,
        \`user_agent\` VARCHAR(500) NULL,
        \`device_type\` ENUM('desktop', 'mobile', 'tablet', 'unknown') NOT NULL DEFAULT 'unknown',
        \`started_at\` DATETIME NOT NULL,
        \`ended_at\` DATETIME NULL,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_user_sessions_session_token\` (\`session_token\`),
        KEY \`IDX_user_sessions_user_id\` (\`user_id\`),
        KEY \`IDX_user_sessions_is_active\` (\`is_active\`),
        CONSTRAINT \`FK_user_sessions_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`user_addresses\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`user_id\` INT NOT NULL,
        \`label\` VARCHAR(100) NOT NULL,
        \`address_line1\` VARCHAR(255) NOT NULL,
        \`address_line2\` VARCHAR(255) NULL,
        \`city\` VARCHAR(100) NOT NULL,
        \`state\` VARCHAR(100) NOT NULL,
        \`postal_code\` VARCHAR(20) NOT NULL,
        \`country\` VARCHAR(100) NOT NULL,
        \`is_default\` TINYINT(1) NOT NULL DEFAULT 0,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_user_addresses_user_id\` (\`user_id\`),
        CONSTRAINT \`FK_user_addresses_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`categories\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`name\` VARCHAR(100) NOT NULL,
        \`slug\` VARCHAR(100) NOT NULL,
        \`description\` TEXT NULL,
        \`parent_id\` INT NULL,
        \`image_url\` VARCHAR(255) NULL,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_categories_name\` (\`name\`),
        UNIQUE KEY \`UQ_categories_slug\` (\`slug\`),
        KEY \`IDX_categories_slug\` (\`slug\`),
        KEY \`IDX_categories_parent_id\` (\`parent_id\`),
        CONSTRAINT \`FK_categories_parent\` FOREIGN KEY (\`parent_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`brands\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`name\` VARCHAR(100) NOT NULL,
        \`slug\` VARCHAR(100) NOT NULL,
        \`description\` TEXT NULL,
        \`logo_url\` VARCHAR(255) NULL,
        \`website_url\` VARCHAR(255) NULL,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_brands_name\` (\`name\`),
        UNIQUE KEY \`UQ_brands_slug\` (\`slug\`),
        KEY \`IDX_brands_slug\` (\`slug\`)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`products\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`category_id\` INT NOT NULL,
        \`brand_id\` INT NULL,
        \`name\` VARCHAR(200) NOT NULL,
        \`slug\` VARCHAR(200) NOT NULL,
        \`sku\` VARCHAR(100) NOT NULL,
        \`description\` TEXT NOT NULL,
        \`short_description\` VARCHAR(500) NULL,
        \`base_price\` DECIMAL(10,2) NOT NULL,
        \`compare_at_price\` DECIMAL(10,2) NULL,
        \`cost_price\` DECIMAL(10,2) NULL,
        \`weight_kg\` DECIMAL(8,3) NULL,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`is_featured\` TINYINT(1) NOT NULL DEFAULT 0,
        \`meta_title\` VARCHAR(255) NULL,
        \`meta_description\` VARCHAR(500) NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_products_slug\` (\`slug\`),
        UNIQUE KEY \`UQ_products_sku\` (\`sku\`),
        KEY \`IDX_products_category_id\` (\`category_id\`),
        KEY \`IDX_products_brand_id\` (\`brand_id\`),
        KEY \`IDX_products_is_active\` (\`is_active\`),
        KEY \`IDX_products_is_featured\` (\`is_featured\`),
        KEY \`IDX_products_slug\` (\`slug\`),
        KEY \`IDX_products_sku\` (\`sku\`),
        CONSTRAINT \`FK_products_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_products_brand\` FOREIGN KEY (\`brand_id\`) REFERENCES \`brands\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`product_variants\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`product_id\` INT NOT NULL,
        \`sku\` VARCHAR(100) NOT NULL,
        \`size\` VARCHAR(50) NULL,
        \`color\` VARCHAR(50) NULL,
        \`color_code\` VARCHAR(7) NULL,
        \`material\` VARCHAR(50) NULL,
        \`price_adjustment\` DECIMAL(10,2) NOT NULL DEFAULT 0,
        \`final_price\` DECIMAL(10,2) NOT NULL,
        \`weight_kg\` DECIMAL(8,3) NULL,
        \`barcode\` VARCHAR(100) NULL,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_product_variants_sku\` (\`sku\`),
        UNIQUE KEY \`UQ_product_variants_barcode\` (\`barcode\`),
        KEY \`IDX_product_variants_product_id\` (\`product_id\`),
        KEY \`IDX_product_variants_is_active\` (\`is_active\`),
        KEY \`IDX_product_variants_sku\` (\`sku\`),
        CONSTRAINT \`FK_product_variants_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`product_images\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`product_id\` INT NOT NULL,
        \`variant_id\` INT NULL,
        \`image_url\` VARCHAR(500) NOT NULL,
        \`thumbnail_url\` VARCHAR(500) NULL,
        \`alt_text\` VARCHAR(255) NULL,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`is_primary\` TINYINT(1) NOT NULL DEFAULT 0,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_product_images_product_id\` (\`product_id\`),
        KEY \`IDX_product_images_variant_id\` (\`variant_id\`),
        KEY \`IDX_product_images_is_primary\` (\`is_primary\`),
        CONSTRAINT \`FK_product_images_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_product_images_variant\` FOREIGN KEY (\`variant_id\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`warehouses\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`name\` VARCHAR(100) NOT NULL,
        \`code\` VARCHAR(20) NOT NULL,
        \`address\` VARCHAR(255) NOT NULL,
        \`city\` VARCHAR(100) NOT NULL,
        \`country\` VARCHAR(100) NOT NULL DEFAULT 'Vietnam',
        \`contact_name\` VARCHAR(100) NULL,
        \`contact_phone\` VARCHAR(20) NULL,
        \`contact_email\` VARCHAR(150) NULL,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`is_default\` TINYINT(1) NOT NULL DEFAULT 0,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_warehouses_code\` (\`code\`)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`inventory\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`variant_id\` INT NOT NULL,
        \`warehouse_id\` INT NOT NULL,
        \`quantity_available\` INT NOT NULL DEFAULT 0,
        \`quantity_reserved\` INT NOT NULL DEFAULT 0,
        \`quantity_total\` INT NOT NULL DEFAULT 0,
        \`reorder_level\` INT NOT NULL DEFAULT 10,
        \`reorder_quantity\` INT NULL,
        \`last_counted_at\` DATETIME NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_inventory_variant_warehouse\` (\`variant_id\`, \`warehouse_id\`),
        KEY \`IDX_inventory_variant_id\` (\`variant_id\`),
        KEY \`IDX_inventory_warehouse_id\` (\`warehouse_id\`),
        KEY \`IDX_inventory_quantity_available\` (\`quantity_available\`),
        CONSTRAINT \`FK_inventory_variant\` FOREIGN KEY (\`variant_id\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_inventory_warehouse\` FOREIGN KEY (\`warehouse_id\`) REFERENCES \`warehouses\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`inventory_logs\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`inventory_id\` INT NOT NULL,
        \`action_type\` ENUM('sale', 'restock', 'adjustment', 'return', 'transfer_in', 'transfer_out') NOT NULL,
        \`quantity_change\` INT NOT NULL,
        \`quantity_before\` INT NOT NULL,
        \`quantity_after\` INT NOT NULL,
        \`reference_id\` INT NULL,
        \`reference_type\` VARCHAR(50) NULL,
        \`notes\` TEXT NULL,
        \`performed_by_user_id\` INT NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_inventory_logs_inventory_id\` (\`inventory_id\`),
        KEY \`IDX_inventory_logs_performed_by_user_id\` (\`performed_by_user_id\`),
        KEY \`IDX_inventory_logs_action_type\` (\`action_type\`),
        KEY \`IDX_inventory_logs_created_at\` (\`created_at\`),
        CONSTRAINT \`FK_inventory_logs_inventory\` FOREIGN KEY (\`inventory_id\`) REFERENCES \`inventory\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_inventory_logs_performed_by_user\` FOREIGN KEY (\`performed_by_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`carts\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`user_id\` INT NULL,
        \`guest_token\` VARCHAR(64) NULL,
        \`status\` ENUM('active', 'converted', 'abandoned') NOT NULL DEFAULT 'active',
        \`total_amount\` DECIMAL(10,2) NOT NULL DEFAULT 0,
        \`item_count\` INT NOT NULL DEFAULT 0,
        \`currency\` VARCHAR(3) NOT NULL DEFAULT 'VND',
        \`expires_at\` DATETIME NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_carts_guest_token\` (\`guest_token\`),
        KEY \`IDX_carts_user_id\` (\`user_id\`),
        KEY \`IDX_carts_guest_token\` (\`guest_token\`),
        KEY \`IDX_carts_status\` (\`status\`),
        CONSTRAINT \`FK_carts_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`cart_items\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`cart_id\` INT NOT NULL,
        \`variant_id\` INT NOT NULL,
        \`quantity\` INT NOT NULL DEFAULT 1,
        \`unit_price\` DECIMAL(10,2) NOT NULL,
        \`total_price\` DECIMAL(10,2) NOT NULL,
        \`added_at\` DATETIME NOT NULL,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_cart_items_cart_variant\` (\`cart_id\`, \`variant_id\`),
        KEY \`IDX_cart_items_cart_id\` (\`cart_id\`),
        KEY \`IDX_cart_items_variant_id\` (\`variant_id\`),
        CONSTRAINT \`FK_cart_items_cart\` FOREIGN KEY (\`cart_id\`) REFERENCES \`carts\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_cart_items_variant\` FOREIGN KEY (\`variant_id\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`orders\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`order_number\` VARCHAR(20) NOT NULL,
        \`user_id\` INT NOT NULL,
        \`cart_id\` INT NULL,
        \`status\` ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
        \`payment_status\` ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
        \`payment_method\` ENUM('cod', 'credit_card', 'bank_transfer', 'e_wallet') NOT NULL,
        \`shipping_address\` JSON NOT NULL,
        \`billing_address\` JSON NOT NULL,
        \`subtotal\` DECIMAL(10,2) NOT NULL,
        \`discount_amount\` DECIMAL(10,2) NOT NULL DEFAULT 0,
        \`shipping_amount\` DECIMAL(10,2) NOT NULL DEFAULT 0,
        \`tax_amount\` DECIMAL(10,2) NOT NULL DEFAULT 0,
        \`total_amount\` DECIMAL(10,2) NOT NULL,
        \`currency\` VARCHAR(3) NOT NULL DEFAULT 'VND',
        \`notes\` TEXT NULL,
        \`internal_notes\` TEXT NULL,
        \`tracking_number\` VARCHAR(100) NULL,
        \`shipped_at\` DATETIME NULL,
        \`delivered_at\` DATETIME NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_orders_order_number\` (\`order_number\`),
        KEY \`IDX_orders_user_id\` (\`user_id\`),
        KEY \`IDX_orders_cart_id\` (\`cart_id\`),
        KEY \`IDX_orders_status\` (\`status\`),
        KEY \`IDX_orders_payment_status\` (\`payment_status\`),
        CONSTRAINT \`FK_orders_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_orders_cart\` FOREIGN KEY (\`cart_id\`) REFERENCES \`carts\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`order_items\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`order_id\` INT NOT NULL,
        \`variant_id\` INT NOT NULL,
        \`product_snapshot\` JSON NOT NULL,
        \`quantity\` INT NOT NULL,
        \`unit_price\` DECIMAL(10,2) NOT NULL,
        \`total_price\` DECIMAL(10,2) NOT NULL,
        \`discount_amount\` DECIMAL(10,2) NOT NULL DEFAULT 0,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_order_items_order_id\` (\`order_id\`),
        KEY \`IDX_order_items_variant_id\` (\`variant_id\`),
        CONSTRAINT \`FK_order_items_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_order_items_variant\` FOREIGN KEY (\`variant_id\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`order_status_histories\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`order_id\` INT NOT NULL,
        \`status\` ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') NOT NULL,
        \`previous_status\` ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') NULL,
        \`changed_by\` VARCHAR(100) NULL,
        \`notes\` TEXT NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_order_status_histories_order_id\` (\`order_id\`),
        CONSTRAINT \`FK_order_status_histories_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`reviews\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`product_id\` INT NOT NULL,
        \`user_id\` INT NOT NULL,
        \`order_item_id\` INT NULL,
        \`rating\` INT NOT NULL,
        \`title\` VARCHAR(200) NULL,
        \`content\` TEXT NOT NULL,
        \`is_verified_purchase\` TINYINT(1) NOT NULL DEFAULT 0,
        \`is_approved\` TINYINT(1) NOT NULL DEFAULT 0,
        \`helpful_count\` INT NOT NULL DEFAULT 0,
        \`not_helpful_count\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_reviews_product_id\` (\`product_id\`),
        KEY \`IDX_reviews_user_id\` (\`user_id\`),
        KEY \`IDX_reviews_order_item_id\` (\`order_item_id\`),
        KEY \`IDX_reviews_rating\` (\`rating\`),
        KEY \`IDX_reviews_is_approved\` (\`is_approved\`),
        CONSTRAINT \`FK_reviews_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_reviews_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_reviews_order_item\` FOREIGN KEY (\`order_item_id\`) REFERENCES \`order_items\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`review_helpful\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`review_id\` INT NOT NULL,
        \`user_id\` INT NOT NULL,
        \`is_helpful\` TINYINT(1) NOT NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_review_helpful_review_user\` (\`review_id\`, \`user_id\`),
        KEY \`IDX_review_helpful_review_id\` (\`review_id\`),
        KEY \`IDX_review_helpful_user_id\` (\`user_id\`),
        CONSTRAINT \`FK_review_helpful_review\` FOREIGN KEY (\`review_id\`) REFERENCES \`reviews\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_review_helpful_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`wishlists\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`user_id\` INT NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`is_default\` TINYINT(1) NOT NULL DEFAULT 0,
        \`is_public\` TINYINT(1) NOT NULL DEFAULT 0,
        \`share_token\` VARCHAR(255) NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_wishlists_share_token\` (\`share_token\`),
        KEY \`IDX_wishlists_user_id\` (\`user_id\`),
        CONSTRAINT \`FK_wishlists_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`wishlist_items\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`wishlist_id\` INT NOT NULL,
        \`variant_id\` INT NOT NULL,
        \`notes\` VARCHAR(500) NULL,
        \`priority\` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
        \`added_at\` DATETIME NOT NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_wishlist_items_wishlist_variant\` (\`wishlist_id\`, \`variant_id\`),
        KEY \`IDX_wishlist_items_wishlist_id\` (\`wishlist_id\`),
        KEY \`IDX_wishlist_items_variant_id\` (\`variant_id\`),
        CONSTRAINT \`FK_wishlist_items_wishlist\` FOREIGN KEY (\`wishlist_id\`) REFERENCES \`wishlists\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_wishlist_items_variant\` FOREIGN KEY (\`variant_id\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`promotions\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`code\` VARCHAR(50) NOT NULL,
        \`name\` VARCHAR(100) NOT NULL,
        \`description\` TEXT NULL,
        \`type\` ENUM('percentage', 'fixed_amount', 'free_shipping') NOT NULL,
        \`value\` DECIMAL(10,2) NOT NULL,
        \`min_order_amount\` DECIMAL(10,2) NULL,
        \`max_discount_amount\` DECIMAL(10,2) NULL,
        \`usage_limit\` INT NULL,
        \`usage_limit_per_user\` INT NULL,
        \`starts_at\` DATETIME NULL,
        \`ends_at\` DATETIME NULL,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`applies_to\` ENUM('all', 'categories', 'products') NOT NULL DEFAULT 'all',
        \`applicable_ids\` JSON NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_promotions_code\` (\`code\`),
        KEY \`IDX_promotions_is_active\` (\`is_active\`),
        KEY \`IDX_promotions_starts_at\` (\`starts_at\`),
        KEY \`IDX_promotions_ends_at\` (\`ends_at\`)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`promotion_usage\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`promotion_id\` INT NOT NULL,
        \`order_id\` INT NOT NULL,
        \`user_id\` INT NOT NULL,
        \`discount_amount\` DECIMAL(10,2) NOT NULL,
        \`used_at\` DATETIME NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_promotion_usage_promotion_id\` (\`promotion_id\`),
        KEY \`IDX_promotion_usage_order_id\` (\`order_id\`),
        KEY \`IDX_promotion_usage_user_id\` (\`user_id\`),
        CONSTRAINT \`FK_promotion_usage_promotion\` FOREIGN KEY (\`promotion_id\`) REFERENCES \`promotions\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_promotion_usage_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_promotion_usage_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`user_behavior_logs\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`session_id\` INT NOT NULL,
        \`user_id\` INT NULL,
        \`action_type\` ENUM('view', 'click', 'add_to_cart', 'remove_from_cart', 'purchase', 'search', 'wishlist_add', 'review_view') NOT NULL,
        \`product_id\` INT NULL,
        \`variant_id\` INT NULL,
        \`search_query\` VARCHAR(255) NULL,
        \`metadata\` JSON NULL,
        \`device_type\` ENUM('desktop', 'mobile', 'tablet', 'unknown') NOT NULL,
        \`referrer_url\` VARCHAR(500) NULL,
        \`page_url\` VARCHAR(500) NOT NULL,
        \`ip_address\` VARCHAR(45) NULL,
        \`session_duration_seconds\` INT NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_user_behavior_logs_session_created_at\` (\`session_id\`, \`created_at\`),
        KEY \`IDX_user_behavior_logs_user_id\` (\`user_id\`),
        KEY \`IDX_user_behavior_logs_action_type\` (\`action_type\`),
        KEY \`IDX_user_behavior_logs_product_id\` (\`product_id\`),
        KEY \`IDX_user_behavior_logs_variant_id\` (\`variant_id\`),
        CONSTRAINT \`FK_user_behavior_logs_session\` FOREIGN KEY (\`session_id\`) REFERENCES \`user_sessions\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_user_behavior_logs_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`FK_user_behavior_logs_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`FK_user_behavior_logs_variant\` FOREIGN KEY (\`variant_id\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`product_features\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`product_id\` INT NOT NULL,
        \`feature_type\` ENUM('category', 'style', 'occasion', 'season', 'pattern', 'fabric_type', 'attribute') NOT NULL,
        \`feature_value\` VARCHAR(100) NOT NULL,
        \`confidence_score\` DECIMAL(3,2) NULL,
        \`source\` ENUM('manual', 'ai_extracted', 'imported') NOT NULL DEFAULT 'manual',
        \`weight\` INT NOT NULL DEFAULT 1,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_product_features_product_type_value\` (\`product_id\`, \`feature_type\`, \`feature_value\`),
        KEY \`IDX_product_features_product_id\` (\`product_id\`),
        KEY \`IDX_product_features_feature_type\` (\`feature_type\`),
        KEY \`IDX_product_features_feature_value\` (\`feature_value\`),
        CONSTRAINT \`FK_product_features_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`recommendation_cache\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`cache_key\` VARCHAR(191) NOT NULL,
        \`user_id\` INT NULL,
        \`product_id\` INT NULL,
        \`recommendation_type\` ENUM('similar', 'personalized', 'trending', 'complementary', 'frequently_bought_together') NOT NULL,
        \`algorithm\` VARCHAR(50) NOT NULL DEFAULT 'third_party',
        \`recommended_products\` JSON NOT NULL,
        \`context_data\` JSON NULL,
        \`expires_at\` DATETIME NOT NULL,
        \`generated_at\` DATETIME NOT NULL,
        \`cache_hit_count\` INT NOT NULL DEFAULT 0,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_recommendation_cache_cache_key\` (\`cache_key\`),
        KEY \`IDX_recommendation_cache_user_id\` (\`user_id\`),
        KEY \`IDX_recommendation_cache_product_id\` (\`product_id\`),
        KEY \`IDX_recommendation_cache_recommendation_type\` (\`recommendation_type\`),
        KEY \`IDX_recommendation_cache_expires_at\` (\`expires_at\`),
        KEY \`IDX_recommendation_cache_is_active\` (\`is_active\`),
        CONSTRAINT \`FK_recommendation_cache_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`FK_recommendation_cache_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`notifications\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`user_id\` INT NOT NULL,
        \`type\` ENUM(
          'order_placed', 'order_confirmed', 'order_shipped', 'order_delivered', 'order_cancelled', 'order_refunded',
          'personalized_recommendation', 'similar_products', 'trending_products',
          'promotion_available', 'promotion_expiring', 'flash_sale',
          'review_published', 'review_response',
          'cart_abandoned', 'price_drop', 'back_in_stock', 'low_stock_alert',
          'welcome', 'password_changed', 'account_verified',
          'admin_alert', 'system_maintenance', 'general'
        ) NOT NULL DEFAULT 'general',
        \`title\` VARCHAR(255) NOT NULL,
        \`message\` TEXT NOT NULL,
        \`priority\` ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
        \`data\` JSON NULL,
        \`action_url\` VARCHAR(500) NULL,
        \`image_url\` VARCHAR(255) NULL,
        \`is_read\` TINYINT(1) NOT NULL DEFAULT 0,
        \`read_at\` DATETIME NULL,
        \`is_archived\` TINYINT(1) NOT NULL DEFAULT 0,
        \`archived_at\` DATETIME NULL,
        \`expires_at\` DATETIME NULL,
        \`reference_id\` INT NULL,
        \`reference_type\` VARCHAR(50) NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_notifications_user_id\` (\`user_id\`),
        KEY \`IDX_notifications_user_read_archived_created\` (\`user_id\`, \`is_read\`, \`is_archived\`, \`created_at\`),
        KEY \`IDX_notifications_user_read_created\` (\`user_id\`, \`is_read\`, \`created_at\`),
        KEY \`IDX_notifications_user_priority_read_created\` (\`user_id\`, \`priority\`, \`is_read\`, \`created_at\`),
        KEY \`IDX_notifications_user_expires_at\` (\`user_id\`, \`expires_at\`),
        KEY \`IDX_notifications_reference\` (\`reference_type\`, \`reference_id\`),
        KEY \`IDX_notifications_created_at\` (\`created_at\`),
        CONSTRAINT \`FK_notifications_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`notification_preferences\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`user_id\` INT NOT NULL,
        \`in_app_enabled\` TINYINT(1) NOT NULL DEFAULT 1,
        \`email_enabled\` TINYINT(1) NOT NULL DEFAULT 1,
        \`push_enabled\` TINYINT(1) NOT NULL DEFAULT 0,
        \`sms_enabled\` TINYINT(1) NOT NULL DEFAULT 0,
        \`order_updates\` TINYINT(1) NOT NULL DEFAULT 1,
        \`promotions\` TINYINT(1) NOT NULL DEFAULT 1,
        \`recommendations\` TINYINT(1) NOT NULL DEFAULT 1,
        \`reviews\` TINYINT(1) NOT NULL DEFAULT 1,
        \`price_alerts\` TINYINT(1) NOT NULL DEFAULT 1,
        \`newsletter\` TINYINT(1) NOT NULL DEFAULT 0,
        \`system_updates\` TINYINT(1) NOT NULL DEFAULT 1,
        \`quiet_hours_enabled\` TINYINT(1) NOT NULL DEFAULT 0,
        \`quiet_hours_start\` TIME NULL,
        \`quiet_hours_end\` TIME NULL,
        \`email_digest_enabled\` TINYINT(1) NOT NULL DEFAULT 0,
        \`email_frequency\` ENUM('immediate', 'daily', 'weekly') NOT NULL DEFAULT 'immediate',
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_notification_preferences_user_id\` (\`user_id\`),
        KEY \`IDX_notification_preferences_user_id\` (\`user_id\`),
        KEY \`IDX_notification_preferences_user_email_enabled\` (\`user_id\`, \`email_enabled\`),
        KEY \`IDX_notification_preferences_user_in_app_enabled\` (\`user_id\`, \`in_app_enabled\`),
        KEY \`IDX_notification_preferences_user_quiet_hours_enabled\` (\`user_id\`, \`quiet_hours_enabled\`),
        CONSTRAINT \`FK_notification_preferences_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`notification_templates\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`type\` ENUM(
          'order_placed', 'order_confirmed', 'order_shipped', 'order_delivered', 'order_cancelled', 'order_refunded',
          'personalized_recommendation', 'similar_products', 'trending_products',
          'promotion_available', 'promotion_expiring', 'flash_sale',
          'review_published', 'review_response',
          'cart_abandoned', 'price_drop', 'back_in_stock', 'low_stock_alert',
          'welcome', 'password_changed', 'account_verified',
          'admin_alert', 'system_maintenance', 'general'
        ) NOT NULL,
        \`channel\` ENUM('email', 'sms', 'push', 'in_app') NOT NULL DEFAULT 'in_app',
        \`name\` VARCHAR(100) NOT NULL,
        \`title_template\` VARCHAR(255) NOT NULL,
        \`message_template\` TEXT NOT NULL,
        \`email_subject_template\` TEXT NULL,
        \`email_body_template\` TEXT NULL,
        \`default_data\` JSON NULL,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_notification_templates_type_active\` (\`type\`, \`is_active\`),
        KEY \`IDX_notification_templates_is_active\` (\`is_active\`)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`notification_delivery_logs\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`notification_id\` INT NOT NULL,
        \`channel\` ENUM('in_app', 'push', 'email', 'sms') NOT NULL,
        \`status\` ENUM('pending', 'sent', 'delivered', 'failed', 'retry') NOT NULL DEFAULT 'pending',
        \`attempt_number\` INT NOT NULL DEFAULT 1,
        \`retry_count\` INT NOT NULL DEFAULT 0,
        \`next_retry_at\` DATETIME NULL,
        \`sent_at\` DATETIME NULL,
        \`delivered_at\` DATETIME NULL,
        \`error_message\` TEXT NULL,
        \`metadata\` JSON NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_notification_delivery_logs_notification_id\` (\`notification_id\`),
        KEY \`IDX_notification_delivery_logs_notification_channel\` (\`notification_id\`, \`channel\`),
        KEY \`IDX_notification_delivery_logs_status_retry_created\` (\`status\`, \`retry_count\`, \`created_at\`),
        KEY \`IDX_notification_delivery_logs_channel_status_created\` (\`channel\`, \`status\`, \`created_at\`),
        KEY \`IDX_notification_delivery_logs_channel_status\` (\`channel\`, \`status\`),
        KEY \`IDX_notification_delivery_logs_created_at\` (\`created_at\`),
        CONSTRAINT \`FK_notification_delivery_logs_notification\` FOREIGN KEY (\`notification_id\`) REFERENCES \`notifications\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`notification_subscriptions\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`user_id\` INT NOT NULL,
        \`topic_type\` VARCHAR(50) NOT NULL,
        \`topic_id\` INT NOT NULL,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_notification_subscriptions_user_topic\` (\`user_id\`, \`topic_type\`, \`topic_id\`),
        KEY \`IDX_notification_subscriptions_user_id\` (\`user_id\`),
        KEY \`IDX_notification_subscriptions_topic_active\` (\`topic_type\`, \`topic_id\`, \`is_active\`),
        KEY \`IDX_notification_subscriptions_user_active\` (\`user_id\`, \`is_active\`),
        KEY \`IDX_notification_subscriptions_user_topic_type\` (\`user_id\`, \`topic_type\`),
        CONSTRAINT \`FK_notification_subscriptions_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`notification_batch_jobs\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`job_name\` VARCHAR(100) NOT NULL,
        \`job_type\` VARCHAR(50) NOT NULL,
        \`total_notifications\` INT NOT NULL DEFAULT 0,
        \`sent_count\` INT NOT NULL DEFAULT 0,
        \`failed_count\` INT NOT NULL DEFAULT 0,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'pending',
        \`started_at\` DATETIME NULL,
        \`completed_at\` DATETIME NULL,
        \`error_message\` TEXT NULL,
        \`metadata\` JSON NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `notification_batch_jobs`;');
    await queryRunner.query('DROP TABLE IF EXISTS `notification_subscriptions`;');
    await queryRunner.query('DROP TABLE IF EXISTS `notification_delivery_logs`;');
    await queryRunner.query('DROP TABLE IF EXISTS `notification_templates`;');
    await queryRunner.query('DROP TABLE IF EXISTS `notification_preferences`;');
    await queryRunner.query('DROP TABLE IF EXISTS `notifications`;');
    await queryRunner.query('DROP TABLE IF EXISTS `recommendation_cache`;');
    await queryRunner.query('DROP TABLE IF EXISTS `product_features`;');
    await queryRunner.query('DROP TABLE IF EXISTS `user_behavior_logs`;');
    await queryRunner.query('DROP TABLE IF EXISTS `promotion_usage`;');
    await queryRunner.query('DROP TABLE IF EXISTS `promotions`;');
    await queryRunner.query('DROP TABLE IF EXISTS `wishlist_items`;');
    await queryRunner.query('DROP TABLE IF EXISTS `wishlists`;');
    await queryRunner.query('DROP TABLE IF EXISTS `review_helpful`;');
    await queryRunner.query('DROP TABLE IF EXISTS `reviews`;');
    await queryRunner.query('DROP TABLE IF EXISTS `order_status_histories`;');
    await queryRunner.query('DROP TABLE IF EXISTS `order_items`;');
    await queryRunner.query('DROP TABLE IF EXISTS `orders`;');
    await queryRunner.query('DROP TABLE IF EXISTS `cart_items`;');
    await queryRunner.query('DROP TABLE IF EXISTS `carts`;');
    await queryRunner.query('DROP TABLE IF EXISTS `inventory_logs`;');
    await queryRunner.query('DROP TABLE IF EXISTS `inventory`;');
    await queryRunner.query('DROP TABLE IF EXISTS `warehouses`;');
    await queryRunner.query('DROP TABLE IF EXISTS `product_images`;');
    await queryRunner.query('DROP TABLE IF EXISTS `product_variants`;');
    await queryRunner.query('DROP TABLE IF EXISTS `products`;');
    await queryRunner.query('DROP TABLE IF EXISTS `brands`;');
    await queryRunner.query('DROP TABLE IF EXISTS `categories`;');
    await queryRunner.query('DROP TABLE IF EXISTS `user_addresses`;');
    await queryRunner.query('DROP TABLE IF EXISTS `user_sessions`;');
    await queryRunner.query('DROP TABLE IF EXISTS `users`;');
  }
}
