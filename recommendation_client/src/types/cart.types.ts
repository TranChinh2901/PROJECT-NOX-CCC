import { CartStatus } from './order.types';
import { ProductVariant, Product, ProductImage } from './product.types';
import { User } from './auth.types';

// Extended ProductVariant that includes the parent product
export interface CartItemVariant extends ProductVariant {
  product?: Product;
}

export interface CartItem {
  id: number;
  cart_id: number;
  variant_id: number;
  variant?: CartItemVariant | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  added_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Cart {
  id: number;
  user_id?: number;
  user?: User;
  session_id?: number;
  status: CartStatus;
  total_amount: number;
  item_count: number;
  currency: string;
  expires_at?: Date;
  items?: CartItem[];
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface AddToCartDto {
  variant_id: number;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

/**
 * Cart context contract shared by Cart and Profile teams.
 *
 * Persistence & sync strategy:
 * - localStorage is the source of truth for guests; key: `cart:state`.
 * - For authenticated users, write optimistic UI changes to localStorage first,
 *   then sync with the API.
 * - If API sync fails, keep localStorage data and surface a toast; retry via
 *   {@link syncWithAPI}.
 */
export interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  /** Derived count for the header cart badge. */
  itemCount: number;

  addToCart(data: AddToCartDto, product?: Product, variant?: ProductVariant): Promise<Cart>;

  updateQuantity(itemId: number, data: UpdateCartItemDto): Promise<Cart>;

  removeItem(itemId: number): Promise<Cart>;

  clearCart(): Promise<void>;

  refreshCart(): Promise<Cart | null>;

  /**
   * Reconcile localStorage cart with API when authenticated.
   * Returns the latest cart snapshot (or null for empty).
   */
  syncWithAPI(): Promise<Cart | null>;
}
