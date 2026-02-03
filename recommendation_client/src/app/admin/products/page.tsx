'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Edit, Trash2, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/types';
import { productApi } from '@/lib/api';

interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
  page?: number;
  limit?: number;
}

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

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategory, selectedBrand, selectedStatus, currentPage]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const filters: ProductFilters = {
        search: searchTerm,
        page: currentPage,
        limit: 10,
      };

      const response = await productApi.getAllProducts(filters);
      setProducts(response.data);
      setTotalPages(Math.ceil(response.total / response.limit));
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#FAFAF9]">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#FAFAF9]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Product Management</h1>
        <p className="text-[#A1A1AA]">Manage products, categories, and inventory.</p>
      </div>

      {/* Controls */}
      <div className="glass-card backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#A1A1AA] w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg hover:bg-[#44403C] transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>
            <Link
              href="/admin/products/create"
              className="flex items-center space-x-2 px-4 py-2 bg-[#7366ff] text-white rounded-lg hover:bg-[#5d54cc] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </Link>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="1">Áo</option>
                <option value="2">Quần</option>
                <option value="3">Giày</option>
                <option value="4">Túi sách</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Brand</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
              >
                <option value="">All Brands</option>
                <option value="1">Nike</option>
                <option value="2">Adidas</option>
                <option value="3">Puma</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="glass-card backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-colors">
            {/* Product Image */}
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0].image_url}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-[#292524] flex items-center justify-center">
                <Package className="w-12 h-12 text-[#A1A1AA]" />
              </div>
            )}

            {/* Product Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                  {product.status}
                </span>
              </div>
              <p className="text-sm text-[#A1A1AA] mb-2 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between text-sm text-[#A1A1AA] mb-3">
                <span>{product.category?.name}</span>
                <span>SKU: {product.sku}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xl font-bold text-[#FAFAF9]">
                    {formatPrice(product.price)}
                  </p>
                  {product.discount_price && (
                    <p className="text-sm text-[#A1A1AA] line-through">
                      {formatPrice(product.discount_price)}
                    </p>
                  )}
                </div>
                <span className="text-sm text-[#A1A1AA]">
                  {product.stock} in stock
                </span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-[#7366ff] text-white rounded hover:bg-[#5d54cc] transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm">Edit</span>
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(product.id)}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Products */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-[#A1A1AA] mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-[#A1A1AA]">No products match your search criteria.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded hover:bg-[#44403C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-[#A1A1AA]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded hover:bg-[#44403C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-red-500">Delete Product</h3>
            <p className="text-[#A1A1AA] mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-[#292524] text-[#FAFAF9] rounded hover:bg-[#44403C] transition-colors"
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