import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationSystemFunctions1738742500003 implements MigrationInterface {
    name = 'CreateNotificationSystemFunctions1738742500003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ===== Function to archive old read notifications =====
        await queryRunner.query(`
            CREATE PROCEDURE archive_old_notifications(IN days_old INT)
            BEGIN
                DECLARE archived_count INT DEFAULT 0;

                -- Create archive table if it doesn't exist
                CREATE TABLE IF NOT EXISTS notifications_archive LIKE notifications;
                CREATE TABLE IF NOT EXISTS notification_recipients_archive LIKE notification_recipients;

                -- Move notifications older than X days where all recipients have read them
                INSERT INTO notifications_archive
                SELECT n.* FROM notifications n
                WHERE n.created_at < DATE_SUB(NOW(), INTERVAL days_old DAY)
                  AND n.id IN (
                      SELECT nr.notification_id
                      FROM notification_recipients nr
                      WHERE nr.notification_id = n.id
                      GROUP BY nr.notification_id
                      HAVING COUNT(*) = SUM(CASE WHEN nr.status = 'read' THEN 1 ELSE 0 END)
                  );

                -- Get count of archived notifications
                SET archived_count = ROW_COUNT();

                -- Move corresponding recipients
                INSERT INTO notification_recipients_archive
                SELECT nr.* FROM notification_recipients nr
                WHERE nr.notification_id IN (SELECT id FROM notifications_archive);

                -- Delete from main tables
                DELETE nr FROM notification_recipients nr
                WHERE nr.notification_id IN (SELECT id FROM notifications_archive);

                DELETE n FROM notifications n
                WHERE n.id IN (SELECT id FROM notifications_archive);

                -- Return count
                SELECT archived_count AS archived_notifications;
            END
        `);

        // ===== Function to cleanup expired notifications =====
        await queryRunner.query(`
            CREATE PROCEDURE cleanup_expired_notifications()
            BEGIN
                DECLARE deleted_count INT DEFAULT 0;

                -- Delete expired notifications (cascades to recipients via foreign key)
                DELETE FROM notifications
                WHERE expires_at < NOW()
                  AND created_at < DATE_SUB(NOW(), INTERVAL 1 DAY);

                SET deleted_count = ROW_COUNT();

                SELECT deleted_count AS deleted_notifications;
            END
        `);

        // ===== Function to get user notification stats =====
        await queryRunner.query(`
            CREATE PROCEDURE get_user_notification_stats(IN user_id_param INT)
            BEGIN
                SELECT
                    COUNT(*) AS total_count,
                    SUM(CASE WHEN status = 'read' THEN 0 ELSE 1 END) AS unread_count,
                    SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) AS read_count,
                    MAX(CASE WHEN status != 'read' THEN created_at END) AS last_unread_at,
                    MAX(read_at) AS last_read_at
                FROM notification_recipients
                WHERE user_id = user_id_param
                  AND created_at > DATE_SUB(NOW(), INTERVAL 90 DAY);
            END
        `);

        // ===== Function to mark all as read for a user =====
        await queryRunner.query(`
            CREATE PROCEDURE mark_all_notifications_read(IN user_id_param INT)
            BEGIN
                UPDATE notification_recipients
                SET status = 'read',
                    read_at = NOW()
                WHERE user_id = user_id_param
                  AND status != 'read';

                SELECT ROW_COUNT() AS marked_read_count;
            END
        `);

        // ===== Function to cleanup old delivery logs =====
        await queryRunner.query(`
            CREATE PROCEDURE cleanup_old_delivery_logs(IN days_old INT)
            BEGIN
                DELETE FROM notification_delivery_log
                WHERE attempted_at < DATE_SUB(NOW(), INTERVAL days_old DAY)
                  AND status IN ('success', 'abandoned');

                SELECT ROW_COUNT() AS deleted_logs;
            END
        `);

        // ===== Function to get notifications pending delivery =====
        await queryRunner.query(`
            CREATE PROCEDURE get_pending_notifications(IN limit_count INT)
            BEGIN
                SELECT
                    nr.id AS recipient_id,
                    nr.notification_id,
                    nr.user_id,
                    nr.channel,
                    n.title,
                    n.message,
                    n.metadata,
                    n.priority,
                    u.email,
                    u.phone_number,
                    u.fullname AS user_name
                FROM notification_recipients nr
                INNER JOIN notifications n ON n.id = nr.notification_id
                INNER JOIN users u ON u.id = nr.user_id
                WHERE nr.status = 'pending'
                  AND (n.expires_at IS NULL OR n.expires_at > NOW())
                ORDER BY n.priority DESC, n.created_at ASC
                LIMIT limit_count;
            END
        `);

        // ===== Function to get failed deliveries for retry =====
        await queryRunner.query(`
            CREATE PROCEDURE get_failed_deliveries_for_retry(IN limit_count INT)
            BEGIN
                SELECT
                    dl.id AS log_id,
                    dl.recipient_id,
                    dl.channel,
                    dl.attempt_number,
                    dl.error_message,
                    nr.notification_id,
                    nr.user_id
                FROM notification_delivery_log dl
                INNER JOIN notification_recipients nr ON nr.id = dl.recipient_id
                WHERE dl.status = 'failed'
                  AND dl.next_retry_at <= NOW()
                  AND dl.attempt_number < 5
                ORDER BY dl.next_retry_at ASC
                LIMIT limit_count;
            END
        `);

        // ===== Function to update notification group =====
        await queryRunner.query(`
            CREATE PROCEDURE update_notification_group(
                IN group_key_param VARCHAR(255),
                IN user_id_param INT,
                IN notification_type_param VARCHAR(50),
                IN notification_id_param BIGINT
            )
            BEGIN
                INSERT INTO notification_groups (
                    group_key,
                    user_id,
                    notification_type,
                    aggregated_count,
                    last_notification_id,
                    created_at,
                    updated_at
                ) VALUES (
                    group_key_param,
                    user_id_param,
                    notification_type_param,
                    1,
                    notification_id_param,
                    NOW(),
                    NOW()
                )
                ON DUPLICATE KEY UPDATE
                    aggregated_count = aggregated_count + 1,
                    last_notification_id = notification_id_param,
                    updated_at = NOW();

                SELECT * FROM notification_groups
                WHERE group_key = group_key_param AND user_id = user_id_param;
            END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop all stored procedures
        await queryRunner.query(`DROP PROCEDURE IF EXISTS update_notification_group`);
        await queryRunner.query(`DROP PROCEDURE IF EXISTS get_failed_deliveries_for_retry`);
        await queryRunner.query(`DROP PROCEDURE IF EXISTS get_pending_notifications`);
        await queryRunner.query(`DROP PROCEDURE IF EXISTS cleanup_old_delivery_logs`);
        await queryRunner.query(`DROP PROCEDURE IF EXISTS mark_all_notifications_read`);
        await queryRunner.query(`DROP PROCEDURE IF EXISTS get_user_notification_stats`);
        await queryRunner.query(`DROP PROCEDURE IF EXISTS cleanup_expired_notifications`);
        await queryRunner.query(`DROP PROCEDURE IF EXISTS archive_old_notifications`);

        // Drop archive tables if they exist
        await queryRunner.query(`DROP TABLE IF EXISTS notification_recipients_archive`);
        await queryRunner.query(`DROP TABLE IF EXISTS notifications_archive`);
    }
}
