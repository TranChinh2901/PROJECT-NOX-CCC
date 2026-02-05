# Notification System Test Suite

Comprehensive integration and end-to-end tests for the notification system.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Backend Integration Tests](#backend-integration-tests)
- [Frontend E2E Tests](#frontend-e2e-tests)
- [Running Tests](#running-tests)
- [CI/CD Integration](#cicd-integration)
- [Test Coverage](#test-coverage)
- [Troubleshooting](#troubleshooting)

## Overview

This test suite provides comprehensive coverage of the notification system including:

- **50+ Backend Integration Tests**: API endpoints, database operations, WebSocket connections, service integrations
- **40+ Frontend E2E Tests**: User journeys, accessibility, responsive design, real-time updates
- **Test Fixtures and Mocks**: Reusable test data and service mocks
- **Helper Utilities**: Authentication, database management, page objects

## Test Structure

```
recommendation_server/
└── src/modules/notification/__tests__/
    ├── integration/           # Integration test suites
    │   ├── api.spec.ts       # REST API endpoint tests
    │   ├── repository.spec.ts # Database and repository tests
    │   ├── websocket.spec.ts # WebSocket connection tests
    │   └── service.spec.ts   # Service integration tests
    ├── fixtures/              # Test data fixtures
    │   └── notification.fixtures.ts
    ├── mocks/                 # Service mocks
    │   └── service.mocks.ts
    └── helpers/               # Test utilities
        ├── test-database.ts
        ├── test-server.ts
        └── auth-helper.ts

recommendation_client/
├── e2e/
│   ├── notifications/         # E2E test suites
│   │   ├── user-journey.spec.ts
│   │   └── accessibility.spec.ts
│   ├── helpers/               # Page objects and utilities
│   │   ├── auth.helper.ts
│   │   └── notification.page.ts
│   └── fixtures/              # Test data
└── playwright.config.ts       # Playwright configuration
```

## Backend Integration Tests

### API Integration Tests (`api.spec.ts`)

**Coverage: 30+ test cases**

Tests all REST endpoints with various scenarios:

#### Authentication Tests
- ✅ Returns 401 without authentication token
- ✅ Returns 401 with invalid token
- ✅ Returns 401 with expired token

#### Notification Retrieval
- ✅ Returns paginated notifications
- ✅ Filters by type, priority, read status
- ✅ Filters by date range
- ✅ Only returns user's own notifications
- ✅ Handles invalid pagination parameters

#### Notification Actions
- ✅ Marks single notification as read
- ✅ Marks multiple notifications as read
- ✅ Marks all notifications as read
- ✅ Archives notifications
- ✅ Deletes notifications
- ✅ Returns unread count

#### Error Handling
- ✅ Returns 404 for non-existent notifications
- ✅ Returns 403 when accessing other user's data
- ✅ Returns 400 for invalid request data

#### Concurrency
- ✅ Handles concurrent read operations
- ✅ Handles concurrent write operations

### Repository Tests (`repository.spec.ts`)

**Coverage: 20+ test cases**

Tests database operations and data integrity:

#### CRUD Operations
- ✅ Creates notifications with proper defaults
- ✅ Reads notifications by ID and filters
- ✅ Updates notifications
- ✅ Deletes notifications (hard and soft delete)

#### Query Operations
- ✅ Pagination with offset and limit
- ✅ Filtering by multiple criteria
- ✅ Sorting by date
- ✅ Aggregation and counting

#### Transactions
- ✅ Commits on success
- ✅ Rolls back on error
- ✅ Handles nested transactions

#### Data Integrity
- ✅ Enforces required fields
- ✅ Validates data types
- ✅ Handles JSON data fields

### WebSocket Tests (`websocket.spec.ts`)

**Coverage: 15+ test cases**

Tests real-time notification delivery:

#### Connection Management
- ✅ Connects with valid token
- ✅ Rejects invalid/missing tokens
- ✅ Handles multiple concurrent connections
- ✅ Manages disconnections

#### Real-time Delivery
- ✅ Delivers notifications to correct users
- ✅ Broadcasts to multiple devices
- ✅ Handles acknowledgments
- ✅ Processes rapid consecutive notifications

#### Reconnection
- ✅ Reconnects after disconnect
- ✅ Retries on connection errors
- ✅ Maintains connection state

#### Error Handling
- ✅ Handles malformed data
- ✅ Manages server errors gracefully

### Service Tests (`service.spec.ts`)

**Coverage: 20+ test cases**

Tests service layer integration:

#### Notification Delivery
- ✅ Delivers via WebSocket when user online
- ✅ Falls back to email when offline
- ✅ Prioritizes urgent notifications
- ✅ Batches notifications

#### Email Service
- ✅ Sends HTML emails
- ✅ Retries on failure
- ✅ Respects user preferences
- ✅ Uses different templates by type

#### Queue Processing
- ✅ Queues jobs for processing
- ✅ Processes jobs in order
- ✅ Respects job priorities
- ✅ Retries failed jobs
- ✅ Handles concurrent processing

#### Event Publishing
- ✅ Publishes notification events
- ✅ Handles publishing failures

## Frontend E2E Tests

### User Journey Tests (`user-journey.spec.ts`)

**Coverage: 20+ test cases**

Tests complete user workflows:

#### Notification Reception
- ✅ Displays unread badge
- ✅ Opens dropdown on bell click
- ✅ Shows notification details
- ✅ Marks single as read
- ✅ Marks all as read
- ✅ Navigates to detail page
- ✅ Navigates to full notifications page
- ✅ Deletes notifications

#### Filtering and Sorting
- ✅ Filters by type
- ✅ Filters by read status
- ✅ Paginates results

#### Real-time Updates
- ✅ Receives WebSocket notifications
- ✅ Shows toast for urgent notifications

#### Preferences
- ✅ Updates notification preferences
- ✅ Persists preference changes

#### Multi-Tab Sync
- ✅ Syncs notifications across tabs

### Accessibility Tests (`accessibility.spec.ts`)

**Coverage: 20+ test cases**

Tests inclusive design compliance:

#### Keyboard Navigation
- ✅ Opens dropdown with Enter/Space
- ✅ Navigates with arrow keys
- ✅ Closes with Escape
- ✅ Activates with Enter
- ✅ Tabs through elements

#### Screen Reader Support
- ✅ Has proper ARIA labels
- ✅ Announces unread count
- ✅ Has correct role attributes
- ✅ Announces new notifications
- ✅ Labels form controls
- ✅ Maintains color contrast

#### Responsive Design
- ✅ Full-screen panel on mobile
- ✅ Touch-friendly tap targets
- ✅ Swipe gestures
- ✅ Side sheet on tablet
- ✅ Positioned dropdown on desktop
- ✅ Hover states on desktop

#### Focus Management
- ✅ Traps focus in modal
- ✅ Returns focus to trigger

#### Animation
- ✅ Animates dropdown
- ✅ Respects reduced motion

## Running Tests

### Backend Tests

```bash
cd recommendation_server

# Run all tests
npm test

# Run specific test suite
npm test -- api.spec.ts

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- -t "should return 401 without authentication"
```

### Frontend E2E Tests

```bash
cd recommendation_client

# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/notifications/user-journey.spec.ts

# Run specific test
npx playwright test -g "should mark notification as read"

# Debug mode
npm run test:e2e:debug
```

### Test Reports

```bash
# View Playwright HTML report
npx playwright show-report

# View Jest coverage report
open recommendation_server/coverage/lcov-report/index.html
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd recommendation_server && npm ci
      - name: Run tests
        run: cd recommendation_server && npm test -- --ci --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd recommendation_client && npm ci
      - name: Install Playwright
        run: cd recommendation_client && npx playwright install --with-deps
      - name: Run E2E tests
        run: cd recommendation_client && npm run test:e2e
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: recommendation_client/playwright-report
```

## Test Coverage

### Backend Coverage Goals

| Module | Target | Current |
|--------|--------|---------|
| Controllers | 95% | ✅ |
| Use Cases | 95% | ✅ |
| Repositories | 90% | ✅ |
| Services | 85% | ✅ |
| Overall | 90% | ✅ |

### Frontend Coverage

- **User Journeys**: All critical paths covered
- **Accessibility**: WCAG 2.1 AA compliance tested
- **Responsive**: Mobile, tablet, desktop tested
- **Cross-browser**: Chrome, Firefox, Safari, Edge

## Troubleshooting

### Common Issues

#### Backend Tests

**Issue**: Database connection fails
```bash
# Solution: Ensure test database is configured
# The tests use SQLite in-memory by default
```

**Issue**: Tests timeout
```bash
# Solution: Increase timeout in jest.config.js
testTimeout: 30000 // milliseconds
```

**Issue**: Port already in use
```bash
# Solution: Kill process using the port
lsof -ti:3000 | xargs kill -9
```

#### Frontend E2E Tests

**Issue**: Browser not installed
```bash
# Solution: Install Playwright browsers
npx playwright install
```

**Issue**: Tests fail on CI
```bash
# Solution: Install system dependencies
npx playwright install --with-deps
```

**Issue**: Flaky tests
```bash
# Solution: Add explicit waits
await page.waitForTimeout(500);
await page.waitForSelector('[data-testid="element"]');
```

**Issue**: Element not found
```bash
# Solution: Verify data-testid attributes exist in components
# Use Playwright Inspector to debug
npx playwright test --debug
```

### Debugging Tips

#### Backend
```typescript
// Add console logs in tests
console.log('Response:', response.body);

// Use debugger
debugger;

// Run single test with verbose output
npm test -- -t "test name" --verbose
```

#### Frontend
```typescript
// Take screenshots
await page.screenshot({ path: 'debug.png' });

// Pause execution
await page.pause();

// Print page content
console.log(await page.content());

// Use Playwright Inspector
npx playwright test --debug
```

### Test Data Management

#### Resetting Test Data

```bash
# Backend: Tests automatically clear database between runs
# Frontend: Clear local storage
await page.evaluate(() => localStorage.clear());
```

#### Creating Test Users

```typescript
// Backend
const user = AuthHelper.createTestUser({ id: 1, email: 'test@example.com' });

// Frontend
await AuthHelper.login(page, { email: 'test@example.com', password: 'Test123!' });
```

## Best Practices

### Writing Tests

1. **Use descriptive test names**: "should mark notification as read" not "test 1"
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **One assertion per test**: Keep tests focused
4. **Use data-testid**: For reliable element selection
5. **Avoid hardcoded waits**: Use waitFor methods
6. **Clean up after tests**: Clear database, close connections
7. **Mock external services**: Use service mocks for isolation

### Test Organization

1. **Group related tests**: Use describe blocks
2. **Share setup code**: Use beforeEach/beforeAll
3. **Reuse utilities**: Page objects, helpers, fixtures
4. **Keep tests independent**: Don't rely on test order
5. **Name files clearly**: `*.spec.ts` for tests

### Performance

1. **Run tests in parallel**: Configure workers
2. **Use test database**: Faster than production DB
3. **Mock when possible**: Avoid real API calls
4. **Selective testing**: Run only affected tests in development

## Contributing

### Adding New Tests

1. Create test file in appropriate directory
2. Follow existing test patterns
3. Add test to documentation
4. Ensure tests pass in CI
5. Update coverage thresholds if needed

### Updating Tests

1. Maintain backwards compatibility
2. Update related documentation
3. Run full test suite before committing
4. Review test coverage impact

## Support

For questions or issues:
- Check this documentation
- Review existing test examples
- Use Playwright/Jest documentation
- Open an issue in the repository

## License

Same as the main project license.
