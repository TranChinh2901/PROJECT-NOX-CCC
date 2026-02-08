import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationSystemIndexes1738742500001 implements MigrationInterface {
    name = 'CreateNotificationSystemIndexes1738742500001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ===== Indexes for notification_templates =====
        await queryRunner.query(
            `CREATE INDEX idx_templates_type ON notification_templates(type)`
        );
        await queryRunner.query(
            `CREATE INDEX idx_templates_channel ON notification_templates(channel)`
        );

        // ===== Indexes for notifications =====
        await queryRunner.query(
            `CREATE INDEX idx_notifications_template ON notifications(template_id)`
        );
        await queryRunner.query(
            `CREATE INDEX idx_notifications_group ON notifications(group_id)`
        );
        await queryRunner.query(
            `CREATE INDEX idx_notifications_type ON notifications(type)`
        );
        await queryRunner.query(
            `CREATE INDEX idx_notifications_order ON notifications(order_id)`
        );
        await queryRunner.query(
            `CREATE INDEX idx_notifications_product ON notifications(product_id)`
        );
        await queryRunner.query(
            `CREATE INDEX idx_notifications_expires ON notifications(expires_at)`
        );
        await queryRunner.query(
            `CREATE INDEX idx_notifications_created ON notifications(created_at DESC)`
        );
        // Composite index for priority + created_at for delivery queue
        await queryRunner.query(
            `CREATE INDEX idx_notifications_priority_created ON notifications(priority DESC, created_at ASC)`
        );

        // ===== Critical indexes for notification_recipients =====
        // Most important index: user + status + created_at for user notification queries
        await queryRunner.query(
            `CREATE INDEX idx_recipients_user_status_created ON notification_recipients(user_id, status, created_at DESC)`
        );
        // Partial index for unread notifications (most common query)
        await queryRunner.query(
            `CREATE INDEX idx_recipients_user_unread ON notification_recipients(user_id, created_at DESC)`
        );
        await queryRunner.query(
            `CREATE INDEX idx_recipients_notification ON notification_recipients(notification_id)`
        );
        await queryRunner.query(
            `CREATE INDEX idx_recipients_channel_status ON notification_recipients(channel, status)`
        );
        // Index for cleanup jobs (old read notifications)
        await queryRunner.query(
            `CREATE INDEX idx_recipients_old_read ON notification_recipients(created_at)`
        );
        // Index for pending delivery
        await queryRunner.query(
            `CREATE INDEX idx_recipients_pending ON notification_recipients(status, created_at ASC)`
        );

        // ===== Indexes for notification_preferences =====
        await queryRunner.query(
            `CREATE INDEX idx_preferences_user ON notification_preferences(user_id)`
        );
        await queryRunner.query(
            `CREATE INDEX idx_preferences_type_enabled ON notification_preferences(notification_type, enabled)`
        );

        // ===== Indexes for notification_delivery_log =====
        // Index for retry jobs
        await queryRunner.query(
            `CREATE INDEX idx_delivery_log_retry ON notification_delivery_log(status, next_retry_at)`
        );
        await queryRunner.query(
            `CREATE INDEX idx_delivery_log_recipient ON notification_delivery_log(recipient_id)`
        );
        await queryRunner.query(
            `CREATE INDEX idx_delivery_log_attempted ON notification_delivery_log(attempted_at)`
        );
        await queryRunner.query(
            `CREATE INDEX idx_delivery_log_channel_status ON notification_delivery_log(channel, status)`
        );

        // ===== Indexes for notification_groups =====
        await queryRunner.query(
            `CREATE INDEX idx_groups_user ON notification_groups(user_id)`
        );
        await queryRunner.query(
            `CREATE INDEX idx_groups_updated ON notification_groups(updated_at DESC)`
        );
        await queryRunner.query(
            `CREATE INDEX idx_groups_type ON notification_groups(notification_type)`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop all indexes in reverse order

        // notification_groups indexes
        await queryRunner.query(`DROP INDEX idx_groups_type ON notification_groups`);
        await queryRunner.query(`DROP INDEX idx_groups_updated ON notification_groups`);
        await queryRunner.query(`DROP INDEX idx_groups_user ON notification_groups`);

        // notification_delivery_log indexes
        await queryRunner.query(`DROP INDEX idx_delivery_log_channel_status ON notification_delivery_log`);
        await queryRunner.query(`DROP INDEX idx_delivery_log_attempted ON notification_delivery_log`);
        await queryRunner.query(`DROP INDEX idx_delivery_log_recipient ON notification_delivery_log`);
        await queryRunner.query(`DROP INDEX idx_delivery_log_retry ON notification_delivery_log`);

        // notification_preferences indexes
        await queryRunner.query(`DROP INDEX idx_preferences_type_enabled ON notification_preferences`);
        await queryRunner.query(`DROP INDEX idx_preferences_user ON notification_preferences`);

        // notification_recipients indexes
        await queryRunner.query(`DROP INDEX idx_recipients_pending ON notification_recipients`);
        await queryRunner.query(`DROP INDEX idx_recipients_old_read ON notification_recipients`);
        await queryRunner.query(`DROP INDEX idx_recipients_channel_status ON notification_recipients`);
        await queryRunner.query(`DROP INDEX idx_recipients_notification ON notification_recipients`);
        await queryRunner.query(`DROP INDEX idx_recipients_user_unread ON notification_recipients`);
        await queryRunner.query(`DROP INDEX idx_recipients_user_status_created ON notification_recipients`);

        // notifications indexes
        await queryRunner.query(`DROP INDEX idx_notifications_priority_created ON notifications`);
        await queryRunner.query(`DROP INDEX idx_notifications_created ON notifications`);
        await queryRunner.query(`DROP INDEX idx_notifications_expires ON notifications`);
        await queryRunner.query(`DROP INDEX idx_notifications_product ON notifications`);
        await queryRunner.query(`DROP INDEX idx_notifications_order ON notifications`);
        await queryRunner.query(`DROP INDEX idx_notifications_type ON notifications`);
        await queryRunner.query(`DROP INDEX idx_notifications_group ON notifications`);
        await queryRunner.query(`DROP INDEX idx_notifications_template ON notifications`);

        // notification_templates indexes
        await queryRunner.query(`DROP INDEX idx_templates_channel ON notification_templates`);
        await queryRunner.query(`DROP INDEX idx_templates_type ON notification_templates`);
    }
}
