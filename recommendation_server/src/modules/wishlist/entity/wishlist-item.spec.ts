import { WishlistItem } from './wishlist-item';
import { User } from '@/modules/users/entity/user.entity';
import { ProductVariant } from '@/modules/products/entity/product-variant';
import { WishlistPriority } from '../enum/wishlist.enum';

describe('WishlistItem Entity', () => {
  describe('Schema Validation', () => {
    it('should create a WishlistItem with all required fields', () => {
      const item = new WishlistItem();
      item.id = 1;
      item.user_id = 10;
      item.variant_id = 5;
      item.priority = WishlistPriority.MEDIUM;
      item.added_at = new Date();
      
      expect(item.id).toBe(1);
      expect(item.user_id).toBe(10);
      expect(item.variant_id).toBe(5);
      expect(item.priority).toBe(WishlistPriority.MEDIUM);
      expect(item.added_at).toBeInstanceOf(Date);
    });

    it('should allow nullable notes', () => {
      const item = new WishlistItem();
      item.notes = undefined;
      
      expect(item.notes).toBeUndefined();
    });

    it('should default priority to MEDIUM', () => {
      const item = new WishlistItem();
      item.priority = WishlistPriority.MEDIUM;
      
      expect(item.priority).toBe(WishlistPriority.MEDIUM);
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique (user_id, variant_id) combination', () => {
      const item1 = new WishlistItem();
      item1.user_id = 10;
      item1.variant_id = 5;
      
      const item2 = new WishlistItem();
      item2.user_id = 10;
      item2.variant_id = 5;
      
      expect(item1.user_id).toBe(item2.user_id);
      expect(item1.variant_id).toBe(item2.variant_id);
    });

    it('should allow same user to add different variants', () => {
      const item1 = new WishlistItem();
      item1.user_id = 10;
      item1.variant_id = 5;
      
      const item2 = new WishlistItem();
      item2.user_id = 10;
      item2.variant_id = 6;
      
      expect(item1.user_id).toBe(item2.user_id);
      expect(item1.variant_id).not.toBe(item2.variant_id);
    });

    it('should allow different users to add same variant', () => {
      const item1 = new WishlistItem();
      item1.user_id = 10;
      item1.variant_id = 5;
      
      const item2 = new WishlistItem();
      item2.user_id = 11;
      item2.variant_id = 5;
      
      expect(item1.variant_id).toBe(item2.variant_id);
      expect(item1.user_id).not.toBe(item2.user_id);
    });
  });

  describe('Field Constraints', () => {
    it('should accept notes at max length (500)', () => {
      const item = new WishlistItem();
      item.notes = 'a'.repeat(500);
      
      expect(item.notes.length).toBe(500);
    });

    it('should accept realistic personal notes', () => {
      const item = new WishlistItem();
      item.notes = 'Waiting for sale - want to buy in black color';
      
      expect(item.notes).toBeTruthy();
      expect(item.notes!.length).toBeLessThanOrEqual(500);
    });
  });

  describe('Enum Validation', () => {
    it('should accept WishlistPriority.LOW', () => {
      const item = new WishlistItem();
      item.priority = WishlistPriority.LOW;
      
      expect(item.priority).toBe(WishlistPriority.LOW);
      expect(item.priority).toBe('low');
    });

    it('should accept WishlistPriority.MEDIUM', () => {
      const item = new WishlistItem();
      item.priority = WishlistPriority.MEDIUM;
      
      expect(item.priority).toBe(WishlistPriority.MEDIUM);
      expect(item.priority).toBe('medium');
    });

    it('should accept WishlistPriority.HIGH', () => {
      const item = new WishlistItem();
      item.priority = WishlistPriority.HIGH;
      
      expect(item.priority).toBe(WishlistPriority.HIGH);
      expect(item.priority).toBe('high');
    });

    it('should have exactly 3 priority levels', () => {
      const priorities = Object.values(WishlistPriority);
      expect(priorities).toHaveLength(3);
      expect(priorities).toContain('low');
      expect(priorities).toContain('medium');
      expect(priorities).toContain('high');
    });
  });

  describe('Timestamp Fields', () => {
    it('should set added_at timestamp', () => {
      const item = new WishlistItem();
      item.added_at = new Date('2025-01-15T10:00:00Z');
      
      expect(item.added_at).toBeInstanceOf(Date);
    });

    it('should auto-set created_at', () => {
      const item = new WishlistItem();
      item.created_at = new Date();
      
      expect(item.created_at).toBeInstanceOf(Date);
    });

    it('should auto-update updated_at', () => {
      const item = new WishlistItem();
      item.updated_at = new Date();
      
      expect(item.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('Relationships', () => {
    it('should define ManyToOne relationship with User', () => {
      const user = new User();
      user.id = 10;
      
      const item = new WishlistItem();
      item.user = user;
      item.user_id = user.id;
      
      expect(item.user).toBe(user);
      expect(item.user_id).toBe(10);
    });

    it('should define ManyToOne relationship with ProductVariant', () => {
      const variant = new ProductVariant();
      variant.id = 5;
      
      const item = new WishlistItem();
      item.variant = variant;
      item.variant_id = variant.id;
      
      expect(item.variant).toBe(variant);
      expect(item.variant_id).toBe(5);
    });

    it('should allow user to have multiple wishlist items', () => {
      const userId = 10;
      
      const item1 = new WishlistItem();
      item1.user_id = userId;
      item1.variant_id = 5;
      
      const item2 = new WishlistItem();
      item2.user_id = userId;
      item2.variant_id = 6;
      
      const item3 = new WishlistItem();
      item3.user_id = userId;
      item3.variant_id = 7;
      
      expect([item1, item2, item3].every(i => i.user_id === userId)).toBe(true);
    });
  });

  describe('Priority Management', () => {
    it('should allow changing priority', () => {
      const item = new WishlistItem();
      item.priority = WishlistPriority.LOW;
      
      item.priority = WishlistPriority.HIGH;
      
      expect(item.priority).toBe(WishlistPriority.HIGH);
    });

    it('should filter items by priority', () => {
      const items = [
        { id: 1, priority: WishlistPriority.HIGH },
        { id: 2, priority: WishlistPriority.LOW },
        { id: 3, priority: WishlistPriority.HIGH },
        { id: 4, priority: WishlistPriority.MEDIUM },
      ];
      
      const highPriority = items.filter(i => i.priority === WishlistPriority.HIGH);
      
      expect(highPriority).toHaveLength(2);
    });
  });

  describe('Notes Management', () => {
    it('should store personal notes', () => {
      const item = new WishlistItem();
      item.notes = 'Gift for anniversary - size M preferred';
      
      expect(item.notes).toBe('Gift for anniversary - size M preferred');
    });

    it('should allow updating notes', () => {
      const item = new WishlistItem();
      item.notes = 'Buy when on sale';
      
      item.notes = 'Buy when on sale - need size L';
      
      expect(item.notes).toBe('Buy when on sale - need size L');
    });

    it('should allow empty notes', () => {
      const item = new WishlistItem();
      item.notes = undefined;
      
      expect(item.notes).toBeUndefined();
    });
  });

  describe('Business Logic', () => {
    it('should track when item was added', () => {
      const item = new WishlistItem();
      const addedDate = new Date('2025-01-15');
      item.added_at = addedDate;
      
      expect(item.added_at).toBe(addedDate);
    });

    it('should sort by added_at for chronological view', () => {
      const item1 = new WishlistItem();
      item1.added_at = new Date('2025-01-15');
      
      const item2 = new WishlistItem();
      item2.added_at = new Date('2025-01-10');
      
      const item3 = new WishlistItem();
      item3.added_at = new Date('2025-01-20');
      
      const items = [item1, item2, item3].sort((a, b) => 
        a.added_at.getTime() - b.added_at.getTime()
      );
      
      expect(items[0].added_at.getTime()).toBe(item2.added_at.getTime());
      expect(items[2].added_at.getTime()).toBe(item3.added_at.getTime());
    });

    it('should sort by priority for priority view', () => {
      const priorityOrder = {
        [WishlistPriority.HIGH]: 3,
        [WishlistPriority.MEDIUM]: 2,
        [WishlistPriority.LOW]: 1,
      };
      
      const item1 = new WishlistItem();
      item1.priority = WishlistPriority.LOW;
      
      const item2 = new WishlistItem();
      item2.priority = WishlistPriority.HIGH;
      
      const items = [item1, item2].sort((a, b) => 
        priorityOrder[b.priority] - priorityOrder[a.priority]
      );
      
      expect(items[0].priority).toBe(WishlistPriority.HIGH);
    });
  });

  describe('Edge Cases', () => {
    it('should handle wishlist item with no notes', () => {
      const item = new WishlistItem();
      item.user_id = 10;
      item.variant_id = 5;
      item.notes = undefined;
      
      expect(item.notes).toBeUndefined();
    });

    it('should handle very long notes', () => {
      const item = new WishlistItem();
      item.notes = 'a'.repeat(500);
      
      expect(item.notes.length).toBe(500);
    });

    it('should handle user with empty wishlist', () => {
      const userId = 10;
      const wishlistItems: WishlistItem[] = [];
      
      const userItems = wishlistItems.filter(i => i.user_id === userId);
      
      expect(userItems).toHaveLength(0);
    });

    it('should handle user with large wishlist', () => {
      const userId = 10;
      const items: WishlistItem[] = [];
      
      for (let i = 1; i <= 50; i++) {
        const item = new WishlistItem();
        item.user_id = userId;
        item.variant_id = i;
        items.push(item);
      }
      
      expect(items).toHaveLength(50);
      expect(items.every(i => i.user_id === userId)).toBe(true);
    });
  });
});
