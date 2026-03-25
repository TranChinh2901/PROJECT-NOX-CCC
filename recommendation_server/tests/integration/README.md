# Integration Tests

## Setup

Integration tests require a MySQL test database. Before running integration tests:

1. Create a test database:
```sql
CREATE DATABASE IF NOT EXISTS fashion_ecommerce_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON fashion_ecommerce_test.*
  TO 'fashion_user'@'localhost';
FLUSH PRIVILEGES;
```

2. Run migrations on the test database:
```bash
DB_NAME=fashion_ecommerce_test npm run migration:run
```

3. Set environment variable for tests:
```bash
export DB_TEST_NAME=fashion_ecommerce_test
```

## Running Tests

```bash
npm test -- tests/integration/admin/brands.spec.ts
```

## Notes

- Integration tests use the actual database (not SQLite in-memory)
- Tests clean up data after each test case
- Requires MySQL/MariaDB database
