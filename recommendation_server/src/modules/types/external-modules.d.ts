declare module 'fuse.js' {
  export default class Fuse<T> {
    constructor(list: T[], options?: unknown);
    search(query: string): Array<{ item: T; score?: number }>;
  }
}

declare module '@faker-js/faker' {
  export const faker: any;
}
