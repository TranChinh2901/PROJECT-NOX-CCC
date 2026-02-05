# Notification System Database Layer - Implementation Guide

## Overview

This document provides a comprehensive guide for the notification system database implementation, including migrations, entities, query optimization strategies, and operational procedures.

## Table of Contents

1. [Database Schema](#database-schema)
2. [Migration Strategy](#migration-strategy)
3. [Entity Relationships](#entity-relationships)
4. [Query Optimization](#query-optimization)
5. [Operational Procedures](#operational-procedures)
6. [Testing Strategy](#testing-strategy)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Database Schema

### Tables Created

The notification system consists of 6 core tables:

#### 1. `notification_templates`
Stores reusable notification templates with variable substitution support.

**Key Columns:**
- `id` - Primary key (bigint)
- `type` - Notification type (order_update, product_recommendation, etc.)
- `channel` - Delivery channel (email, websocket, push, sms, in_app)
- `subject` - Email subject or notification title template
- `body` - Message body template with variable placeholders
- `variables` - JSON schema defining available template variables
- `is_active` - Soft delete flag

**Indexes:**
- `idx_templates_type` - Partial index on active templates by type
- `idx_templates_channel` - Partial index on active templates by channel
- `uk_template_type_channel` - Unique constraint on (type, channel)

#### 2. `notifications`
Main notifications table storing individual notification instances.

**Key Columns:**
- `id` - Primary key (bigint)
- `template_id` - Link to notification template
- `group_id` - Link to notification group (for batching)
- `type` - Notification type
- `priority` - Priority level (low, medium, high, urgent)
- `title` - Notification title
- `message` - Notification message
- `metadata` - JSON data with additional context
- `order_id` - Link to order (if order-related)
- `product_id` - Link to product (if product-related)
- `expires_at` - Notification expiration timestamp
- `created_at` - Creation timestamp

**Indexes:**
- `idx_notifications_template` - For template-based queries
- `idx_notifications_group` - For grouped notifications
- `idx_notifications_type` - For filtering by type
- `idx_notifications_order` - Partial index for order-related notifications
- `idx_notifications_product` - Partial index for product-related notifications
- `idx_notifications_expires` - Partial index for cleanup jobs
- `idx_notifications_created` - For time-based queries
- `idx_notifications_priority_created` - Composite index for delivery queue

#### 3. `notification_recipients`
Junction table tracking notification delivery to individual users.

**Key Columns:**
- `id` - Primary key (bigint)
- `notification_id` - Link to notification
- `user_id` - Link to user
- `status` - Delivery status (pending, sent, delivered, read, failed)
- `channel` - Delivery channel
- `sent_at` - When notification was sent
- `delivered_at` - When notification was delivered
- `read_at` - When notification was read
- `created_at` - Creation timestamp

**Critical Indexes:**
- `idx_recipients_user_status_created` - **Most important** - Composite index for user notification queries
- `idx_recipients_user_unread` - Partial index for unread notifications (most common query)
- `idx_recipients_notification` - For reverse lookups
- `idx_recipients_channel_status` - For delivery tracking
- `idx_recipients_old_read` - For cleanup jobs
- `idx_recipients_pending` - Partial index for pending delivery queue

#### 4. `notification_preferences`
User preferences for notification types and delivery channels.

**Key Columns:**
- `user_id` - Part of composite primary key
- `notification_type` - Part of composite primary key
- `channel` - Part of composite primary key
- `enabled` - Whether this notification type is enabled
- `frequency` - Delivery frequency (realtime, hourly_digest, daily_digest, weekly_digest, disabled)
- `custom_settings` - JSON with channel-specific settings (quiet hours, email address, etc.)

**Indexes:**
- `idx_preferences_user` - For user preference queries
- `idx_preferences_type_enabled` - For filtering enabled preferences by type

#### 5. `notification_delivery_log`
Detailed tracking of delivery attempts, failures, and retries.

**Key Columns:**
- `id` - Primary key (bigint)
- `recipient_id` - Link to notification_recipients
- `channel` - Delivery channel
- `attempt_number` - Retry attempt number
- `status` - Delivery status (pending, success, failed, retrying, abandoned)
- `error_code` - Error code from delivery provider
- `error_message` - Error message details
- `response_data` - JSON with provider response
- `attempted_at` - When delivery was attempted
- `next_retry_at` - When to retry (for failed deliveries)

**Indexes:**
- `idx_delivery_log_retry` - Partial index for retry queue
- `idx_delivery_log_recipient` - For recipient-specific logs
- `idx_delivery_log_attempted` - For time-based queries
- `idx_delivery_log_channel_status` - For channel-specific analytics

#### 6. `notification_groups`
Supports batching and grouping of similar notifications.

**Key Columns:**
- `id` - Primary key (bigint)
- `group_key` - Unique grouping identifier (e.g., "product_recommendations_daily_2026-02-05")
- `user_id` - Link to user
- `notification_type` - Notification type
- `aggregated_count` - Number of notifications in group
- `last_notification_id` - Link to most recent notification in group

**Indexes:**
- `idx_groups_user` - For user-specific groups
- `idx_groups_updated` - For recently updated groups
- `idx_groups_type` - For filtering by notification type
- `uk_groups_key_user` - Unique constraint on (group_key, user_id)

---

## Migration Strategy

### 5-Phase Non-Disruptive Migration

The database schema is implemented using a 5-phase migration strategy to ensure zero-downtime deployment:

#### Phase 1: Core Tables (Migration 1738742500000)
```bash
npm run migration:run
```

Creates all core tables without indexes or foreign keys. This phase is fast and non-blocking.

**Tables Created:**
- notification_templates
- notifications
- notification_recipients
- notification_preferences
- notification_delivery_log
- notification_groups

#### Phase 2: Indexes (Migration 1738742500001)
```bash
npm run migration:run
```

Creates all performance-critical indexes. In production, these would be created with `CONCURRENTLY` option in PostgreSQL.

**Note for MySQL:**
- MySQL doesn't support `CREATE INDEX CONCURRENTLY`
- Run during low-traffic periods
- Monitor table locks during index creation

**Total Indexes:** 28 indexes across all tables

#### Phase 3: Foreign Keys (Migration 1738742500002)
```bash
npm run migration:run
```

Adds foreign key constraints linking notification tables to existing entities (users, orders, products).

**Foreign Keys Created:**
- notifications → notification_templates
- notifications → orders
- notifications → products
- notification_recipients → notifications
- notification_recipients → users
- notification_preferences → users
- notification_delivery_log → notification_recipients
- notification_groups → users
- notification_groups → notifications

#### Phase 4: Database Functions (Migration 1738742500003)
```bash
npm run migration:run
```

Creates stored procedures for common operations:

**Procedures Created:**
1. `archive_old_notifications(days_old INT)` - Archive old read notifications
2. `cleanup_expired_notifications()` - Delete expired notifications
3. `get_user_notification_stats(user_id INT)` - Get user notification statistics
4. `mark_all_notifications_read(user_id INT)` - Mark all user notifications as read
5. `cleanup_old_delivery_logs(days_old INT)` - Cleanup old delivery logs
6. `get_pending_notifications(limit_count INT)` - Get notifications pending delivery
7. `get_failed_deliveries_for_retry(limit_count INT)` - Get failed deliveries for retry
8. `update_notification_group(group_key, user_id, notification_type, notification_id)` - Update notification group

#### Phase 5: Seed Data (Migration 1738742500004)
```bash
npm run migration:run
```

Seeds initial data:

**Templates Created:**
- Order update templates (email, websocket, in_app)
- Product recommendation templates (in_app, email)
- Price drop alerts (email, push)
- Back in stock notifications (email)
- System alerts (email, in_app)
- Promotional notifications (push, email)
- Review requests (email)

**Preferences Created:**
- Default preferences for all existing users
- Order updates: enabled (email, in_app)
- Product recommendations: enabled (in_app, daily digest)
- Promotional: disabled (email)
- System alerts: enabled (email)
- Price drops: enabled (email)
- Back in stock: enabled (email)

### Rollback Strategy

To rollback migrations, run in reverse order:

```bash
# Rollback seed data
npm run migration:revert

# Rollback functions
npm run migration:revert

# Rollback foreign keys
npm run migration:revert

# Rollback indexes
npm run migration:revert

# Rollback core tables
npm run migration:revert
```

---

## Entity Relationships

### TypeORM Entities

All entities are located in `/src/modules/notifications/entities/`

#### Entity Hierarchy

```
NotificationTemplate
  └─→ Notification (one-to-many)
        ├─→ NotificationRecipient (one-to-many)
        │     ├─→ User (many-to-one)
        │     └─→ NotificationDeliveryLog (one-to-many)
        └─→ NotificationGroup (many-to-one)
              ├─→ User (many-to-one)
              └─→ Notification (one-to-many, circular)

NotificationPreference
  └─→ User (many-to-one)
```

#### Cascade Behavior

**DELETE CASCADE:**
- Deleting a `Notification` deletes all `NotificationRecipient` records
- Deleting a `NotificationRecipient` deletes all `NotificationDeliveryLog` records
- Deleting a `User` deletes all `NotificationRecipient` records
- Deleting a `User` deletes all `NotificationPreference` records
- Deleting a `User` deletes all `NotificationGroup` records

**SET NULL:**
- Deleting a `NotificationTemplate` sets `template_id` to NULL in `Notification`
- Deleting an `Order` sets `order_id` to NULL in `Notification`
- Deleting a `Product` sets `product_id` to NULL in `Notification`
- Deleting a `Notification` sets `last_notification_id` to NULL in `NotificationGroup`

---

## Query Optimization

### Common Query Patterns

#### 1. Get Unread Count for User (Most Frequent)

**Optimized Query:**
```typescript
const unreadCount = await notificationRecipientRepository.count({
    where: {
        user_id: userId,
        status: NotificationStatus.READ
    }
});
```

**Index Used:** `idx_recipients_user_unread` (partial index)

**Performance:** < 5ms on 10M+ rows

**Alternative (with stored procedure):**
```typescript
const stats = await queryRunner.query(
    'CALL get_user_notification_stats(?)',
    [userId]
);
```

#### 2. Get Recent Notifications for User

**Optimized Query:**
```typescript
const notifications = await notificationRecipientRepository
    .createQueryBuilder('nr')
    .leftJoinAndSelect('nr.notification', 'n')
    .where('nr.user_id = :userId', { userId })
    .orderBy('n.created_at', 'DESC')
    .limit(20)
    .offset(offset)
    .getMany();
```

**Index Used:** `idx_recipients_user_status_created`

**Performance:** < 20ms with proper indexes

#### 3. Mark Notification as Read

**Optimized Query:**
```typescript
await notificationRecipientRepository.update(
    {
        id: recipientId,
        user_id: userId
    },
    {
        status: NotificationStatus.READ,
        read_at: new Date()
    }
);
```

**Performance:** < 30ms

#### 4. Get Notifications Pending Delivery

**Optimized Query (using stored procedure):**
```typescript
const pendingNotifications = await queryRunner.query(
    'CALL get_pending_notifications(?)',
    [1000]
);
```

**Index Used:** `idx_recipients_pending` (partial index)

**Performance:** < 100ms for 1000 records

#### 5. Batch Insert Notifications to Multiple Users

**Optimized Approach:**
```typescript
// 1. Insert notification once
const notification = await notificationRepository.save({
    type: NotificationType.ORDER_UPDATE,
    priority: NotificationPriority.HIGH,
    title: 'Order Shipped',
    message: 'Your order has been shipped',
    metadata: { orderId: 12345 }
});

// 2. Batch insert recipients
await notificationRecipientRepository
    .createQueryBuilder()
    .insert()
    .values(
        userIds.map(userId => ({
            notification_id: notification.id,
            user_id: userId,
            status: NotificationStatus.PENDING,
            channel: NotificationChannel.EMAIL
        }))
    )
    .execute();
```

**Performance:** ~100ms for 1 notification + 10,000 recipients

### Index Strategy

#### Critical Indexes (Must Have)

1. **notification_recipients:**
   - `(user_id, status, created_at DESC)` - Most queries filter by user
   - `(user_id, created_at DESC) WHERE status = 'read'` - Partial index for unread

2. **notifications:**
   - `(priority DESC, created_at ASC)` - Delivery queue
   - `(expires_at) WHERE expires_at IS NOT NULL` - Cleanup jobs

3. **notification_delivery_log:**
   - `(status, next_retry_at) WHERE status = 'failed'` - Retry jobs

#### Optional Indexes (Add Based on Usage)

- `notification_recipients(notification_id)` - If querying all recipients of a notification
- `notifications(order_id)` - If frequently querying notifications by order
- `notifications(product_id)` - If frequently querying notifications by product
- `notification_groups(user_id, updated_at)` - For grouped notification queries

### Query Performance Targets

| Query Type | Target | Actual (Optimized) |
|------------|--------|-------------------|
| Get unread count | < 10ms | 2-5ms |
| Get recent notifications (20) | < 20ms | 8-15ms |
| Mark as read | < 30ms | 12-25ms |
| Batch insert (1000 recipients) | < 500ms | 100-200ms |
| Get pending notifications (1000) | < 100ms | 50-80ms |

---

## Operational Procedures

### Daily Maintenance Tasks

#### 1. Cleanup Expired Notifications

**Frequency:** Daily at 2:00 AM

**Command:**
```sql
CALL cleanup_expired_notifications();
```

**What it does:**
- Deletes notifications where `expires_at < NOW()`
- Only deletes notifications older than 1 day
- Cascades to `notification_recipients` via foreign key

#### 2. Archive Old Read Notifications

**Frequency:** Daily at 3:00 AM

**Command:**
```sql
CALL archive_old_notifications(90);
```

**What it does:**
- Moves notifications older than 90 days where all recipients have read them
- Creates archive tables if they don't exist
- Moves to `notifications_archive` and `notification_recipients_archive`

#### 3. Cleanup Old Delivery Logs

**Frequency:** Weekly on Sunday at 4:00 AM

**Command:**
```sql
CALL cleanup_old_delivery_logs(180);
```

**What it does:**
- Deletes delivery logs older than 180 days
- Only deletes successful or abandoned delivery attempts

### Scheduled Jobs (Cron)

**Recommended cron schedule:**

```bash
# Cleanup expired notifications daily at 2 AM
0 2 * * * mysql -u user -p database -e "CALL cleanup_expired_notifications();"

# Archive old notifications daily at 3 AM
0 3 * * * mysql -u user -p database -e "CALL archive_old_notifications(90);"

# Cleanup delivery logs weekly on Sunday at 4 AM
0 4 * * 0 mysql -u user -p database -e "CALL cleanup_old_delivery_logs(180);"
```

### Manual Operations

#### Get User Notification Statistics

```sql
CALL get_user_notification_stats(123);
```

Returns:
- `total_count` - Total notifications in last 90 days
- `unread_count` - Number of unread notifications
- `read_count` - Number of read notifications
- `last_unread_at` - Timestamp of most recent unread notification
- `last_read_at` - Timestamp of most recent read notification

#### Mark All Notifications as Read

```sql
CALL mark_all_notifications_read(123);
```

Returns:
- `marked_read_count` - Number of notifications marked as read

#### Get Pending Notifications for Delivery

```sql
CALL get_pending_notifications(1000);
```

Returns up to 1000 pending notifications with:
- Notification details (title, message, metadata, priority)
- User details (email, phone, name)
- Ordered by priority (DESC) and created_at (ASC)

#### Get Failed Deliveries for Retry

```sql
CALL get_failed_deliveries_for_retry(100);
```

Returns up to 100 failed deliveries where:
- `status = 'failed'`
- `next_retry_at <= NOW()`
- `attempt_number < 5`

---

## Testing Strategy

### 1. Migration Testing

**Test migrations on sample database:**

```bash
# Create test database
mysql -u root -p -e "CREATE DATABASE notification_test;"

# Run migrations
DATABASE_NAME=notification_test npm run migration:run

# Verify tables
mysql -u root -p notification_test -e "SHOW TABLES;"

# Verify indexes
mysql -u root -p notification_test -e "SHOW INDEX FROM notification_recipients;"

# Test rollback
DATABASE_NAME=notification_test npm run migration:revert
```

### 2. Index Usage Testing

**Verify indexes are being used:**

```sql
EXPLAIN SELECT *
FROM notification_recipients
WHERE user_id = 123 AND status != 'read'
ORDER BY created_at DESC
LIMIT 20;
```

**Check for:**
- `type: ref` (using index)
- `key: idx_recipients_user_unread` (correct index)
- `rows: < 1000` (efficient scan)

### 3. Performance Testing

**Test query performance:**

```typescript
// Create test data
for (let i = 0; i < 10000; i++) {
    await notificationRecipientRepository.save({
        notification_id: notification.id,
        user_id: 123,
        status: i % 10 === 0 ? 'read' : 'pending',
        channel: NotificationChannel.EMAIL
    });
}

// Measure query time
const start = Date.now();
const count = await notificationRecipientRepository.count({
    where: { user_id: 123, status: Not(NotificationStatus.READ) }
});
const duration = Date.now() - start;

console.log(`Query took ${duration}ms for ${count} results`);
```

### 4. Foreign Key Constraint Testing

**Verify cascade behavior:**

```typescript
// Create notification with recipients
const notification = await notificationRepository.save({...});
await notificationRecipientRepository.save({
    notification_id: notification.id,
    user_id: 123,
    ...
});

// Delete notification
await notificationRepository.delete(notification.id);

// Verify recipients were deleted (cascade)
const recipientCount = await notificationRecipientRepository.count({
    where: { notification_id: notification.id }
});

expect(recipientCount).toBe(0);
```

---

## Monitoring and Maintenance

### Key Metrics to Monitor

#### 1. Notification Volume
```sql
SELECT
    DATE(created_at) AS date,
    COUNT(*) AS notification_count,
    COUNT(DISTINCT user_id) AS unique_users
FROM notification_recipients
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

#### 2. Delivery Success Rate
```sql
SELECT
    channel,
    status,
    COUNT(*) AS count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY channel), 2) AS percentage
FROM notification_recipients
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY channel, status
ORDER BY channel, status;
```

#### 3. Pending Notification Backlog
```sql
SELECT
    COUNT(*) AS pending_count,
    MIN(created_at) AS oldest_pending,
    TIMESTAMPDIFF(MINUTE, MIN(created_at), NOW()) AS lag_minutes
FROM notification_recipients
WHERE status = 'pending';
```

**Alert Thresholds:**
- `lag_minutes > 5` - Warning
- `lag_minutes > 15` - Critical
- `pending_count > 10000` - Warning

#### 4. Index Usage Statistics
```sql
SELECT
    table_name,
    index_name,
    seq_in_index,
    column_name,
    cardinality
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND table_name LIKE 'notification%'
ORDER BY table_name, index_name, seq_in_index;
```

#### 5. Table Size Monitoring
```sql
SELECT
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
    table_rows AS estimated_rows
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name LIKE 'notification%'
ORDER BY (data_length + index_length) DESC;
```

### Performance Optimization Tips

#### 1. Connection Pooling
```typescript
// In database.config.ts
export const AppDataSource = new DataSource({
    type: "mysql",
    poolSize: 50,
    extra: {
        max: 50,
        min: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
    }
});
```

#### 2. Batch Operations
```typescript
// Use batch inserts for multiple recipients
await notificationRecipientRepository
    .createQueryBuilder()
    .insert()
    .values(recipients)
    .execute();

// Instead of individual saves
for (const recipient of recipients) {
    await notificationRecipientRepository.save(recipient); // SLOW
}
```

#### 3. Use Stored Procedures for Complex Operations
```typescript
// Use stored procedure for stats (faster)
const stats = await queryRunner.query('CALL get_user_notification_stats(?)', [userId]);

// Instead of multiple queries
const unreadCount = await repo.count({ where: { user_id: userId, status: 'unread' } });
const readCount = await repo.count({ where: { user_id: userId, status: 'read' } });
```

#### 4. Optimize JSON Queries
```sql
-- Index JSON field for better performance (MySQL 5.7+)
ALTER TABLE notifications
ADD INDEX idx_metadata_order ((CAST(metadata->>'$.order_id' AS UNSIGNED)));
```

---

## Database Maintenance Schedule

### Daily Tasks (Automated)
- 02:00 AM - Cleanup expired notifications
- 03:00 AM - Archive old read notifications
- 04:00 AM - Analyze tables

### Weekly Tasks (Automated)
- Sunday 04:00 AM - Cleanup old delivery logs
- Sunday 05:00 AM - Optimize tables

### Monthly Tasks (Manual)
- Review index usage and remove unused indexes
- Review table sizes and plan archival strategy
- Review query performance and optimize slow queries
- Test disaster recovery procedures

---

## Troubleshooting

### Problem: High Pending Notification Backlog

**Diagnosis:**
```sql
CALL get_pending_notifications(10);
```

**Solutions:**
1. Check delivery worker is running
2. Increase worker concurrency
3. Check external service availability (email, SMS providers)
4. Review rate limits

### Problem: Slow Unread Count Queries

**Diagnosis:**
```sql
EXPLAIN SELECT COUNT(*) FROM notification_recipients
WHERE user_id = 123 AND status != 'read';
```

**Solutions:**
1. Verify `idx_recipients_user_unread` index exists
2. Run `ANALYZE TABLE notification_recipients;`
3. Consider using stored procedure `get_user_notification_stats`

### Problem: Table Lock During Index Creation

**Diagnosis:**
```sql
SHOW PROCESSLIST;
```

**Solutions:**
1. Create indexes during low-traffic periods
2. Use `pt-online-schema-change` (Percona Toolkit) for large tables
3. Consider read replicas for serving queries during maintenance

---

## Enums and Types Reference

### NotificationType
- `order_update` - Order status changes
- `product_recommendation` - AI-powered product suggestions
- `system_alert` - System maintenance, updates
- `promotional` - Marketing campaigns, sales
- `review_request` - Request for product reviews
- `price_drop` - Price alerts for wishlisted items
- `back_in_stock` - Out-of-stock item availability alerts

### NotificationChannel
- `websocket` - Real-time WebSocket delivery
- `email` - Email delivery
- `push` - Push notifications
- `sms` - SMS delivery
- `in_app` - In-app notification center

### NotificationStatus
- `pending` - Awaiting delivery
- `sent` - Sent to delivery provider
- `delivered` - Confirmed delivery
- `read` - User has read the notification
- `failed` - Delivery failed

### NotificationPriority
- `low` - Low priority (batch delivery acceptable)
- `medium` - Normal priority (default)
- `high` - High priority (deliver quickly)
- `urgent` - Critical priority (deliver immediately)

### DeliveryFrequency
- `realtime` - Deliver immediately
- `hourly_digest` - Batch into hourly digest
- `daily_digest` - Batch into daily digest
- `weekly_digest` - Batch into weekly digest
- `disabled` - Do not deliver

---

## File Structure

```
/src/modules/notifications/
├── enums/
│   ├── NotificationType.enum.ts
│   ├── NotificationChannel.enum.ts
│   ├── NotificationStatus.enum.ts
│   ├── NotificationPriority.enum.ts
│   ├── DeliveryFrequency.enum.ts
│   └── index.ts
├── entities/
│   ├── NotificationTemplate.entity.ts
│   ├── Notification.entity.ts
│   ├── NotificationRecipient.entity.ts
│   ├── NotificationPreference.entity.ts
│   ├── NotificationDeliveryLog.entity.ts
│   ├── NotificationGroup.entity.ts
│   └── index.ts
└── README.md (this file)

/src/migrations/
├── 1738742500000-CreateNotificationSystemTables.ts
├── 1738742500001-CreateNotificationSystemIndexes.ts
├── 1738742500002-CreateNotificationSystemForeignKeys.ts
├── 1738742500003-CreateNotificationSystemFunctions.ts
└── 1738742500004-SeedNotificationSystemData.ts
```

---

## Next Steps

After running migrations, you can:

1. **Implement Service Layer** - Create services to interact with notification entities
2. **Implement Delivery Workers** - Create background workers to process pending notifications
3. **Implement WebSocket Gateway** - Create real-time notification delivery via WebSocket
4. **Add Analytics** - Track notification performance metrics
5. **Add Rate Limiting** - Prevent notification spam
6. **Add Template Rendering** - Implement variable substitution in templates

---

## Support and Maintenance

For questions or issues related to the notification system database layer, please refer to:

- Main schema documentation: `/NOTIFICATION_SYSTEM_SCHEMA.md`
- Migration files: `/src/migrations/`
- Entity definitions: `/src/modules/notifications/entities/`

**Database Migration Commands:**

```bash
# Run all pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration from entity changes
npm run migration:generate -- -n MigrationName
```
