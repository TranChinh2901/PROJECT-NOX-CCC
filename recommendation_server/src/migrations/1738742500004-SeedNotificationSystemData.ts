import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedNotificationSystemData1738742500004 implements MigrationInterface {
    name = 'SeedNotificationSystemData1738742500004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ===== Seed notification templates =====

        // Order update templates
        await queryRunner.query(`
            INSERT INTO notification_templates (type, channel, name, subject, body, variables, is_active)
            VALUES
            ('order_update', 'email', 'Order Confirmed', 'Order #{{order_id}} Confirmed',
             'Hi {{user_name}},\\n\\nThank you for your order! We have received your order #{{order_id}} for {{total_amount}}.\\n\\nEstimated delivery: {{delivery_date}}\\n\\nBest regards,\\nYour Store Team',
             '{"order_id": "string", "user_name": "string", "total_amount": "string", "delivery_date": "string"}',
             true)
        `);

        await queryRunner.query(`
            INSERT INTO notification_templates (type, channel, name, subject, body, variables, is_active)
            VALUES
            ('order_update', 'websocket', 'Order Shipped', 'Your order has shipped!',
             'Order #{{order_id}} is on its way. Track it here: {{tracking_url}}',
             '{"order_id": "string", "tracking_url": "string"}',
             true)
        `);

        await queryRunner.query(`
            INSERT INTO notification_templates (type, channel, name, subject, body, variables, is_active)
            VALUES
            ('order_update', 'in_app', 'Order Delivered', 'Your order has been delivered!',
             'Order #{{order_id}} was successfully delivered on {{delivery_date}}. Thank you for shopping with us!',
             '{"order_id": "string", "delivery_date": "string"}',
             true)
        `);

        // Product recommendation templates
        await queryRunner.query(`
            INSERT INTO notification_templates (type, channel, name, subject, body, variables, is_active)
            VALUES
            ('product_recommendation', 'in_app', 'Recommended For You', 'You might like this',
             'Based on your interest in {{previous_product}}, check out {{product_name}} - now {{discount_percent}}% off!',
             '{"previous_product": "string", "product_name": "string", "discount_percent": "number", "product_url": "string"}',
             true)
        `);

        await queryRunner.query(`
            INSERT INTO notification_templates (type, channel, name, subject, body, variables, is_active)
            VALUES
            ('product_recommendation', 'email', 'Personalized Picks', 'Products picked just for you',
             'Hi {{user_name}},\\n\\nBased on your browsing history, we think you will love these products:\\n\\n{{product_list}}\\n\\nHappy shopping!',
             '{"user_name": "string", "product_list": "string"}',
             true)
        `);

        // Price drop templates
        await queryRunner.query(`
            INSERT INTO notification_templates (type, channel, name, subject, body, variables, is_active)
            VALUES
            ('price_drop', 'email', 'Price Drop Alert', 'Price dropped on {{product_name}}!',
             'Great news! The price of {{product_name}} has dropped from {{original_price}} to {{new_price}} ({{discount_percent}}% off).\\n\\nGet it now before the sale ends!',
             '{"product_name": "string", "original_price": "string", "new_price": "string", "discount_percent": "number", "product_url": "string"}',
             true)
        `);

        await queryRunner.query(`
            INSERT INTO notification_templates (type, channel, name, subject, body, variables, is_active)
            VALUES
            ('price_drop', 'push', 'Price Alert', '{{product_name}} is now {{discount_percent}}% off!',
             'The item in your wishlist just got cheaper. Buy now!',
             '{"product_name": "string", "discount_percent": "number"}',
             true)
        `);

        // Back in stock template
        await queryRunner.query(`
            INSERT INTO notification_templates (type, channel, name, subject, body, variables, is_active)
            VALUES
            ('back_in_stock', 'email', 'Back in Stock', '{{product_name}} is back in stock!',
             'Good news! {{product_name}} that you were waiting for is now back in stock.\\n\\nOrder now before it sells out again!\\n\\n{{product_url}}',
             '{"product_name": "string", "product_url": "string"}',
             true)
        `);

        // System alert templates
        await queryRunner.query(`
            INSERT INTO notification_templates (type, channel, name, subject, body, variables, is_active)
            VALUES
            ('system_alert', 'email', 'Scheduled Maintenance', 'Scheduled System Maintenance',
             'Our system will be under maintenance on {{maintenance_date}} from {{start_time}} to {{end_time}}. You may experience brief interruptions during this period.',
             '{"maintenance_date": "string", "start_time": "string", "end_time": "string"}',
             true)
        `);

        await queryRunner.query(`
            INSERT INTO notification_templates (type, channel, name, subject, body, variables, is_active)
            VALUES
            ('system_alert', 'in_app', 'Service Update', 'System Update',
             'We have updated our system with new features and improvements. Check out what is new!',
             '{}',
             true)
        `);

        // Promotional templates
        await queryRunner.query(`
            INSERT INTO notification_templates (type, channel, name, subject, body, variables, is_active)
            VALUES
            ('promotional', 'push', 'Flash Sale', 'Flash Sale - {{discount}}% Off!',
             'Limited time offer! Get {{discount}}% off {{category}} products. Use code: {{promo_code}}',
             '{"discount": "number", "category": "string", "promo_code": "string", "expires_at": "string"}',
             true)
        `);

        await queryRunner.query(`
            INSERT INTO notification_templates (type, channel, name, subject, body, variables, is_active)
            VALUES
            ('promotional', 'email', 'Weekly Deals', 'This Week''s Best Deals!',
             'Hi {{user_name}},\\n\\nDon''t miss out on this week''s hottest deals:\\n\\n{{deals_list}}\\n\\nOffer valid until {{expires_at}}',
             '{"user_name": "string", "deals_list": "string", "expires_at": "string"}',
             true)
        `);

        // Review request template
        await queryRunner.query(`
            INSERT INTO notification_templates (type, channel, name, subject, body, variables, is_active)
            VALUES
            ('review_request', 'email', 'Review Request', 'How was your recent purchase?',
             'Hi {{user_name}},\\n\\nWe hope you are enjoying your {{product_name}}! We would love to hear your feedback.\\n\\nLeave a review: {{review_url}}',
             '{"user_name": "string", "product_name": "string", "review_url": "string", "order_id": "string"}',
             true)
        `);

        // ===== Create default notification preferences for existing users =====
        // This will set up default preferences for all notification types

        await queryRunner.query(`
            INSERT INTO notification_preferences (user_id, notification_type, channel, enabled, frequency)
            SELECT
                u.id AS user_id,
                'order_update' AS notification_type,
                'email' AS channel,
                true AS enabled,
                'realtime' AS frequency
            FROM users u
            WHERE NOT EXISTS (
                SELECT 1 FROM notification_preferences np
                WHERE np.user_id = u.id
                  AND np.notification_type = 'order_update'
                  AND np.channel = 'email'
            )
        `);

        await queryRunner.query(`
            INSERT INTO notification_preferences (user_id, notification_type, channel, enabled, frequency)
            SELECT
                u.id AS user_id,
                'order_update' AS notification_type,
                'in_app' AS channel,
                true AS enabled,
                'realtime' AS frequency
            FROM users u
            WHERE NOT EXISTS (
                SELECT 1 FROM notification_preferences np
                WHERE np.user_id = u.id
                  AND np.notification_type = 'order_update'
                  AND np.channel = 'in_app'
            )
        `);

        await queryRunner.query(`
            INSERT INTO notification_preferences (user_id, notification_type, channel, enabled, frequency)
            SELECT
                u.id AS user_id,
                'product_recommendation' AS notification_type,
                'in_app' AS channel,
                true AS enabled,
                'daily_digest' AS frequency
            FROM users u
            WHERE NOT EXISTS (
                SELECT 1 FROM notification_preferences np
                WHERE np.user_id = u.id
                  AND np.notification_type = 'product_recommendation'
                  AND np.channel = 'in_app'
            )
        `);

        await queryRunner.query(`
            INSERT INTO notification_preferences (user_id, notification_type, channel, enabled, frequency)
            SELECT
                u.id AS user_id,
                'promotional' AS notification_type,
                'email' AS channel,
                false AS enabled,
                'disabled' AS frequency
            FROM users u
            WHERE NOT EXISTS (
                SELECT 1 FROM notification_preferences np
                WHERE np.user_id = u.id
                  AND np.notification_type = 'promotional'
                  AND np.channel = 'email'
            )
        `);

        await queryRunner.query(`
            INSERT INTO notification_preferences (user_id, notification_type, channel, enabled, frequency)
            SELECT
                u.id AS user_id,
                'system_alert' AS notification_type,
                'email' AS channel,
                true AS enabled,
                'realtime' AS frequency
            FROM users u
            WHERE NOT EXISTS (
                SELECT 1 FROM notification_preferences np
                WHERE np.user_id = u.id
                  AND np.notification_type = 'system_alert'
                  AND np.channel = 'email'
            )
        `);

        await queryRunner.query(`
            INSERT INTO notification_preferences (user_id, notification_type, channel, enabled, frequency)
            SELECT
                u.id AS user_id,
                'price_drop' AS notification_type,
                'email' AS channel,
                true AS enabled,
                'realtime' AS frequency
            FROM users u
            WHERE NOT EXISTS (
                SELECT 1 FROM notification_preferences np
                WHERE np.user_id = u.id
                  AND np.notification_type = 'price_drop'
                  AND np.channel = 'email'
            )
        `);

        await queryRunner.query(`
            INSERT INTO notification_preferences (user_id, notification_type, channel, enabled, frequency)
            SELECT
                u.id AS user_id,
                'back_in_stock' AS notification_type,
                'email' AS channel,
                true AS enabled,
                'realtime' AS frequency
            FROM users u
            WHERE NOT EXISTS (
                SELECT 1 FROM notification_preferences np
                WHERE np.user_id = u.id
                  AND np.notification_type = 'back_in_stock'
                  AND np.channel = 'email'
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Delete all seeded data
        await queryRunner.query(`DELETE FROM notification_preferences WHERE TRUE`);
        await queryRunner.query(`DELETE FROM notification_templates WHERE TRUE`);
    }
}
