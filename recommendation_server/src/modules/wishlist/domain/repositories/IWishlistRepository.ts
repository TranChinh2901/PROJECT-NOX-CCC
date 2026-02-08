import { Wishlist } from "../../entity/wishlist.entity";
import { WishlistItem } from "../../entity/wishlist-item";
import { WishlistPriority } from "../../enum/wishlist.enum";

export interface IWishlistRepository {
  create(userId: number, name: string): Promise<Wishlist>;
  findByUserId(userId: number): Promise<Wishlist[]>;
  findById(id: number): Promise<Wishlist | null>;
  findDefaultByUserId(userId: number): Promise<Wishlist | null>;
  update(wishlist: Wishlist): Promise<Wishlist>;
  delete(id: number): Promise<void>;

  addItem(wishlistId: number, variantId: number, notes?: string, priority?: WishlistPriority): Promise<WishlistItem>;
  removeItem(itemId: number): Promise<void>;
  updateItem(itemId: number, data: Partial<WishlistItem>): Promise<WishlistItem>;
  findItem(wishlistId: number, variantId: number): Promise<WishlistItem | null>;
  findItemById(itemId: number): Promise<WishlistItem | null>;
  countItems(wishlistId: number): Promise<number>;
}
