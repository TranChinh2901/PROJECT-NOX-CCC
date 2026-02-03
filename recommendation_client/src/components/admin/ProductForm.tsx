'use client';

import { useState, useEffect } from 'react';
import { Product, Category, Brand } from '@/types';
import { Plus, Minus, X } from 'lucide-react';

interface ProductVariantInput {
  id?: number;
  size?: string;
  color?: string;
  sku?: string;
  price?: number;
  stock?: number;
  images?: string[];
}

interface ProductFormData {
  name: string;
  description: string;
  category_id?: number;
  brand_id?: number;
  price: number;
  discount_price?: number;
  sku: string;
  status: 'active' | 'inactive' | 'draft';
  variants: ProductVariantInput[];
  images: File[];
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
}

export default function ProductForm({
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = 'Save Product',
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData.name || '',
    description: initialData.description || '',
    category_id: initialData.category_id,
    brand_id: initialData.brand_id,
    price: initialData.price || 0,
    discount_price: initialData.discount_price,
    sku: initialData.sku || '',
    status: initialData.status as 'active' | 'inactive' | 'draft' || 'draft',
    variants: initialData.variants || [
      {
        size: '',
        color: '',
        sku: '',
        price: 0,
        stock: 0,
        images: [],
      },
    ],
    images: initialData.images as File[] || [],
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    // Fetch categories and brands
    // TODO: Implement when API is ready
    // categoryApi.getAllCategories().then(setCategories);
    // brandApi.getAllBrands().then(setBrands);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData({ ...formData, images: files });

    // Create previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });

    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(newPreviews);
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, {
        size: '',
        color: '',
        sku: '',
        price: 0,
        stock: 0,
        images: [],
      }],
    });
  };

  const removeVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    });
  };

  const updateVariant = (index: number, field: keyof ProductVariantInput, value: any) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="glass-card backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Product Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">SKU *</label>
            <input
              type="text"
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="glass-card backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Regular Price *</label>
            <input
              type="number"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Discount Price</label>
            <input
              type="number"
              value={formData.discount_price || ''}
              onChange={(e) => setFormData({ ...formData, discount_price: parseFloat(e.target.value) || undefined })}
              className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Categorization */}
      <div className="glass-card backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Categorization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={formData.category_id || ''}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Brand</label>
            <select
              value={formData.brand_id || ''}
              onChange={(e) => setFormData({ ...formData, brand_id: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
            >
              <option value="">Select Brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Product Status */}
      <div className="glass-card backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Product Status</h3>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'draft' })}
          className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Variants */}
      <div className="glass-card backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Product Variants</h3>
          <button
            type="button"
            onClick={addVariant}
            className="flex items-center space-x-2 px-4 py-2 bg-[#7366ff] text-white rounded-lg hover:bg-[#5d54cc] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Variant</span>
          </button>
        </div>

        {formData.variants.map((variant, index) => (
          <div key={index} className="glass-card backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Variant {index + 1}</h4>
              {formData.variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Size</label>
                <input
                  type="text"
                  value={variant.size || ''}
                  onChange={(e) => updateVariant(index, 'size', e.target.value)}
                  placeholder="e.g., S, M, L, XL"
                  className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <input
                  type="text"
                  value={variant.color || ''}
                  onChange={(e) => updateVariant(index, 'color', e.target.value)}
                  placeholder="e.g., Red, Blue, Black"
                  className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">SKU</label>
                <input
                  type="text"
                  value={variant.sku || ''}
                  onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                  placeholder="Variant SKU"
                  className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Stock</label>
                <input
                  type="number"
                  value={variant.stock || 0}
                  onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Images */}
      <div className="glass-card backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Product Images</h3>
        <div className="mb-4">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="product-images"
          />
          <label
            htmlFor="product-images"
            className="inline-block px-4 py-2 bg-[#7366ff] text-white rounded-lg hover:bg-[#5d54cc] transition-colors cursor-pointer"
          >
            Upload Images
          </label>
        </div>

        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-[#292524] text-[#FAFAF9] rounded-lg hover:bg-[#44403C] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-[#7366ff] text-white rounded-lg hover:bg-[#5d54cc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}