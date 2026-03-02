import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateNotificationSystemTables1738742500000 implements MigrationInterface {
    name = 'CreateNotificationSystemTables1738742500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create notification_templates table
        await queryRunner.createTable(
            new Table({
                name: "notification_templates",
                columns: [
                    {
                        name: "id",
                        type: "bigint",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                        unsigned: true
                    },
                    {
                        name: "type",
                        type: "varchar",
                        length: "50"
                    },
                    {
                        name: "channel",
                        type: "varchar",
                        length: "20"
                    },
                    {
                        name: "name",
                        type: "varchar",
                        length: "255"
                    },
                    {
                        name: "subject",
                        type: "varchar",
                        length: "500",
                        isNullable: true
                    },
                    {
                        name: "body",
                        type: "text"
                    },
                    {
                        name: "variables",
                        type: "json",
                        isNullable: true
                    },
                    {
                        name: "is_active",
                        type: "boolean",
                        default: true
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP"
                    }
                ]
            }),
            true
        );

        // Create unique constraint for type + channel
        await queryRunner.query(
            `ALTER TABLE notification_templates ADD CONSTRAINT uk_template_type_channel UNIQUE (type, channel)`
        );

        // Create notifications table
        await queryRunner.createTable(
            new Table({
                name: "notifications",
                columns: [
                    {
                        name: "id",
                        type: "bigint",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                        unsigned: true
                    },
                    {
                        name: "template_id",
                        type: "bigint",
                        isNullable: true,
                        unsigned: true
                    },
                    {
                        name: "group_id",
                        type: "bigint",
                        isNullable: true,
                        unsigned: true
                    },
                    {
                        name: "type",
                        type: "varchar",
                        length: "50"
                    },
                    {
                        name: "priority",
                        type: "enum",
                        enum: ["low", "medium", "high", "urgent"],
                        default: "'medium'"
                    },
                    {
                        name: "title",
                        type: "varchar",
                        length: "500"
                    },
                    {
                        name: "message",
                        type: "text"
                    },
                    {
                        name: "metadata",
                        type: "json",
                        isNullable: true
                    },
                    {
                        name: "order_id",
                        type: "int",
                        isNullable: true
                    },
                    {
                        name: "product_id",
                        type: "int",
                        isNullable: true
                    },
                    {
                        name: "user_action",
                        type: "varchar",
                        length: "100",
                        isNullable: true
                    },
                    {
                        name: "expires_at",
                        type: "timestamp",
                        isNullable: true
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    }
                ]
            }),
            true
        );

        // Create notification_recipients table
        await queryRunner.createTable(
            new Table({
                name: "notification_recipients",
                columns: [
                    {
                        name: "id",
                        type: "bigint",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                        unsigned: true
                    },
                    {
                        name: "notification_id",
                        type: "bigint",
                        unsigned: true
                    },
                    {
                        name: "user_id",
                        type: "int"
                    },
                    {
                        name: "status",
                        type: "enum",
                        enum: ["pending", "sent", "delivered", "read", "failed"],
                        default: "'pending'"
                    },
                    {
                        name: "channel",
                        type: "enum",
                        enum: ["websocket", "email", "push", "sms", "in_app"]
                    },
                    {
                        name: "sent_at",
                        type: "timestamp",
                        isNullable: true
                    },
                    {
                        name: "delivered_at",
                        type: "timestamp",
                        isNullable: true
                    },
                    {
                        name: "read_at",
                        type: "timestamp",
                        isNullable: true
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    }
                ]
            }),
            true
        );

        // Create notification_preferences table
        await queryRunner.createTable(
            new Table({
                name: "notification_preferences",
                columns: [
                    {
                        name: "user_id",
                        type: "int",
                        isPrimary: true
                    },
                    {
                        name: "notification_type",
                        type: "varchar",
                        length: "50",
                        isPrimary: true
                    },
                    {
                        name: "channel",
                        type: "enum",
                        enum: ["websocket", "email", "push", "sms", "in_app"],
                        isPrimary: true
                    },
                    {
                        name: "enabled",
                        type: "boolean",
                        default: true
                    },
                    {
                        name: "frequency",
                        type: "enum",
                        enum: ["realtime", "hourly_digest", "daily_digest", "weekly_digest", "disabled"],
                        default: "'realtime'"
                    },
                    {
                        name: "custom_settings",
                        type: "json",
                        isNullable: true
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP"
                    }
                ]
            }),
            true
        );

        // Create notification_delivery_log table
        await queryRunner.createTable(
            new Table({
                name: "notification_delivery_log",
                columns: [
                    {
                        name: "id",
                        type: "bigint",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                        unsigned: true
                    },
                    {
                        name: "recipient_id",
                        type: "bigint",
                        unsigned: true
                    },
                    {
                        name: "channel",
                        type: "enum",
                        enum: ["websocket", "email", "push", "sms", "in_app"]
                    },
                    {
                        name: "attempt_number",
                        type: "smallint",
                        default: 1
                    },
                    {
                        name: "status",
                        type: "enum",
                        enum: ["pending", "success", "failed", "retrying", "abandoned"]
                    },
                    {
                        name: "error_code",
                        type: "varchar",
                        length: "50",
                        isNullable: true
                    },
                    {
                        name: "error_message",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "response_data",
                        type: "json",
                        isNullable: true
                    },
                    {
                        name: "attempted_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "next_retry_at",
                        type: "timestamp",
                        isNullable: true
                    }
                ]
            }),
            true
        );

        // Create notification_groups table
        await queryRunner.createTable(
            new Table({
                name: "notification_groups",
                columns: [
                    {
                        name: "id",
                        type: "bigint",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                        unsigned: true
                    },
                    {
                        name: "group_key",
                        type: "varchar",
                        length: "255"
                    },
                    {
                        name: "user_id",
                        type: "int"
                    },
                    {
                        name: "notification_type",
                        type: "varchar",
                        length: "50"
                    },
                    {
                        name: "aggregated_count",
                        type: "int",
                        default: 1
                    },
                    {
                        name: "last_notification_id",
                        type: "bigint",
                        isNullable: true,
                        unsigned: true
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP"
                    }
                ]
            }),
            true
        );

        // Create unique constraint for group_key + user_id
        await queryRunner.query(
            `ALTER TABLE notification_groups ADD CONSTRAINT uk_groups_key_user UNIQUE (group_key, user_id)`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order to handle dependencies
        await queryRunner.dropTable("notification_groups");
        await queryRunner.dropTable("notification_delivery_log");
        await queryRunner.dropTable("notification_preferences");
        await queryRunner.dropTable("notification_recipients");
        await queryRunner.dropTable("notifications");
        await queryRunner.dropTable("notification_templates");
    }
}
