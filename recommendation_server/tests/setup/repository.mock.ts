type MockRepository<T> = {
  find: jest.Mock;
  findOne: jest.Mock;
  findOneBy: jest.Mock;
  findBy: jest.Mock;
  findAndCount: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  remove: jest.Mock;
  count: jest.Mock;
  increment: jest.Mock;
  decrement: jest.Mock;
  findByIds: jest.Mock;
  query: jest.Mock;
  queryAndCount: jest.Mock;
  [key: string]: any;
};

export function createMockRepository<T>(overrides?: Partial<MockRepository<T>>): MockRepository<T> {
  const mock: MockRepository<T> = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    findByIds: jest.fn(),
    query: jest.fn(),
    queryAndCount: jest.fn(),
    ...overrides,
  };

  return mock;
}
