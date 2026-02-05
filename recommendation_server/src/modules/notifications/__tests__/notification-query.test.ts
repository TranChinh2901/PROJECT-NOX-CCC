import { DataSource, Repository } from "typeorm";
import {
    Notification,
    NotificationRecipient,
    NotificationTemplate,
    NotificationPreference,
    NotificationDeliveryLog,
    NotificationGroup
} from "../entities";
import {
    NotificationType,
    NotificationChannel,
    NotificationStatus,
    NotificationPriority,
    DeliveryFrequency
} from "../enums";

/**
 * Notification System Query Optimization Tests
 *
 * This file contains test queries to validate index usage and performance
 * Run with EXPLAIN to verify indexes are being used correctly
 */

export class NotificationQueryTests {
    private dataSource: DataSource;
    private notificationRepo: Repository<Notification>;
    private recipientRepo: Repository<NotificationRecipient>;
    private templateRepo: Repository<NotificationTemplate>;
    private preferenceRepo: Repository<NotificationPreference>;
    private deliveryLogRepo: Repository<NotificationDeliveryLog>;
    private groupRepo: Repository<NotificationGroup>;

    constructor(dataSource: DataSource) {
        this.dataSource = dataSource;
        this.notificationRepo = dataSource.getRepository(Notification);
        this.recipientRepo = dataSource.getRepository(NotificationRecipient);
        this.templateRepo = dataSource.getRepository(NotificationTemplate);
        this.preferenceRepo = dataSource.getRepository(NotificationPreference);
        this.deliveryLogRepo = dataSource.getRepository(NotificationDeliveryLog);
        this.groupRepo = dataSource.getRepository(NotificationGroup);
    }

    /**
     * Test Query 1: Get Unread Count for User
     * Expected Index: idx_recipients_user_unread
     * Expected Performance: < 5ms
     */
    async testGetUnreadCount(userId: number): Promise<number> {
        const startTime = Date.now();

        const count = await this.recipientRepo.count({
            where: {
                user_id: userId,
                status: NotificationStatus.PENDING
            }
        });

        const duration = Date.now() - startTime;
        console.log(`✓ Get Unread Count: ${duration}ms (target: < 5ms)`);

        return count;
    }

    /**
     * Test Query 2: Get Recent Notifications for User
     * Expected Index: idx_recipients_user_status_created
     * Expected Performance: < 20ms
     */
    async testGetRecentNotifications(userId: number, limit: number = 20): Promise<NotificationRecipient[]> {
        const startTime = Date.now();

        const notifications = await this.recipientRepo
            .createQueryBuilder('nr')
            .leftJoinAndSelect('nr.notification', 'n')
            .where('nr.user_id = :userId', { userId })
            .orderBy('n.created_at', 'DESC')
            .limit(limit)
            .getMany();

        const duration = Date.now() - startTime;
        console.log(`✓ Get Recent Notifications: ${duration}ms (target: < 20ms)`);

        return notifications;
    }

    /**
     * Test Query 3: Mark Notification as Read
     * Expected Performance: < 30ms
     */
    async testMarkAsRead(recipientId: number, userId: number): Promise<void> {
        const startTime = Date.now();

        await this.recipientRepo.update(
            { id: recipientId, user_id: userId },
            {
                status: NotificationStatus.READ,
                read_at: new Date()
            }
        );

        const duration = Date.now() - startTime;
        console.log(`✓ Mark as Read: ${duration}ms (target: < 30ms)`);
    }

    /**
     * Test Query 4: Get Notifications Pending Delivery
     * Expected Index: idx_recipients_pending
     * Expected Performance: < 100ms for 1000 records
     */
    async testGetPendingNotifications(limit: number = 1000): Promise<any[]> {
        const startTime = Date.now();

        const result = await this.dataSource.query(
            'CALL get_pending_notifications(?)',
            [limit]
        );

        const duration = Date.now() - startTime;
        console.log(`✓ Get Pending Notifications: ${duration}ms (target: < 100ms)`);

        return result[0];
    }

    /**
     * Test Query 5: Batch Insert Notifications
     * Expected Performance: < 500ms for 1000 recipients
     */
    async testBatchInsert(notificationId: number, userIds: number[]): Promise<void> {
        const startTime = Date.now();

        await this.recipientRepo
            .createQueryBuilder()
            .insert()
            .values(
                userIds.map(userId => ({
                    notification_id: notificationId,
                    user_id: userId,
                    status: NotificationStatus.PENDING,
                    channel: NotificationChannel.EMAIL
                }))
            )
            .execute();

        const duration = Date.now() - startTime;
        console.log(`✓ Batch Insert (${userIds.length} recipients): ${duration}ms (target: < 500ms for 1000)`);
    }

    /**
     * Test Query 6: Get User Preferences
     * Expected Index: idx_preferences_user
     * Expected Performance: < 10ms
     */
    async testGetUserPreferences(userId: number): Promise<NotificationPreference[]> {
        const startTime = Date.now();

        const preferences = await this.preferenceRepo.find({
            where: { user_id: userId }
        });

        const duration = Date.now() - startTime;
        console.log(`✓ Get User Preferences: ${duration}ms (target: < 10ms)`);

        return preferences;
    }

    /**
     * Test Query 7: Check if User Has Opted In
     * Expected Index: PRIMARY KEY (user_id, notification_type, channel)
     * Expected Performance: < 5ms
     */
    async testCheckOptIn(
        userId: number,
        notificationType: string,
        channel: NotificationChannel
    ): Promise<boolean> {
        const startTime = Date.now();

        const preference = await this.preferenceRepo.findOne({
            where: {
                user_id: userId,
                notification_type: notificationType,
                channel: channel
            }
        });

        const duration = Date.now() - startTime;
        console.log(`✓ Check Opt-In: ${duration}ms (target: < 5ms)`);

        return preference?.enabled ?? false;
    }

    /**
     * Test Query 8: Get Failed Deliveries for Retry
     * Expected Index: idx_delivery_log_retry
     * Expected Performance: < 50ms for 100 records
     */
    async testGetFailedDeliveries(limit: number = 100): Promise<any[]> {
        const startTime = Date.now();

        const result = await this.dataSource.query(
            'CALL get_failed_deliveries_for_retry(?)',
            [limit]
        );

        const duration = Date.now() - startTime;
        console.log(`✓ Get Failed Deliveries: ${duration}ms (target: < 50ms)`);

        return result[0];
    }

    /**
     * Test Query 9: Get Notifications by Type for User
     * Expected Index: idx_recipients_user_status_created + idx_notifications_type
     * Expected Performance: < 30ms
     */
    async testGetNotificationsByType(
        userId: number,
        notificationType: string,
        limit: number = 50
    ): Promise<NotificationRecipient[]> {
        const startTime = Date.now();

        const notifications = await this.recipientRepo
            .createQueryBuilder('nr')
            .leftJoinAndSelect('nr.notification', 'n')
            .where('nr.user_id = :userId', { userId })
            .andWhere('n.type = :type', { type: notificationType })
            .orderBy('n.created_at', 'DESC')
            .limit(limit)
            .getMany();

        const duration = Date.now() - startTime;
        console.log(`✓ Get Notifications by Type: ${duration}ms (target: < 30ms)`);

        return notifications;
    }

    /**
     * Test Query 10: Get User Notification Stats
     * Expected Performance: < 10ms (using stored procedure)
     */
    async testGetUserStats(userId: number): Promise<any> {
        const startTime = Date.now();

        const result = await this.dataSource.query(
            'CALL get_user_notification_stats(?)',
            [userId]
        );

        const duration = Date.now() - startTime;
        console.log(`✓ Get User Stats: ${duration}ms (target: < 10ms)`);

        return result[0][0];
    }

    /**
     * Explain Query Helper
     * Use this to analyze query execution plans
     */
    async explainQuery(query: string, params: any[] = []): Promise<void> {
        console.log('\n--- Query Execution Plan ---');
        console.log('Query:', query);
        console.log('Params:', params);

        const explainResult = await this.dataSource.query(`EXPLAIN ${query}`, params);
        console.table(explainResult);
        console.log('----------------------------\n');
    }

    /**
     * Run All Tests
     */
    async runAllTests(testUserId: number = 1): Promise<void> {
        console.log('\n========================================');
        console.log('Notification System Query Performance Tests');
        console.log('========================================\n');

        try {
            // Test 1: Unread count
            await this.testGetUnreadCount(testUserId);

            // Test 2: Recent notifications
            await this.testGetRecentNotifications(testUserId);

            // Test 3: Get user preferences
            await this.testGetUserPreferences(testUserId);

            // Test 4: Check opt-in
            await this.testCheckOptIn(testUserId, NotificationType.ORDER_UPDATE, NotificationChannel.EMAIL);

            // Test 5: Get user stats
            await this.testGetUserStats(testUserId);

            // Test 6: Get notifications by type
            await this.testGetNotificationsByType(testUserId, NotificationType.ORDER_UPDATE);

            // Test 7: Get pending notifications
            await this.testGetPendingNotifications(100);

            // Test 8: Get failed deliveries
            await this.testGetFailedDeliveries(100);

            console.log('\n========================================');
            console.log('All Tests Completed Successfully!');
            console.log('========================================\n');
        } catch (error) {
            console.error('\n❌ Test Failed:', error);
            throw error;
        }
    }

    /**
     * Verify Index Usage
     * Run EXPLAIN on critical queries to ensure indexes are being used
     */
    async verifyIndexUsage(): Promise<void> {
        console.log('\n========================================');
        console.log('Index Usage Verification');
        console.log('========================================\n');

        // Verify idx_recipients_user_unread
        console.log('1. Testing idx_recipients_user_unread:');
        await this.explainQuery(
            'SELECT COUNT(*) FROM notification_recipients WHERE user_id = ? AND status != ?',
            [1, 'read']
        );

        // Verify idx_recipients_user_status_created
        console.log('2. Testing idx_recipients_user_status_created:');
        await this.explainQuery(
            `SELECT nr.*, n.*
             FROM notification_recipients nr
             JOIN notifications n ON n.id = nr.notification_id
             WHERE nr.user_id = ?
             ORDER BY n.created_at DESC
             LIMIT 20`,
            [1]
        );

        // Verify idx_recipients_pending
        console.log('3. Testing idx_recipients_pending:');
        await this.explainQuery(
            `SELECT * FROM notification_recipients
             WHERE status = 'pending'
             ORDER BY created_at ASC
             LIMIT 1000`,
            []
        );

        // Verify idx_delivery_log_retry
        console.log('4. Testing idx_delivery_log_retry:');
        await this.explainQuery(
            `SELECT * FROM notification_delivery_log
             WHERE status = 'failed'
               AND next_retry_at <= NOW()
               AND attempt_number < 5
             ORDER BY next_retry_at ASC
             LIMIT 100`,
            []
        );

        console.log('========================================\n');
    }

    /**
     * Generate Sample Test Data
     * Use this to populate database for performance testing
     */
    async generateTestData(
        userId: number = 1,
        notificationCount: number = 1000
    ): Promise<void> {
        console.log(`Generating ${notificationCount} test notifications...`);

        const template = await this.templateRepo.findOne({
            where: { type: NotificationType.ORDER_UPDATE, channel: NotificationChannel.EMAIL }
        });

        if (!template) {
            throw new Error('No template found. Run seed migration first.');
        }

        for (let i = 0; i < notificationCount; i++) {
            const notification = await this.notificationRepo.save({
                template_id: template.id,
                type: NotificationType.ORDER_UPDATE,
                priority: NotificationPriority.MEDIUM,
                title: `Test Notification ${i}`,
                message: `This is test notification number ${i}`,
                metadata: { test: true, index: i }
            });

            await this.recipientRepo.save({
                notification_id: notification.id,
                user_id: userId,
                status: i % 10 === 0 ? NotificationStatus.READ : NotificationStatus.PENDING,
                channel: NotificationChannel.EMAIL
            });

            if ((i + 1) % 100 === 0) {
                console.log(`Generated ${i + 1}/${notificationCount} notifications`);
            }
        }

        console.log('✓ Test data generation complete!');
    }
}

/**
 * Usage Example:
 *
 * ```typescript
 * import { AppDataSource } from '@/config/database.config';
 * import { NotificationQueryTests } from './notification-query.test';
 *
 * async function runTests() {
 *   await AppDataSource.initialize();
 *   const tests = new NotificationQueryTests(AppDataSource);
 *
 *   // Generate test data
 *   await tests.generateTestData(1, 10000);
 *
 *   // Run performance tests
 *   await tests.runAllTests(1);
 *
 *   // Verify indexes
 *   await tests.verifyIndexUsage();
 *
 *   await AppDataSource.destroy();
 * }
 *
 * runTests();
 * ```
 */
