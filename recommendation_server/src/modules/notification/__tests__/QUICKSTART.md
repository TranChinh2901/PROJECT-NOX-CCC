# Quick Start Guide: Running Tests

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git repository cloned

## Backend Tests Setup (5 minutes)

### 1. Install Dependencies

```bash
cd recommendation_server
npm install
```

### 2. Run All Tests

```bash
npm test
```

### 3. Run Specific Test Suite

```bash
# API tests only
npm test -- api.spec.ts

# Repository tests only
npm test -- repository.spec.ts

# WebSocket tests only
npm test -- websocket.spec.ts

# Service tests only
npm test -- service.spec.ts
```

### 4. Watch Mode (for development)

```bash
npm test -- --watch
```

### 5. Generate Coverage Report

```bash
npm test -- --coverage
```

Coverage report will be in: `coverage/lcov-report/index.html`

## Frontend E2E Tests Setup (10 minutes)

### 1. Install Dependencies

```bash
cd recommendation_client
npm install
```

### 2. Install Playwright Browsers (First Time Only)

```bash
npx playwright install
```

If you encounter issues, install with dependencies:

```bash
npx playwright install --with-deps
```

### 3. Run All E2E Tests

```bash
npm run test:e2e
```

### 4. Run Tests in UI Mode (Recommended for Development)

```bash
npm run test:e2e:ui
```

This opens an interactive UI where you can:
- Select tests to run
- See test execution live
- Debug failed tests
- View screenshots and videos

### 5. Run Tests in Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

### 6. Run Specific Test File

```bash
npx playwright test e2e/notifications/user-journey.spec.ts
```

### 7. Run Specific Test

```bash
npx playwright test -g "should mark notification as read"
```

### 8. Debug Mode

```bash
npm run test:e2e:debug
```

Or debug specific test:

```bash
npx playwright test --debug -g "should open dropdown"
```

### 9. View Test Report

```bash
npx playwright show-report
```

## Quick Verification (2 minutes)

Run this to verify everything works:

```bash
# Backend
cd recommendation_server && npm test -- --testNamePattern="should return 401 without authentication"

# Frontend
cd recommendation_client && npx playwright test -g "should display unread notification badge"
```

## Common Commands Cheat Sheet

### Backend (Jest)

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm test -- --watch` | Watch mode |
| `npm test -- --coverage` | With coverage |
| `npm test -- api.spec.ts` | Specific file |
| `npm test -- -t "test name"` | Specific test |
| `npm test -- --verbose` | Verbose output |

### Frontend (Playwright)

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all E2E tests |
| `npm run test:e2e:ui` | Interactive UI mode |
| `npm run test:e2e:headed` | Show browser |
| `npm run test:e2e:debug` | Debug mode |
| `npx playwright test --grep "pattern"` | Filter by pattern |
| `npx playwright show-report` | View report |
| `npx playwright codegen` | Generate tests |

## Test Structure Overview

### Backend Tests

```
recommendation_server/src/modules/notification/__tests__/
├── integration/
│   ├── api.spec.ts          # 30+ API tests
│   ├── repository.spec.ts   # 20+ database tests
│   ├── websocket.spec.ts    # 15+ WebSocket tests
│   └── service.spec.ts      # 20+ service tests
├── fixtures/                 # Test data
├── mocks/                    # Service mocks
└── helpers/                  # Test utilities
```

### Frontend Tests

```
recommendation_client/e2e/
├── notifications/
│   ├── user-journey.spec.ts      # 20+ user journey tests
│   └── accessibility.spec.ts     # 20+ accessibility tests
└── helpers/                       # Page objects
```

## Troubleshooting

### Backend Tests Not Running

**Error**: `Cannot find module`
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Error**: `Test timeout`
```bash
# Solution: Tests use 30s timeout by default
# If needed, increase in jest.config.js
```

### Frontend Tests Not Running

**Error**: `Executable doesn't exist`
```bash
# Solution: Install Playwright browsers
npx playwright install
```

**Error**: `page.goto: net::ERR_CONNECTION_REFUSED`
```bash
# Solution: Ensure dev server is running
# Either start manually: npm run dev
# Or Playwright will auto-start via webServer config
```

**Error**: `Browser is not installed`
```bash
# Solution: Install specific browser
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

### Permission Issues (Linux/Mac)

```bash
# Make scripts executable
chmod +x node_modules/.bin/*

# Or use npx
npx playwright test
```

## Next Steps

1. ✅ Run all tests to verify setup
2. ✅ Review test files to understand patterns
3. ✅ Try writing a simple test
4. ✅ Run tests in watch mode while developing
5. ✅ Integrate into CI/CD pipeline

## Getting Help

- 📖 Read full [README.md](./README.md)
- 🔍 Check [Playwright docs](https://playwright.dev)
- 🔍 Check [Jest docs](https://jestjs.io)
- 💬 Ask in team chat
- 🐛 Open an issue

## Success Criteria

You're ready when:
- ✅ Backend tests run and pass
- ✅ Frontend tests run and pass
- ✅ You can run specific tests
- ✅ You can debug failing tests
- ✅ Coverage reports generate

Happy Testing! 🚀
