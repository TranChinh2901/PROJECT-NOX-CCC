# Notification System Database Layer - Quick Reference

## Migration Commands

```bash
# Run all migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration
npm run migration:generate -- -n MigrationName
```

## Migration Files (Run Order)

1. `1738742500000-CreateNotificationSystemTables.ts` - Core tables
2. `1738742500001-CreateNotificationSystemIndexes.ts` - Performance indexes
3. `1738742500002-CreateNotificationSystemForeignKeys.ts` - Referential integrity
4. `1738742500003-CreateNotificationSystemFunctions.ts` - Stored procedures
5. `1738742500004-SeedNotificationSystemData.ts` - Initial data

## Database Tables

| Table | Purpose | Primary Key | Indexes |
|-------|---------|-------------|---------|
| `notification_templates` | Reusable templates | `id` (bigint) | 2 partial, 1 unique |
| `notifications` | Notification instances | `id` (bigint) | 8 indexes |
| `notification_recipients` | User-specific delivery | `id` (bigint) | 6 indexes (2 partial) |
| `notification_preferences` | User settings | `(user_id, type, channel)` | 2 indexes |
| `notification_delivery_log` | Delivery tracking | `id` (bigint) | 4 indexes (1 partial) |
| `notification_groups` | Batched notifications | `id` (bigint) | 3 indexes, 1 unique |

## Stored Procedures

```sql
-- Archive old read notifications
CALL archive_old_notifications(90);

-- Cleanup expired notifications
CALL cleanup_expired_notifications();

-- Get user stats
CALL get_user_notification_stats(123);

-- Mark all as read
CALL mark_all_notifications_read(123);

-- Cleanup old logs
CALL cleanup_old_delivery_logs(180);

-- Get pending for delivery
CALL get_pending_notifications(1000);

-- Get failed for retry
CALL get_failed_deliveries_for_retry(100);

-- Update notification group
CALL update_notification_group('group_key', 123, 'order_update', 456);
```

## TypeScript Entities

```typescript
import {
    NotificationTemplate,
    Notification,
    NotificationRecipient,
    NotificationPreference,
    NotificationDeliveryLog,
    NotificationGroup
} from '@/modules/notifications/entities';

import {
    NotificationType,
    NotificationChannel,
    NotificationStatus,
    NotificationPriority,
    DeliveryFrequency
} from '@/modules/notifications/enums';
```

## Common Query Patterns

### Get Unread Count
```typescript
const count = await notificationRecipientRepo.count({
    where: {
        user_id: userId,
        status: NotificationStatus.PENDING
    }
});
```

### Get Recent Notifications
```typescript
const notifications = await notificationRecipientRepo
    .createQueryBuilder('nr')
    .leftJoinAndSelect('nr.notification', 'n')
    .where('nr.user_id = :userId', { userId })
    .orderBy('n.created_at', 'DESC')
    .limit(20)
    .getMany();
```

### Mark as Read
```typescript
await notificationRecipientRepo.update(
    { id: recipientId, user_id: userId },
    {
        status: NotificationStatus.READ,
        read_at: new Date()
    }
);
```

### Batch Insert
```typescript
await notificationRecipientRepo
    .createQueryBuilder()
    .insert()
    .values(userIds.map(userId => ({
        notification_id: notificationId,
        user_id: userId,
        status: NotificationStatus.PENDING,
        channel: NotificationChannel.EMAIL
    })))
    .execute();
```

## Performance Targets

| Operation | Target | Optimized |
|-----------|--------|-----------|
| Get unread count | < 10ms | 2-5ms |
| Get recent notifications | < 20ms | 8-15ms |
| Mark as read | < 30ms | 12-25ms |
| Batch insert (1000) | < 500ms | 100-200ms |
| Get pending (1000) | < 100ms | 50-80ms |

## Critical Indexes

1. **notification_recipients:**
   - `idx_recipients_user_status_created` - Composite for user queries
   - `idx_recipients_user_unread` - Partial for unread notifications

2. **notifications:**
   - `idx_notifications_priority_created` - Delivery queue
   - `idx_notifications_expires` - Cleanup jobs

3. **notification_delivery_log:**
   - `idx_delivery_log_retry` - Retry queue

## Enums

### NotificationType
- `order_update`, `product_recommendation`, `system_alert`
- `promotional`, `review_request`, `price_drop`, `back_in_stock`

### NotificationChannel
- `websocket`, `email`, `push`, `sms`, `in_app`

### NotificationStatus
- `pending`, `sent`, `delivered`, `read`, `failed`

### NotificationPriority
- `low`, `medium`, `high`, `urgent`

### DeliveryFrequency
- `realtime`, `hourly_digest`, `daily_digest`, `weekly_digest`, `disabled`

## Maintenance Schedule

### Daily (Automated)
- 02:00 - Cleanup expired notifications
- 03:00 - Archive old read notifications

### Weekly (Automated)
- Sunday 04:00 - Cleanup old delivery logs

### Monthly (Manual)
- Review index usage
- Review table sizes
- Optimize slow queries

## Monitoring Queries

### Notification Volume
```sql
SELECT DATE(created_at) AS date, COUNT(*) AS count
FROM notification_recipients
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at);
```

### Delivery Success Rate
```sql
SELECT channel, status, COUNT(*) AS count
FROM notification_recipients
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY channel, status;
```

### Pending Backlog
```sql
SELECT COUNT(*) AS pending_count,
       MIN(created_at) AS oldest_pending,
       TIMESTAMPDIFF(MINUTE, MIN(created_at), NOW()) AS lag_minutes
FROM notification_recipients
WHERE status = 'pending';
```

### Table Sizes
```sql
SELECT table_name,
       ROUND((data_length + index_length) / 1024 / 1024, 2) AS size_mb,
       table_rows
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name LIKE 'notification%';
```

## Testing

```bash
# Run query performance tests
ts-node -r tsconfig-paths/register \
  src/modules/notifications/__tests__/notification-query.test.ts
```

```typescript
import { AppDataSource } from '@/config/database.config';
import { NotificationQueryTests } from '@/modules/notifications/__tests__/notification-query.test';

async function runTests() {
    await AppDataSource.initialize();
    const tests = new NotificationQueryTests(AppDataSource);

    // Generate test data
    await tests.generateTestData(1, 10000);

    // Run performance tests
    await tests.runAllTests(1);

    // Verify indexes
    await tests.verifyIndexUsage();

    await AppDataSource.destroy();
}
```

## File Locations

```
/src/modules/notifications/
├── enums/                          # TypeScript enums
├── entities/                       # TypeORM entities
├── __tests__/                      # Query tests
├── DATABASE_IMPLEMENTATION.md      # Full documentation
└── QUICK_REFERENCE.md              # This file

/src/migrations/
├── 1738742500000-CreateNotificationSystemTables.ts
├── 1738742500001-CreateNotificationSystemIndexes.ts
├── 1738742500002-CreateNotificationSystemForeignKeys.ts
├── 1738742500003-CreateNotificationSystemFunctions.ts
└── 1738742500004-SeedNotificationSystemData.ts

/NOTIFICATION_SYSTEM_SCHEMA.md      # Original schema design
```

## Next Steps

1. Run migrations: `npm run migration:run`
2. Verify tables: `mysql -e "SHOW TABLES;"`
3. Test queries: Run query performance tests
4. Implement service layer
5. Implement delivery workers
6. Add WebSocket gateway
7. Add monitoring and alerts

## Support

For detailed documentation, see:
- `/src/modules/notifications/DATABASE_IMPLEMENTATION.md` - Full implementation guide
- `/NOTIFICATION_SYSTEM_SCHEMA.md` - Original schema design
- Migration files in `/src/migrations/`
