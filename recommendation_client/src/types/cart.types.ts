import { CartStatus } from './order.types';
import { ProductVariant, Product } from './product.types';
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

export interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;

  addToCart(data: AddToCartDto, product?: Product, variant?: ProductVariant): Promise<Cart>;

  updateQuantity(itemId: number, data: UpdateCartItemDto): Promise<Cart>;

  removeItem(itemId: number): Promise<Cart>;

  bulkRemoveItems(itemIds: number[]): Promise<Cart>;

  clearCart(): Promise<void>;

  refreshCart(): Promise<Cart | null>;

  syncWithAPI(): Promise<Cart | null>;
}
