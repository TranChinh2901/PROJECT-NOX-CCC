import { Cart } from '@/modules/cart/entity/cart';
import { CartItem } from '@/modules/cart/entity/cart-item';
import { CartStatus } from '@/modules/cart/enum/cart.enum';

export const EMPTY_CART: Cart = {
  id: 1,
  user_id: 2,
  session_id: undefined,
  status: CartStatus.ACTIVE,
  total_amount: 0,
  item_count: 0,
  currency: 'VND',
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  created_at: new Date('2024-01-15T10:00:00Z'),
  updated_at: new Date('2024-01-15T10:00:00Z'),
  items: [],
} as Cart;

export const CART_WITH_ITEMS: Cart = {
  id: 2,
  user_id: 2,
  session_id: undefined,
  status: CartStatus.ACTIVE,
  total_amount: 848000,
  item_count: 2,
  currency: 'VND',
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  created_at: new Date('2024-01-14T14:30:00Z'),
  updated_at: new Date('2024-01-15T11:45:00Z'),
  items: [],
} as Cart;

export const ABANDONED_CART: Cart = {
  id: 3,
  user_id: 3,
  session_id: undefined,
  status: CartStatus.ABANDONED,
  total_amount: 349000,
  item_count: 1,
  currency: 'VND',
  expires_at: new Date('2024-01-20T14:30:00Z'),
  created_at: new Date('2024-01-10T09:00:00Z'),
  updated_at: new Date('2024-01-12T16:20:00Z'),
  items: [],
} as Cart;

export const CART_ITEM_1: CartItem = {
  id: 1,
  cart_id: 2,
  variant_id: 1,
  quantity: 2,
  unit_price: 199000,
  total_price: 398000,
  added_at: new Date('2024-01-14T14:30:00Z'),
  updated_at: new Date('2024-01-14T14:30:00Z'),
} as CartItem;

export const CART_ITEM_2: CartItem = {
  id: 2,
  cart_id: 2,
  variant_id: 4,
  quantity: 1,
  unit_price: 649000,
  total_price: 649000,
  added_at: new Date('2024-01-15T11:00:00Z'),
  updated_at: new Date('2024-01-15T11:00:00Z'),
} as CartItem;

export const ABANDONED_CART_ITEM: CartItem = {
  id: 3,
  cart_id: 3,
  variant_id: 6,
  quantity: 1,
  unit_price: 349000,
  total_price: 349000,
  added_at: new Date('2024-01-10T09:00:00Z'),
  updated_at: new Date('2024-01-10T09:00:00Z'),
} as CartItem;

export const TEST_CARTS = [EMPTY_CART, CART_WITH_ITEMS, ABANDONED_CART];

export const TEST_CART_ITEMS = [CART_ITEM_1, CART_ITEM_2, ABANDONED_CART_ITEM];
