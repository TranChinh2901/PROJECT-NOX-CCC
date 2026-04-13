'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CaretLeft,
  CaretRight,
  CheckCircle,
  ClockCounterClockwise,
  MagnifyingGlass,
  Package,
  Sparkle,
  TrendUp,
  WarningCircle,
} from '@phosphor-icons/react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Skeleton } from '@/components/common/Skeleton';
import { GlassCard } from '@/components/ui/GlassCard';
import { productApi, recommendationApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types';
import { buildProductPath } from '@/lib/utils';

type SortOption = 'relevance' | 'latest' | 'topsales' | 'price_asc' | 'price_desc';
type PriceRangeId = 'under-20' | '20-35' | '35-50' | 'above-50';

type PriceRange = {
  id: PriceRangeId;
  label: string;
  min?: number;
  max?: number;
};

type FilterOption = {
  id: number | string;
  label: string;
  count: number;
};

const ITEMS_PER_PAGE = 16;

const SORT_OPTIONS: Array<{ id: SortOption; label: string; icon: typeof TrendUp }> = [
  { id: 'relevance', label: 'Liên quan', icon: TrendUp },
  { id: 'latest', label: 'Mới cập nhật', icon: ClockCounterClockwise },
  { id: 'topsales', label: 'Bán chạy', icon: Sparkle },
];

const PRICE_RANGES: PriceRange[] = [
  { id: 'under-20', label: 'Dưới 20 triệu', max: 20_000_000 },
  { id: '20-35', label: 'Từ 20 đến 35 triệu', min: 20_000_000, max: 35_000_000 },
  { id: '35-50', label: 'Từ 35 đến 50 triệu', min: 35_000_000, max: 50_000_000 },
  { id: 'above-50', label: 'Trên 50 triệu', min: 50_000_000 },
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(price);

const getFallbackProductImage = (productId: number) =>
  `https://picsum.photos/seed/search-product-${productId}/900/900`;

const getBrandLabel = (product: Product) => {
  if (product.brand?.name?.trim()) {
    return product.brand.name.trim();
  }

  const [firstWord] = product.name.split(' ');
  return firstWord || 'Khác';
};

const getProductCategoryId = (product: Product) => product.category?.id ?? product.category_id;

const matchesPriceRange = (price: number, range: PriceRange) => {
  const matchesMin = range.min === undefined || price >= range.min;
  const matchesMax = range.max === undefined || price < range.max;
  return matchesMin && matchesMax;
};

function SearchSearchParamsSync({
  onQueryChange,
}: {
  onQueryChange: (query: string) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    onQueryChange(searchParams.get('q') || '');
  }, [onQueryChange, searchParams]);

  return null;
}

function SearchProductCard({ product }: { product: Product }) {
  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.base_price) / product.compare_at_price) * 100)
    : null;
  const primaryImage =
    product.images?.find((img) => img.is_primary)?.image_url ||
    product.images?.[0]?.image_url ||
    getFallbackProductImage(product.id);
  const destinationHref = buildProductPath(product);
  const categoryLabel = product.category?.name ?? 'Thiết bị chọn lọc';
  const brandLabel = getBrandLabel(product);
  const soldCount = product.sold_count ?? 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_24px_48px_-34px_rgba(28,25,23,0.28)] backdrop-blur transition-transform duration-300 hover:-translate-y-1 active:scale-[0.99]">
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(202,138,4,0.18),_transparent_48%),linear-gradient(180deg,_#f8f3ea_0%,_#f4efe7_100%)]">
        {product.is_featured && (
          <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#171412] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
            <Sparkle className="h-3.5 w-3.5 text-[#f4c96a]" weight="fill" />
            Nổi bật
          </div>
        )}

        {discount && (
          <div className="absolute right-4 top-4 z-10 rounded-full border border-[#f5d9d5] bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d35d4d]">
            -{discount}%
          </div>
        )}

        <Link href={destinationHref} className="relative block aspect-[4/3.85] overflow-hidden">
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.045]"
          />
        </Link>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#171412]/18 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#7b725f]">
          <span className="inline-flex rounded-full bg-[#f8f3ea] px-2.5 py-1">{categoryLabel}</span>
          <span className="inline-flex rounded-full bg-[#f3ede3] px-2.5 py-1">{brandLabel}</span>
        </div>

        <Link href={destinationHref} className="group/title mt-3">
          <h3 className="min-h-[3.1rem] line-clamp-2 font-heading text-[1.05rem] font-semibold leading-snug tracking-tight text-[#171412] transition-colors group-hover/title:text-[#8a5a00]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-4 flex items-end gap-2 border-t border-[#efe5d6] pt-4">
          <span className="text-[1.28rem] font-semibold leading-none tracking-[-0.03em] text-[#171412]">
            {formatPrice(product.base_price)}
          </span>
          {product.compare_at_price && (
            <span className="pb-0.5 text-sm text-[#a49a8b] line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-[#7b725f]">
          <CheckCircle className="h-4 w-4 text-[#c58a10]" weight="fill" />
          <span>Đã bán {soldCount.toLocaleString('vi-VN')}</span>
        </div>
      </div>
    </article>
  );
}

function FilterGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard className="rounded-[1.75rem] border-white/70 bg-white/82 p-5 shadow-[0_18px_40px_-30px_rgba(28,25,23,0.28)]">
      <div className="border-b border-[#eee4d5] pb-4">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-[#171412]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[#6b655b]">{description}</p>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </GlassCard>
  );
}

function SearchPageContent() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRangeId | null>(null);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const trackedSearchRef = useRef<string | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, selectedBrandIds, selectedCategoryIds, selectedPriceRange, featuredOnly]);

  useEffect(() => {
    let isActive = true;

    const runSearch = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!searchQuery.trim()) {
          const productsData = await productApi.getAllProducts({ limit: 60 });
          if (isActive) {
            setProducts(productsData.data || []);
          }
          return;
        }

        const response = await productApi.searchProducts(searchQuery, 100);
        if (isActive) {
          setProducts(response.data || []);
        }
      } catch (searchError) {
        if (isActive) {
          console.error('Error searching products:', searchError);
          setProducts([]);
          setError('Không thể tải kết quả tìm kiếm lúc này. Vui lòng thử lại sau ít phút.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void runSearch();

    return () => {
      isActive = false;
    };
  }, [searchQuery]);

  useEffect(() => {
    const normalizedQuery = searchQuery.trim();

    if (!user?.id || normalizedQuery.length < 2) {
      return;
    }

    const trackingKey = `${user.id}:${normalizedQuery.toLowerCase()}`;
    if (trackedSearchRef.current === trackingKey) {
      return;
    }

    trackedSearchRef.current = trackingKey;

    recommendationApi
      .trackBehavior({
        userId: user.id,
        behaviorType: 'search',
        metadata: {
          query: normalizedQuery,
          page: 'search',
        },
      })
      .catch((trackingError: unknown) => {
        trackedSearchRef.current = null;
        console.error('Failed to track search behavior:', trackingError);
      });
  }, [user?.id, searchQuery]);

  const availableBrands = useMemo(() => {
    const brandMap = new Map<string, FilterOption>();

    products.forEach((product) => {
      const label = getBrandLabel(product);
      const current = brandMap.get(label);

      if (current) {
        current.count += 1;
      } else {
        brandMap.set(label, { id: label, label, count: 1 });
      }
    });

    return Array.from(brandMap.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [products]);

  const availableBrandIdSet = useMemo(() => new Set(availableBrands.map((brand) => brand.id as string)), [availableBrands]);

  const availableCategories = useMemo(() => {
    const categoryMap = new Map<number, FilterOption>();

    products.forEach((product) => {
      if (!product.category) {
        return;
      }

      const current = categoryMap.get(product.category.id);
      if (current) {
        current.count += 1;
      } else {
        categoryMap.set(product.category.id, {
          id: product.category.id,
          label: product.category.name,
          count: 1,
        });
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [products]);

  const availableCategoryIdSet = useMemo(
    () => new Set(availableCategories.map((category) => category.id as number)),
    [availableCategories],
  );

  useEffect(() => {
    setSelectedBrandIds((current) => current.filter((brandId) => availableBrandIdSet.has(brandId)));
  }, [availableBrandIdSet]);

  useEffect(() => {
    setSelectedCategoryIds((current) => current.filter((categoryId) => availableCategoryIdSet.has(categoryId)));
  }, [availableCategoryIdSet]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (selectedBrandIds.length > 0) {
      filtered = filtered.filter((product) => selectedBrandIds.includes(getBrandLabel(product)));
    }

    if (selectedCategoryIds.length > 0) {
      filtered = filtered.filter((product) => {
        const categoryId = getProductCategoryId(product);
        return categoryId !== undefined && selectedCategoryIds.includes(categoryId);
      });
    }

    if (selectedPriceRange) {
      const range = PRICE_RANGES.find((item) => item.id === selectedPriceRange);
      if (range) {
        filtered = filtered.filter((product) => matchesPriceRange(product.base_price, range));
      }
    }

    if (featuredOnly) {
      filtered = filtered.filter((product) => product.is_featured);
    }

    switch (sortBy) {
      case 'latest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'topsales':
        filtered.sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0));
        break;
      case 'price_asc':
        filtered.sort((a, b) => a.base_price - b.base_price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.base_price - a.base_price);
        break;
      case 'relevance':
      default:
        break;
    }

    return filtered;
  }, [products, selectedBrandIds, selectedCategoryIds, selectedPriceRange, featuredOnly, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const hasRecoverableEmptyState = !loading && !error && products.length > 0 && filteredProducts.length === 0;
  const recoveryCategoryOptions = availableCategories.slice(0, 4);
  const recoveryBrandOptions = availableBrands.slice(0, 4);

  const activeFilterCount =
    selectedBrandIds.length +
    selectedCategoryIds.length +
    (selectedPriceRange ? 1 : 0) +
    (featuredOnly ? 1 : 0);

  const discoveryTitle = searchQuery.trim()
    ? `Kết quả cho '${searchQuery.trim()}'`
    : 'Khám phá danh mục đang được quan tâm';

  const handleBrandToggle = (brandId: string) => {
    setSelectedBrandIds((current) =>
      current.includes(brandId) ? current.filter((item) => item !== brandId) : [...current, brandId]
    );
  };

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId) ? current.filter((item) => item !== categoryId) : [...current, categoryId]
    );
  };

  const clearAllFilters = () => {
    setSelectedBrandIds([]);
    setSelectedCategoryIds([]);
    setSelectedPriceRange(null);
    setFeaturedOnly(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f1e8] pt-24 sm:pt-32">
      <Suspense fallback={null}>
        <SearchSearchParamsSync onQueryChange={setSearchQuery} />
      </Suspense>
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="w-full lg:sticky lg:top-32 lg:self-start">
              <div className="space-y-5">
                <div className="px-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8a5a00]">
                    Search Desk
                  </p>
                  <h1 className="mt-3 font-heading text-[2rem] font-semibold tracking-tighter text-[#171412]">
                    Bộ lọc được rút gọn để bạn chạm nhanh vào nhóm đáng xem.
                  </h1>
                  <p className="mt-3 max-w-[28ch] text-sm leading-6 text-[#6b655b]">
                    Thay vì một cột checkbox dày đặc, trang này chỉ giữ những nhóm lọc có thể dùng
                    ngay từ dữ liệu hiện có.
                  </p>
                </div>

                <FilterGroup
                  title="Trạng thái lọc"
                  description="Theo dõi số bộ lọc đang bật và quay về trạng thái mặc định nếu cần."
                >
                  <div className="rounded-[1.4rem] border border-[#eee4d5] bg-[#faf6ef] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#6b655b]">Bộ lọc đang bật</span>
                      <span className="font-heading text-2xl font-semibold tracking-tight text-[#171412]">
                        {activeFilterCount}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      disabled={activeFilterCount === 0}
                      className="mt-4 inline-flex items-center rounded-full border border-[#d9ccb8] bg-white px-4 py-2 text-sm font-medium text-[#2f2a24] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ca8a04] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Xóa toàn bộ
                    </button>
                  </div>

                  <label className="flex items-start gap-3 rounded-[1.2rem] border border-[#eee4d5] bg-white/65 p-4 transition-colors hover:border-[#dccdb5]">
                    <input
                      type="checkbox"
                      checked={featuredOnly}
                      onChange={(event) => setFeaturedOnly(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-[#cdbda6] text-[#ca8a04] focus:ring-[#ca8a04]/30"
                    />
                    <span>
                      <span className="block text-sm font-medium text-[#171412]">Ưu tiên mẫu nổi bật</span>
                      <span className="mt-1 block text-sm leading-6 text-[#6b655b]">
                        Chỉ giữ lại những sản phẩm được đánh dấu nổi bật trong hệ thống.
                      </span>
                    </span>
                  </label>
                </FilterGroup>

                <FilterGroup
                  title="Ngành hàng"
                  description="Các nhóm xuất hiện trực tiếp trong tập kết quả hiện tại."
                >
                  {availableCategories.length > 0 ? (
                    availableCategories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-[#eee4d5] bg-white/70 px-4 py-3 transition-colors hover:border-[#dccdb5]"
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedCategoryIds.includes(category.id as number)}
                            onChange={() => handleCategoryToggle(category.id as number)}
                            className="h-4 w-4 rounded border-[#cdbda6] text-[#ca8a04] focus:ring-[#ca8a04]/30"
                          />
                          <span className="text-sm text-[#2f2a24]">{category.label}</span>
                        </span>
                        <span className="text-xs text-[#8d8477]">{category.count}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-[#6b655b]">Chưa có nhóm ngành hàng để lọc.</p>
                  )}
                </FilterGroup>

                <FilterGroup
                  title="Thương hiệu"
                  description="Lấy trực tiếp từ dữ liệu sản phẩm hoặc nhãn thương hiệu có sẵn."
                >
                  {availableBrands.length > 0 ? (
                    availableBrands.slice(0, 8).map((brand) => (
                      <label
                        key={brand.id}
                        className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-[#eee4d5] bg-white/70 px-4 py-3 transition-colors hover:border-[#dccdb5]"
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedBrandIds.includes(brand.id as string)}
                            onChange={() => handleBrandToggle(brand.id as string)}
                            className="h-4 w-4 rounded border-[#cdbda6] text-[#ca8a04] focus:ring-[#ca8a04]/30"
                          />
                          <span className="text-sm text-[#2f2a24]">{brand.label}</span>
                        </span>
                        <span className="text-xs text-[#8d8477]">{brand.count}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-[#6b655b]">Chưa có dữ liệu thương hiệu trong tập kết quả này.</p>
                  )}
                </FilterGroup>

                <FilterGroup
                  title="Khoảng giá"
                  description="Giữ lại những mức giá phù hợp với quyết định bạn đang cân nhắc."
                >
                  {PRICE_RANGES.map((range) => (
                    <button
                      key={range.id}
                      type="button"
                      onClick={() =>
                        setSelectedPriceRange((current) => (current === range.id ? null : range.id))
                      }
                      className={`flex w-full items-center justify-between rounded-[1.2rem] border px-4 py-3 text-left text-sm transition-all duration-300 ${
                        selectedPriceRange === range.id
                          ? 'border-[#ca8a04] bg-[#faf3e3] text-[#171412]'
                          : 'border-[#eee4d5] bg-white/70 text-[#2f2a24] hover:border-[#dccdb5]'
                      }`}
                    >
                      <span>{range.label}</span>
                      {selectedPriceRange === range.id && (
                        <CheckCircle className="h-4 w-4 text-[#ca8a04]" weight="fill" />
                      )}
                    </button>
                  ))}
                </FilterGroup>
              </div>
            </aside>

            <section className="min-w-0">
              <div className="rounded-[2.5rem] border border-white/70 bg-white/72 p-6 shadow-[0_30px_80px_-48px_rgba(28,25,23,0.34)] backdrop-blur sm:p-8">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8a5a00]">
                      Results Workspace
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8f1e2] text-[#8a5a00]">
                        <MagnifyingGlass className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-heading text-[1.85rem] font-semibold tracking-tight text-[#171412]">
                          {discoveryTitle}
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-[#6b655b]">
                          {filteredProducts.length} kết quả sau khi áp dụng bộ lọc và thứ tự hiển thị.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <GlassCard className="rounded-[1.5rem] border-[#f0e6d9] bg-[#faf6ef] p-4 shadow-none">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#8d8477]">Kết quả</p>
                      <p className="mt-3 font-heading text-2xl font-semibold tracking-tight text-[#171412]">
                        {filteredProducts.length}
                      </p>
                    </GlassCard>
                    <GlassCard className="rounded-[1.5rem] border-[#f0e6d9] bg-[#faf6ef] p-4 shadow-none">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#8d8477]">Trang</p>
                      <p className="mt-3 font-heading text-2xl font-semibold tracking-tight text-[#171412]">
                        {filteredProducts.length === 0 ? 0 : currentPage}
                      </p>
                    </GlassCard>
                    <GlassCard className="rounded-[1.5rem] border-[#f0e6d9] bg-[#faf6ef] p-4 shadow-none">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#8d8477]">Bộ lọc</p>
                      <p className="mt-3 font-heading text-2xl font-semibold tracking-tight text-[#171412]">
                        {activeFilterCount}
                      </p>
                    </GlassCard>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-4 rounded-[2rem] border border-[#eee4d5] bg-[#fbf8f2] p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-[#6b655b]">Sắp xếp theo</span>
                    {SORT_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isActive = sortBy === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSortBy(option.id)}
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                            isActive
                              ? 'bg-[#171412] text-white shadow-[0_14px_30px_-18px_rgba(23,20,18,0.46)]'
                              : 'border border-[#ddd3c3] bg-white text-[#2f2a24] hover:-translate-y-0.5 hover:border-[#ca8a04]'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </button>
                      );
                    })}

                    <select
                      value={['price_asc', 'price_desc'].includes(sortBy) ? sortBy : 'price_default'}
                      onChange={(event) => {
                        if (event.target.value !== 'price_default') {
                          setSortBy(event.target.value as SortOption);
                        }
                      }}
                      className="rounded-full border border-[#ddd3c3] bg-white px-4 py-2 text-sm text-[#2f2a24] focus:border-[#ca8a04] focus:outline-none"
                    >
                      <option value="price_default">Giá</option>
                      <option value="price_asc">Giá tăng dần</option>
                      <option value="price_desc">Giá giảm dần</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-4 lg:justify-end">
                    <div className="flex items-center gap-2 text-sm text-[#6b655b]">
                      <span className="font-medium">
                        {filteredProducts.length === 0 ? 0 : currentPage}/{totalPages}
                      </span>
                    </div>
                    <div className="flex items-center overflow-hidden rounded-full border border-[#ddd3c3] bg-white">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={currentPage === 1 || filteredProducts.length === 0}
                        className="flex h-10 w-10 items-center justify-center text-[#5a544b] transition-colors hover:bg-[#f4efe6] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <CaretLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        disabled={currentPage === totalPages || filteredProducts.length === 0}
                        className="flex h-10 w-10 items-center justify-center border-l border-[#ddd3c3] text-[#5a544b] transition-colors hover:bg-[#f4efe6] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <CaretRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#8d8477]">
                      Đang áp dụng
                    </span>
                    {selectedCategoryIds.map((categoryId) => {
                      const category = availableCategories.find((item) => item.id === categoryId);
                      if (!category) {
                        return null;
                      }

                      return (
                        <button
                          key={`category-${categoryId}`}
                          type="button"
                          onClick={() => handleCategoryToggle(categoryId)}
                          className="rounded-full border border-[#dccdb5] bg-white px-3 py-1.5 text-xs font-medium text-[#2f2a24] transition-colors hover:border-[#ca8a04]"
                        >
                          {category.label}
                        </button>
                      );
                    })}
                    {selectedBrandIds.map((brandId) => (
                      <button
                        key={`brand-${brandId}`}
                        type="button"
                        onClick={() => handleBrandToggle(brandId)}
                        className="rounded-full border border-[#dccdb5] bg-white px-3 py-1.5 text-xs font-medium text-[#2f2a24] transition-colors hover:border-[#ca8a04]"
                      >
                        {brandId}
                      </button>
                    ))}
                    {selectedPriceRange && (
                      <button
                        type="button"
                        onClick={() => setSelectedPriceRange(null)}
                        className="rounded-full border border-[#dccdb5] bg-white px-3 py-1.5 text-xs font-medium text-[#2f2a24] transition-colors hover:border-[#ca8a04]"
                      >
                        {PRICE_RANGES.find((item) => item.id === selectedPriceRange)?.label}
                      </button>
                    )}
                    {featuredOnly && (
                      <button
                        type="button"
                        onClick={() => setFeaturedOnly(false)}
                        className="rounded-full border border-[#dccdb5] bg-white px-3 py-1.5 text-xs font-medium text-[#2f2a24] transition-colors hover:border-[#ca8a04]"
                      >
                        Mẫu nổi bật
                      </button>
                    )}
                  </div>
                )}
              </div>

              {loading ? (
                <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/82 p-0 shadow-[0_24px_48px_-34px_rgba(28,25,23,0.28)]"
                    >
                      <Skeleton className="aspect-[4/3.85] w-full bg-[#ece4d7]" rounded="none" />
                      <div className="space-y-3 p-4">
                        <Skeleton height="18px" className="w-24 rounded-full bg-[#f1e8d9]" />
                        <Skeleton height="42px" className="w-full bg-[#efe6da]" />
                        <Skeleton height="22px" className="w-2/3 bg-[#eadfcd]" />
                        <Skeleton height="14px" className="w-24 bg-[#efe6da]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="mt-8 rounded-[2.5rem] border border-[#ead7d3] bg-white px-6 py-16 text-center shadow-[0_30px_80px_-48px_rgba(28,25,23,0.34)]">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f8ece9] text-[#a14f3b]">
                    <WarningCircle className="h-8 w-8" />
                  </div>
                  <h3 className="mt-5 font-heading text-2xl font-semibold tracking-tight text-[#171412]">
                    Không thể tải kết quả tìm kiếm
                  </h3>
                  <p className="mx-auto mt-3 max-w-[48ch] text-sm leading-6 text-[#6b655b]">{error}</p>
                </div>
              ) : paginatedProducts.length > 0 ? (
                <>
                  <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {paginatedProducts.map((product) => (
                      <SearchProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-10 flex justify-center">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                          disabled={currentPage === 1}
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ddd3c3] bg-white text-[#5a544b] transition-colors hover:bg-[#f4efe6] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <CaretLeft className="h-4 w-4" />
                        </button>
                        {Array.from({ length: totalPages }).map((_, index) => {
                          const pageNumber = index + 1;
                          const isVisible =
                            pageNumber === 1 ||
                            pageNumber === totalPages ||
                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);

                          if (!isVisible) {
                            if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                              return (
                                <span key={pageNumber} className="px-1 text-sm text-[#8d8477]">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          }

                          return (
                            <button
                              key={pageNumber}
                              type="button"
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-medium transition-all duration-300 ${
                                currentPage === pageNumber
                                  ? 'bg-[#171412] text-white shadow-[0_14px_30px_-18px_rgba(23,20,18,0.46)]'
                                  : 'border border-[#ddd3c3] bg-white text-[#5a544b] hover:bg-[#f4efe6]'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                          disabled={currentPage === totalPages}
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ddd3c3] bg-white text-[#5a544b] transition-colors hover:bg-[#f4efe6] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <CaretRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-8 rounded-[2.5rem] border border-dashed border-[#d7ccb9] bg-white/70 px-6 py-16 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f2ebe0] text-[#8a5a00]">
                    <Package className="h-8 w-8" />
                  </div>
                  <h3 className="mt-5 font-heading text-2xl font-semibold tracking-tight text-[#171412]">
                    {hasRecoverableEmptyState ? 'Bộ lọc đang che mất kết quả' : 'Không có kết quả phù hợp'}
                  </h3>
                  <p className="mx-auto mt-3 max-w-[50ch] text-sm leading-6 text-[#6b655b]">
                    {hasRecoverableEmptyState
                      ? `Hiện vẫn có ${products.length.toLocaleString('vi-VN')} sản phẩm trong tập kết quả cho “${searchQuery.trim()}”, nhưng các bộ lọc đang chọn loại hết danh sách hiển thị.`
                      : 'Thử bỏ bớt bộ lọc, đổi khoảng giá hoặc dùng từ khóa ngắn gọn hơn để tìm lại.'}
                  </p>

                  {hasRecoverableEmptyState && (
                    <div className="mx-auto mt-8 flex max-w-[52rem] flex-col items-center gap-5">
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={clearAllFilters}
                          className="rounded-full bg-[#171412] px-5 py-2.5 text-sm font-medium text-white transition-transform duration-300 hover:-translate-y-0.5"
                        >
                          Xem lại toàn bộ kết quả
                        </button>
                        {selectedPriceRange && (
                          <button
                            type="button"
                            onClick={() => setSelectedPriceRange(null)}
                            className="rounded-full border border-[#dccdb5] bg-white px-4 py-2 text-sm font-medium text-[#2f2a24] transition-colors hover:border-[#ca8a04]"
                          >
                            Bỏ lọc giá
                          </button>
                        )}
                        {featuredOnly && (
                          <button
                            type="button"
                            onClick={() => setFeaturedOnly(false)}
                            className="rounded-full border border-[#dccdb5] bg-white px-4 py-2 text-sm font-medium text-[#2f2a24] transition-colors hover:border-[#ca8a04]"
                          >
                            Bỏ ưu tiên nổi bật
                          </button>
                        )}
                      </div>

                      {recoveryCategoryOptions.length > 0 && (
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#8d8477]">
                            Thử mở theo ngành hàng còn kết quả
                          </span>
                          <div className="flex flex-wrap justify-center gap-2">
                            {recoveryCategoryOptions.map((category) => (
                              <button
                                key={`recovery-category-${category.id}`}
                                type="button"
                                onClick={() => setSelectedCategoryIds([category.id as number])}
                                className="rounded-full border border-[#dccdb5] bg-white px-3 py-1.5 text-xs font-medium text-[#2f2a24] transition-colors hover:border-[#ca8a04]"
                              >
                                {category.label} · {category.count}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedBrandIds.length > 0 && recoveryBrandOptions.length > 0 && (
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#8d8477]">
                            Hoặc đổi sang thương hiệu khác trong cùng tập kết quả
                          </span>
                          <div className="flex flex-wrap justify-center gap-2">
                            {recoveryBrandOptions.map((brand) => (
                              <button
                                key={`recovery-brand-${brand.id}`}
                                type="button"
                                onClick={() => setSelectedBrandIds([brand.id as string])}
                                className="rounded-full border border-[#dccdb5] bg-white px-3 py-1.5 text-xs font-medium text-[#2f2a24] transition-colors hover:border-[#ca8a04]"
                              >
                                {brand.label} · {brand.count}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}
