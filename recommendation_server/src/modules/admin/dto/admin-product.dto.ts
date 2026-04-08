export interface CreateProductDto {
  category_id: number;
  brand_id?: number;
  name: string;
  slug: string;
  sku: string;
  description: string;
  short_description?: string;
  base_price: number;
  compare_at_price?: number;
  cost_price?: number;
  weight_kg?: number;
  is_active?: boolean;
  is_featured?: boolean;
  meta_title?: string;
  meta_description?: string;
}

export interface AdminProductListQueryDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  category_id?: number;
  brand_id?: number;
  is_active?: boolean;
}

export interface UpdateProductDto {
  category_id?: number;
  brand_id?: number;
  name?: string;
  slug?: string;
  sku?: string;
  description?: string;
  short_description?: string;
  base_price?: number;
  compare_at_price?: number;
  cost_price?: number;
  weight_kg?: number;
  is_active?: boolean;
  is_featured?: boolean;
  meta_title?: string;
  meta_description?: string;
}
