'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, FolderTree, Package, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { adminApi } from '@/lib/api/admin.api';

interface Category {
  id: number;
  name: string;
  description?: string;
  slug?: string;
  parent_id?: number | null;
  products_count?: number;
  created_at: string;
  updated_at: string;
}

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllCategories().catch(() => generateMockCategories());
      setCategories(response);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories(generateMockCategories());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const generateMockCategories = (): Category[] => [
    { id: 1, name: 'Áo', description: 'Các loại áo thời trang', products_count: 245, created_at: '2024-01-15', updated_at: '2024-02-01' },
    { id: 2, name: 'Quần', description: 'Các loại quần thời trang', products_count: 189, created_at: '2024-01-15', updated_at: '2024-02-01' },
    { id: 3, name: 'Giày', description: 'Giày dép các loại', products_count: 156, created_at: '2024-01-15', updated_at: '2024-02-01' },
    { id: 4, name: 'Túi xách', description: 'Túi xách và phụ kiện', products_count: 98, created_at: '2024-01-15', updated_at: '2024-02-01' },
    { id: 5, name: 'Phụ kiện', description: 'Mũ, kính, thắt lưng và các phụ kiện khác', products_count: 124, created_at: '2024-01-15', updated_at: '2024-02-01' },
    { id: 6, name: 'Đồ thể thao', description: 'Quần áo và phụ kiện thể thao', products_count: 84, created_at: '2024-01-20', updated_at: '2024-02-01' },
  ];

  const handleCreateCategory = async () => {
    if (!formData.name.trim()) return;

    try {
      setSaving(true);
      const newCategory = await adminApi.createCategory(formData).catch(() => ({
        id: Date.now(),
        name: formData.name,
        description: formData.description,
        products_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      setCategories([...categories, newCategory]);
      setFormData({ name: '', description: '' });
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !formData.name.trim()) return;

    try {
      setSaving(true);
      const updatedCategory = await adminApi.updateCategory(editingCategory.id, formData).catch(() => ({
        ...editingCategory,
        ...formData,
        updated_at: new Date().toISOString(),
      }));

      setCategories(categories.map(cat =>
        cat.id === editingCategory.id ? updatedCategory : cat
      ));
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Failed to update category:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      await adminApi.deleteCategory(categoryId).catch(() => {});
      setCategories(categories.filter(cat => cat.id !== categoryId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || '' });
  };

  const closeModal = () => {
    setEditingCategory(null);
    setIsCreating(false);
    setFormData({ name: '', description: '' });
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProducts = categories.reduce((sum, cat) => sum + (cat.products_count || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Categories Management</h1>
        <p className="text-slate-500">Organize products by categories for better navigation.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GlassCard hover className="p-6 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Categories</p>
              <p className="text-2xl font-bold mt-1">{categories.length}</p>
            </div>
            <div className="w-12 h-12 bg-[#7C3AED]/10 rounded-lg flex items-center justify-center">
              <FolderTree className="w-6 h-6 text-[#7C3AED]" />
            </div>
          </div>
        </GlassCard>

        <GlassCard hover className="p-6 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Products</p>
              <p className="text-2xl font-bold mt-1">{totalProducts}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </GlassCard>

        <GlassCard hover className="p-6 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Avg Products/Category</p>
              <p className="text-2xl font-bold mt-1">
                {categories.length > 0 ? Math.round(totalProducts / categories.length) : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <ChevronRight className="w-6 h-6 text-green-500" />
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
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all"
              />
            </div>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#7C3AED] text-white rounded-lg hover:bg-[#6D28D9] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </GlassCard>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <GlassCard key={category.id} hover className="p-6 cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-[#7C3AED]/10 rounded-lg flex items-center justify-center">
                <FolderTree className="w-6 h-6 text-[#7C3AED]" />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditModal(category)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(category.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-[#7C3AED] transition-colors">
              {category.name}
            </h3>
            <p className="text-sm text-slate-600 mb-4 line-clamp-2">
              {category.description || 'No description'}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">
                {category.products_count || 0} products
              </span>
              <span className="text-xs text-slate-400">
                ID: {category.id}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <FolderTree className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No categories found</h3>
          <p className="text-slate-500 mb-4">
            {searchTerm ? 'Try adjusting your search.' : 'Get started by creating your first category.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-[#6D28D9] transition-colors"
            >
              Create Category
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isCreating || editingCategory) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <GlassCard className="p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              {isCreating ? 'Create Category' : 'Edit Category'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter category name"
                  className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter category description"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={isCreating ? handleCreateCategory : handleUpdateCategory}
                disabled={saving || !formData.name.trim()}
                className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-[#6D28D9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : isCreating ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <GlassCard className="p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-red-500">Delete Category</h3>
            <p className="text-slate-500 mb-6">
              Are you sure you want to delete this category? Products in this category will become uncategorized.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCategory(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
