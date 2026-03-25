import { Product } from '@/modules/products/entity/product';
import { ProductVariant } from '@/modules/products/entity/product-variant';

export const PRODUCT_1: Product = {
  id: 1,
  category_id: 1,
  brand_id: 1,
  name: 'Classic Cotton T-Shirt',
  slug: 'classic-cotton-t-shirt',
  sku: 'TSHIRT-COTTON-001',
  description: 'Premium quality 100% cotton t-shirt. Comfortable and durable for everyday wear. Available in multiple sizes and colors.',
  short_description: 'Premium cotton t-shirt',
  base_price: 199000,
  compare_at_price: 299000,
  is_active: true,
  is_featured: true,
  created_at: new Date('2024-01-01T08:00:00Z'),
  updated_at: new Date('2024-01-20T10:00:00Z'),
} as Product;

export const PRODUCT_2: Product = {
  id: 2,
  category_id: 2,
  brand_id: 2,
  name: 'Slim Fit Denim Jeans',
  slug: 'slim-fit-denim-jeans',
  sku: 'JEANS-SLIM-001',
  description: 'Modern slim fit denim jeans. Crafted with premium denim fabric for a stylish and comfortable fit.',
  short_description: 'Slim fit denim jeans',
  base_price: 599000,
  compare_at_price: 899000,
  is_active: true,
  is_featured: true,
  created_at: new Date('2024-01-02T09:15:00Z'),
  updated_at: new Date('2024-01-21T11:30:00Z'),
} as Product;

export const PRODUCT_3: Product = {
  id: 3,
  category_id: 3,
  brand_id: 1,
  name: 'Casual Linen Shirt',
  slug: 'casual-linen-shirt',
  sku: 'SHIRT-LINEN-001',
  description: 'Breathable linen shirt perfect for summer. Lightweight and easy to maintain. Ideal for both casual and semi-formal occasions.',
  short_description: 'Casual linen shirt',
  base_price: 349000,
  compare_at_price: 499000,
  is_active: true,
  is_featured: false,
  created_at: new Date('2024-01-03T07:45:00Z'),
  updated_at: new Date('2024-01-22T09:20:00Z'),
} as Product;

export const PRODUCT_1_VARIANT_1: ProductVariant = {
  id: 1,
  product_id: 1,
  sku: 'TSHIRT-COTTON-001-S-BLACK',
  size: 'S',
  color: 'Black',
  color_code: '#000000',
  material: 'Cotton',
  price_adjustment: 0,
  final_price: 199000,
  weight_kg: 0.15,
  barcode: '1234567890001',
  is_active: true,
  sort_order: 0,
  created_at: new Date('2024-01-01T08:00:00Z'),
  updated_at: new Date('2024-01-20T10:00:00Z'),
} as ProductVariant;

export const PRODUCT_1_VARIANT_2: ProductVariant = {
  id: 2,
  product_id: 1,
  sku: 'TSHIRT-COTTON-001-M-BLACK',
  size: 'M',
  color: 'Black',
  color_code: '#000000',
  material: 'Cotton',
  price_adjustment: 0,
  final_price: 199000,
  weight_kg: 0.17,
  barcode: '1234567890002',
  is_active: true,
  sort_order: 1,
  created_at: new Date('2024-01-01T08:00:00Z'),
  updated_at: new Date('2024-01-20T10:00:00Z'),
} as ProductVariant;

export const PRODUCT_1_VARIANT_3: ProductVariant = {
  id: 3,
  product_id: 1,
  sku: 'TSHIRT-COTTON-001-L-WHITE',
  size: 'L',
  color: 'White',
  color_code: '#FFFFFF',
  material: 'Cotton',
  price_adjustment: 0,
  final_price: 199000,
  weight_kg: 0.18,
  barcode: '1234567890003',
  is_active: true,
  sort_order: 2,
  created_at: new Date('2024-01-01T08:00:00Z'),
  updated_at: new Date('2024-01-20T10:00:00Z'),
} as ProductVariant;

export const PRODUCT_2_VARIANT_1: ProductVariant = {
  id: 4,
  product_id: 2,
  sku: 'JEANS-SLIM-001-30-BLUE',
  size: '30',
  color: 'Dark Blue',
  color_code: '#1F3A70',
  material: 'Polyester',
  price_adjustment: 50000,
  final_price: 649000,
  weight_kg: 0.65,
  barcode: '1234567890004',
  is_active: true,
  sort_order: 0,
  created_at: new Date('2024-01-02T09:15:00Z'),
  updated_at: new Date('2024-01-21T11:30:00Z'),
} as ProductVariant;

export const PRODUCT_2_VARIANT_2: ProductVariant = {
  id: 5,
  product_id: 2,
  sku: 'JEANS-SLIM-001-32-BLUE',
  size: '32',
  color: 'Dark Blue',
  color_code: '#1F3A70',
  material: 'Polyester',
  price_adjustment: 50000,
  final_price: 649000,
  weight_kg: 0.72,
  barcode: '1234567890005',
  is_active: true,
  sort_order: 1,
  created_at: new Date('2024-01-02T09:15:00Z'),
  updated_at: new Date('2024-01-21T11:30:00Z'),
} as ProductVariant;

export const PRODUCT_3_VARIANT_1: ProductVariant = {
  id: 6,
  product_id: 3,
  sku: 'SHIRT-LINEN-001-M-BEIGE',
  size: 'M',
  color: 'Beige',
  color_code: '#F5F5DC',
  material: 'Linen',
  price_adjustment: 0,
  final_price: 349000,
  weight_kg: 0.2,
  barcode: '1234567890006',
  is_active: true,
  sort_order: 0,
  created_at: new Date('2024-01-03T07:45:00Z'),
  updated_at: new Date('2024-01-22T09:20:00Z'),
} as ProductVariant;

export const TEST_PRODUCTS = [PRODUCT_1, PRODUCT_2, PRODUCT_3];

export const TEST_PRODUCT_VARIANTS = [
  PRODUCT_1_VARIANT_1,
  PRODUCT_1_VARIANT_2,
  PRODUCT_1_VARIANT_3,
  PRODUCT_2_VARIANT_1,
  PRODUCT_2_VARIANT_2,
  PRODUCT_3_VARIANT_1,
];
