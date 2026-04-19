'use client';

import React, {
  Suspense,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Camera,
  ChevronRight,
  Heart,
  Laptop,
  Plus,
  Search,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Watch,
  Zap,
} from 'lucide-react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Skeleton } from '@/components/common/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { categoryApi, productApi, recommendationApi } from '@/lib/api';
import { buildProductPath, formatPrice } from '@/lib/utils';
import type { Category, Product, ProductVariant } from '@/types';
import toast from 'react-hot-toast';

const INITIAL_VISIBLE_PRODUCTS = 16;

type SortOption = 'featured' | 'price-low' | 'price-high' | 'newest';

// ─── Category icon map ────────────────────────────────────────────
const categoryIconMap: Record<string, React.ElementType> = {
  laptop: Laptop,
  'may-tinh': Laptop,
  'dien-thoai': Smartphone,
  phone: Smartphone,
  'thiet-bi-deo': Watch,
  wearable: Watch,
  'nhiet-anh': Camera,
  camera: Camera,
};

function getCategoryIcon(slug: string): React.ElementType {
  const lower = slug.toLowerCase();
  for (const key of Object.keys(categoryIconMap)) {
    if (lower.includes(key)) return categoryIconMap[key];
  }
  return Laptop;
}

// ─── Hero banners ───────────────────────────────────────────────
const heroBanners = [
  {
    id: 1,
    eyebrow: 'TRUY CẬP SỚM',
    title: 'Góc Làm Việc Chuyên Nghiệp.',
    description:
      'Thiết bị hiệu năng cao được tuyển chọn cho nhà sáng tạo và lập trình viên. Giảm giá lên đến 30% cho các thiết lập được chọn.',
    cta: 'Mua sắm ngay',
    ctaHref: '/?category=laptop#catalog',
    bg: 'from-[#0d1117] via-[#161b22] to-[#0d1117]',
    accent: '#CA8A04',
    imageSrc: '/hero/workspace.jpg',
    size: 'large',
  },
];

const heroSideCards = [
  {
    id: 2,
    title: 'Âm Thanh Di Động',
    description: 'Tai nghe & loa cầm tay cao cấp.',
    cta: 'Khám phá',
    ctaHref: '/?category=am-thanh#catalog',
    bg: 'from-[#0a1628] to-[#1a2d4a]',
    imageSrc: '/hero/audio.jpg',
  },
  {
    id: 3,
    title: 'Góc Gaming',
    description: 'Máy chơi game & phụ kiện thế hệ mới.',
    cta: 'Nâng cấp →',
    ctaHref: '/?category=gaming#catalog',
    bg: 'from-[#1a0a2e] to-[#2d1b4a]',
    imageSrc: '/hero/gaming.jpg',
  },
];

// ─── Helper functions ───────────────────────────────────────────
function getFallbackProductImage(productId: number) {
  return `https://picsum.photos/seed/technova-product-${productId}/900/900`;
}

function findCategoryInTree(
  categories: Category[],
  matcher: (category: Category) => boolean,
): Category | null {
  for (const category of categories) {
    if (matcher(category)) return category;
    const nested = findCategoryInTree(category.children || [], matcher);
    if (nested) return nested;
  }
  return null;
}

function sortProducts(products: Product[], sortBy: SortOption) {
  const next = [...products];
  switch (sortBy) {
    case 'price-low':
      return next.sort((a, b) => a.base_price - b.base_price);
    case 'price-high':
      return next.sort((a, b) => b.base_price - a.base_price);
    case 'newest':
      return next.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    case 'featured':
    default:
      return next.sort(
        (a, b) =>
          Number(b.is_featured) - Number(a.is_featured) ||
          (b.sold_count ?? 0) - (a.sold_count ?? 0),
      );
  }
}

function HomeSearchParamsSync({
  onQueryChange,
  onCategoryChange,
}: {
  onQueryChange: (q: string) => void;
  onCategoryChange: (c: string) => void;
}) {
  const searchParams = useSearchParams();
  useEffect(() => {
    onQueryChange(searchParams.get('q') || '');
    onCategoryChange(searchParams.get('category') || '');
  }, [onCategoryChange, onQueryChange, searchParams]);
  return null;
}

// ─── Star rating component ──────────────────────────────────────
function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <= Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : star <= rating
                  ? 'fill-amber-200 text-amber-400'
                  : 'fill-gray-200 text-gray-300'
            }`}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-gray-500">({count.toLocaleString('vi-VN')})</span>
      )}
    </div>
  );
}

// ─── Product card skeleton ──────────────────────────────────────
function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <Skeleton className="aspect-square w-full" rounded="none" />
      <div className="space-y-2.5 p-4">
        <Skeleton height="12px" className="w-1/3" />
        <Skeleton height="18px" className="w-4/5" />
        <Skeleton height="14px" className="w-2/3" />
        <Skeleton height="20px" className="w-1/2" />
      </div>
    </div>
  );
}

// ─── Empty catalog state ────────────────────────────────────────
function EmptyCatalogState({ searchTooShort }: { searchTooShort: boolean }) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-20 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <Search className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-xl font-semibold text-gray-900">
        {searchTooShort ? 'Nhập thêm để tìm chính xác hơn' : 'Không tìm thấy sản phẩm phù hợp'}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        {searchTooShort
          ? 'Tìm kiếm nên có ít nhất 2 ký tự.'
          : 'Hãy thử đổi từ khóa hoặc bỏ bớt bộ lọc.'}
      </p>
    </div>
  );
}

// ─── Product card ───────────────────────────────────────────────
function ProductCard({
  product,
  onProductClick,
}: {
  product: Product;
  onProductClick?: () => void;
}) {
  const { isInWishlist, toggleWishlist } = useWishlist();

  const primaryImage =
    product.images?.find((img) => img.is_primary)?.image_url ||
    product.images?.[0]?.image_url ||
    product.primary_image ||
    getFallbackProductImage(product.id);

  const href = buildProductPath(product);
  const categoryLabel = product.category?.name ?? 'Thiết bị';
  const brandLabel = product.brand?.name;
  const soldCount = product.sold_count ?? 0;
  const discount = product.compare_at_price
    ? Math.round(
        ((product.compare_at_price - product.base_price) / product.compare_at_price) * 100,
      )
    : null;

  // Use a fake but consistent rating derived from sold_count
  const fakeRating = Math.min(5, 3.5 + (soldCount % 20) / 26.7);
  const fakeReviewCount = Math.floor(soldCount / 3) + 4;

  // Find first active variant for wishlist actions
  const firstVariant: ProductVariant | undefined = product.variants?.find((v) => v.is_active);

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstVariant) return;
    await toggleWishlist(firstVariant.id);
  };

  const wishlisted = firstVariant ? isInWishlist(firstVariant.id) : false;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Image */}
      <Link href={href} onClick={onProductClick} className="relative block aspect-square overflow-hidden bg-gray-50">
        {/* Discount badge */}
        {discount && discount > 0 ? (
          <span className="absolute left-3 top-3 z-10 rounded-md bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
            GIẢM {discount}%
          </span>
        ) : product.is_featured ? (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">
            <Sparkles className="h-3 w-3" />
            BÁN CHẠY NHẤT
          </span>
        ) : null}

        {/* Wishlist button */}
        <button
          type="button"
          aria-label={wishlisted ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          onClick={handleWishlist}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'}`}
          />
        </button>

        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.04]"
        />
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category + brand */}
        <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] text-gray-400">
          <span className="truncate font-medium uppercase tracking-wide">{categoryLabel}</span>
          {brandLabel && (
            <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">
              {brandLabel}
            </span>
          )}
        </div>

        {/* Name */}
        <Link href={href} onClick={onProductClick}>
          <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover:text-amber-700">
            {product.name}
          </h3>
        </Link>

        {/* Stars */}
        <StarRating rating={fakeRating} count={fakeReviewCount} />

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-gray-900">{formatPrice(product.base_price)}</span>
          {product.compare_at_price && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>

        {/* Sold count */}
        {soldCount > 0 && (
          <p className="mt-1 text-[11px] text-gray-400">
            Đã bán {soldCount.toLocaleString('vi-VN')}
          </p>
        )}
      </div>
    </article>
  );
}

// ─── Hero section ───────────────────────────────────────────────
function HeroSection() {
  const banner = heroBanners[0];
  return (
    <section className="mt-6 px-4 pb-8 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          {/* Main banner */}
          <div
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${banner.bg} min-h-[340px] lg:min-h-[400px]`}
          >
            <div className="absolute inset-0">
              <Image
                src={banner.imageSrc}
                alt={banner.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 65vw"
                className="object-cover opacity-40 animate-banner-pan"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            </div>
            <div className="relative z-10 flex h-full flex-col justify-end p-8 lg:p-10">
              <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.22em] text-amber-400">
                {banner.eyebrow}
              </span>
              <h2 className="mb-3 max-w-md font-heading text-3xl font-bold leading-tight text-white sm:text-4xl">
                {banner.title}
              </h2>
              <p className="mb-6 max-w-sm text-sm leading-6 text-gray-300">{banner.description}</p>
              <Link
                href={banner.ctaHref}
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                {banner.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Side cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
            {heroSideCards.map((card) => (
              <Link
                key={card.id}
                href={card.ctaHref}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.bg} min-h-[160px] transition hover:opacity-90`}
              >
                <div className="absolute inset-0">
                  <Image
                    src={card.imageSrc}
                    alt={card.title}
                    fill
                    sizes="340px"
                    className="object-cover opacity-30 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                </div>
                <div className="relative z-10 flex h-full flex-col justify-end p-5">
                  <h3 className="font-heading text-lg font-bold text-white">{card.title}</h3>
                  <p className="mt-1 text-xs text-gray-300">{card.description}</p>
                  <span className="mt-3 text-xs font-semibold text-amber-400">{card.cta}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Category tiles ─────────────────────────────────────────────
function CategorySection({
  categories,
  selectedCategory,
  onSelect,
}: {
  categories: Category[];
  selectedCategory: number | null;
  onSelect: (id: number | null) => void;
}) {
  if (categories.length === 0) return null;

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-gray-900">Danh mục thịnh hành</h2>
            <p className="mt-0.5 text-sm text-gray-500">Khám phá những sản phẩm phổ biến hôm nay.</p>
          </div>
          <Link
            href="/#catalog"
            className="flex items-center gap-1 text-sm font-semibold text-amber-600 hover:text-amber-700"
          >
            Xem tất cả
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          {categories.slice(0, 8).map((cat) => {
            const Icon = getCategoryIcon(cat.slug || cat.name);
            const isActive = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelect(isActive ? null : cat.id)}
                className={`flex flex-col items-center gap-2.5 rounded-2xl border p-5 transition-all duration-150 ${
                  isActive
                    ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm'
                    : 'border-gray-100 bg-white text-gray-700 hover:border-amber-200 hover:bg-amber-50/50'
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    isActive ? 'bg-amber-100' : 'bg-gray-100'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-center text-sm font-semibold leading-tight">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Personalized section ───────────────────────────────────────
function PersonalizedSection({
  products,
  loading,
  reasons,
  title,
  subtitle,
  onProductClick,
}: {
  products: Product[];
  loading: boolean;
  reasons: Record<number, string>;
  title: string;
  subtitle: string;
  onProductClick?: (product: Product) => void;
}) {
  if (!loading && products.length === 0) return null;

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">{title}</p>
          <h2 className="mt-1.5 font-heading text-xl font-bold text-gray-900">{subtitle}</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={`rec-skeleton-${i}`} />
              ))
            : products.map((product) => (
                <div key={product.id} className="space-y-2">
                  <ProductCard
                    product={product}
                    onProductClick={() => onProductClick?.(product)}
                  />
                  {reasons[product.id] && (
                    <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                      ✦ {reasons[product.id]}
                    </p>
                  )}
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

// ─── Catalog toolbar ────────────────────────────────────────────
function CatalogToolbar({
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  totalCount,
  selectedCategoryLabel,
}: {
  categories: Category[];
  selectedCategory: number | null;
  onCategoryChange: (id: number | null) => void;
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  totalCount: number;
  selectedCategoryLabel: string | null;
}) {
  return (
    <div className="sticky top-[68px] z-40 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => onCategoryChange(null)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedCategory === null
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-200 bg-white text-gray-700 hover:border-amber-400'
              }`}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === cat.id
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-200 bg-white text-gray-700 hover:border-amber-400'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Sort + count */}
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{totalCount}</span> sản phẩm
              {selectedCategoryLabel ? ` · ${selectedCategoryLabel}` : ''}
            </span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-amber-400"
            >
              <option value="featured">Nổi bật</option>
              <option value="price-low">Giá tăng dần</option>
              <option value="price-high">Giá giảm dần</option>
              <option value="newest">Mới cập nhật</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page content ──────────────────────────────────────────
const defaultRecommendationCopy = {
  title: 'Dành cho bạn',
  subtitle: 'Những lựa chọn theo hành vi mua sắm của bạn',
};

const fallbackRecommendationCopy = {
  title: 'Xu hướng nổi bật',
  subtitle: 'Những sản phẩm đang được xem nhiều hôm nay',
};

function HomePageContent() {
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categoryFilterSlug, setCategoryFilterSlug] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PRODUCTS);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [personalizedProducts, setPersonalizedProducts] = useState<Product[]>([]);
  const [personalizedReasons, setPersonalizedReasons] = useState<Record<number, string>>({});
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
  const [recommendationCopy, setRecommendationCopy] = useState(defaultRecommendationCopy);

  const trackedImpressionsRef = useRef<Set<string>>(new Set());
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());
  const searchTooShort = deferredSearchQuery.length > 0 && deferredSearchQuery.length < 2;

  // Load categories
  useEffect(() => {
    let active = true;
    categoryApi.getCategoryTree().then((tree) => {
      if (active) setCategories(tree || []);
    }).catch(() => {
      if (active) setCategories([]);
    });
    return () => { active = false; };
  }, []);

  // Resolve category filter slug
  useEffect(() => {
    if (!categoryFilterSlug) { setSelectedCategory(null); return; }
    const matched = findCategoryInTree(
      categories,
      (c) => c.slug === categoryFilterSlug || String(c.id) === categoryFilterSlug,
    );
    setSelectedCategory(matched?.id ?? null);
  }, [categories, categoryFilterSlug]);

  // Load personalized recommendations
  useEffect(() => {
    let active = true;

    const fallback = async () => {
      const fp = await productApi.getFeaturedProducts(4).catch(() => []);
      if (!active) return;
      setPersonalizedProducts(fp);
      setPersonalizedReasons(
        fp.reduce<Record<number, string>>((acc, p) => {
          acc[p.id] = p.is_featured ? 'sản phẩm nổi bật' : 'được nhiều khách hàng quan tâm';
          return acc;
        }, {}),
      );
      setRecommendationCopy(fallbackRecommendationCopy);
    };

    const load = async () => {
      if (!user?.id) { await fallback(); return; }
      try {
        setPersonalizedLoading(true);
        const resp = await recommendationApi.getRecommendations(user.id, { limit: 4, strategy: 'hybrid' });
        if (!resp.recommendations.length) { await fallback(); return; }
        const loaded = await Promise.all(
          resp.recommendations.map((r) => productApi.getProductById(r.productId).catch(() => null)),
        );
        if (!active) return;
        setPersonalizedProducts(loaded.filter((p): p is Product => Boolean(p)));
        setPersonalizedReasons(
          resp.recommendations.reduce<Record<number, string>>((acc, r) => {
            acc[r.productId] = r.reason;
            return acc;
          }, {}),
        );
        setRecommendationCopy(defaultRecommendationCopy);
      } catch {
        if (active) await fallback();
      } finally {
        if (active) setPersonalizedLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [user?.id]);

  // Track recommendation impressions
  useEffect(() => {
    if (!user?.id || personalizedProducts.length === 0) return;
    personalizedProducts.forEach((p) => {
      const key = `homepage:${p.id}`;
      if (trackedImpressionsRef.current.has(key)) return;
      trackedImpressionsRef.current.add(key);
      recommendationApi.trackBehavior({
        userId: user.id,
        behaviorType: 'view',
        productId: p.id,
        categoryId: p.category?.id,
        metadata: { event: 'impression', source: 'homepage_personalized' },
      }).catch(() => trackedImpressionsRef.current.delete(key));
    });
  }, [user?.id, personalizedProducts]);

  // Load catalog
  useEffect(() => {
    let active = true;
    const loadCatalog = async () => {
      if (searchTooShort) { setProducts([]); setError(null); setLoading(false); return; }
      try {
        setLoading(true);
        setError(null);
        if (deferredSearchQuery) {
          const resp = await productApi.searchProducts(deferredSearchQuery, 50);
          if (active) setProducts(resp.data || []);
          return;
        }
        const resp = await productApi.getAllProducts({ limit: 50, category_id: selectedCategory ?? undefined });
        if (active) setProducts(resp.data || []);
      } catch {
        if (active) { setError('Không thể tải dữ liệu. Vui lòng thử lại.'); toast.error('Không thể tải sản phẩm'); }
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadCatalog();
    return () => { active = false; };
  }, [deferredSearchQuery, searchTooShort, selectedCategory]);

  useEffect(() => { setVisibleCount(INITIAL_VISIBLE_PRODUCTS); }, [deferredSearchQuery, selectedCategory, sortBy]);

  const selectedCategoryLabel = useMemo(
    () => findCategoryInTree(categories, (c) => c.id === selectedCategory)?.name ?? null,
    [categories, selectedCategory],
  );

  const sortedProducts = useMemo(() => sortProducts(products, sortBy), [products, sortBy]);
  const visibleProducts = useMemo(() => sortedProducts.slice(0, visibleCount), [sortedProducts, visibleCount]);

  const catalogTitle = deferredSearchQuery
    ? `Kết quả cho "${deferredSearchQuery}"`
    : selectedCategoryLabel || 'Tất cả sản phẩm';

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      <a
        href="#main-content"
        className="sr-only left-4 top-4 z-50 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute"
      >
        Bỏ qua điều hướng
      </a>

      <Suspense fallback={null}>
        <HomeSearchParamsSync
          onQueryChange={setSearchQuery}
          onCategoryChange={setCategoryFilterSlug}
        />
      </Suspense>

      <Header />

      <main id="main-content" className="pt-[68px]">
        {/* Hero */}
        <HeroSection />

        {/* Category tiles */}
        <CategorySection
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Personalized recommendations */}
        <PersonalizedSection
          products={personalizedProducts}
          loading={personalizedLoading}
          reasons={personalizedReasons}
          title={recommendationCopy.title}
          subtitle={recommendationCopy.subtitle}
          onProductClick={(p) => {
            if (!user?.id) return;
            recommendationApi.trackBehavior({
              userId: user.id,
              behaviorType: 'view',
              productId: p.id,
              categoryId: p.category?.id,
              metadata: { source: 'homepage_personalized' },
            }).catch(console.error);
          }}
        />

        {/* Catalog toolbar */}
        <CatalogToolbar
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalCount={sortedProducts.length}
          selectedCategoryLabel={selectedCategoryLabel}
        />

        {/* Catalog grid */}
        <section id="catalog" className="scroll-mt-32 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-6">
              <h2 className="font-heading text-xl font-bold text-gray-900">{catalogTitle}</h2>
              {!deferredSearchQuery && (
                <p className="mt-1 text-sm text-gray-500">
                  Danh mục sắp theo mức độ đáng xem trước.
                </p>
              )}
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <ProductCardSkeleton key={`catalog-skeleton-${i}`} />
                  ))
                : visibleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
              {!loading && !visibleProducts.length && (
                <EmptyCatalogState searchTooShort={searchTooShort} />
              )}
            </div>

            {!loading && visibleCount < sortedProducts.length && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + INITIAL_VISIBLE_PRODUCTS)}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-amber-400 hover:text-amber-700"
                >
                  <Plus className="h-4 w-4" />
                  Xem thêm sản phẩm
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Trust signals footer strip */}
        <section className="border-t border-gray-100 bg-white px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1280px] gap-6 sm:grid-cols-3">
            {[
              { icon: Zap, title: 'Giao hàng cao cấp miễn phí', desc: 'Cho đơn hàng từ 500.000₫ trở lên, giao trong 3 ngày làm việc.' },
              { icon: ShoppingCart, title: 'Đổi trả dễ dàng', desc: 'Hoàn tiền 100% trong vòng 30 ngày nếu sản phẩm không như mô tả.' },
              { icon: Star, title: 'Được đánh giá cao', desc: 'Hơn 50.000 khách hàng đánh giá 4.8/5 cho dịch vụ của chúng tôi.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}
