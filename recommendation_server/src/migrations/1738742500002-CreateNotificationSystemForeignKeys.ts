import { MigrationInterface, QueryRunner, TableForeignKey } from "typeorm";

export class CreateNotificationSystemForeignKeys1738742500002 implements MigrationInterface {
    name = 'CreateNotificationSystemForeignKeys1738742500002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ===== Foreign keys for notifications table =====

        // Link to notification_templates
        await queryRunner.createForeignKey(
            "notifications",
            new TableForeignKey({
                name: "fk_notifications_template",
                columnNames: ["template_id"],
                referencedTableName: "notification_templates",
                referencedColumnNames: ["id"],
                onDelete: "SET NULL"
            })
        );

        // Link to orders table (existing table)
        await queryRunner.createForeignKey(
            "notifications",
            new TableForeignKey({
                name: "fk_notifications_order",
                columnNames: ["order_id"],
                referencedTableName: "orders",
                referencedColumnNames: ["id"],
                onDelete: "SET NULL"
            })
        );

        // Link to products table (existing table)
        await queryRunner.createForeignKey(
            "notifications",
            new TableForeignKey({
                name: "fk_notifications_product",
                columnNames: ["product_id"],
                referencedTableName: "products",
                referencedColumnNames: ["id"],
                onDelete: "SET NULL"
            })
        );

        // ===== Foreign keys for notification_recipients table =====

        // Link to notifications
        await queryRunner.createForeignKey(
            "notification_recipients",
            new TableForeignKey({
                name: "fk_recipients_notification",
                columnNames: ["notification_id"],
                referencedTableName: "notifications",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE"
            })
        );

        // Link to users table (existing table)
        await queryRunner.createForeignKey(
            "notification_recipients",
            new TableForeignKey({
                name: "fk_recipients_user",
                columnNames: ["user_id"],
                referencedTableName: "users",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE"
            })
        );

        // ===== Foreign keys for notification_preferences table =====

        // Link to users table
        await queryRunner.createForeignKey(
            "notification_preferences",
            new TableForeignKey({
                name: "fk_preferences_user",
                columnNames: ["user_id"],
                referencedTableName: "users",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE"
            })
        );

        // ===== Foreign keys for notification_delivery_log table =====

        // Link to notification_recipients
        await queryRunner.createForeignKey(
            "notification_delivery_log",
            new TableForeignKey({
                name: "fk_delivery_log_recipient",
                columnNames: ["recipient_id"],
                referencedTableName: "notification_recipients",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE"
            })
        );

        // ===== Foreign keys for notification_groups table =====

        // Link to users table
        await queryRunner.createForeignKey(
            "notification_groups",
            new TableForeignKey({
                name: "fk_groups_user",
                columnNames: ["user_id"],
                referencedTableName: "users",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE"
            })
        );

        // Link to last notification (self-referencing to notifications)
        await queryRunner.createForeignKey(
            "notification_groups",
            new TableForeignKey({
                name: "fk_groups_last_notification",
                columnNames: ["last_notification_id"],
                referencedTableName: "notifications",
                referencedColumnNames: ["id"],
                onDelete: "SET NULL"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop all foreign keys in reverse order

        // notification_groups
        await queryRunner.dropForeignKey("notification_groups", "fk_groups_last_notification");
        await queryRunner.dropForeignKey("notification_groups", "fk_groups_user");

        // notification_delivery_log
        await queryRunner.dropForeignKey("notification_delivery_log", "fk_delivery_log_recipient");

        // notification_preferences
        await queryRunner.dropForeignKey("notification_preferences", "fk_preferences_user");

        // notification_recipients
        await queryRunner.dropForeignKey("notification_recipients", "fk_recipients_user");
        await queryRunner.dropForeignKey("notification_recipients", "fk_recipients_notification");

        // notifications
        await queryRunner.dropForeignKey("notifications", "fk_notifications_product");
        await queryRunner.dropForeignKey("notifications", "fk_notifications_order");
        await queryRunner.dropForeignKey("notifications", "fk_notifications_template");
    }
}
