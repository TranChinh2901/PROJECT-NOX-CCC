import apiClient from './apiClient';
import { Brand, Category, Product, ProductImage, ProductVariant, User } from '@/types';

// Types for admin API responses
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  usersChange: number;
  productsChange: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: number;
  name: string;
  sales: number;
  revenue: number;
  image_url?: string;
}

export interface UserGrowthData {
  date: string;
  users: number;
  active_users: number;
}

export interface OrderStatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface AnalyticsData {
  revenueByDay: RevenueData[];
  topProducts: TopProduct[];
  userGrowth: UserGrowthData[];
  orderStatusDistribution: OrderStatusDistribution[];
}

export interface AdminOrder {
  id: number;
  order_number: string;
  customer?: {
    id: number;
    fullname: string;
    email: string;
  };
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  items_count: number;
}

export interface OrderDetails extends AdminOrder {
  items: {
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  shipping_address?: {
    address: string;
    city: string;
    province: string;
    postal_code: string;
  };
  payment_method?: string;
}

interface RawAdminOrder {
  id: number;
  order_number: string;
  user_id?: number;
  user?: {
    id: number;
    fullname?: string;
    email?: string;
  } | null;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  items?: Array<unknown>;
  items_count?: number;
}

interface RawAdminOrdersResponse {
  data: RawAdminOrder[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UpdateOrderStatusDto {
  status: string;
}

export interface AdminProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  lowStockProducts: number;
}

export interface AdminUsersResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface UpdateAdminUserDto {
  fullname?: string;
  email?: string;
  phone_number?: string;
  avatar?: string | null;
  role?: User['role'];
}

export interface AdminProductsResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface PaginatedAdminEntityResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages?: number;
    totalPages?: number;
  };
}

export interface UpdateAdminProductDto {
  category_id?: number;
  brand_id?: number | null;
  name?: string;
  slug?: string;
  sku?: string;
  description?: string;
  short_description?: string | null;
  base_price?: number;
  compare_at_price?: number | null;
  cost_price?: number | null;
  weight_kg?: number | null;
  is_active?: boolean;
  is_featured?: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface CreateAdminProductDto {
  category_id: number;
  brand_id?: number | null;
  name: string;
  slug: string;
  sku: string;
  description: string;
  short_description?: string | null;
  base_price: number;
  compare_at_price?: number | null;
  cost_price?: number | null;
  weight_kg?: number | null;
  is_active?: boolean;
  is_featured?: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface UploadAdminProductImagesDto {
  variant_id?: number;
  alt_text?: string;
  is_primary?: boolean;
  sort_order?: number;
}

export interface UpdateAdminProductVariantDto {
  sku?: string;
  size?: string | null;
  color?: string | null;
  color_code?: string | null;
  material?: string | null;
  price_adjustment?: number;
  weight_kg?: number | null;
  barcode?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface CreateAdminProductVariantDto {
  sku: string;
  size?: string | null;
  color?: string | null;
  color_code?: string | null;
  material?: string | null;
  price_adjustment?: number;
  weight_kg?: number | null;
  barcode?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export const adminApi = {
  // Dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    return await apiClient.get<DashboardStats>('/admin/dashboard/stats');
  },

  // Analytics data
  async getAnalyticsData(params?: {
    startDate?: string;
    endDate?: string;
    period?: 'week' | 'month' | 'year'
  }): Promise<AnalyticsData> {
    return await apiClient.get<AnalyticsData>('/admin/analytics', {
      params
    });
  },

  // Order management
  async getAllOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sort?: string;
  }): Promise<{
    data: AdminOrder[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await apiClient.get<RawAdminOrdersResponse>('/admin/orders', { params });

    return {
      data: response.data.map((order) => ({
        id: order.id,
        order_number: order.order_number,
        customer: order.user
          ? {
              id: order.user.id,
              fullname: order.user.fullname || 'Unknown customer',
              email: order.user.email || 'No email available',
            }
          : undefined,
        total_amount: Number(order.total_amount),
        status: order.status,
        payment_status: order.payment_status,
        created_at: order.created_at,
        updated_at: order.updated_at,
        items_count: order.items_count ?? order.items?.length ?? 0,
      })),
      total: response.pagination.total,
      page: response.pagination.page,
      limit: response.pagination.limit,
      totalPages: response.pagination.totalPages,
    };
  },

  async getOrderById(orderId: number): Promise<OrderDetails> {
    return await apiClient.get<OrderDetails>(`/admin/orders/${orderId}`);
  },

  async updateOrderStatus(orderId: number, data: UpdateOrderStatusDto): Promise<AdminOrder> {
    return await apiClient.patch<AdminOrder>(`/admin/orders/${orderId}/status`, data);
  },

  async deleteOrder(orderId: number): Promise<void> {
    return await apiClient.delete(`/admin/orders/${orderId}`);
  },

  // Product management
  async getProductStats(): Promise<AdminProductStats> {
    return await apiClient.get<AdminProductStats>('/admin/products/stats');
  },

  async getAllProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    category_id?: number;
    brand_id?: number;
    is_active?: boolean;
  }): Promise<AdminProductsResponse<Product>> {
    return await apiClient.get<AdminProductsResponse<Product>>('/admin/products', { params });
  },

  async getProductById(productId: number): Promise<Product> {
    return await apiClient.get<Product>(`/admin/products/${productId}`);
  },

  async createProduct(data: CreateAdminProductDto): Promise<Product> {
    return await apiClient.post<Product>('/admin/products', data);
  },

  async updateProduct(productId: number, data: UpdateAdminProductDto): Promise<Product> {
    return await apiClient.patch<Product>(`/admin/products/${productId}`, data);
  },

  async updateProductVariant(
    productId: number,
    variantId: number,
    data: UpdateAdminProductVariantDto,
  ): Promise<ProductVariant> {
    return await apiClient.patch<ProductVariant>(
      `/admin/products/${productId}/variants/${variantId}`,
      data,
    );
  },

  async createProductVariant(
    productId: number,
    data: CreateAdminProductVariantDto,
  ): Promise<ProductVariant> {
    return await apiClient.post<ProductVariant>(`/admin/products/${productId}/variants`, data);
  },

  async deleteProductVariant(productId: number, variantId: number): Promise<void> {
    return await apiClient.delete(`/admin/products/${productId}/variants/${variantId}`);
  },

  async uploadProductImages(
    productId: number,
    files: File[],
    options?: UploadAdminProductImagesDto,
  ): Promise<ProductImage[]> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('images', file);
    });

    if (typeof options?.variant_id === 'number') {
      formData.append('variant_id', String(options.variant_id));
    }

    if (options?.alt_text) {
      formData.append('alt_text', options.alt_text);
    }

    if (typeof options?.sort_order === 'number') {
      formData.append('sort_order', String(options.sort_order));
    }

    if (typeof options?.is_primary === 'boolean') {
      formData.append('is_primary', String(options.is_primary));
    }

    return await apiClient.post<ProductImage[]>(
      `/admin/products/${productId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  },

  async deleteProductImage(productId: number, imageId: number): Promise<void> {
    return await apiClient.delete(`/admin/products/${productId}/images/${imageId}`);
  },

  async deleteProduct(productId: number): Promise<void> {
    return await apiClient.delete(`/admin/products/${productId}`);
  },

  // User analytics
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    userGrowthRate: number;
  }> {
    return await apiClient.get('/admin/users/stats');
  },

  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<AdminUsersResponse<User>> {
    return await apiClient.get<AdminUsersResponse<User>>('/admin/users', { params });
  },

  async updateUser(userId: number, data: UpdateAdminUserDto): Promise<User> {
    return await apiClient.patch<User>(`/admin/users/${userId}`, data);
  },

  async uploadUserAvatar(userId: number, file: File): Promise<User> {
    const formData = new FormData();
    formData.append('avatar', file);

    return await apiClient.put<User>(
      `/admin/users/${userId}/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  },

  // Category management
  async getAllCategories(): Promise<Category[]> {
    const response = await apiClient.get<PaginatedAdminEntityResponse<Category>>('/admin/categories', {
      params: { page: 1, limit: 100 },
    });
    return Array.isArray(response.data) ? response.data : [];
  },

  async createCategory(data: { name: string; description?: string }): Promise<Category> {
    return await apiClient.post<Category>('/admin/categories', data);
  },

  async updateCategory(categoryId: number, data: { name?: string; description?: string }): Promise<Category> {
    return await apiClient.patch<Category>(`/admin/categories/${categoryId}`, data);
  },

  async deleteCategory(categoryId: number): Promise<void> {
    return await apiClient.delete(`/admin/categories/${categoryId}`);
  },

  // Brand management
  async getAllBrands(): Promise<Brand[]> {
    const response = await apiClient.get<PaginatedAdminEntityResponse<Brand>>('/admin/brands', {
      params: { page: 1, limit: 100 },
    });
    return Array.isArray(response.data) ? response.data : [];
  },

  async createBrand(data: { name: string; description?: string }): Promise<Brand> {
    return await apiClient.post<Brand>('/admin/brands', data);
  },

  async updateBrand(brandId: number, data: { name?: string; description?: string }): Promise<Brand> {
    return await apiClient.patch<Brand>(`/admin/brands/${brandId}`, data);
  },

  async deleteBrand(brandId: number): Promise<void> {
    return await apiClient.delete(`/admin/brands/${brandId}`);
  },
};
