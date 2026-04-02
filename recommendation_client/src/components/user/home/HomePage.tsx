'use client';

import React, { Suspense, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { GlassCard } from '../../ui/GlassCard';
import { Header } from '../../layout/Header';
import { Footer } from '../../layout/Footer';
import { Skeleton } from '../../common/Skeleton';
import { productApi, categoryApi } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { Product, Category } from '@/types';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { 
  ArrowRight,
  BadgeCheck,
  Search, 
  ShieldCheck,
  ShoppingCart, 
  Filter,
  Sparkles,
  Truck,
  Zap,
} from 'lucide-react';

const featuredDeals = [
  { title: 'Giảm đến 30% Laptop', subtitle: 'Tiết kiệm cho thiết bị cao cấp', color: '#CA8A04', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=400&fit=crop' },
  { title: 'Bộ Sưu Tập Âm Thanh Mới', subtitle: 'Trải nghiệm âm thanh sống động', color: '#3B82F6', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=400&fit=crop' },
  { title: 'Phụ Kiện Gaming', subtitle: 'Nâng cấp thiết bị của bạn', color: '#8B5CF6', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop' },
];

const expertiseSignals = [
  {
    icon: ShieldCheck,
    title: 'Tư vấn cấu hình thực chiến',
    description: 'Chọn đúng thiết bị cho học tập, sáng tạo và gaming thay vì mua theo quảng cáo.',
  },
  {
    icon: Zap,
    title: 'Danh mục chọn lọc',
    description: 'Ưu tiên model hiệu năng ổn định, thông số rõ ràng và mức giá dễ so sánh.',
  },
  {
    icon: Truck,
    title: 'Giao nhanh, đóng gói kỹ',
    description: 'Quy trình kiểm tra thiết bị trước khi bàn giao, giảm rủi ro khi nhận hàng.',
  },
];

const bannerMetrics = [
  { value: '48h', label: 'vòng quay deal mới' },
  { value: 'Top 5%', label: 'thiết bị được chọn lọc' },
  { value: '1:1', label: 'hỗ trợ chọn cấu hình' },
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(price);
};

function FlyToCartAnimation({ 
  startRect, 
  imageUrl, 
  onComplete 
}: { 
  startRect: DOMRect; 
  imageUrl: string; 
  onComplete: () => void;
}) {
  const [position, setPosition] = useState({ x: 0, y: 0, scale: 1, opacity: 1 });
  
  useEffect(() => {
    const cartIcon = document.querySelector('[data-cart-icon]');
    const endRect = cartIcon?.getBoundingClientRect();
    
    if (!endRect) {
      onComplete();
      return;
    }
    
    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;
    const endX = endRect.left + endRect.width / 2;
    const endY = endRect.top + endRect.height / 2;
    
    const duration = 800;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentX = startX + (endX - startX) * easeOut;
      const currentY = startY + (endY - startY) * easeOut;
      const scale = 1 - (0.7 * easeOut);
      const opacity = 1 - (0.3 * progress);
      
      setPosition({ 
        x: currentX - startX, 
        y: currentY - startY, 
        scale, 
        opacity 
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(onComplete, 100);
      }
    };
    
    requestAnimationFrame(animate);
  }, [startRect, onComplete]);
  
  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: startRect.left + startRect.width / 2,
        top: startRect.top + startRect.height / 2,
        width: startRect.width,
        height: startRect.height,
        transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%) scale(${position.scale})`,
        opacity: position.opacity,
        transition: 'none',
      }}
    >
      <img 
        src={imageUrl} 
        alt="Flying product"
        className="w-full h-full object-cover rounded-lg shadow-2xl"
      />
    </div>
  );
}

function HomeSearchParamsSync({
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

function HomePageContent() {
  const INITIAL_VISIBLE_PRODUCTS = 10;
  const { addToCart: addToCartContext, itemCount } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PRODUCTS);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flyingItems, setFlyingItems] = useState<Array<{ id: number; rect: DOMRect; imageUrl: string }>>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [activeDealIndex, setActiveDealIndex] = useState(0);
  
  const productImageRefs = useRef<Map<number, HTMLImageElement>>(new Map());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveDealIndex((current) => (current + 1) % featuredDeals.length);
    }, 4800);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await categoryApi.getAllCategories();
        setCategories(categoriesData || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
        toast.error('Không thể tải danh mục');
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsData = await productApi.getAllProducts({
          limit: 50,
          category_id: selectedCategory ?? undefined
        });
        setProducts(productsData.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        toast.error('Không thể tải dữ liệu sản phẩm');
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      const fetchDefaultProducts = async () => {
        try {
          setLoading(true);
          const productsData = await productApi.getAllProducts({
            limit: 50,
            category_id: selectedCategory ?? undefined
          });
          setProducts(productsData.data || []);
          setError(null);
        } catch (err) {
          console.error('Error fetching products:', err);
          setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
          toast.error('Không thể tải dữ liệu sản phẩm');
        } finally {
          setLoading(false);
          setIsInitialLoad(false);
        }
      };

      fetchDefaultProducts();
      return;
    }

    if (trimmedQuery.length < 2) {
      setProducts([]);
      return;
    }

    let isActive = true;

    const runSearch = async () => {
      try {
        setIsSearching(true);
        const response = await productApi.searchProducts(trimmedQuery, 50);
        if (isActive) {
          setProducts(response.data || []);
          setError(null);
        }
      } catch (err) {
        if (isActive) {
          console.error('Error searching products:', err);
          toast.error('Không thể tìm kiếm sản phẩm');
        }
      } finally {
        if (isActive) {
          setIsSearching(false);
        }
      }
    };

    runSearch();

    return () => {
      isActive = false;
    };
  }, [searchQuery]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    switch (sortBy) {
      case 'price-low':
        filtered = [...filtered].sort((a, b) => a.base_price - b.base_price);
        break;
      case 'price-high':
        filtered = [...filtered].sort((a, b) => b.base_price - a.base_price);
        break;
      case 'newest':
        filtered = [...filtered].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }
    
    return filtered;
  }, [products, sortBy]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
  }, [selectedCategory, searchQuery, sortBy]);

  const handleAddToCart = useCallback(async (product: Product, imageElement: HTMLImageElement | null) => {
    try {
      if (!product.variants || product.variants.length === 0) {
        toast.error('Sản phẩm không có phiên bản nào khả dụng');
        return;
      }
      
      const defaultVariant = product.variants[0];

      if (imageElement) {
        const rect = imageElement.getBoundingClientRect();
        const imageUrl = imageElement.src;

        setFlyingItems(prev => [...prev, {
          id: Date.now(),
          rect,
          imageUrl
        }]);
      }

      await addToCartContext(
        {
          variant_id: defaultVariant.id,
          quantity: 1,
        },
        product,
        defaultVariant
      );
      
      toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Không thể thêm vào giỏ hàng');
    }
  }, [addToCartContext]);

  const removeFlyingItem = useCallback((id: number) => {
    setFlyingItems(prev => prev.filter(item => item.id !== id));
  }, []);

  if (loading && isInitialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#CA8A04] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">
            Có lỗi xảy ra
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#CA8A04] text-white rounded-lg hover:bg-[#B47B04] transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-7">
      <Suspense fallback={null}>
        <HomeSearchParamsSync onQueryChange={setSearchQuery} />
      </Suspense>
      <Header />

      {flyingItems.map((item) => (
        <FlyToCartAnimation
          key={item.id}
          startRect={item.rect}
          imageUrl={item.imageUrl}
          onComplete={() => removeFlyingItem(item.id)}
        />
      ))}
      
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(202,138,4,0.16),_transparent_30%),linear-gradient(135deg,_#fdfcf8_0%,_#f7f7f5_42%,_#ffffff_100%)] pt-28 pb-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#CA8A04]/5 blur-[150px]" />
          <div className="hero-grid absolute inset-0 opacity-50" />
          <div className="animate-drift-slow absolute -top-16 right-10 h-48 w-48 rounded-full bg-[#0f172a]/[0.05] blur-3xl" />
          <div className="animate-drift-reverse absolute bottom-0 left-10 h-56 w-56 rounded-full bg-[#CA8A04]/[0.08] blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#CA8A04]/20 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#8a5a00] shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Curated Tech Experience
              </div>

              <h1 className="max-w-xl text-4xl font-heading font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Chọn đúng thiết bị dễ hơn.
                <span className="block text-[#8a5a00]">
                  Mọi thứ cần xem đã được sắp sẵn cho bạn.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-gray-600 sm:text-lg">
                Từ laptop, audio đến phụ kiện gaming, TechNova gom sẵn những mẫu đáng mua,
                trình bày rõ thông số và ưu đãi để bạn đi nhanh tới lựa chọn phù hợp.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#catalog"
                  className="inline-flex items-center gap-2 rounded-full bg-[#111827] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-transform hover:-translate-y-0.5"
                >
                  Khám phá sản phẩm
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/service"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/85 px-5 py-3 text-sm font-semibold text-gray-800 backdrop-blur transition-colors hover:border-[#CA8A04] hover:text-[#8a5a00]"
                >
                  Xem dịch vụ tư vấn
                </a>
              </div>

              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                {bannerMetrics.map((metric) => (
                  <GlassCard
                    key={metric.label}
                    className="border-white/60 bg-white/80 p-4 shadow-[0_10px_30px_rgba(17,24,39,0.05)] backdrop-blur"
                  >
                    <div className="text-3xl font-heading font-bold text-slate-900">{metric.value}</div>
                    <p className="mt-1 text-sm text-slate-500">{metric.label}</p>
                  </GlassCard>
                ))}
              </div>

              <div className="mt-6 max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm, thông số kỹ thuật..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-white/70 bg-white/85 py-4 pr-4 pl-12 text-gray-900 placeholder-gray-400 shadow-[0_12px_40px_rgba(17,24,39,0.06)] backdrop-blur transition-all focus:border-[#CA8A04] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/20"
                  />
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative mx-auto max-w-xl">
                <div className="absolute -inset-4 rounded-[2rem] bg-[radial-gradient(circle_at_top,_rgba(202,138,4,0.14),_transparent_55%)]" />
                <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[#0f172a] p-4 shadow-[0_36px_90px_rgba(15,23,42,0.22)]">
                  <div className="animate-banner-pan relative aspect-[1.1/0.86] overflow-hidden rounded-[1.5rem]">
                    <img
                      src={featuredDeals[activeDealIndex].image}
                      alt={featuredDeals[activeDealIndex].title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#CA8A04]/28 via-transparent to-black/72" />
                  </div>

                  <div className="absolute left-8 top-8 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
                    <BadgeCheck className="h-3.5 w-3.5 text-[#fbbf24]" />
                    Chọn lọc bởi đội ngũ tư vấn
                  </div>

                  <div className="absolute right-8 top-8 text-xs font-medium uppercase tracking-[0.2em] text-white/65">
                    0{activeDealIndex + 1} / 0{featuredDeals.length}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/65">
                      Animated Banner
                    </p>
                    <h2 className="max-w-sm text-3xl font-heading font-bold leading-tight">
                      {featuredDeals[activeDealIndex].title}
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-6 text-white/78">
                      {featuredDeals[activeDealIndex].subtitle}. Thay vì banner tĩnh, mỗi khung hình nhấn
                      vào một ngữ cảnh mua hàng khác nhau để trang chủ có nhịp và có chủ đích.
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  {featuredDeals.map((deal, index) => (
                    <button
                      key={deal.title}
                      type="button"
                      onClick={() => setActiveDealIndex(index)}
                      className={`h-1.5 rounded-full transition-all ${
                        index === activeDealIndex ? 'w-12 bg-[#fbbf24]' : 'w-6 bg-slate-300 hover:bg-slate-400'
                      }`}
                      aria-label={`Xem ưu đãi ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {expertiseSignals.map((signal, index) => {
              const Icon = signal.icon;

              return (
                <GlassCard
                  key={signal.title}
                  className="group border-white/70 bg-white/80 p-5 shadow-[0_14px_44px_rgba(17,24,39,0.06)] backdrop-blur transition-transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#CA8A04]/10 text-[#8a5a00]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-heading font-bold text-gray-900">{signal.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{signal.description}</p>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sticky top-24 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-200 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? 'bg-[#CA8A04] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-sm font-medium">Tất Cả</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#CA8A04] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-sm font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="catalog" className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900">
                {selectedCategory === null ? 'Tất Cả Sản Phẩm' : categories.find(c => c.id === selectedCategory)?.name}
              </h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredProducts.length} sản phẩm
            </p>
          </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 text-sm focus:border-[#CA8A04] focus:outline-none cursor-pointer shadow-sm"
                >
                  <option value="featured">Nổi Bật</option>
                  <option value="price-low">Giá: Thấp đến Cao</option>
                  <option value="price-high">Giá: Cao đến Thấp</option>
                  <option value="rating">Đánh Giá Cao</option>
                  <option value="reviews">Nhiều Đánh Giá</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={`product-skeleton-${index}`}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-200"
                >
                  <Skeleton className="w-full aspect-square" rounded="none" />
                  <div className="p-4 space-y-3">
                    <Skeleton height="20px" className="w-3/4" />
                    <Skeleton height="14px" className="w-full" />
                    <Skeleton height="14px" className="w-5/6" />
                    <Skeleton height="24px" className="w-1/2" />
                    <Skeleton height="44px" className="w-full" rounded="lg" />
                  </div>
                </div>
              ))
            ) : (
              visibleProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={(imageEl) => handleAddToCart(product, imageEl)}
                  imageRef={(el) => {
                    if (el) {
                      productImageRefs.current.set(product.id, el);
                    }
                  }}
                />
              ))
            )}
          </div>

          {!loading && visibleCount < filteredProducts.length && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setVisibleCount((prev) => prev + INITIAL_VISIBLE_PRODUCTS)}
                className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Xem thêm
              </button>
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">
                Không tìm thấy sản phẩm
              </h3>
              <p className="text-gray-500">
                Hãy thử điều chỉnh tìm kiếm hoặc bộ lọc danh mục
              </p>
            </div>
          )}
        </div>
      </section>

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

function ProductCard({ 
  product, 
  onAddToCart,
  imageRef
}: { 
  product: Product; 
  onAddToCart: (imageEl: HTMLImageElement | null) => void;
  imageRef?: (el: HTMLImageElement | null) => void;
}) {
  const localImageRef = useRef<HTMLImageElement>(null);
  const discount = product.compare_at_price 
    ? Math.round(((product.compare_at_price - product.base_price) / product.compare_at_price) * 100)
    : null;

  const primaryImage = product.images?.find(img => img.is_primary)?.image_url || 
                       product.images?.[0]?.image_url ||
                       'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop';
  const destinationHref = `/product/${product.id}`;
  const categoryLabel = product.category?.name ?? 'Thiết bị chọn lọc';
  const brandLabel = product.brand?.name ?? 'TechNova Select';
  const soldCount = product.sold_count ?? 0;

  const handleAddToCart = () => {
    onAddToCart(localImageRef.current);
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-[#ece4d7] bg-white shadow-[0_16px_50px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#d8c6a3] hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,#fff7e6_0%,#f8f5ef_46%,#f3efe6_100%)]">
        {product.is_featured && (
          <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#171717] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-lg shadow-black/10">
            <Sparkles className="h-3.5 w-3.5 text-[#f6c453]" />
            Nổi bật
          </div>
        )}

        {discount && (
          <div className="absolute right-4 top-4 z-10 rounded-full border border-red-100 bg-white/92 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-500 shadow-sm">
            -{discount}%
          </div>
        )}

        <Link href={destinationHref} className="block aspect-[4/4.35] overflow-hidden">
          <img 
            ref={(el) => {
              localImageRef.current = el;
              imageRef?.(el);
            }}
            src={primaryImage} 
            alt={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.045]"
            loading="lazy"
          />
        </Link>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#171717]/16 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a6a12]">
          <span className="truncate">{brandLabel}</span>
          <span className="rounded-full bg-[#fbf6ed] px-2.5 py-1 text-[#7a6a4a] normal-case tracking-normal">
            {categoryLabel}
          </span>
        </div>

        <Link href={destinationHref} className="group/title">
          <h3 className="font-heading text-[1.15rem] font-bold leading-tight text-[#111827] transition-colors group-hover/title:text-[#a16207] line-clamp-2 min-h-[3.4rem]">
            {product.name}
          </h3>
        </Link>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#667085] min-h-[3rem]">
          {product.short_description || product.description}
        </p>

        <div className="mt-4 flex items-end gap-2 border-t border-[#efe7da] pt-4">
          <span className="text-[1.45rem] font-bold leading-none tracking-[-0.03em] text-[#111827]">
            {formatPrice(product.base_price)}
          </span>
          {product.compare_at_price && (
            <span className="pb-0.5 text-sm text-[#98a2b3] line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-[#7a6a4a]">
          <BadgeCheck className="h-3.5 w-3.5 text-[#c58a10]" />
          <span>Đã bán {soldCount.toLocaleString('vi-VN')}</span>
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddToCart}
              disabled={!product.is_active}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                product.is_active
                  ? 'bg-[#c58a10] text-white shadow-[0_16px_30px_rgba(197,138,16,0.22)] hover:bg-[#b27b08]'
                  : 'cursor-not-allowed bg-[#f4efe7] text-[#b0a392]'
              }`}
            >
              {product.is_active ? (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Thêm vào giỏ
                </>
              ) : (
                'Hết hàng'
              )}
            </button>
            <Link
              href={destinationHref}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e8dcc6] bg-[#fffaf1] text-[#a16207] transition-colors hover:bg-[#f9f0df]"
              aria-label={`Xem chi tiết ${product.name}`}
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
