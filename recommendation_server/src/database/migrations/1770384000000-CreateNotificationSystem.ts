import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateNotificationSystem1770384000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ==========================================
    // 1. notification_templates Table
    // Store reusable notification templates
    // ==========================================
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
            type: 'varchar',
            length: '50',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'title_template',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'message_template',
            type: 'text',
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
      true
    );

    // Add index for template lookups
    await queryRunner.createIndex(
      'notification_templates',
      new TableIndex({
        name: 'IDX_notification_templates_type_active',
        columnNames: ['type', 'is_active'],
      })
    );

    // ==========================================
    // 2. notifications Table
    // Main notifications table
    // ==========================================
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
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'message',
            type: 'text',
          },
          {
            name: 'priority',
            type: 'varchar',
            length: '20',
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
      true
    );

    // Add foreign key to users table
    await queryRunner.createForeignKey(
      'notifications',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // ==========================================
    // 3. notification_preferences Table
    // User preferences per channel and category
    // ==========================================
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
          },
          // Channel preferences
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
          // Category preferences
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
          // Quiet hours
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
          // Email digest settings
          {
            name: 'email_digest_enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'email_frequency',
            type: 'varchar',
            length: '20',
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
      true
    );

    // Add unique constraint for user_id
    await queryRunner.createUniqueConstraint(
      'notification_preferences',
      new TableIndex({
        name: 'UQ_notification_preferences_user_id',
        columnNames: ['user_id'],
        isUnique: true,
      })
    );

    // Add foreign key to users table
    await queryRunner.createForeignKey(
      'notification_preferences',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // ==========================================
    // 4. notification_delivery_logs Table
    // Track delivery status per channel
    // ==========================================
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
          },
          {
            name: 'channel',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
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
      true
    );

    // Add foreign key to notifications table
    await queryRunner.createForeignKey(
      'notification_delivery_logs',
      new TableForeignKey({
        columnNames: ['notification_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'notifications',
        onDelete: 'CASCADE',
      })
    );

    // ==========================================
    // 5. notification_subscriptions Table
    // Topic-based subscriptions
    // ==========================================
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
          },
          {
            name: 'topic_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'topic_id',
            type: 'int',
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
      true
    );

    // Add foreign key to users table
    await queryRunner.createForeignKey(
      'notification_subscriptions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // Add unique constraint for user + topic combination
    await queryRunner.createUniqueConstraint(
      'notification_subscriptions',
      new TableIndex({
        name: 'UQ_notification_subscriptions_user_topic',
        columnNames: ['user_id', 'topic_type', 'topic_id'],
        isUnique: true,
      })
    );

    // ==========================================
    // 6. notification_batch_jobs Table
    // Track batch notification jobs
    // ==========================================
    await queryRunner.createTable(
      new Table({
        name: 'notification_batch_jobs',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'job_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'job_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'total_notifications',
            type: 'int',
            default: 0,
          },
          {
            name: 'sent_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'failed_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'started_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'completed_at',
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
      true
    );

    // ==========================================
    // ADDITIONAL INDEXES FOR QUERY OPTIMIZATION
    // ==========================================

    // Notifications indexes for common query patterns
    // Pattern: Find by user_id with filters (is_read, is_archived)
    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_user_read_archived',
        columnNames: ['user_id', 'is_read', 'is_archived'],
      })
    );

    // Pattern: Find by user_id ordered by created_at (pagination)
    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_user_created',
        columnNames: ['user_id', 'created_at'],
      })
    );

    // Pattern: Find by type and created_at
    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_type_created',
        columnNames: ['type', 'created_at'],
      })
    );

    // Pattern: Find by priority and read status
    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_priority',
        columnNames: ['priority', 'is_read', 'created_at'],
      })
    );

    // Pattern: Find unread notifications for a user
    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_unread',
        columnNames: ['user_id', 'is_read'],
        where: "is_read = false",
      })
    );

    // Pattern: Find notifications by reference (order_id, etc.)
    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_reference',
        columnNames: ['reference_type', 'reference_id'],
      })
    );

    // Pattern: Find expired notifications for cleanup
    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_expired',
        columnNames: ['expires_at'],
        where: "expires_at IS NOT NULL AND expires_at < NOW()",
      })
    );

    // Delivery logs indexes
    // Pattern: Find by notification_id and channel
    await queryRunner.createIndex(
      'notification_delivery_logs',
      new TableIndex({
        name: 'IDX_delivery_logs_notification_channel',
        columnNames: ['notification_id', 'channel'],
      })
    );

    // Pattern: Find by status and channel for retry logic
    await queryRunner.createIndex(
      'notification_delivery_logs',
      new TableIndex({
        name: 'IDX_delivery_logs_status_retry',
        columnNames: ['status', 'retry_count', 'created_at'],
      })
    );

    // Pattern: Find failed deliveries for analysis
    await queryRunner.createIndex(
      'notification_delivery_logs',
      new TableIndex({
        name: 'IDX_delivery_logs_failed',
        columnNames: ['status', 'channel', 'created_at'],
        where: "status = 'failed'",
      })
    );

    // Subscription indexes
    // Pattern: Find by topic for broadcast
    await queryRunner.createIndex(
      'notification_subscriptions',
      new TableIndex({
        name: 'IDX_subscriptions_topic',
        columnNames: ['topic_type', 'topic_id'],
      })
    );

    // Pattern: Find by user for subscription listing
    await queryRunner.createIndex(
      'notification_subscriptions',
      new TableIndex({
        name: 'IDX_subscriptions_user',
        columnNames: ['user_id', 'is_active'],
      })
    );

    // ==========================================
    // DATABASE-LEVEL VALIDATION CONSTRAINTS
    // ==========================================

    // Add CHECK constraints for notifications
    await queryRunner.query(`
      ALTER TABLE notifications
      ADD CONSTRAINT chk_notifications_priority
      CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
    `);

    await queryRunner.query(`
      ALTER TABLE notifications
      ADD CONSTRAINT chk_notifications_type
      CHECK (
        type IN (
          'order_placed', 'order_confirmed', 'order_shipped', 'order_delivered',
          'order_cancelled', 'order_refunded', 'personalized_recommendation',
          'similar_products', 'trending_products', 'promotion_available',
          'promotion_expiring', 'flash_sale', 'review_published', 'review_response',
          'cart_abandoned', 'price_drop', 'back_in_stock', 'low_stock_alert',
          'welcome', 'password_changed', 'account_verified', 'admin_alert',
          'system_maintenance', 'general'
        )
      )
    `);

    // Add CHECK constraints for notification_preferences
    await queryRunner.query(`
      ALTER TABLE notification_preferences
      ADD CONSTRAINT chk_preferences_email_frequency
      CHECK (email_frequency IN ('immediate', 'daily', 'weekly'))
    `);

    // Add CHECK constraints for notification_delivery_logs
    await queryRunner.query(`
      ALTER TABLE notification_delivery_logs
      ADD CONSTRAINT chk_delivery_logs_channel
      CHECK (channel IN ('in_app', 'push', 'email', 'sms'))
    `);

    await queryRunner.query(`
      ALTER TABLE notification_delivery_logs
      ADD CONSTRAINT chk_delivery_logs_status
      CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'retry'))
    `);

    // Add CHECK constraints for notification_subscriptions
    await queryRunner.query(`
      ALTER TABLE notification_subscriptions
      ADD CONSTRAINT chk_subscriptions_topic_type
      CHECK (topic_type IN ('product', 'category', 'brand', 'merchant'))
    `);

    // Add CHECK constraints for notification_batch_jobs
    await queryRunner.query(`
      ALTER TABLE notification_batch_jobs
      ADD CONSTRAINT chk_batch_jobs_status
      CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'))
    `);

    await queryRunner.query(`
      ALTER TABLE notification_batch_jobs
      ADD CONSTRAINT chk_batch_jobs_job_type
      CHECK (job_type IN ('broadcast', 'scheduled', 'triggered', 'campaign'))
    `);

    // ==========================================
    // SEED DATA FOR NOTIFICATION TEMPLATES
    // ==========================================
    await queryRunner.query(`
      INSERT INTO notification_templates (
        type, name, title_template, message_template, email_subject_template,
        email_body_template, default_data, is_active, created_at, updated_at
      ) VALUES
      -- Order-related templates
      (
        'order_placed',
        'Order Placed Confirmation',
        'Your order #{{order_number}} has been placed!',
        'Thank you for your order. We have received your order #{{order_number}} and will process it shortly. Total: {{total_amount}}.',
        'Order Confirmation - #{{order_number}}',
        '<h1>Thank you for your order!</h1><p>Your order #{{order_number}} has been received and is being processed.</p><p>Total: {{total_amount}}</p>',
        '{"order_number": "ORD-001", "total_amount": "$99.99"}',
        true,
        NOW(),
        NOW()
      ),
      (
        'order_confirmed',
        'Order Confirmed',
        'Your order #{{order_number}} is confirmed!',
        'Great news! Your order #{{order_number}} has been confirmed and is ready for shipping.',
        'Order Confirmed - #{{order_number}}',
        '<h1>Order Confirmed</h1><p>Your order #{{order_number}} has been confirmed and is being prepared for shipment.</p>',
        '{"order_number": "ORD-001"}',
        true,
        NOW(),
        NOW()
      ),
      (
        'order_shipped',
        'Order Shipped',
        'Your order #{{order_number}} has been shipped!',
        'Your order #{{order_number}} has been shipped and is on its way. Tracking: {{tracking_number}}',
        'Shipped - Order #{{order_number}}',
        '<h1>Your order has been shipped!</h1><p>Tracking number: {{tracking_number}}</p>',
        '{"order_number": "ORD-001", "tracking_number": "1Z999AA10123456784"}',
        true,
        NOW(),
        NOW()
      ),
      (
        'order_delivered',
        'Order Delivered',
        'Your order #{{order_number}} has been delivered!',
        'Your order #{{order_number}} has been delivered successfully. We hope you enjoy your purchase!',
        'Delivered - Order #{{order_number}}',
        '<h1>Order Delivered</h1><p>We hope you enjoy your purchase!</p>',
        '{"order_number": "ORD-001"}',
        true,
        NOW(),
        NOW()
      ),
      (
        'order_cancelled',
        'Order Cancelled',
        'Your order #{{order_number}} has been cancelled',
        'Your order #{{order_number}} has been cancelled. Reason: {{cancel_reason}}. If you have any questions, please contact us.',
        'Order Cancelled - #{{order_number}}',
        '<h1>Order Cancelled</h1><p>Reason: {{cancel_reason}}</p>',
        '{"order_number": "ORD-001", "cancel_reason": "Out of stock"}',
        true,
        NOW(),
        NOW()
      ),
      (
        'order_refunded',
        'Order Refunded',
        'Refund processed for order #{{order_number}}',
        'A refund of {{refund_amount}} has been processed for order #{{order_number}}. It will appear in your account within 5-7 business days.',
        'Refund Processed - Order #{{order_number}}',
        '<h1>Refund Processed</h1><p>Amount: {{refund_amount}}</p>',
        '{"order_number": "ORD-001", "refund_amount": "$99.99"}',
        true,
        NOW(),
        NOW()
      ),
      -- Recommendation templates
      (
        'personalized_recommendation',
        'Personalized Recommendations',
        'New recommendations for you!',
        'Based on your recent activity, we think you might like these products: {{product_list}}',
        'Personalized Product Recommendations',
        '<h1>Personalized Recommendations</h1><p>Based on your recent activity, we think you might like:</p><ul>{{product_list}}</ul>',
        '{"product_list": "<li>Product 1</li><li>Product 2</li>"}',
        true,
        NOW(),
        NOW()
      ),
      (
        'similar_products',
        'Similar Products Available',
        'Similar products to {{product_name}}',
        'You viewed {{product_name}}. Check out these similar products: {{product_list}}',
        'Similar Products to {{product_name}}',
        '<h1>Similar Products</h1><p>You viewed {{product_name}}</p>',
        '{"product_name": "Wireless Headphones", "product_list": "<li>Product 1</li>"}',
        true,
        NOW(),
        NOW()
      ),
      (
        'trending_products',
        'Trending Products',
        'Trending products this week',
        'These products are trending this week: {{product_list}}',
        'Trending Products This Week',
        '<h1>Trending This Week</h1>',
        '{"product_list": "<li>Product 1</li>"}',
        true,
        NOW(),
        NOW()
      ),
      -- Promotion templates
      (
        'promotion_available',
        'Promotion Available',
        'Special offer just for you!',
        'We have a special promotion available: {{promotion_name}}. Use code {{promo_code}} for {{discount}} off.',
        'Special Offer: {{promotion_name}}',
        '<h1>Special Offer!</h1><p>{{promotion_name}} - Use code {{promo_code}} for {{discount}} off</p>',
        '{"promotion_name": "Summer Sale", "promo_code": "SUMMER2024", "discount": "20%"}',
        true,
        NOW(),
        NOW()
      ),
      (
        'promotion_expiring',
        'Promotion Ending Soon',
        'Your promotion expires soon!',
        'Your promotion {{promotion_name}} expires in {{days_remaining}} days. Don''t miss out!',
        'Reminder: Promotion Ending Soon',
        '<h1>Promotion Ending Soon</h1><p>{{promotion_name}} expires in {{days_remaining}} days.</p>',
        '{"promotion_name": "Summer Sale", "days_remaining": 2}',
        true,
        NOW(),
        NOW()
      ),
      (
        'flash_sale',
        'Flash Sale!',
        'Flash sale alert!',
        'Flash sale for {{product_name}} starting now! {{discount}} off for the next {{duration}}.',
        'Flash Sale: {{product_name}}',
        '<h1>Flash Sale!</h1><p>{{product_name}} - {{discount}} off for the next {{duration}}</p>',
        '{"product_name": "Premium Headphones", "discount": "50%", "duration": "2 hours"}',
        true,
        NOW(),
        NOW()
      ),
      -- Review templates
      (
        'review_published',
        'Review Published',
        'Your review has been published!',
        'Thank you for your review. It has been published and will help other customers.',
        'Review Published',
        '<h1>Review Published</h1><p>Thank you for sharing your feedback!</p>',
        '{}',
        true,
        NOW(),
        NOW()
      ),
      (
        'review_response',
        'Response to Your Review',
        'Response to your review',
        'We have responded to your review of {{product_name}}: "{{response}}"',
        'Response to Your Review',
        '<h1>We Responded to Your Review</h1><p>{{response}}</p>',
        '{"product_name": "Wireless Headphones", "response": "Thank you for your feedback!"}',
        true,
        NOW(),
        NOW()
      ),
      -- Cart and price templates
      (
        'cart_abandoned',
        'Cart Abandoned',
        'Forgot something?',
        'You left items in your cart. Complete your purchase now and get {{bonus}} off your next order!',
        'Complete Your Purchase',
        '<h1>Complete Your Purchase</h1><p>Don''t forget your items!</p>',
        '{"bonus": "10%"}',
        true,
        NOW(),
        NOW()
      ),
      (
        'price_drop',
        'Price Drop Alert',
        'Price drop for {{product_name}}',
        'The price of {{product_name}} has dropped from {{old_price}} to {{new_price}}!',
        'Price Drop: {{product_name}}',
        '<h1>Price Drop!</h1><p>{{product_name}} is now {{new_price}} (was {{old_price}})</p>',
        '{"product_name": "Wireless Headphones", "old_price": "$199.99", "new_price": "$149.99"}',
        true,
        NOW(),
        NOW()
      ),
      (
        'back_in_stock',
        'Back in Stock',
        '{{product_name}} is back in stock!',
        'Great news! {{product_name}} is now back in stock and ready to order.',
        'Back in Stock: {{product_name}}',
        '<h1>Back in Stock</h1><p>{{product_name}} is now available!</p>',
        '{"product_name": "Wireless Headphones"}',
        true,
        NOW(),
        NOW()
      ),
      (
        'low_stock_alert',
        'Low Stock Alert',
        '{{product_name}} is running low',
        'Only {{quantity_left}} units of {{product_name}} are left in stock. Order now!',
        'Low Stock: {{product_name}}',
        '<h1>Low Stock Alert</h1><p>Only {{quantity_left}} left!</p>',
        '{"product_name": "Wireless Headphones", "quantity_left": 5}',
        true,
        NOW(),
        NOW()
      ),
      -- Account templates
      (
        'welcome',
        'Welcome to Our Store!',
        'Welcome, {{user_name}}!',
        'Welcome to our store! We are excited to have you as a new customer. Start exploring now.',
        'Welcome to Our Store!',
        '<h1>Welcome, {{user_name}}!</h1><p>We are excited to have you as a new customer!</p>',
        '{"user_name": "John"}',
        true,
        NOW(),
        NOW()
      ),
      (
        'password_changed',
        'Password Changed',
        'Your password has been changed',
        'Your password has been successfully changed. If this was not you, please contact us immediately.',
        'Password Changed',
        '<h1>Password Changed</h1><p>If this was not you, please contact us immediately.</p>',
        '{}',
        true,
        NOW(),
        NOW()
      ),
      (
        'account_verified',
        'Account Verified',
        'Your account has been verified',
        'Congratulations! Your account has been verified. You can now enjoy all features.',
        'Account Verified',
        '<h1>Account Verified</h1><p>You can now enjoy all features!</p>',
        '{}',
        true,
        NOW(),
        NOW()
      ),
      -- Admin templates
      (
        'admin_alert',
        'Admin Alert',
        'Admin notification: {{alert_type}}',
        'Important: {{alert_message}}. Please review immediately.',
        'Admin Alert: {{alert_type}}',
        '<h1>Admin Alert</h1><p>{{alert_message}}</p>',
        '{"alert_type": "System Error", "alert_message": "Payment gateway timeout"}',
        true,
        NOW(),
        NOW()
      ),
      (
        'system_maintenance',
        'System Maintenance',
        'Scheduled maintenance notification',
        'We will be performing scheduled maintenance from {{start_time}} to {{end_time}}. Expected downtime: {{duration}}.',
        'System Maintenance Notice',
        '<h1>Scheduled Maintenance</h1><p>{{start_time}} - {{end_time}}</p>',
        '{"start_time": "2:00 AM", "end_time": "4:00 AM", "duration": "2 hours"}',
        true,
        NOW(),
        NOW()
      ),
      -- General template
      (
        'general',
        'General Notification',
        'Important Update',
        'Here is an important update for you: {{message}}',
        'Important Update',
        '<h1>Important Update</h1><p>{{message}}</p>',
        '{"message": "System maintenance scheduled"}',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes first
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_notifications_user_read_archived`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_notifications_user_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_notifications_type_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_notifications_priority`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_notifications_unread`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_notifications_reference`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_notifications_expired`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_delivery_logs_notification_channel`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_delivery_logs_status_retry`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_delivery_logs_failed`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_subscriptions_topic`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_subscriptions_user`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_notification_templates_type_active`);

    // Drop foreign keys - TypeORM doesn't provide getTableForeignKey by name
    // We need to drop by column names instead
    const deliveryTable = await queryRunner.getTable('notification_delivery_logs');
    if (deliveryTable && deliveryTable.foreignKeys.length > 0) {
      await queryRunner.dropForeignKey('notification_delivery_logs', deliveryTable.foreignKeys[0]);
    }

    const subscriptionTable = await queryRunner.getTable('notification_subscriptions');
    if (subscriptionTable && subscriptionTable.foreignKeys.length > 0) {
      await queryRunner.dropForeignKey('notification_subscriptions', subscriptionTable.foreignKeys[0]);
    }

    const preferenceTable = await queryRunner.getTable('notification_preferences');
    if (preferenceTable && preferenceTable.foreignKeys.length > 0) {
      await queryRunner.dropForeignKey('notification_preferences', preferenceTable.foreignKeys[0]);
    }

    const notificationTable = await queryRunner.getTable('notifications');
    if (notificationTable && notificationTable.foreignKeys.length > 0) {
      await queryRunner.dropForeignKey('notifications', notificationTable.foreignKeys[0]);
    }

    // Drop check constraints
    await queryRunner.query(`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS chk_notifications_priority`);
    await queryRunner.query(`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS chk_notifications_type`);
    await queryRunner.query(`ALTER TABLE notification_preferences DROP CONSTRAINT IF EXISTS chk_preferences_email_frequency`);
    await queryRunner.query(`ALTER TABLE notification_delivery_logs DROP CONSTRAINT IF EXISTS chk_delivery_logs_channel`);
    await queryRunner.query(`ALTER TABLE notification_delivery_logs DROP CONSTRAINT IF EXISTS chk_delivery_logs_status`);
    await queryRunner.query(`ALTER TABLE notification_subscriptions DROP CONSTRAINT IF EXISTS chk_subscriptions_topic_type`);
    await queryRunner.query(`ALTER TABLE notification_batch_jobs DROP CONSTRAINT IF EXISTS chk_batch_jobs_status`);
    await queryRunner.query(`ALTER TABLE notification_batch_jobs DROP CONSTRAINT IF EXISTS chk_batch_jobs_job_type`);

    // Drop unique constraints
    await queryRunner.query(`ALTER TABLE notification_preferences DROP CONSTRAINT IF EXISTS UQ_notification_preferences_user_id`);
    await queryRunner.query(`ALTER TABLE notification_subscriptions DROP CONSTRAINT IF EXISTS UQ_notification_subscriptions_user_topic`);

    // Drop tables in reverse dependency order
    await queryRunner.dropTable('notification_batch_jobs');
    await queryRunner.dropTable('notification_subscriptions');
    await queryRunner.dropTable('notification_delivery_logs');
    await queryRunner.dropTable('notification_preferences');
    await queryRunner.dropTable('notifications');
    await queryRunner.dropTable('notification_templates');
  }
}
