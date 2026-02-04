'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Plus, Edit, Trash2, SlidersHorizontal, ChevronLeft, ChevronRight, Package, TrendingUp, AlertCircle, CheckCircle, Grid3x3, LayoutList } from 'lucide-react';
import { Product } from '@/types';
import { productApi } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';

interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
  page?: number;
  limit?: number;
}

type ViewMode = 'grid' | 'list';

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const filters: ProductFilters = {
        search: searchTerm,
        page: currentPage,
        limit: viewMode === 'grid' ? 12 : 10,
      };

      const response = await productApi.getAllProducts(filters);
      setProducts(response.data);
      setTotalPages(Math.ceil(response.total / response.limit));

      // Calculate stats
      setStats({
        total: response.total,
        active: response.data.filter((p: Product) => p.is_active).length,
        lowStock: response.data.filter((p: Product) => (p.stock_quantity || 0) < 10 && (p.stock_quantity || 0) > 0).length,
        outOfStock: response.data.filter((p: Product) => (p.stock_quantity || 0) === 0).length,
      });
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage, viewMode]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, selectedCategory, selectedBrand, selectedStatus]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Product Management</h1>
        <p className="text-slate-500">Manage products, categories, and inventory.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <GlassCard hover className="p-6 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Products</p>
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
              <p className="text-sm text-slate-500">Active Products</p>
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
              <p className="text-sm text-slate-500">Low Stock</p>
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
              <p className="text-sm text-slate-500">Out of Stock</p>
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
                placeholder="Search products..."
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
              <span>Filters</span>
            </button>
            <Link
              href="/admin/products/create"
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#7C3AED] text-white rounded-lg hover:bg-[#6D28D9] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </Link>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="1">Áo</option>
                <option value="2">Quần</option>
                <option value="3">Giày</option>
                <option value="4">Túi sách</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">Brand</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all cursor-pointer"
              >
                <option value="">All Brands</option>
                <option value="1">Nike</option>
                <option value="2">Adidas</option>
                <option value="3">Puma</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
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
                      {statusLabel}
                    </span>
                    {stockStatus !== 'normal' && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                        stockStatus === 'out' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {stockStatus === 'out' ? 'Out of stock' : 'Low stock'}
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
                    <span>Stock: {product.stock_quantity || 0}</span>
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
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-[#6D28D9] transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-sm">Edit</span>
                    </Link>
                    <button
                      onClick={() => setShowDeleteConfirm(product.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm">Delete</span>
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
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="bg-slate-100 px-3 py-1 rounded">{product.category?.name}</span>
                      <span>Stock: {(product as any).stock_quantity || 0}</span>
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
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-[#6D28D9] transition-colors cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-sm">Edit</span>
                      </Link>
                      <button
                        onClick={() => setShowDeleteConfirm(product.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Delete</span>
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
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-slate-500">No products match your search criteria.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white text-slate-700 border border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 bg-white text-slate-700 border border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card backdrop-blur-sm bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-red-500">Delete Product</h3>
            <p className="text-slate-500 mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
