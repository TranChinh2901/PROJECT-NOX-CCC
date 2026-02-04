import apiClient from './apiClient';

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
  customer: {
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

export interface UpdateOrderStatusDto {
  status: string;
}

export interface AdminProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  lowStockProducts: number;
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
    return await apiClient.get('/admin/orders', { params });
  },

  async getOrderById(orderId: number): Promise<OrderDetails> {
    return await apiClient.get<OrderDetails>(`/admin/orders/${orderId}`);
  },

  async updateOrderStatus(orderId: number, data: UpdateOrderStatusDto): Promise<AdminOrder> {
    return await apiClient.patch<AdminOrder>(`/admin/orders/${orderId}/status`, data);
  },

  // Product management
  async getProductStats(): Promise<AdminProductStats> {
    return await apiClient.get<AdminProductStats>('/admin/products/stats');
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

  // Category management
  async getAllCategories(): Promise<any[]> {
    return await apiClient.get('/admin/categories');
  },

  async createCategory(data: { name: string; description?: string }): Promise<any> {
    return await apiClient.post('/admin/categories', data);
  },

  async updateCategory(categoryId: number, data: { name?: string; description?: string }): Promise<any> {
    return await apiClient.patch(`/admin/categories/${categoryId}`, data);
  },

  async deleteCategory(categoryId: number): Promise<void> {
    return await apiClient.delete(`/admin/categories/${categoryId}`);
  },

  // Brand management
  async getAllBrands(): Promise<any[]> {
    return await apiClient.get('/admin/brands');
  },

  async createBrand(data: { name: string; description?: string }): Promise<any> {
    return await apiClient.post('/admin/brands', data);
  },

  async updateBrand(brandId: number, data: { name?: string; description?: string }): Promise<any> {
    return await apiClient.patch(`/admin/brands/${brandId}`, data);
  },

  async deleteBrand(brandId: number): Promise<void> {
    return await apiClient.delete(`/admin/brands/${brandId}`);
  },
};
