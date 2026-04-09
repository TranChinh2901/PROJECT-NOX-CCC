import type { User } from './auth.types';

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
  inventory?: Array<{
    warehouse_id: number;
    quantity_available: number;
    quantity_reserved: number;
    quantity_total: number;
  }>;
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
  stock_quantity?: number;
  is_active: boolean;
  is_featured: boolean;
  sold_count?: number;
  meta_title?: string;
  meta_description?: string;
  primary_image?: string | null;
  image_count?: number;
  variant_count?: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  variants?: ProductVariant[];
  images?: ProductImage[];
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

export interface ProductReviewDistributionItem {
  rating: number;
  count: number;
}

export interface ProductReviewsSummary {
  total_reviews: number;
  average_rating: string;
  rating_distribution: ProductReviewDistributionItem[];
}

export interface ProductReviewsResponse {
  data: Review[];
  summary: ProductReviewsSummary;
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface CreateReviewDto {
  order_item_id: number;
  rating: number;
  title?: string;
  content: string;
}
