'use client';

import Image from 'next/image';
import { memo, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Search, Plus, Edit, Trash2, SlidersHorizontal, Package, TrendingUp, AlertCircle, CheckCircle, Grid3x3, LayoutList, ImagePlus, Star, LoaderCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Brand, Category, Product, ProductImage, ProductVariant } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { adminApi } from '@/lib/api/admin.api';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatPrice } from '@/lib/utils';

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

interface VariantEditForm {
  sku: string;
  size: string;
  color: string;
  color_code: string;
  material: string;
  price_adjustment: string;
  weight_kg: string;
  barcode: string;
  is_active: boolean;
  sort_order: string;
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

const emptyVariantForm: VariantEditForm = {
  sku: '',
  size: '',
  color: '',
  color_code: '',
  material: '',
  price_adjustment: '0',
  weight_kg: '',
  barcode: '',
  is_active: true,
  sort_order: '0',
};

const toOptionalNumber = (value: string): number | null =>
  value.trim() === '' ? null : Number(value);

const toOptionalString = (value: string): string | null =>
  value.trim() === '' ? null : value.trim();

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Không hoạt động' },
] as const;

const SEARCH_DEBOUNCE_MS = 250;

const productCardViewportStyle: CSSProperties = {
  contentVisibility: 'auto',
  containIntrinsicSize: '360px 420px',
};

const PRODUCT_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  draft: 'bg-yellow-100 text-yellow-800',
  out_of_stock: 'bg-red-100 text-red-800',
};

const PRODUCT_STATUS_LABELS: Record<string, string> = {
  active: 'hoạt động',
  inactive: 'không hoạt động',
};

const getProductStatusColor = (status: string) =>
  PRODUCT_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

const getProductStatusLabel = (status: string) =>
  PRODUCT_STATUS_LABELS[status] || status;

type ProductCardActionProps = {
  onOpenEdit: (product: Product) => void;
  onRequestDelete: (productId: number) => void;
  isOpeningEditor: boolean;
};

const ProductGridCard = memo(function ProductGridCard({
  product,
  onOpenEdit,
  onRequestDelete,
  isOpeningEditor,
}: { product: Product } & ProductCardActionProps) {
  const statusLabel = product.is_active ? 'active' : 'inactive';
  const showComparePrice =
    typeof product.compare_at_price === 'number' && product.compare_at_price > product.base_price;
  const stockStatus =
    (product.stock_quantity || 0) === 0 ? 'out' : (product.stock_quantity || 0) < 10 ? 'low' : 'normal';
  const primaryImageUrl = product.primary_image;
  const imageCount = product.image_count ?? 0;

  return (
    <GlassCard
      hover
      style={productCardViewportStyle}
      className="overflow-hidden group cursor-pointer"
    >
      <div className="relative overflow-hidden border-b border-slate-100 bg-slate-50/80">
        <div className="relative aspect-[4/3] w-full">
          {primaryImageUrl ? (
            <Image
              src={primaryImageUrl}
              alt={product.name}
              fill
              sizes="(min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-contain p-3"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 text-center">
              <Package className="h-12 w-12 text-slate-400" />
              <span className="text-xs font-medium text-slate-500">Chưa có ảnh</span>
            </div>
          )}
        </div>
        <div className="absolute top-2 right-2 flex gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProductStatusColor(statusLabel)}`}>
            {getProductStatusLabel(statusLabel)}
          </span>
          {stockStatus !== 'normal' && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                stockStatus === 'out' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
              }`}
            >
              {stockStatus === 'out' ? 'Hết hàng' : 'Sắp hết hàng'}
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm">
            {primaryImageUrl ? 'Ảnh chính' : 'Ảnh sản phẩm'}
          </span>
          {imageCount > 1 && (
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm">
              +{imageCount - 1} ảnh
            </span>
          )}
        </div>
      </div>

      <div className="p-3">
        <div className="mb-1.5">
          <h3 className="font-semibold text-sm text-slate-900 line-clamp-1">{product.name}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">SKU: {product.sku}</p>
        </div>
        <p className="text-xs text-slate-600 mb-2 line-clamp-2 leading-tight min-h-[2.5rem]">{product.description}</p>

        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
          <span className="bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[60%]">{product.category?.name}</span>
          <span>Tồn kho: {product.stock_quantity || 0}</span>
        </div>

        <div className="mb-3">
          <p className="text-base font-bold text-[#7C3AED]">{formatPrice(product.base_price)}</p>
          {showComparePrice && (
            <p className="text-xs text-slate-500 line-through">
              {formatPrice(product.compare_at_price as number)}
            </p>
          )}
        </div>

        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => onOpenEdit(product)}
            disabled={isOpeningEditor}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#7366ff] text-white rounded-lg hover:bg-[#5d54cc] transition-colors cursor-pointer disabled:cursor-wait disabled:bg-[#8f85ff]"
          >
            {isOpeningEditor ? (
              <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Edit className="w-3.5 h-3.5" />
            )}
            <span className="text-xs font-medium">{isOpeningEditor ? 'Đang mở' : 'Sửa'}</span>
          </button>
          <button
            onClick={() => onRequestDelete(product.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Xóa</span>
          </button>
        </div>
      </div>
    </GlassCard>
  );
});

const ProductListRow = memo(function ProductListRow({
  product,
  onOpenEdit,
  onRequestDelete,
  isOpeningEditor,
}: { product: Product } & ProductCardActionProps) {
  const statusLabel = product.is_active ? 'active' : 'inactive';
  const showComparePrice =
    typeof product.compare_at_price === 'number' && product.compare_at_price > product.base_price;
  const primaryImageUrl = product.primary_image;
  const imageCount = product.image_count ?? 0;

  return (
    <GlassCard
      hover
      style={productCardViewportStyle}
      className="p-6 cursor-pointer"
    >
      <div className="flex items-center gap-6">
        <div className="flex-shrink-0">
          {primaryImageUrl ? (
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
              <div className="relative h-20 w-20">
                <Image
                  src={primaryImageUrl}
                  alt={product.name}
                  fill
                  sizes="80px"
                  className="object-contain"
                />
              </div>
              {imageCount > 1 && (
                <span className="absolute bottom-1 right-1 rounded-full bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  +{imageCount - 1}
                </span>
              )}
            </div>
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg text-slate-900">{product.name}</h3>
              <p className="text-sm text-slate-500 mt-1">SKU: {product.sku}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getProductStatusColor(statusLabel)}`}>
              {getProductStatusLabel(statusLabel)}
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{product.description}</p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="bg-slate-100 px-3 py-1 rounded">{product.category?.name}</span>
            <span>Tồn kho: {product.stock_quantity || 0}</span>
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          <div className="mb-4">
            <p className="text-2xl font-bold text-[#7C3AED]">{formatPrice(product.base_price)}</p>
            {showComparePrice && (
              <p className="text-sm text-slate-500 line-through">
                {formatPrice(product.compare_at_price as number)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onOpenEdit(product)}
              disabled={isOpeningEditor}
              className="flex items-center gap-2 px-4 py-2 bg-[#7366ff] text-white rounded-lg hover:bg-[#5d54cc] transition-colors disabled:cursor-wait disabled:bg-[#8f85ff]"
            >
              {isOpeningEditor ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : (
                <Edit className="w-4 h-4" />
              )}
              <span className="text-sm">{isOpeningEditor ? 'Đang mở...' : 'Chỉnh sửa'}</span>
            </button>
            <button
              onClick={() => onRequestDelete(product.id)}
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
});

const sortProductImages = (images: ProductImage[] = []): ProductImage[] =>
  [...images].sort((firstImage, secondImage) => {
    if (firstImage.is_primary !== secondImage.is_primary) {
      return Number(secondImage.is_primary) - Number(firstImage.is_primary);
    }

    if (firstImage.sort_order !== secondImage.sort_order) {
      return firstImage.sort_order - secondImage.sort_order;
    }

    return firstImage.id - secondImage.id;
  });

const getVariantFormLabel = (variantForm: VariantEditForm) => {
  const parts = [variantForm.size, variantForm.color, variantForm.material]
    .map((value) => value.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(' • ') : variantForm.sku.trim() || 'Phiên bản';
};

const mapVariantToForm = (variant: ProductVariant): VariantEditForm => ({
  sku: variant.sku ?? '',
  size: variant.size ?? '',
  color: variant.color ?? '',
  color_code: variant.color_code ?? '',
  material: variant.material ?? '',
  price_adjustment: String(variant.price_adjustment ?? 0),
  weight_kg: variant.weight_kg === undefined || variant.weight_kg === null ? '' : String(variant.weight_kg),
  barcode: variant.barcode ?? '',
  is_active: Boolean(variant.is_active),
  sort_order: String(variant.sort_order ?? 0),
});

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
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductEditForm>(emptyProductForm);
  const [variantForms, setVariantForms] = useState<Record<number, VariantEditForm>>({});
  const [newVariantForm, setNewVariantForm] = useState<VariantEditForm>(emptyVariantForm);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [openingProductId, setOpeningProductId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isCreatingVariant, setIsCreatingVariant] = useState(false);
  const [savingVariantId, setSavingVariantId] = useState<number | null>(null);
  const [deletingVariantId, setDeletingVariantId] = useState<number | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isDeletingImageId, setIsDeletingImageId] = useState<number | null>(null);
  const [productModalError, setProductModalError] = useState('');
  const [productImageActionError, setProductImageActionError] = useState('');
  const [variantErrors, setVariantErrors] = useState<Record<number, string>>({});
  const [newVariantError, setNewVariantError] = useState('');
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [deleteProductError, setDeleteProductError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    lowStock: 0,
    outOfStock: 0,
  });
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const primaryImageInputRef = useRef<HTMLInputElement | null>(null);

  useBodyScrollLock(Boolean(editingProduct || isCreateMode || showDeleteConfirm));

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedCategory, selectedBrand, selectedStatus, viewMode]);

  useEffect(() => {
    const nextSearchTerm = searchTerm.trim();
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(nextSearchTerm);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsFetching(true);
        const response = await adminApi.getAllProducts({
          search: debouncedSearchTerm || undefined,
          category_id: selectedCategory ? Number(selectedCategory) : undefined,
          brand_id: selectedBrand ? Number(selectedBrand) : undefined,
          is_active:
            selectedStatus === ''
              ? undefined
              : selectedStatus === 'active',
          page: currentPage,
          limit: viewMode === 'grid' ? 24 : 10,
        });
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
  }, [currentPage, debouncedSearchTerm, selectedCategory, selectedBrand, selectedStatus, viewMode]);

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

  const initializeEditModal = useCallback((product: Product) => {
    const sortedImages = sortProductImages(product.images ?? []);
    setEditingProduct(product);
    setProductForm(mapProductToForm(product));
    setVariantForms(
      Object.fromEntries((product.variants ?? []).map((variant) => [variant.id, mapVariantToForm(variant)])),
    );
    setNewVariantForm({
      ...emptyVariantForm,
      sort_order: String(product.variants?.length ?? 0),
    });
    setProductImages(sortedImages);
    setSelectedImageId(sortedImages[0]?.id ?? null);
    setProductModalError('');
    setProductImageActionError('');
    setVariantErrors({});
    setNewVariantError('');
    setIsCreatingVariant(false);
  }, []);

  const openEditModal = useCallback(async (productSummary: Product) => {
    try {
      setOpeningProductId(productSummary.id);
      const product = await adminApi.getProductById(productSummary.id);
      initializeEditModal(product);
    } catch (error) {
      console.error('Failed to load full product details:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Không thể tải thông tin sản phẩm. Vui lòng thử lại.',
      );
    } finally {
      setOpeningProductId(null);
    }
  }, [initializeEditModal]);

  const openCreateModal = useCallback(() => {
    setIsCreateMode(true);
    setEditingProduct(null);
    setProductForm({
      ...emptyProductForm,
      is_active: true,
    });
    setVariantForms({});
    setNewVariantForm(emptyVariantForm);
    setProductImages([]);
    setSelectedImageId(null);
    setProductModalError('');
    setProductImageActionError('');
    setVariantErrors({});
    setNewVariantError('');
    setIsCreatingVariant(false);
    setSavingVariantId(null);
    setDeletingVariantId(null);
  }, []);

  const requestDeleteProduct = useCallback((productId: number) => {
    setDeleteProductError('');
    setShowDeleteConfirm(productId);
  }, []);

  const closeEditModal = () => {
    if (
      isSavingProduct ||
      isCreatingVariant ||
      savingVariantId !== null ||
      deletingVariantId !== null ||
      isUploadingImages ||
      isDeletingImageId !== null
    ) return;
    setIsCreateMode(false);
    setEditingProduct(null);
    setProductForm(emptyProductForm);
    setVariantForms({});
    setNewVariantForm(emptyVariantForm);
    setProductImages([]);
    setSelectedImageId(null);
    setProductModalError('');
    setProductImageActionError('');
    setVariantErrors({});
    setNewVariantError('');
    setIsCreatingVariant(false);
    setSavingVariantId(null);
    setDeletingVariantId(null);
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
    if (primaryImageInputRef.current) {
      primaryImageInputRef.current.value = '';
    }
  };

  const recalculateStats = (nextProducts: Product[]) => {
    setStats((currentStats) => ({
      ...currentStats,
      active: nextProducts.filter((p) => p.is_active).length,
      lowStock: nextProducts.filter((p) => (p.stock_quantity || 0) < 10 && (p.stock_quantity || 0) > 0).length,
      outOfStock: nextProducts.filter((p) => (p.stock_quantity || 0) === 0).length,
    }));
  };

  const handleSaveProduct = async () => {
    const isCreatingProduct = !editingProduct;

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

      if (isCreatingProduct) {
        const createdProduct = await adminApi.createProduct({
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
          const nextProducts = [createdProduct, ...currentProducts];
          recalculateStats(nextProducts);
          return nextProducts;
        });
        setStats((currentStats) => ({
          ...currentStats,
          total: currentStats.total + 1,
        }));
      } else {
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
      }

      setIsCreateMode(false);
      setEditingProduct(null);
      setProductForm(emptyProductForm);
      setProductImages([]);
      setSelectedImageId(null);
      setVariantForms({});
      setNewVariantForm(emptyVariantForm);
      setProductModalError('');

      toast.success(isCreatingProduct ? 'Thêm sản phẩm thành công.' : 'Cập nhật sản phẩm thành công.');
    } catch (error) {
      console.error('Failed to save product:', error);
      setProductModalError(
        error instanceof Error
          ? error.message
          : isCreatingProduct
            ? 'Không thể thêm sản phẩm. Vui lòng thử lại.'
            : 'Không thể cập nhật sản phẩm. Vui lòng thử lại.',
      );
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      setIsDeletingProduct(true);
      setDeleteProductError('');
      await adminApi.deleteProduct(productId);
      setProducts((currentProducts) => {
        const nextProducts = currentProducts.filter((product) => product.id !== productId);
        recalculateStats(nextProducts);
        return nextProducts;
      });
      setStats((currentStats) => ({
        ...currentStats,
        total: Math.max(currentStats.total - 1, 0),
      }));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete product:', error);
      setDeleteProductError(
        error instanceof Error ? error.message : 'Không thể xóa sản phẩm. Vui lòng thử lại.',
      );
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const syncProductImages = (productId: number, nextImages: ProductImage[]) => {
    const sortedImages = sortProductImages(nextImages);
    setProductImages(sortedImages);
    setSelectedImageId((currentImageId) => {
      if (currentImageId && sortedImages.some((image) => image.id === currentImageId)) {
        return currentImageId;
      }

      return sortedImages[0]?.id ?? null;
    });
    setEditingProduct((currentProduct) =>
      currentProduct?.id === productId
        ? {
            ...currentProduct,
            images: sortedImages,
          }
        : currentProduct,
    );
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              images: sortedImages,
            }
          : product,
      ),
    );
  };

  const syncProductVariant = (productId: number, nextVariant: ProductVariant) => {
    const updateVariants = (variants: ProductVariant[] = []) =>
      variants.map((variant) => (variant.id === nextVariant.id ? nextVariant : variant));

    setVariantForms((currentForms) => ({
      ...currentForms,
      [nextVariant.id]: mapVariantToForm(nextVariant),
    }));

    setEditingProduct((currentProduct) =>
      currentProduct?.id === productId
        ? {
            ...currentProduct,
            variants: updateVariants(currentProduct.variants ?? []),
          }
        : currentProduct,
    );

    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              variants: updateVariants(product.variants ?? []),
            }
          : product,
      ),
    );
  };

  const handleVariantFieldChange = (
    variantId: number,
    field: keyof VariantEditForm,
    value: string | boolean,
  ) => {
    setVariantForms((currentForms) => ({
      ...currentForms,
      [variantId]: {
        ...currentForms[variantId],
        [field]: value,
      },
    }));
    setVariantErrors((currentErrors) => ({
      ...currentErrors,
      [variantId]: '',
    }));
  };

  const validateVariantForm = (variantForm: VariantEditForm) => {
    if (!variantForm.sku.trim()) {
      return 'SKU phiên bản là bắt buộc.';
    }

    if (variantForm.color_code.trim() && !/^#(?:[0-9a-fA-F]{6})$/.test(variantForm.color_code.trim())) {
      return 'Mã màu phải theo định dạng #RRGGBB.';
    }

    if (variantForm.price_adjustment.trim() === '' || Number.isNaN(Number(variantForm.price_adjustment))) {
      return 'Điều chỉnh giá phải là một số hợp lệ.';
    }

    if (
      variantForm.sort_order.trim() === '' ||
      Number.isNaN(Number(variantForm.sort_order)) ||
      !Number.isInteger(Number(variantForm.sort_order))
    ) {
      return 'Thứ tự hiển thị phải là một số nguyên.';
    }

    return '';
  };

  const resetVariantForm = (variant: ProductVariant) => {
    setVariantForms((currentForms) => ({
      ...currentForms,
      [variant.id]: mapVariantToForm(variant),
    }));
    setVariantErrors((currentErrors) => ({
      ...currentErrors,
      [variant.id]: '',
    }));
  };

  const handleSaveVariant = async (variant: ProductVariant) => {
    if (!editingProduct) {
      return;
    }

    const variantForm = variantForms[variant.id];
    if (!variantForm) {
      return;
    }

    const validationError = validateVariantForm(variantForm);
    if (validationError) {
      setVariantErrors((currentErrors) => ({
        ...currentErrors,
        [variant.id]: validationError,
      }));
      return;
    }

    if (hasPendingBasePriceChange) {
      setVariantErrors((currentErrors) => ({
        ...currentErrors,
        [variant.id]: 'Hãy lưu giá cơ bản của sản phẩm trước khi cập nhật phiên bản.',
      }));
      return;
    }

    try {
      setSavingVariantId(variant.id);
      setVariantErrors((currentErrors) => ({
        ...currentErrors,
        [variant.id]: '',
      }));

      const updatedVariant = await adminApi.updateProductVariant(editingProduct.id, variant.id, {
        sku: variantForm.sku.trim(),
        size: toOptionalString(variantForm.size),
        color: toOptionalString(variantForm.color),
        color_code: toOptionalString(variantForm.color_code),
        material: toOptionalString(variantForm.material),
        price_adjustment: Number(variantForm.price_adjustment),
        weight_kg: toOptionalNumber(variantForm.weight_kg),
        barcode: toOptionalString(variantForm.barcode),
        is_active: variantForm.is_active,
        sort_order: Number(variantForm.sort_order),
      });

      syncProductVariant(editingProduct.id, updatedVariant);
    } catch (error) {
      console.error('Failed to update product variant:', error);
      setVariantErrors((currentErrors) => ({
        ...currentErrors,
        [variant.id]:
          error instanceof Error ? error.message : 'Không thể cập nhật phiên bản. Vui lòng thử lại.',
      }));
    } finally {
      setSavingVariantId(null);
    }
  };

  const handleCreateVariant = async () => {
    if (!editingProduct) {
      return;
    }

    const validationError = validateVariantForm(newVariantForm);
    if (validationError) {
      setNewVariantError(validationError);
      return;
    }

    if (hasPendingBasePriceChange) {
      setNewVariantError('Hãy lưu giá cơ bản của sản phẩm trước khi tạo phiên bản mới.');
      return;
    }

    try {
      setIsCreatingVariant(true);
      setNewVariantError('');

      const createdVariant = await adminApi.createProductVariant(editingProduct.id, {
        sku: newVariantForm.sku.trim(),
        size: toOptionalString(newVariantForm.size),
        color: toOptionalString(newVariantForm.color),
        color_code: toOptionalString(newVariantForm.color_code),
        material: toOptionalString(newVariantForm.material),
        price_adjustment: Number(newVariantForm.price_adjustment),
        weight_kg: toOptionalNumber(newVariantForm.weight_kg),
        barcode: toOptionalString(newVariantForm.barcode),
        is_active: newVariantForm.is_active,
        sort_order: Number(newVariantForm.sort_order),
      });

      setEditingProduct((currentProduct) =>
        currentProduct?.id === editingProduct.id
          ? {
              ...currentProduct,
              variants: [...(currentProduct.variants ?? []), createdVariant],
            }
          : currentProduct,
      );

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === editingProduct.id
            ? {
                ...product,
                variants: [...(product.variants ?? []), createdVariant],
              }
            : product,
        ),
      );

      setVariantForms((currentForms) => ({
        ...currentForms,
        [createdVariant.id]: mapVariantToForm(createdVariant),
      }));
      setNewVariantForm({
        ...emptyVariantForm,
        sort_order: String(Number(createdVariant.sort_order ?? 0) + 1),
      });
    } catch (error) {
      console.error('Failed to create product variant:', error);
      setNewVariantError(
        error instanceof Error ? error.message : 'Không thể tạo phiên bản. Vui lòng thử lại.',
      );
    } finally {
      setIsCreatingVariant(false);
    }
  };

  const handleDeleteVariant = async (variant: ProductVariant) => {
    if (!editingProduct) {
      return;
    }

    if (!window.confirm(`Xóa phiên bản "${getVariantFormLabel(variantForms[variant.id] ?? mapVariantToForm(variant))}"?`)) {
      return;
    }

    try {
      setDeletingVariantId(variant.id);
      setVariantErrors((currentErrors) => ({
        ...currentErrors,
        [variant.id]: '',
      }));

      await adminApi.deleteProductVariant(editingProduct.id, variant.id);

      setEditingProduct((currentProduct) =>
        currentProduct?.id === editingProduct.id
          ? {
              ...currentProduct,
              variants: (currentProduct.variants ?? []).filter((currentVariant) => currentVariant.id !== variant.id),
            }
          : currentProduct,
      );

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === editingProduct.id
            ? {
                ...product,
                variants: (product.variants ?? []).filter((currentVariant) => currentVariant.id !== variant.id),
              }
            : product,
        ),
      );

      setVariantForms((currentForms) => {
        const nextForms = { ...currentForms };
        delete nextForms[variant.id];
        return nextForms;
      });
      setVariantErrors((currentErrors) => {
        const nextErrors = { ...currentErrors };
        delete nextErrors[variant.id];
        return nextErrors;
      });
    } catch (error) {
      console.error('Failed to delete product variant:', error);
      setVariantErrors((currentErrors) => ({
        ...currentErrors,
        [variant.id]:
          error instanceof Error ? error.message : 'Không thể xóa phiên bản. Vui lòng thử lại.',
      }));
    } finally {
      setDeletingVariantId(null);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    options: { makePrimary: boolean },
  ) => {
    if (!editingProduct) {
      return;
    }

    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    const invalidFile = files.find((file) => !file.type.startsWith('image/'));
    if (invalidFile) {
      setProductImageActionError('Chỉ chấp nhận tệp hình ảnh.');
      event.target.value = '';
      return;
    }

    const oversizedFile = files.find((file) => file.size > 8 * 1024 * 1024);
    if (oversizedFile) {
      setProductImageActionError('Mỗi ảnh phải nhỏ hơn hoặc bằng 8MB.');
      event.target.value = '';
      return;
    }

    const shouldMakePrimary = options.makePrimary || productImages.length === 0;

    try {
      setIsUploadingImages(true);
      setProductImageActionError('');

      const uploadedImages = await adminApi.uploadProductImages(editingProduct.id, files, {
        is_primary: shouldMakePrimary,
      });

      const nextImages = sortProductImages([
        ...(shouldMakePrimary
          ? productImages.map((image) => ({
              ...image,
              is_primary: false,
            }))
          : productImages),
        ...uploadedImages,
      ]);

      syncProductImages(editingProduct.id, nextImages);
      setSelectedImageId(
        uploadedImages.find((image) => image.is_primary)?.id ??
          uploadedImages[0]?.id ??
          nextImages[0]?.id ??
          null,
      );
    } catch (error) {
      console.error('Failed to upload product images:', error);
      setProductImageActionError(
        error instanceof Error ? error.message : 'Không thể tải ảnh lên. Vui lòng thử lại.',
      );
    } finally {
      setIsUploadingImages(false);
      event.target.value = '';
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!editingProduct) {
      return;
    }

    try {
      setIsDeletingImageId(imageId);
      setProductImageActionError('');
      await adminApi.deleteProductImage(editingProduct.id, imageId);
      syncProductImages(
        editingProduct.id,
        productImages.filter((image) => image.id !== imageId),
      );
    } catch (error) {
      console.error('Failed to delete product image:', error);
      setProductImageActionError(
        error instanceof Error ? error.message : 'Không thể xóa ảnh. Vui lòng thử lại.',
      );
    } finally {
      setIsDeletingImageId(null);
    }
  };

  const selectedProductImage =
    productImages.find((image) => image.id === selectedImageId) ?? productImages[0] ?? null;
  const editingProductVariants = [...(editingProduct?.variants ?? [])].sort(
    (firstVariant, secondVariant) =>
      Number(firstVariant.sort_order ?? 0) - Number(secondVariant.sort_order ?? 0),
  );
  const editingProductName = editingProduct?.name || productForm.name || 'sản phẩm';
  const editingProductSku = editingProduct?.sku || productForm.sku;
  const editingProductBasePrice = Number(editingProduct?.base_price ?? 0);
  const hasPendingBasePriceChange =
    Boolean(editingProduct) &&
    productForm.base_price.trim() !== '' &&
    Number(productForm.base_price) !== Number(editingProduct?.base_price ?? 0);

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
              onClick={openCreateModal}
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#7366ff] text-white rounded-lg hover:bg-[#5d54cc] transition-colors"
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
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
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
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">Trạng thái</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all cursor-pointer"
              >
                {STATUS_OPTIONS.map((statusOption) => (
                  <option key={statusOption.value || 'all'} value={statusOption.value}>
                    {statusOption.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Products Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {products.map((product) => (
            <ProductGridCard
              key={product.id}
              product={product}
              onOpenEdit={openEditModal}
              onRequestDelete={requestDeleteProduct}
              isOpeningEditor={openingProductId === product.id}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {products.map((product) => (
            <ProductListRow
              key={product.id}
              product={product}
              onOpenEdit={openEditModal}
              onRequestDelete={requestDeleteProduct}
              isOpeningEditor={openingProductId === product.id}
            />
          ))}
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
          pageSize={viewMode === 'grid' ? 24 : 10}
          itemLabel="products"
          onPageChange={setCurrentPage}
          isFetching={isFetching}
          variant="standalone"
        />
      </div>

      {/* Create/Edit Product Modal */}
      {(editingProduct || isCreateMode) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-none bg-black/50 p-4">
          <div className="glass-card max-h-[90vh] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-6 backdrop-blur-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">{isCreateMode ? 'Thêm sản phẩm' : 'Chỉnh sửa sản phẩm'}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {isCreateMode
                    ? 'Tạo sản phẩm mới trước, sau đó có thể mở lại để bổ sung ảnh và phiên bản.'
                    : 'Tối ưu thông tin hiển thị và quản lý bộ ảnh ngay trong một màn hình.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={
                  isSavingProduct ||
                  isCreatingVariant ||
                  savingVariantId !== null ||
                  deletingVariantId !== null ||
                  isUploadingImages ||
                  isDeletingImageId !== null
                }
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={isCreateMode ? 'Đóng hộp thoại thêm sản phẩm' : 'Đóng hộp thoại chỉnh sửa sản phẩm'}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {!isCreateMode && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:col-span-2">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Ảnh sản phẩm</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {productImages.length > 0
                        ? `${productImages.length} ảnh đã được liên kết với sản phẩm này.`
                        : 'Chưa có ảnh nào, hãy thêm ảnh để thẻ sản phẩm cân đối hơn.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        void handleImageUpload(event, { makePrimary: false });
                      }}
                    />
                    <input
                      ref={primaryImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        void handleImageUpload(event, { makePrimary: true });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={isUploadingImages || isDeletingImageId !== null}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUploadingImages ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4" />
                      )}
                      Tải thêm ảnh
                    </button>
                    <button
                      type="button"
                      onClick={() => primaryImageInputRef.current?.click()}
                      disabled={isUploadingImages || isDeletingImageId !== null}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#7366ff] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5d54cc] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Star className="h-4 w-4" />
                      Thay ảnh chính
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="relative aspect-[4/3]">
                      {selectedProductImage ? (
                        <>
                          <Image
                            src={selectedProductImage.image_url}
                            alt={selectedProductImage.alt_text || editingProductName}
                            fill
                            sizes="(min-width: 1024px) 45vw, 100vw"
                            className="object-contain p-6"
                          />
                          <div className="absolute left-4 top-4 flex items-center gap-2">
                            {selectedProductImage.is_primary && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                <Star className="h-3.5 w-3.5 fill-current" />
                                Ảnh chính
                              </span>
                            )}
                            <span className="rounded-full bg-slate-900/75 px-3 py-1 text-xs font-medium text-white">
                              #{selectedProductImage.sort_order + 1}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-100 to-slate-200 text-center">
                          <Package className="h-12 w-12 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">Chưa có ảnh hiển thị</p>
                            <p className="mt-1 text-xs text-slate-500">Tải ảnh lên để hoàn thiện thẻ sản phẩm.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
                      {productImages.map((image) => {
                        const isSelected = image.id === selectedProductImage?.id;
                        const isDeletingThisImage = isDeletingImageId === image.id;

                        return (
                          <div
                            key={image.id}
                            className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
                              isSelected
                                ? 'border-[#7366ff] ring-2 ring-[#7366ff]/20'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedImageId(image.id)}
                              className="block w-full"
                            >
                              <div className="relative aspect-square bg-slate-50 p-3">
                                <Image
                                  src={image.thumbnail_url || image.image_url}
                                  alt={image.alt_text || editingProductName}
                                  fill
                                  sizes="(min-width: 1024px) 10vw, (min-width: 640px) 18vw, 40vw"
                                  className="object-contain"
                                />
                              </div>
                            </button>

                            <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1">
                              {image.is_primary && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                  Chính
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                void handleDeleteImage(image.id);
                              }}
                              disabled={isDeletingThisImage || isUploadingImages}
                              className="absolute right-2 top-2 rounded-full bg-white/95 p-1.5 text-red-500 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label={`Xóa ảnh ${image.alt_text || editingProductName}`}
                            >
                              {isDeletingThisImage ? (
                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {productImages.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                        Bộ ảnh trống. Thêm ảnh để xem trước ngay tại đây.
                      </div>
                    )}

                    <p className="text-xs text-slate-500">
                      Hỗ trợ JPG, PNG, GIF, WEBP · tối đa 8MB mỗi ảnh. Nút “Thay ảnh chính” sẽ gán ảnh mới làm ảnh đại diện.
                    </p>
                  </div>
                </div>

                {productImageActionError && (
                  <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                    {productImageActionError}
                  </p>
                )}
              </div>
              )}

              {!isCreateMode && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:col-span-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Phiên bản sản phẩm</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {editingProductVariants.length > 0
                        ? `${editingProductVariants.length} phiên bản đang được dùng ở trang chi tiết sản phẩm.`
                        : 'Sản phẩm này hiện chưa có phiên bản riêng và sẽ dùng giá cơ bản.'}
                    </p>
                  </div>
                  {editingProductVariants.length > 0 && (
                    <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                      SKU gốc: {editingProductSku}
                    </span>
                  )}
                </div>

                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Thêm phiên bản mới</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Tạo nhanh một phiên bản mới từ giá cơ bản hiện tại.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void handleCreateVariant();
                      }}
                      disabled={isCreatingVariant || hasPendingBasePriceChange}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#7366ff] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5d54cc] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCreatingVariant ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {isCreatingVariant ? 'Đang tạo...' : 'Thêm phiên bản'}
                    </button>
                  </div>

                  {hasPendingBasePriceChange && (
                    <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                      Bạn đã thay đổi giá cơ bản nhưng chưa lưu. Hãy lưu sản phẩm trước khi tạo hoặc cập nhật phiên bản để giá cuối cùng được tính đúng.
                    </p>
                  )}

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <input
                      type="text"
                      placeholder="SKU phiên bản"
                      value={newVariantForm.sku}
                      onChange={(e) => {
                        setNewVariantForm((current) => ({ ...current, sku: e.target.value }));
                        setNewVariantError('');
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                    />
                    <input
                      type="text"
                      placeholder="Kích cỡ"
                      value={newVariantForm.size}
                      onChange={(e) => {
                        setNewVariantForm((current) => ({ ...current, size: e.target.value }));
                        setNewVariantError('');
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                    />
                    <input
                      type="text"
                      placeholder="Màu sắc"
                      value={newVariantForm.color}
                      onChange={(e) => {
                        setNewVariantForm((current) => ({ ...current, color: e.target.value }));
                        setNewVariantError('');
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                    />
                    <input
                      type="text"
                      placeholder="#FFFFFF"
                      value={newVariantForm.color_code}
                      onChange={(e) => {
                        setNewVariantForm((current) => ({ ...current, color_code: e.target.value }));
                        setNewVariantError('');
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                    />
                    <input
                      type="text"
                      placeholder="Chất liệu"
                      value={newVariantForm.material}
                      onChange={(e) => {
                        setNewVariantForm((current) => ({ ...current, material: e.target.value }));
                        setNewVariantError('');
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                    />
                    <input
                      type="text"
                      placeholder="Barcode"
                      value={newVariantForm.barcode}
                      onChange={(e) => {
                        setNewVariantForm((current) => ({ ...current, barcode: e.target.value }));
                        setNewVariantError('');
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Điều chỉnh giá"
                      value={newVariantForm.price_adjustment}
                      onChange={(e) => {
                        setNewVariantForm((current) => ({ ...current, price_adjustment: e.target.value }));
                        setNewVariantError('');
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                    />
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="Khối lượng (kg)"
                      value={newVariantForm.weight_kg}
                      onChange={(e) => {
                        setNewVariantForm((current) => ({ ...current, weight_kg: e.target.value }));
                        setNewVariantError('');
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                    />
                    <input
                      type="number"
                      placeholder="Thứ tự hiển thị"
                      value={newVariantForm.sort_order}
                      onChange={(e) => {
                        setNewVariantForm((current) => ({ ...current, sort_order: e.target.value }));
                        setNewVariantError('');
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                    />
                    <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={newVariantForm.is_active}
                        onChange={(e) => {
                          setNewVariantForm((current) => ({ ...current, is_active: e.target.checked }));
                          setNewVariantError('');
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-[#7366ff] focus:ring-[#7366ff]"
                      />
                      Kích hoạt ngay
                    </label>
                  </div>

                  {newVariantError && (
                    <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                      {newVariantError}
                    </p>
                  )}
                </div>

                {editingProductVariants.length > 0 ? (
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {editingProductVariants.map((variant) => {
                      const variantForm = variantForms[variant.id] ?? mapVariantToForm(variant);
                      const adjustment = Number(variantForm.price_adjustment || 0);
                      const isAdjusted = adjustment !== 0;
                      const basePriceForPreview =
                        productForm.base_price.trim() !== '' && !Number.isNaN(Number(productForm.base_price))
                          ? Number(productForm.base_price)
                          : editingProductBasePrice;
                      const previewFinalPrice = Number.isNaN(adjustment)
                        ? Number(variant.final_price)
                        : basePriceForPreview + adjustment;
                      const variantError = variantErrors[variant.id];
                      const isSavingThisVariant = savingVariantId === variant.id;

                      return (
                        <div
                          key={variant.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-slate-900">
                                  {getVariantFormLabel(variantForm)}
                                </p>
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                    variantForm.is_active
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {variantForm.is_active ? 'Đang bán' : 'Tạm ẩn'}
                                </span>
                              </div>
                            </div>
                            {variantForm.color_code && /^#(?:[0-9a-fA-F]{6})$/.test(variantForm.color_code) && (
                              <span
                                className="mt-1 h-4 w-4 rounded-full border border-slate-200"
                                style={{ backgroundColor: variantForm.color_code }}
                                aria-label={`Màu ${variantForm.color || 'phiên bản'}`}
                              />
                            )}
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                                SKU phiên bản
                              </label>
                              <input
                                type="text"
                                value={variantForm.sku}
                                onChange={(e) => handleVariantFieldChange(variant.id, 'sku', e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                                Thứ tự hiển thị
                              </label>
                              <input
                                type="number"
                                value={variantForm.sort_order}
                                onChange={(e) => handleVariantFieldChange(variant.id, 'sort_order', e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                                Kích cỡ
                              </label>
                              <input
                                type="text"
                                value={variantForm.size}
                                onChange={(e) => handleVariantFieldChange(variant.id, 'size', e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                                Màu sắc
                              </label>
                              <input
                                type="text"
                                value={variantForm.color}
                                onChange={(e) => handleVariantFieldChange(variant.id, 'color', e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                                Mã màu
                              </label>
                              <input
                                type="text"
                                placeholder="#FFFFFF"
                                value={variantForm.color_code}
                                onChange={(e) => handleVariantFieldChange(variant.id, 'color_code', e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                                Chất liệu
                              </label>
                              <input
                                type="text"
                                value={variantForm.material}
                                onChange={(e) => handleVariantFieldChange(variant.id, 'material', e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                                Barcode
                              </label>
                              <input
                                type="text"
                                value={variantForm.barcode}
                                onChange={(e) => handleVariantFieldChange(variant.id, 'barcode', e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                                Điều chỉnh giá
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={variantForm.price_adjustment}
                                onChange={(e) =>
                                  handleVariantFieldChange(variant.id, 'price_adjustment', e.target.value)
                                }
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                                Khối lượng (kg)
                              </label>
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                value={variantForm.weight_kg}
                                onChange={(e) => handleVariantFieldChange(variant.id, 'weight_kg', e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7366ff]"
                              />
                            </div>
                            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3">
                              <div>
                                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                                  Giá bán sau điều chỉnh
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                  {formatPrice(previewFinalPrice)}
                                </p>
                              </div>
                              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={variantForm.is_active}
                                  onChange={(e) =>
                                    handleVariantFieldChange(variant.id, 'is_active', e.target.checked)
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-[#7366ff] focus:ring-[#7366ff]"
                                />
                                Kích hoạt phiên bản
                              </label>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <p
                              className={`text-sm font-semibold ${
                                !isAdjusted
                                  ? 'text-slate-700'
                                  : adjustment > 0
                                    ? 'text-amber-700'
                                    : 'text-emerald-700'
                              }`}
                            >
                              {!isAdjusted
                                ? 'Phiên bản này đang dùng đúng giá cơ bản.'
                                : adjustment > 0
                                  ? `Đang cộng thêm ${formatPrice(adjustment)} so với giá cơ bản.`
                                  : `Đang giảm ${formatPrice(Math.abs(adjustment))} so với giá cơ bản.`}
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => resetVariantForm(variant)}
                                disabled={isSavingThisVariant || deletingVariantId === variant.id}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Hoàn tác
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  void handleSaveVariant(variant);
                                }}
                                disabled={isSavingThisVariant || deletingVariantId === variant.id || hasPendingBasePriceChange}
                                className="inline-flex items-center gap-2 rounded-lg bg-[#7366ff] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5d54cc] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isSavingThisVariant && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                {isSavingThisVariant ? 'Đang lưu...' : 'Lưu phiên bản'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  void handleDeleteVariant(variant);
                                }}
                                disabled={isSavingThisVariant || deletingVariantId === variant.id}
                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingVariantId === variant.id ? (
                                  <LoaderCircle className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                {deletingVariantId === variant.id ? 'Đang xóa...' : 'Xóa'}
                              </button>
                            </div>
                          </div>

                          {variantError && (
                            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                              {variantError}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    Chưa có dữ liệu phiên bản cho sản phẩm này.
                  </div>
                )}
              </div>
              )}

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
                disabled={
                  isSavingProduct ||
                  isCreatingVariant ||
                  savingVariantId !== null ||
                  deletingVariantId !== null ||
                  isUploadingImages ||
                  isDeletingImageId !== null
                }
                className="rounded border border-slate-200 bg-white px-4 py-2 text-slate-700 transition-colors hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={isSavingProduct}
                className="rounded bg-[#7366ff] px-4 py-2 text-white transition-colors hover:bg-[#5d54cc] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingProduct ? 'Đang lưu...' : isCreateMode ? 'Tạo sản phẩm' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-none bg-black/50 p-4">
          <div className="glass-card max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-4 text-red-500">Xóa sản phẩm</h3>
            <p className="text-slate-500 mb-6">
              Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác.
            </p>
            {deleteProductError && (
              <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {deleteProductError}
              </p>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(null);
                  setDeleteProductError('');
                }}
                disabled={isDeletingProduct}
                className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteProduct(showDeleteConfirm)}
                disabled={isDeletingProduct}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeletingProduct ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
