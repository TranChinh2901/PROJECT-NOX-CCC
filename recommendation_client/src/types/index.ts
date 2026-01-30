// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Enums
export enum GenderType {
  MALE = 'male',
  FEMALE = 'female'
}

export enum RoleType {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum CartStatus {
  ACTIVE = 'active',
  CONVERTED = 'converted',
  ABANDONED = 'abandoned'
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  COD = 'cod',
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  E_WALLET = 'e_wallet'
}

// User types
export interface User {
  id: number;
  fullname: string;
  email: string;
  phone_number: string;
  address?: string;
  avatar?: string;
  gender?: GenderType;
  date_of_birth?: Date;
  is_verified: boolean;
  role: RoleType;
  created_at: Date;
  updated_at: Date;
}

// Product types
export interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  parent?: Category;
  children?: Category[];
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface ProductImage {
  id: number;
  product_id: number;
  variant_id?: number;
  image_url: string;
  thumbnail_url?: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  size?: string;
  color?: string;
  color_code?: string;
  material?: string;
  price_adjustment: number;
  final_price: number;
  weight_kg?: number;
  barcode?: string;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Product {
  id: number;
  category_id: number;
  category?: Category;
  brand_id?: number;
  brand?: Brand;
  name: string;
  slug: string;
  sku: string;
  description: string;
  short_description?: string;
  base_price: number;
  compare_at_price?: number;
  cost_price?: number;
  weight_kg?: number;
  is_active: boolean;
  is_featured: boolean;
  meta_title?: string;
  meta_description?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  variants?: ProductVariant[];
  images?: ProductImage[];
}

// Cart types
export interface CartItem {
  id: number;
  cart_id: number;
  variant_id: number;
  variant?: ProductVariant;
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

// Order types
export interface Address {
  fullname: string;
  phone: string;
  address: string;
  city: string;
  district?: string;
  ward?: string;
  postal_code?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  variant_id: number;
  variant?: ProductVariant;
  product_snapshot: object;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  user?: User;
  cart_id?: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  shipping_address: Address;
  billing_address: Address;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  notes?: string;
  internal_notes?: string;
  tracking_number?: string;
  shipped_at?: Date;
  delivered_at?: Date;
  items?: OrderItem[];
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

// Review types
export interface Review {
  id: number;
  product_id: number;
  product?: Product;
  user_id: number;
  user?: User;
  order_item_id: number;
  rating: number;
  title?: string;
  content: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  not_helpful_count: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

// DTOs for API requests
export interface LoginDto {
  email: string;
  password: string;
}

export interface SignupDto {
  fullname: string;
  email: string;
  password: string;
  phone_number?: string;
  address?: string;
  gender: GenderType;
  date_of_birth: Date | string;
  role?: RoleType;
}

export interface UpdateProfileDto {
  fullname?: string;
  phone_number?: string;
  address?: string;
  gender?: GenderType;
  date_of_birth?: Date | string;
}

export interface AddToCartDto {
  variant_id: number;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

export interface CreateOrderDto {
  cart_id: number;
  shipping_address: Address;
  billing_address: Address;
  payment_method: PaymentMethod;
  notes?: string;
}

export interface CreateReviewDto {
  order_item_id: number;
  rating: number;
  title?: string;
  content: string;
}

export interface ProductFilterOptions {
  category_id?: number;
  brand_id?: number;
  min_price?: number;
  max_price?: number;
  search?: string;
  is_featured?: boolean;
  is_active?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}

// Paginated response type
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Auth response types
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
}
