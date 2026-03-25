export interface CreateCategoryDto {
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  parent_id?: number | null;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
}
