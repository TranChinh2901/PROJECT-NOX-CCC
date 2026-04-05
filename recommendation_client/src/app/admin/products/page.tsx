'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, SlidersHorizontal, Package, TrendingUp, AlertCircle, CheckCircle, Grid3x3, LayoutList } from 'lucide-react';
import { Brand, Category, Product } from '@/types';
import { productApi } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { adminApi } from '@/lib/api/admin.api';

interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
  page?: number;
  limit?: number;
}

type ViewMode = 'grid' | 'list';

interface ProductEditForm {
  category_id: number | '';
  brand_id: number | '';
  name: string;
  slug: string;
  sku: string;
  description: string;
  short_description: string;
  base_price: string;
  compare_at_price: string;
  cost_price: string;
  weight_kg: string;
  is_active: boolean;
  is_featured: boolean;
}

const emptyProductForm: ProductEditForm = {
  category_id: '',
  brand_id: '',
  name: '',
  slug: '',
  sku: '',
  description: '',
  short_description: '',
  base_price: '',
  compare_at_price: '',
  cost_price: '',
  weight_kg: '',
  is_active: false,
  is_featured: false,
};

const toOptionalNumber = (value: string): number | null =>
  value.trim() === '' ? null : Number(value);

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductEditForm>(emptyProductForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productModalError, setProductModalError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    lowStock: 0,
    outOfStock: 0,
  });
  const deferredSearchTerm = useDeferredValue(searchTerm.trim());

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm, selectedCategory, selectedBrand, selectedStatus, viewMode]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsFetching(true);
        const filters: ProductFilters = {
          search: deferredSearchTerm || undefined,
          page: currentPage,
          limit: viewMode === 'grid' ? 12 : 10,
        };

        const response = await productApi.getAllProducts(filters);
        setProducts(response.data);
        setTotalPages(response.pagination.total_pages);

        // Calculate stats
        setStats({
          total: response.pagination.total,
          active: response.data.filter((p: Product) => p.is_active).length,
          lowStock: response.data.filter((p: Product) => (p.stock_quantity || 0) < 10 && (p.stock_quantity || 0) > 0).length,
          outOfStock: response.data.filter((p: Product) => (p.stock_quantity || 0) === 0).length,
        });
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsFetching(false);
        setInitialLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, deferredSearchTerm, selectedCategory, selectedBrand, selectedStatus, viewMode]);

  useEffect(() => {
    const loadProductMeta = async () => {
      try {
        const [categoryOptions, brandOptions] = await Promise.all([
          adminApi.getAllCategories(),
          adminApi.getAllBrands(),
        ]);
        setCategories(categoryOptions);
        setBrands(brandOptions);
      } catch (error) {
        console.error('Failed to load product metadata:', error);
      }
    };

    void loadProductMeta();
  }, []);

  const mapProductToForm = (product: Product): ProductEditForm => ({
    category_id: product.category?.id ?? '',
    brand_id: product.brand?.id ?? '',
    name: product.name ?? '',
    slug: product.slug ?? '',
    sku: product.sku ?? '',
    description: product.description ?? '',
    short_description: product.short_description ?? '',
    base_price: String(product.base_price ?? ''),
    compare_at_price:
      typeof product.compare_at_price === 'number' ? String(product.compare_at_price) : '',
    cost_price: typeof product.cost_price === 'number' ? String(product.cost_price) : '',
    weight_kg: typeof product.weight_kg === 'number' ? String(product.weight_kg) : '',
    is_active: Boolean(product.is_active),
    is_featured: Boolean(product.is_featured),
  });

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm(mapProductToForm(product));
    setProductModalError('');
  };

  const closeEditModal = () => {
    if (isSavingProduct) return;
    setEditingProduct(null);
    setProductForm(emptyProductForm);
    setProductModalError('');
  };

  const recalculateStats = (nextProducts: Product[]) => {
    setStats((currentStats) => ({
      ...currentStats,
      active: nextProducts.filter((p) => p.is_active).length,
      lowStock: nextProducts.filter((p) => (p.stock_quantity || 0) < 10 && (p.stock_quantity || 0) > 0).length,
      outOfStock: nextProducts.filter((p) => (p.stock_quantity || 0) === 0).length,
    }));
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    if (!productForm.name.trim() || !productForm.slug.trim() || !productForm.sku.trim()) {
      setProductModalError('Tên, slug và SKU là bắt buộc.');
      return;
    }

    if (!productForm.category_id) {
      setProductModalError('Vui lòng chọn danh mục.');
      return;
    }

    if (!productForm.description.trim()) {
      setProductModalError('Mô tả sản phẩm là bắt buộc.');
      return;
    }

    if (productForm.base_price.trim() === '' || Number(productForm.base_price) <= 0) {
      setProductModalError('Giá bán phải lớn hơn 0.');
      return;
    }

    try {
      setIsSavingProduct(true);
      setProductModalError('');

      const updatedProduct = await adminApi.updateProduct(editingProduct.id, {
        category_id: Number(productForm.category_id),
        brand_id: productForm.brand_id === '' ? null : Number(productForm.brand_id),
        name: productForm.name.trim(),
        slug: productForm.slug.trim(),
        sku: productForm.sku.trim(),
        description: productForm.description.trim(),
        short_description: productForm.short_description.trim() || null,
        base_price: Number(productForm.base_price),
        compare_at_price: toOptionalNumber(productForm.compare_at_price),
        cost_price: toOptionalNumber(productForm.cost_price),
        weight_kg: toOptionalNumber(productForm.weight_kg),
        is_active: productForm.is_active,
        is_featured: productForm.is_featured,
      });

      setProducts((currentProducts) => {
        const nextProducts = currentProducts.map((product) =>
          product.id === editingProduct.id ? updatedProduct : product,
        );
        recalculateStats(nextProducts);
        return nextProducts;
      });
      setEditingProduct(null);
      setProductForm(emptyProductForm);
      setProductModalError('');
    } catch (error) {
      console.error('Failed to update product:', error);
      setProductModalError(
        error instanceof Error ? error.message : 'Không thể cập nhật sản phẩm. Vui lòng thử lại.',
      );
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      // TODO: Implement delete product API
      // await productApi.deleteProduct(productId);
      setProducts(products.filter(product => product.id !== productId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      draft: 'bg-yellow-100 text-yellow-800',
      out_of_stock: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      active: 'hoạt động',
      inactive: 'không hoạt động',
    };
    return labels[status] || status;
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Đang tải sản phẩm...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Quản lý sản phẩm</h1>
        <p className="text-slate-500">Quản lý sản phẩm, danh mục và kho hàng.</p>
        {isFetching && <p className="mt-2 text-sm text-slate-400">Đang cập nhật sản phẩm...</p>}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <GlassCard hover className="p-6 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Tổng sản phẩm</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-[#7C3AED]/10 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-[#7C3AED]" />
            </div>
          </div>
        </GlassCard>

        <GlassCard hover className="p-6 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Sản phẩm đang hoạt động</p>
              <p className="text-2xl font-bold mt-1">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </GlassCard>

        <GlassCard hover className="p-6 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Sắp hết hàng</p>
              <p className="text-2xl font-bold mt-1">{stats.lowStock}</p>
            </div>
            <div className="w-12 h-12 bg-[#F97316]/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#F97316]" />
            </div>
          </div>
        </GlassCard>

        <GlassCard hover className="p-6 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Hết hàng</p>
              <p className="text-2xl font-bold mt-1">{stats.outOfStock}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Controls */}
      <GlassCard className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-[#7C3AED] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                title="Grid View"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-[#7C3AED] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                title="List View"
              >
                <LayoutList className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2.5 border rounded-lg transition-all cursor-pointer ${
                showFilters
                  ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Bộ lọc</span>
            </button>
            <button
              type="button"
              disabled
              title="Tính năng thêm sản phẩm chưa khả dụng."
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-300 text-slate-500 rounded-lg cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm sản phẩm</span>
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">Danh mục</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all cursor-pointer"
              >
                <option value="">Tất cả danh mục</option>
                <option value="1">Áo</option>
                <option value="2">Quần</option>
                <option value="3">Giày</option>
                <option value="4">Túi sách</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">Thương hiệu</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all cursor-pointer"
              >
                <option value="">Tất cả thương hiệu</option>
                <option value="1">Nike</option>
                <option value="2">Adidas</option>
                <option value="3">Puma</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">Trạng thái</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all cursor-pointer"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Không hoạt động</option>
                <option value="draft">Bản nháp</option>
              </select>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Products Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const statusLabel = product.is_active ? 'active' : 'inactive';
            const showComparePrice = typeof product.compare_at_price === 'number' && product.compare_at_price > product.base_price;
            const stockStatus = (product.stock_quantity || 0) === 0 ? 'out' : (product.stock_quantity || 0) < 10 ? 'low' : 'normal';

            return (
              <GlassCard key={product.id} hover className="overflow-hidden group cursor-pointer">
                {/* Product Image */}
                <div className="relative">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0].image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <Package className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getStatusColor(statusLabel)}`}>
                      {getStatusLabel(statusLabel)}
                    </span>
                    {stockStatus !== 'normal' && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                        stockStatus === 'out' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {stockStatus === 'out' ? 'Hết hàng' : 'Sắp hết hàng'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="mb-2">
                    <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-[#7C3AED] transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">SKU: {product.sku}</p>
                  </div>
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">{product.description}</p>

                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span className="bg-slate-100 px-2 py-1 rounded">{product.category?.name}</span>
                    <span>Tồn kho: {product.stock_quantity || 0}</span>
                  </div>

                  <div className="mb-4">
                    <p className="text-xl font-bold text-[#7C3AED]">
                      {formatPrice(product.base_price)}
                    </p>
                    {showComparePrice && (
                      <p className="text-sm text-slate-500 line-through">
                        {formatPrice(product.compare_at_price as number)}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#7366ff] text-white rounded-lg hover:bg-[#5d54cc] transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-sm">Chỉnh sửa</span>
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(product.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm">Xóa</span>
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {products.map((product) => {
            const statusLabel = product.is_active ? 'active' : 'inactive';
            const showComparePrice = typeof product.compare_at_price === 'number' && product.compare_at_price > product.base_price;

            return (
              <GlassCard key={product.id} hover className="p-6 cursor-pointer">
                <div className="flex items-center gap-6">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].image_url}
                        alt={product.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900">{product.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">SKU: {product.sku}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(statusLabel)}`}>
                        {getStatusLabel(statusLabel)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="bg-slate-100 px-3 py-1 rounded">{product.category?.name}</span>
                      <span>Tồn kho: {product.stock_quantity || 0}</span>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex-shrink-0 text-right">
                    <div className="mb-4">
                      <p className="text-2xl font-bold text-[#7C3AED]">
                        {formatPrice(product.base_price)}
                      </p>
                      {showComparePrice && (
                        <p className="text-sm text-slate-500 line-through">
                          {formatPrice(product.compare_at_price as number)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#7366ff] text-white rounded-lg hover:bg-[#5d54cc] transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-sm">Chỉnh sửa</span>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(product.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Xóa</span>
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* No Products */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Không tìm thấy sản phẩm</h3>
          <p className="text-slate-500">Không có sản phẩm nào phù hợp với tiêu chí tìm kiếm.</p>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-8">
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={stats.total}
          pageSize={viewMode === 'grid' ? 12 : 10}
          itemLabel="products"
          onPageChange={setCurrentPage}
          isFetching={isFetching}
          variant="standalone"
        />
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="glass-card max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 backdrop-blur-sm">
            <h3 className="mb-4 text-xl font-bold">Chỉnh sửa sản phẩm</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Tên sản phẩm</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm((current) => ({ ...current, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">SKU</label>
                <input
                  type="text"
                  value={productForm.sku}
                  onChange={(e) => setProductForm((current) => ({ ...current, sku: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Slug</label>
                <input
                  type="text"
                  value={productForm.slug}
                  onChange={(e) => setProductForm((current) => ({ ...current, slug: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Danh mục</label>
                <select
                  value={productForm.category_id}
                  onChange={(e) =>
                    setProductForm((current) => ({
                      ...current,
                      category_id: e.target.value ? Number(e.target.value) : '',
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Thương hiệu</label>
                <select
                  value={productForm.brand_id}
                  onChange={(e) =>
                    setProductForm((current) => ({
                      ...current,
                      brand_id: e.target.value ? Number(e.target.value) : '',
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                >
                  <option value="">Không có thương hiệu</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Giá bán</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.base_price}
                  onChange={(e) => setProductForm((current) => ({ ...current, base_price: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Giá so sánh</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.compare_at_price}
                  onChange={(e) =>
                    setProductForm((current) => ({ ...current, compare_at_price: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Giá vốn</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.cost_price}
                  onChange={(e) => setProductForm((current) => ({ ...current, cost_price: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Cân nặng (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={productForm.weight_kg}
                  onChange={(e) => setProductForm((current) => ({ ...current, weight_kg: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                />
              </div>
              <div className="flex items-center gap-6 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={productForm.is_active}
                    onChange={(e) =>
                      setProductForm((current) => ({ ...current, is_active: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-[#7366ff] focus:ring-[#7366ff]"
                  />
                  Đang hoạt động
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={productForm.is_featured}
                    onChange={(e) =>
                      setProductForm((current) => ({ ...current, is_featured: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-[#7366ff] focus:ring-[#7366ff]"
                  />
                  Nổi bật
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">Mô tả ngắn</label>
                <textarea
                  rows={2}
                  value={productForm.short_description}
                  onChange={(e) =>
                    setProductForm((current) => ({ ...current, short_description: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">Mô tả sản phẩm</label>
                <textarea
                  rows={5}
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm((current) => ({ ...current, description: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                />
              </div>
            </div>

            {productModalError && (
              <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {productModalError}
              </p>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeEditModal}
                className="rounded border border-slate-200 bg-white px-4 py-2 text-slate-700 transition-colors hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateProduct}
                disabled={isSavingProduct}
                className="rounded bg-[#7366ff] px-4 py-2 text-white transition-colors hover:bg-[#5d54cc] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingProduct ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card backdrop-blur-sm bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-red-500">Xóa sản phẩm</h3>
            <p className="text-slate-500 mb-6">
              Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteProduct(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
