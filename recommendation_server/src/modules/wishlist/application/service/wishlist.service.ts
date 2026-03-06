import { IWishlistRepository } from "../../domain/repositories/IWishlistRepository";
import { Wishlist } from "../../entity/wishlist.entity";
import { WishlistItem } from "../../entity/wishlist-item";
import { WishlistPriority } from "../../enum/wishlist.enum";
import { AppError } from "@/common/error.response";

export class WishlistService {
  constructor(private wishlistRepo: IWishlistRepository) {}

  async list(userId: number): Promise<Wishlist[]> {
    return await this.wishlistRepo.findByUserId(userId);
  }

  async get(userId: number, wishlistId: number): Promise<Wishlist> {
    const wishlist = await this.wishlistRepo.findById(wishlistId);
    if (!wishlist) {
      throw new AppError("Wishlist not found", 404, "NOT_FOUND");
    }

    // Check ownership or public access (if implemented later)
    if (wishlist.user_id !== userId && !wishlist.is_public) {
        throw new AppError("Access denied", 403, "FORBIDDEN");
    }

    return wishlist;
  }

  async create(userId: number, name: string): Promise<Wishlist> {
    // Check if user already has a default wishlist
    const defaultList = await this.wishlistRepo.findDefaultByUserId(userId);

    const wishlist = await this.wishlistRepo.create(userId, name);

    // If no default list exists, make this one default
    if (!defaultList) {
        wishlist.is_default = true;
        await this.wishlistRepo.update(wishlist);
    }

    return wishlist;
  }

  async delete(userId: number, wishlistId: number): Promise<void> {
    const wishlist = await this.get(userId, wishlistId);

    if (wishlist.is_default) {
        throw new AppError("Cannot delete default wishlist", 400, "BAD_REQUEST");
    }

    await this.wishlistRepo.delete(wishlistId);
  }

  async add(userId: number, variantId: number, notes?: string, priority?: WishlistPriority, wishlistId?: number): Promise<WishlistItem> {
    let targetWishlist: Wishlist | null = null;

    if (wishlistId) {
        targetWishlist = await this.wishlistRepo.findById(wishlistId);
        if (!targetWishlist) throw new AppError("Wishlist not found", 404, "NOT_FOUND");
        if (targetWishlist.user_id !== userId) throw new AppError("Access denied", 403, "FORBIDDEN");
    } else {
        targetWishlist = await this.wishlistRepo.findDefaultByUserId(userId);
        if (!targetWishlist) {
            // Create default wishlist if none exists
            targetWishlist = await this.create(userId, "My Wishlist");
        }
    }

    if (!targetWishlist) {
        // Should not happen due to logic above
        throw new AppError("Could not determine target wishlist", 500, "INTERNAL_SERVER_ERROR");
    }

    // Check if item already exists
    const existingItem = await this.wishlistRepo.findItem(targetWishlist.id, variantId);
    if (existingItem) {
        throw new AppError("Item already in wishlist", 400, "DUPLICATE_ITEM");
    }

    return await this.wishlistRepo.addItem(targetWishlist.id, variantId, notes, priority);
  }

  async updateItem(userId: number, itemId: number, data: { notes?: string; priority?: WishlistPriority }): Promise<WishlistItem> {
    const item = await this.wishlistRepo.findItemById(itemId);
    if (!item) {
        throw new AppError("Wishlist item not found", 404, "NOT_FOUND");
    }

    if (item.wishlist.user_id !== userId) {
        throw new AppError("Access denied", 403, "FORBIDDEN");
    }

    return await this.wishlistRepo.updateItem(itemId, data);
  }

  async removeItem(userId: number, itemId: number): Promise<void> {
    const item = await this.wishlistRepo.findItemById(itemId);
    if (!item) {
        throw new AppError("Wishlist item not found", 404, "NOT_FOUND");
    }

    if (item.wishlist.user_id !== userId) {
        throw new AppError("Access denied", 403, "FORBIDDEN");
    }

    await this.wishlistRepo.removeItem(itemId);
  }

  async check(userId: number, variantId: number): Promise<{ in_wishlist: boolean; wishlist_id?: number; item_id?: number }> {
    const item = await this.wishlistRepo.findItemByUserIdAndVariantId(userId, variantId);
    if (item) {
        return { in_wishlist: true, wishlist_id: item.wishlist_id, item_id: item.id };
    }

    return { in_wishlist: false };
  }

  // Helper to move item between lists
  async moveItem(userId: number, itemId: number, targetWishlistId: number): Promise<WishlistItem> {
      const item = await this.wishlistRepo.findItemById(itemId);
      if (!item) throw new AppError("Item not found", 404, "NOT_FOUND");
      if (item.wishlist.user_id !== userId) throw new AppError("Access denied", 403, "FORBIDDEN");

      const targetList = await this.wishlistRepo.findById(targetWishlistId);
      if (!targetList) throw new AppError("Target wishlist not found", 404, "NOT_FOUND");
      if (targetList.user_id !== userId) throw new AppError("Access denied", 403, "FORBIDDEN");

      // Check if already in target
      const existing = await this.wishlistRepo.findItem(targetWishlistId, item.variant_id);
      if (existing) throw new AppError("Item already exists in target wishlist", 400, "DUPLICATE_ITEM");

      return await this.wishlistRepo.updateItem(itemId, { wishlist_id: targetWishlistId });
  }
}
