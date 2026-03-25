export const ADMIN_CONSTANTS = {
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
    DEFAULT_SORT_ORDER: 'DESC' as const,
  },
  BULK_OPERATION: {
    MAX_ITEMS: 100,
  },
} as const;
