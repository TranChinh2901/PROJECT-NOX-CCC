import { Product } from './product.types';

export interface WishlistVariant {
  id: number;
  product_id: number;
  final_price?: number;
  product?: Product;
}

export interface WishlistItem {
  id: number;
  user_id?: number;
  wishlist_id?: number;
  product_id?: number;
  variant_id?: number;
  variant?: WishlistVariant;
  product?: Product;
  added_at: Date;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface WishlistCollection {
  id: number;
  user_id: number;
  name: string;
  is_default: boolean;
  items: WishlistItem[];
}

export type WishlistResponse = WishlistItem[] | WishlistCollection[];

export interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
}

export interface WishlistContextType {
  items: WishlistItem[];
  isLoading: boolean;
  wishlistCount: number;
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (productId: number) => Promise<void>;
  clearWishlist: () => Promise<void>;
}
