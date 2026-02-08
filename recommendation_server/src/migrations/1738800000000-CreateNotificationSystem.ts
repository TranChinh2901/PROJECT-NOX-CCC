import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: Create Notification System Tables
 *
 * Creates all tables for the notification system:
 * - notifications: Core notification records
 * - notification_preferences: User channel and category preferences
 * - notification_templates: Reusable notification templates
 * - notification_delivery_logs: Delivery tracking across channels
 * - notification_subscriptions: Topic-based subscriptions
 */
export class CreateNotificationSystem1738800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create notifications table
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: [
              'order_placed', 'order_confirmed', 'order_shipped', 'order_delivered',
              'order_cancelled', 'order_refunded', 'personalized_recommendation',
              'similar_products', 'trending_products', 'promotion_available',
              'promotion_expiring', 'flash_sale', 'review_published', 'review_response',
              'cart_abandoned', 'price_drop', 'back_in_stock', 'low_stock_alert',
              'welcome', 'password_changed', 'account_verified', 'admin_alert',
              'system_maintenance', 'general',
            ],
            default: "'general'",
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'priority',
            type: 'enum',
            enum: ['low', 'normal', 'high', 'urgent'],
            default: "'normal'",
          },
          {
            name: 'data',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'action_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'image_url',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'is_read',
            type: 'boolean',
            default: false,
          },
          {
            name: 'read_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'is_archived',
            type: 'boolean',
            default: false,
          },
          {
            name: 'archived_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'reference_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'reference_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

      // Create indexes for notifications
      /*
      await queryRunner.createIndex(
        'notifications',
        new TableIndex({
          name: 'IDX_notifications_user_id',
          columnNames: ['user_id'],
        }),
      );
      */

      /*
    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_user_read_created',
        columnNames: ['user_id', 'is_read', 'created_at'],
      }),
    );
    */

    /*
    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_user_type_created',
        columnNames: ['user_id', 'type', 'created_at'],
      }),
    );
    */

    /*
    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_type_created',
        columnNames: ['type', 'created_at'],
      }),
    );
    */

    /*
    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_is_read',
        columnNames: ['is_read'],
      }),
    );
    */

    // 2. Create notification_preferences table
    await queryRunner.createTable(
      new Table({
        name: 'notification_preferences',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'in_app_enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'email_enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'push_enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'sms_enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'order_updates',
            type: 'boolean',
            default: true,
          },
          {
            name: 'promotions',
            type: 'boolean',
            default: true,
          },
          {
            name: 'recommendations',
            type: 'boolean',
            default: true,
          },
          {
            name: 'reviews',
            type: 'boolean',
            default: true,
          },
          {
            name: 'price_alerts',
            type: 'boolean',
            default: true,
          },
          {
            name: 'newsletter',
            type: 'boolean',
            default: false,
          },
          {
            name: 'system_updates',
            type: 'boolean',
            default: true,
          },
          {
            name: 'quiet_hours_enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'quiet_hours_start',
            type: 'time',
            isNullable: true,
          },
          {
            name: 'quiet_hours_end',
            type: 'time',
            isNullable: true,
          },
          {
            name: 'email_digest_enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'email_frequency',
            type: 'enum',
            enum: ['immediate', 'daily', 'weekly'],
            default: "'immediate'",
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    /*
    await queryRunner.createIndex(
      'notification_preferences',
      new TableIndex({
        name: 'IDX_notification_preferences_user_id',
        columnNames: ['user_id'],
        isUnique: true,
      }),
    );
    */

    // 3. Create notification_templates table
    await queryRunner.createTable(
      new Table({
        name: 'notification_templates',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'type',
            type: 'enum',
            enum: [
              'order_placed', 'order_confirmed', 'order_shipped', 'order_delivered',
              'order_cancelled', 'order_refunded', 'personalized_recommendation',
              'similar_products', 'trending_products', 'promotion_available',
              'promotion_expiring', 'flash_sale', 'review_published', 'review_response',
              'cart_abandoned', 'price_drop', 'back_in_stock', 'low_stock_alert',
              'welcome', 'password_changed', 'account_verified', 'admin_alert',
              'system_maintenance', 'general',
            ],
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'title_template',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'message_template',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'email_subject_template',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'email_body_template',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'default_data',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    /*
    await queryRunner.createIndex(
      'notification_templates',
      new TableIndex({
        name: 'IDX_notification_templates_type',
        columnNames: ['type'],
      }),
    );
    */

    /*
    await queryRunner.createIndex(
      'notification_templates',
      new TableIndex({
        name: 'IDX_notification_templates_type_active',
        columnNames: ['type', 'is_active'],
      }),
    );
    */

    // 4. Create notification_delivery_logs table
    await queryRunner.createTable(
      new Table({
        name: 'notification_delivery_logs',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'notification_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'channel',
            type: 'enum',
            enum: ['in_app', 'push', 'email', 'sms'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'sent', 'delivered', 'failed', 'retry'],
            default: "'pending'",
          },
          {
            name: 'retry_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'sent_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'delivered_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    /*
    await queryRunner.createIndex(
      'notification_delivery_logs',
      new TableIndex({
        name: 'IDX_notification_delivery_logs_notification_id',
        columnNames: ['notification_id'],
      }),
    );
    */

    /*
    await queryRunner.createIndex(
      'notification_delivery_logs',
      new TableIndex({
        name: 'IDX_notification_delivery_logs_notification_channel',
        columnNames: ['notification_id', 'channel'],
      }),
    );
    */

    /*
    await queryRunner.createIndex(
      'notification_delivery_logs',
      new TableIndex({
        name: 'IDX_notification_delivery_logs_status_created',
        columnNames: ['status', 'created_at'],
      }),
    );
    */

    /*
    await queryRunner.createIndex(
      'notification_delivery_logs',
      new TableIndex({
        name: 'IDX_notification_delivery_logs_channel_status_created',
        columnNames: ['channel', 'status', 'created_at'],
      }),
    );
    */

    // 5. Create notification_subscriptions table
    await queryRunner.createTable(
      new Table({
        name: 'notification_subscriptions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'topic_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'topic_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    /*
    await queryRunner.createIndex(
      'notification_subscriptions',
      new TableIndex({
        name: 'IDX_notification_subscriptions_user_id',
        columnNames: ['user_id'],
      }),
    );
    */

    /*
    await queryRunner.createIndex(
      'notification_subscriptions',
      new TableIndex({
        name: 'IDX_notification_subscriptions_topic',
        columnNames: ['topic_type', 'topic_id'],
      }),
    );
    */

    /*
    await queryRunner.createIndex(
      'notification_subscriptions',
      new TableIndex({
        name: 'IDX_notification_subscriptions_user_topic',
        columnNames: ['user_id', 'topic_type', 'topic_id'],
        isUnique: true,
      }),
    );
    */

    // Create foreign keys
    /*
    await queryRunner.createForeignKey(
      'notifications',
      new TableForeignKey({
        name: 'FK_notifications_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    */

    /*
    await queryRunner.createForeignKey(
      'notification_preferences',
      new TableForeignKey({
        name: 'FK_notification_preferences_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    */

    /*
    await queryRunner.createForeignKey(
      'notification_delivery_logs',
      new TableForeignKey({
        name: 'FK_notification_delivery_logs_notification',
        columnNames: ['notification_id'],
        referencedTableName: 'notifications',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    */

    /*
    await queryRunner.createForeignKey(
      'notification_subscriptions',
      new TableForeignKey({
        name: 'FK_notification_subscriptions_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    */
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('notification_subscriptions', 'FK_notification_subscriptions_user');
    await queryRunner.dropForeignKey('notification_delivery_logs', 'FK_notification_delivery_logs_notification');
    await queryRunner.dropForeignKey('notification_preferences', 'FK_notification_preferences_user');
    await queryRunner.dropForeignKey('notifications', 'FK_notifications_user');

    // Drop tables in reverse order
    await queryRunner.dropTable('notification_subscriptions');
    await queryRunner.dropTable('notification_delivery_logs');
    await queryRunner.dropTable('notification_templates');
    await queryRunner.dropTable('notification_preferences');
    await queryRunner.dropTable('notifications');
  }
}
