/**
 * Test Configuration and Environment Variables
 * Centralized test configuration
 */

export const TEST_CONFIG = {
  // API Configuration
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:4000',
  API_TIMEOUT: 5000,

  // Authentication
  TEST_USER: {
    email: 'test@example.com',
    password: 'Test123!',
    name: 'Test User',
  },
  ADMIN_USER: {
    email: 'admin@example.com',
    password: 'Admin123!',
    name: 'Admin User',
  },

  // WebSocket Configuration
  WS_URL: process.env.WS_URL || 'ws://localhost:4000',
  WS_RECONNECT_DELAY: 1000,
  WS_MAX_RECONNECT_ATTEMPTS: 3,

  // Test Timeouts
  DEFAULT_TIMEOUT: 30000,
  ELEMENT_TIMEOUT: 5000,
  NAVIGATION_TIMEOUT: 10000,

  // Database
  TEST_DB_TYPE: 'sqlite',
  TEST_DB_NAME: ':memory:',

  // Feature Flags
  ENABLE_WEBSOCKET_TESTS: true,
  ENABLE_EMAIL_TESTS: false, // Disable in tests by default
  ENABLE_PERFORMANCE_TESTS: false,

  // Notification Settings
  MAX_NOTIFICATIONS_PER_PAGE: 20,
  NOTIFICATION_TYPES: ['ORDER_UPDATE', 'PROMOTION', 'SYSTEM_ALERT', 'NEWSLETTER'],
  PRIORITY_LEVELS: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
};

export const getTestConfig = () => TEST_CONFIG;
