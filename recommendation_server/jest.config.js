module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { diagnostics: { ignoreCodes: [151002] } }],
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/migrations/**',
    '!src/main.ts',
    '!src/database/**',
  ],
  coveragePathIgnorePatterns: [
    'node_modules',
    'tests',
    'migrations',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'src/modules/cart/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    'src/modules/users/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    'src/modules/auth/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  maxWorkers: 1,
  testTimeout: 30000,
};
