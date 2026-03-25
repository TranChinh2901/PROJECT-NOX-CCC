import bcryptjs from 'bcryptjs';
import { User } from '../../src/modules/users/entity/user.entity';
import { Cart } from '../../src/modules/cart/entity/cart';
import { CartItem } from '../../src/modules/cart/entity/cart-item';
import { Product } from '../../src/modules/products/entity/product';
import { ProductVariant } from '../../src/modules/products/entity/product-variant';
import { UserSession } from '../../src/modules/users/entity/user-session';
import { RoleType } from '../../src/modules/auth/enum/auth.enum';
import { GenderType } from '../../src/modules/users/enum/user.enum';
import { DeviceType } from '../../src/modules/users/enum/user-session.enum';
import { CartStatus } from '../../src/modules/cart/enum/cart.enum';

let sequence = 1;
const nextSequence = () => {
  const value = sequence;
  sequence += 1;
  return value;
};

const pick = <T>(items: T[]): T => items[nextSequence() % items.length];

const makeNumber = (min: number, max: number) => {
  const range = Math.max(1, max - min + 1);
  return min + (nextSequence() % range);
};

const makeDecimal = (min: number, max: number, decimals = 2) => {
  const base = makeNumber(min, max);
  const value = base + (nextSequence() % 100) / 100;
  return parseFloat(value.toFixed(decimals));
};

const makeToken = (prefix: string) => `${prefix}-${nextSequence()}`;

const makeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const BASE_DATE = new Date('2024-01-01T00:00:00Z');
const addSeconds = (seconds: number) => new Date(BASE_DATE.getTime() + seconds * 1000);
const makePastDate = () => addSeconds(-makeNumber(1, 100000));
const makeRecentDate = () => addSeconds(-makeNumber(1, 1000));
const makeFutureDate = () => addSeconds(makeNumber(1, 100000));

export function createMockUser(overrides?: Partial<User>): User {
  const user = new User();
  user.id = makeNumber(1, 1000);
  user.fullname = `User ${nextSequence()}`;
  user.email = `user${nextSequence()}@example.com`;
  user.phone_number = `0900${makeNumber(100000, 999999)}`;
  user.address = `Street ${makeNumber(1, 999)}`;
  user.avatar = `https://example.com/avatar/${nextSequence()}.png`;
  user.password = bcryptjs.hashSync('password123', 10);
  user.gender = pick([GenderType.MALE, GenderType.FEMALE]);
  user.date_of_birth = new Date('1990-01-01T00:00:00Z');
  user.is_verified = nextSequence() % 2 === 0;
  user.role = RoleType.USER;
  user.created_at = makePastDate();
  user.updated_at = makeRecentDate();

  return Object.assign(user, overrides);
}

export function createMockAdmin(overrides?: Partial<User>): User {
  return createMockUser({
    role: RoleType.ADMIN,
    is_verified: true,
    ...overrides,
  });
}

export function createMockProduct(overrides?: Partial<Product>): Product {
  const product = new Product();
  product.id = makeNumber(1, 10000);
  product.category_id = makeNumber(1, 50);
  product.brand_id = makeNumber(1, 20);
  product.name = `Product ${nextSequence()}`;
  product.slug = makeSlug(product.name);
  product.sku = `SKU-${makeNumber(1000, 9999)}`;
  product.description = `Description ${nextSequence()}`;
  product.short_description = `Short desc ${nextSequence()}`;
  product.base_price = makeDecimal(10, 1000, 2);
  product.compare_at_price = makeDecimal(100, 2000, 2);
  product.is_active = true;
  product.is_featured = nextSequence() % 2 === 0;
  product.created_at = makePastDate();
  product.updated_at = makeRecentDate();

  return Object.assign(product, overrides);
}

export function createMockProductVariant(overrides?: Partial<ProductVariant>): ProductVariant {
  const variant = new ProductVariant();
  variant.id = makeNumber(1, 50000);
  variant.product_id = makeNumber(1, 10000);
  variant.sku = `SKU-${makeNumber(100000, 999999)}`;
  variant.size = pick(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
  variant.color = pick(['Black', 'White', 'Red', 'Blue']);
  variant.color_code = '#000000';
  variant.material = pick(['Cotton', 'Polyester', 'Wool', 'Silk', 'Linen']);
  variant.price_adjustment = makeDecimal(0, 100, 2);
  variant.final_price = makeDecimal(10, 500, 2);
  variant.weight_kg = parseFloat((0.5 + (nextSequence() % 10) / 10).toFixed(3));
  variant.barcode = `${makeNumber(100000000000, 999999999999)}`;
  variant.is_active = true;
  variant.sort_order = makeNumber(0, 100);
  variant.created_at = makePastDate();
  variant.updated_at = makeRecentDate();

  return Object.assign(variant, overrides);
}

export function createMockCart(overrides?: Partial<Cart>): Cart {
  const cart = new Cart();
  cart.id = makeNumber(1, 10000);
  cart.user_id = makeNumber(1, 1000);
  cart.guest_token = null;
  cart.status = CartStatus.ACTIVE;
  cart.total_amount = makeDecimal(0, 5000, 2);
  cart.item_count = makeNumber(0, 50);
  cart.currency = 'VND';
  cart.expires_at = makeFutureDate();
  cart.created_at = makePastDate();
  cart.updated_at = makeRecentDate();

  return Object.assign(cart, overrides);
}

export function createMockCartItem(overrides?: Partial<CartItem>): CartItem {
  const item = new CartItem();
  item.id = makeNumber(1, 100000);
  item.cart_id = makeNumber(1, 10000);
  item.variant_id = makeNumber(1, 50000);
  item.quantity = makeNumber(1, 100);
  item.unit_price = makeDecimal(10, 500, 2);
  item.total_price = item.quantity * item.unit_price;
  item.added_at = makePastDate();
  item.updated_at = makeRecentDate();

  return Object.assign(item, overrides);
}

export function createMockUserSession(overrides?: Partial<UserSession>): UserSession {
  const session = new UserSession();
  session.id = makeNumber(1, 10000);
  session.user_id = makeNumber(1, 1000);
  session.session_token = makeToken('session');
  session.ip_address = `192.168.0.${makeNumber(1, 254)}`;
  session.user_agent = `jest-agent-${nextSequence()}`;
  session.device_type = DeviceType.UNKNOWN;
  session.started_at = makePastDate();
  session.ended_at = nextSequence() % 2 === 0 ? makeRecentDate() : undefined;
  session.is_active = true;
  session.created_at = makePastDate();
  session.updated_at = makeRecentDate();

  return Object.assign(session, overrides);
}
