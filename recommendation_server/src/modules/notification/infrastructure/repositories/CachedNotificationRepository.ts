/**
 * Infrastructure: In-Memory Cache Repository Wrapper
 * Wraps notification repository with simple in-memory caching
 * Note: For production, use Redis instead
 */
import { INotificationRepository, NotificationFilter, PaginatedNotifications } from '../../domain/repositories/INotificationRepository';
import { NotificationDomain } from '../../domain/entities/NotificationDomain';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class CachedNotificationRepository implements INotificationRepository {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly defaultTTL = 60 * 1000; // 1 minute

  constructor(private readonly delegate: INotificationRepository) {}

  private getCacheKey(type: string, ...args: any[]): string {
    return `${type}:${JSON.stringify(args)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttlMs: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  private invalidateUserCache(userId: number): void {
    // Invalidate all cache entries for this user
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(`"userId":${userId}`) || key.includes(`userId:${userId}`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(k => this.cache.delete(k));
  }

  async findById(id: number): Promise<NotificationDomain | null> {
    const cacheKey = this.getCacheKey('findById', id);
    const cached = this.getFromCache<NotificationDomain | null>(cacheKey);
    if (cached !== null) return cached;

    const result = await this.delegate.findById(id);
    if (result) {
      this.setCache(cacheKey, result);
    }
    return result;
  }

  async findByUserId(filter: NotificationFilter): Promise<PaginatedNotifications> {
    // Don't cache paginated results (too complex to invalidate)
    return this.delegate.findByUserId(filter);
  }

  async findUnreadByUserId(userId: number, limit: number = 10): Promise<NotificationDomain[]> {
    const cacheKey = this.getCacheKey('unread', userId, limit);
    const cached = this.getFromCache<NotificationDomain[]>(cacheKey);
    if (cached) return cached;

    const result = await this.delegate.findUnreadByUserId(userId, limit);
    this.setCache(cacheKey, result, 30 * 1000); // 30 seconds for unread
    return result;
  }

  async countUnread(userId: number): Promise<number> {
    const cacheKey = this.getCacheKey('countUnread', userId);
    const cached = this.getFromCache<number>(cacheKey);
    if (cached !== null) return cached;

    const result = await this.delegate.countUnread(userId);
    this.setCache(cacheKey, result, 30 * 1000); // 30 seconds
    return result;
  }

  async save(notification: NotificationDomain): Promise<NotificationDomain> {
    const result = await this.delegate.save(notification);
    this.invalidateUserCache(notification.userId.getValue());
    return result;
  }

  async saveMany(notifications: NotificationDomain[]): Promise<NotificationDomain[]> {
    const result = await this.delegate.saveMany(notifications);
    const userIds = new Set(notifications.map(n => n.userId.getValue()));
    userIds.forEach(userId => this.invalidateUserCache(userId));
    return result;
  }

  async markAsRead(id: number): Promise<boolean> {
    const notification = await this.delegate.findById(id);
    const result = await this.delegate.markAsRead(id);
    if (result && notification) {
      this.invalidateUserCache(notification.userId.getValue());
    }
    return result;
  }

  async markAllAsRead(userId: number): Promise<number> {
    const result = await this.delegate.markAllAsRead(userId);
    this.invalidateUserCache(userId);
    return result;
  }

  async markManyAsRead(ids: number[]): Promise<number> {
    const result = await this.delegate.markManyAsRead(ids);
    // Can't easily determine which users to invalidate without fetching
    this.cache.clear();
    return result;
  }

  async archive(id: number): Promise<boolean> {
    const notification = await this.delegate.findById(id);
    const result = await this.delegate.archive(id);
    if (result && notification) {
      this.invalidateUserCache(notification.userId.getValue());
    }
    return result;
  }

  async archiveMany(ids: number[]): Promise<number> {
    const result = await this.delegate.archiveMany(ids);
    this.cache.clear();
    return result;
  }

  async delete(id: number): Promise<boolean> {
    const notification = await this.delegate.findById(id);
    const result = await this.delegate.delete(id);
    if (result && notification) {
      this.invalidateUserCache(notification.userId.getValue());
    }
    return result;
  }

  async deleteExpired(beforeDate: Date): Promise<number> {
    const result = await this.delegate.deleteExpired(beforeDate);
    if (result > 0) {
      this.cache.clear();
    }
    return result;
  }

  async findByReference(referenceType: string, referenceId: number): Promise<NotificationDomain[]> {
    return this.delegate.findByReference(referenceType, referenceId);
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}
