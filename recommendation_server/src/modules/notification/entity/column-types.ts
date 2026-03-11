const isSqliteRuntime =
  (process.env.DATABASE_TYPE ?? '').toLowerCase() === 'sqlite' ||
  (process.env.NODE_ENV === 'test' && !process.env.TEST_DB_HOST);

export const notificationEnumColumnType = isSqliteRuntime ? 'simple-enum' : 'enum';
export const notificationJsonColumnType = isSqliteRuntime ? 'simple-json' : 'json';
export const notificationTimeColumnType = isSqliteRuntime ? 'text' : 'time';
