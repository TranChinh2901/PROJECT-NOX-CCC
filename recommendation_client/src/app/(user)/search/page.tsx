'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CaretLeft,
  CaretRight,
  CheckCircle,
  ClockCounterClockwise,
  FadersHorizontal,
  MagnifyingGlass,
  Package,
  Sparkle,
  TrendUp,
  WarningCircle,
} from '@phosphor-icons/react';
import { ShoppingCart, Star } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Skeleton } from '@/components/common/Skeleton';
import { productApi, recommendationApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types';
import { buildProductPath, formatPrice } from '@/lib/utils';

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
  { id: '20-35', label: '20 - 35 triệu', min: 20_000_000, max: 35_000_000 },
  { id: '35-50', label: '35 - 50 triệu', min: 35_000_000, max: 50_000_000 },
  { id: 'above-50', label: 'Trên 50 triệu', min: 50_000_000 },
];



const getFallbackProductImage = (productId: number) =>
  `https://picsum.photos/seed/search-product-${productId}/900/900`;

const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

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

const getSearchableProductText = (product: Product) =>
  normalizeSearchText(
    [
      product.name,
      product.sku,
      product.description,
      product.short_description,
      product.category?.name,
      product.brand?.name,
    ]
      .filter(Boolean)
      .join(' '),
  );

const matchesProductQuery = (product: Product, query: string) => {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return true;
  }

  const searchableText = getSearchableProductText(product);
  return tokens.every((token) => searchableText.includes(token));
};

const uniqueProductsById = (products: Product[]) => {
  const productMap = new Map<number, Product>();
  products.forEach((product) => productMap.set(product.id, product));
  return Array.from(productMap.values());
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
    product.primary_image ||
    getFallbackProductImage(product.id);
  const destinationHref = buildProductPath(product);
  const categoryLabel = product.category?.name ?? 'Thiết bị';
  const brandLabel = getBrandLabel(product);
  const soldCount = product.sold_count ?? 0;

  // Derive a consistent fake rating from sold_count for display
  const fakeRating = Math.min(5, 3.5 + (soldCount % 20) / 26.7);
  const fakeReviewCount = Math.max(1, Math.floor(soldCount / 3) + 4);
  const roundedRating = Math.round(fakeRating * 10) / 10;

  const isLowStock = soldCount > 0 && soldCount < 5;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Image */}
      <Link href={destinationHref} className="relative block aspect-square overflow-hidden bg-gray-50">
        {discount && discount > 0 ? (
          <span className="absolute left-3 top-3 z-10 rounded-md bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
            GIẢM {discount}%
          </span>
        ) : product.is_featured ? (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">
            <Sparkle className="h-3 w-3" weight="fill" />
            BÁN CHẠY
          </span>
        ) : null}

        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.04]"
        />
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col p-4">
        {/* Brand badge */}
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-medium uppercase tracking-wide text-gray-400">
            {categoryLabel}
          </span>
          <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">
            {brandLabel}
          </span>
        </div>

        {/* Name */}
        <Link href={destinationHref}>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 transition group-hover:text-amber-700">
            {product.name}
          </h3>
        </Link>

        {/* Stars */}
        <div className="mt-1.5 flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3.5 w-3.5 ${star <= Math.round(roundedRating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-300'}`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">({fakeReviewCount.toLocaleString('vi-VN')})</span>
        </div>

        {/* Short description */}
        {product.short_description && (
          <p className="mt-1 line-clamp-1 text-xs text-gray-500">{product.short_description}</p>
        )}

        <div className="mt-auto pt-3">
          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-gray-900">{formatPrice(product.base_price)}</span>
            {product.compare_at_price && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(product.compare_at_price)}</span>
            )}
          </div>

          {/* Sold / urgency */}
          {isLowStock ? (
            <p className="mt-1 text-[11px] font-semibold text-orange-600">
              Chỉ còn {soldCount} sản phẩm
            </p>
          ) : soldCount > 0 ? (
            <p className="mt-0.5 text-[11px] text-gray-400">
              Đã bán {soldCount.toLocaleString('vi-VN')}
            </p>
          ) : null}

          {/* Add to cart */}
          <Link
            href={destinationHref}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            <ShoppingCart className="h-4 w-4" />
            Xem chi tiết
          </Link>
        </div>
      </div>
    </article>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

function SearchPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
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

  const syncSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setSearchInput(query);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, selectedBrandIds, selectedCategoryIds, selectedPriceRange, featuredOnly]);

  useEffect(() => {
    let isActive = true;

    const getFallbackSearchResults = async (query: string) => {
      const apiFilteredProducts = await productApi
        .getAllProducts({ limit: 100, search: query })
        .then((response) => response.data || [])
        .catch(() => []);

      if (apiFilteredProducts.length > 0) {
        return apiFilteredProducts;
      }

      const productPool = await productApi
        .getAllProducts({ limit: 100 })
        .then((response) => response.data || []);

      return productPool.filter((product) => matchesProductQuery(product, query));
    };

    const runSearch = async () => {
      const trimmedQuery = searchQuery.trim();

      try {
        setLoading(true);
        setError(null);

        if (!trimmedQuery) {
          const productsData = await productApi.getAllProducts({ limit: 80 });
          if (isActive) {
            setProducts(productsData.data || []);
          }
          return;
        }

        if (trimmedQuery.length < 2) {
          if (isActive) {
            setProducts([]);
          }
          return;
        }

        let directResults: Product[] = [];

        try {
          const response = await productApi.searchProducts(trimmedQuery, 100);
          directResults = response.data || [];
        } catch (searchEndpointError) {
          console.warn('Product search endpoint failed, using fallback search:', searchEndpointError);
        }

        const fallbackResults = directResults.length === 0
          ? await getFallbackSearchResults(trimmedQuery)
          : [];

        if (isActive) {
          setProducts(uniqueProductsById([...directResults, ...fallbackResults]));
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

  const availableBrandIdSet = useMemo(
    () => new Set(availableBrands.map((brand) => brand.id as string)),
    [availableBrands],
  );

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

  const activeFilterCount =
    selectedBrandIds.length +
    selectedCategoryIds.length +
    (selectedPriceRange ? 1 : 0) +
    (featuredOnly ? 1 : 0);

  const discoveryTitle = searchQuery.trim()
    ? `Kết quả cho "${searchQuery.trim()}"`
    : 'Tất cả sản phẩm';

  const resultSummary = loading
    ? 'Đang tải kết quả...'
    : `${filteredProducts.length.toLocaleString('vi-VN')} sản phẩm`;

  const handleBrandToggle = (brandId: string) => {
    setSelectedBrandIds((current) =>
      current.includes(brandId) ? current.filter((item) => item !== brandId) : [...current, brandId],
    );
  };

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId) ? current.filter((item) => item !== categoryId) : [...current, categoryId],
    );
  };

  const clearAllFilters = () => {
    setSelectedBrandIds([]);
    setSelectedCategoryIds([]);
    setSelectedPriceRange(null);
    setFeaturedOnly(false);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedInput = searchInput.trim();
    clearAllFilters();
    setSearchQuery(trimmedInput.length >= 2 ? trimmedInput : '');

    router.push(trimmedInput.length >= 2 ? `/search?q=${encodeURIComponent(trimmedInput)}` : '/search');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f7] pt-[68px]">
      <Suspense fallback={null}>
        <SearchSearchParamsSync onQueryChange={syncSearchQuery} />
      </Suspense>
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          {/* Search header */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">Tìm kiếm</p>
                <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  {discoveryTitle}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Nhập tên sản phẩm, thương hiệu, SKU hoặc nhóm hàng.
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-left lg:min-w-44">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Đang hiển thị</p>
                <p className="mt-1 text-2xl font-bold text-gray-900" aria-live="polite">{resultSummary}</p>
              </div>
            </div>

            <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <MagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Ví dụ: laptop gaming, tai nghe, Dell..."
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-base text-gray-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                  aria-label="Từ khóa tìm kiếm"
                />
              </div>
              <button
                type="submit"
                className="h-12 rounded-xl bg-amber-500 px-6 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                Tìm kiếm
              </button>
            </form>

            {searchInput.trim().length === 1 && (
              <p className="mt-3 text-sm text-amber-600">Nhập ít nhất 2 ký tự để tìm kiếm.</p>
            )}
          </section>

          {/* Sort / filter toolbar */}
          <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <FadersHorizontal className="h-4 w-4" />
                  Sắp xếp
                </span>
                {SORT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = sortBy === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSortBy(option.id)}
                      className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition ${
                        isActive
                          ? 'bg-gray-900 text-white'
                          : 'border border-gray-200 bg-white text-gray-700 hover:border-amber-400'
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
                    setSortBy(event.target.value !== 'price_default' ? (event.target.value as SortOption) : 'relevance');
                  }}
                  className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-amber-400"
                >
                  <option value="price_default">Giá</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-amber-400"
                  >
                    Xóa lọc ({activeFilterCount})
                  </button>
                )}
                <span className="text-sm text-gray-500">
                  {filteredProducts.length === 0 ? 0 : currentPage}/{totalPages}
                </span>
                <div className="flex overflow-hidden rounded-xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1 || filteredProducts.length === 0}
                    className="flex h-9 w-9 items-center justify-center bg-white text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CaretLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages || filteredProducts.length === 0}
                    className="flex h-9 w-9 items-center justify-center border-l border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CaretRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="space-y-3 lg:sticky lg:top-28 lg:self-start">
              <FilterSection title="Danh mục">
                {availableCategories.length > 0 ? (
                  availableCategories.slice(0, 8).map((category) => {
                    const isActive = selectedCategoryIds.includes(category.id as number);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategoryToggle(category.id as number)}
                        className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                          isActive
                            ? 'border-amber-400 bg-amber-50 text-amber-800'
                            : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-amber-300'
                        }`}
                      >
                        {category.label} <span className="text-gray-400">({category.count})</span>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-400">Chưa có danh mục.</p>
                )}
              </FilterSection>

              <FilterSection title="Thương hiệu">
                {availableBrands.length > 0 ? (
                  availableBrands.slice(0, 10).map((brand) => {
                    const isActive = selectedBrandIds.includes(brand.id as string);
                    return (
                      <button
                        key={brand.id}
                        type="button"
                        onClick={() => handleBrandToggle(brand.id as string)}
                        className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                          isActive
                            ? 'border-amber-400 bg-amber-50 text-amber-800'
                            : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-amber-300'
                        }`}
                      >
                        {brand.label} <span className="text-gray-400">({brand.count})</span>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-400">Chưa có thương hiệu.</p>
                )}
              </FilterSection>

              <FilterSection title="Khoảng giá">
                {PRICE_RANGES.map((range) => {
                  const isActive = selectedPriceRange === range.id;
                  return (
                    <button
                      key={range.id}
                      type="button"
                      onClick={() => setSelectedPriceRange((c) => (c === range.id ? null : range.id))}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'border-amber-400 bg-amber-50 text-amber-800'
                          : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-amber-300'
                      }`}
                    >
                      {isActive && <CheckCircle className="h-4 w-4" weight="fill" />}
                      {range.label}
                    </button>
                  );
                })}
              </FilterSection>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-sm font-medium text-gray-800 shadow-sm">
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(event) => setFeaturedOnly(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                />
                Chỉ xem sản phẩm nổi bật
              </label>
            </aside>

            <section className="min-w-0">
              {activeFilterCount > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">Đang lọc:</span>
                  {selectedCategoryIds.map((categoryId) => {
                    const category = availableCategories.find((item) => item.id === categoryId);
                    if (!category) return null;
                    return (
                      <button
                        key={`category-${categoryId}`}
                        type="button"
                        onClick={() => handleCategoryToggle(categoryId)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                      >
                        {category.label} ×
                      </button>
                    );
                  })}
                  {selectedBrandIds.map((brandId) => (
                    <button
                      key={`brand-${brandId}`}
                      type="button"
                      onClick={() => handleBrandToggle(brandId)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                    >
                      {brandId} ×
                    </button>
                  ))}
                  {selectedPriceRange && (
                    <button
                      type="button"
                      onClick={() => setSelectedPriceRange(null)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                    >
                      {PRICE_RANGES.find((item) => item.id === selectedPriceRange)?.label} ×
                    </button>
                  )}
                  {featuredOnly && (
                    <button
                      type="button"
                      onClick={() => setFeaturedOnly(false)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                    >
                      Nổi bật ×
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-500 transition hover:border-red-300 hover:text-red-600"
                  >
                    Xóa tất cả
                  </button>
                </div>
              )}

              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                      <Skeleton className="aspect-square w-full" rounded="none" />
                      <div className="space-y-2.5 p-4">
                        <Skeleton height="12px" className="w-1/3" />
                        <Skeleton height="18px" className="w-4/5" />
                        <Skeleton height="14px" className="w-2/3" />
                        <Skeleton height="20px" className="w-1/2" />
                        <Skeleton height="36px" className="w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-red-100 bg-white px-6 py-16 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <WarningCircle className="h-8 w-8" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-gray-900">Không thể tải kết quả</h3>
                  <p className="mx-auto mt-3 max-w-[48ch] text-sm leading-6 text-gray-500">{error}</p>
                </div>
              ) : paginatedProducts.length > 0 ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {paginatedProducts.map((product) => (
                      <SearchProductCard key={product.id} product={product} />
                    ))}
                  </div>


                  {totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                          disabled={currentPage === 1}
                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
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
                                <span key={pageNumber} className="px-1 text-sm text-gray-400">
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
                              className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition ${
                                currentPage === pageNumber
                                  ? 'bg-gray-900 text-white'
                                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
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
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <CaretRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
                    <Package className="h-8 w-8" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-gray-900">
                    {hasRecoverableEmptyState ? 'Bộ lọc đang che mất kết quả' : 'Không có kết quả phù hợp'}
                  </h3>
                  <p className="mx-auto mt-3 max-w-[50ch] text-sm leading-6 text-gray-500">
                    {hasRecoverableEmptyState
                      ? `Có ${products.length.toLocaleString('vi-VN')} sản phẩm trong tập kết quả, nhưng bộ lọc hiện tại đã loại hết.`
                      : 'Thử từ khóa ngắn hơn, bỏ dấu hoặc tìm theo thương hiệu như Dell, Asus, Lenovo.'}
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                      >
                        Xóa bộ lọc
                      </button>
                    )}
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => { setSearchInput(''); setSearchQuery(''); router.push('/search'); }}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-amber-400"
                      >
                        Xem tất cả sản phẩm
                      </button>
                    )}
                  </div>
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
