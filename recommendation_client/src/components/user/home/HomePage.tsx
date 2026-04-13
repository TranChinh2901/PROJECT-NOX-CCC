'use client';

import React, { Suspense, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { GlassCard } from '../../ui/GlassCard';
import { Header } from '../../layout/Header';
import { Footer } from '../../layout/Footer';
import { Skeleton } from '../../common/Skeleton';
import { productApi, categoryApi, recommendationApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Product, Category } from '@/types';
import { buildProductPath } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { 
  ArrowRight,
  CheckCircle,
  FadersHorizontal,
  Lightning,
  MagnifyingGlass,
  ShieldCheck,
  Sparkle,
  Truck,
  WarningCircle,
} from '@phosphor-icons/react';

const featuredDeals = [
  {
    title: 'Laptop làm việc đã lọc sẵn',
    subtitle: 'Model pin bền, tản ổn và màn hình đủ sạch cho lịch làm việc dài.',
    image: 'https://picsum.photos/seed/technova-workstation/1200/900',
  },
  {
    title: 'Âm thanh cá nhân cho ngày di chuyển',
    subtitle: 'Tai nghe, loa gọn và phụ kiện đi kèm được gom theo ngữ cảnh sử dụng.',
    image: 'https://picsum.photos/seed/technova-audio-bay/1200/900',
  },
  {
    title: 'Góc gaming tối giản nhưng đúng lực',
    subtitle: 'Bộ phụ kiện có độ hoàn thiện tốt, không kéo bạn vào những món trang trí dư thừa.',
    image: 'https://picsum.photos/seed/technova-gaming-surface/1200/900',
  },
];

const expertiseSignals = [
  {
    icon: ShieldCheck,
    title: 'Tư vấn cấu hình thực chiến',
    description: 'Chọn đúng thiết bị cho học tập, sáng tạo và gaming thay vì mua theo quảng cáo.',
  },
  {
    icon: Lightning,
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
  { value: '36h', label: 'chu kỳ làm mới deal' },
  { value: '47.2%', label: 'mẫu đã qua vòng cắt giảm' },
  { value: '312', label: 'cấu hình được so sánh mỗi tuần' },
];

const getFallbackProductImage = (productId: number) =>
  `https://picsum.photos/seed/technova-product-${productId}/900/900`;

const findCategoryInTree = (
  categories: Category[],
  matcher: (category: Category) => boolean,
): Category | null => {
  for (const category of categories) {
    if (matcher(category)) {
      return category;
    }

    const nestedMatch = findCategoryInTree(category.children || [], matcher);
    if (nestedMatch) {
      return nestedMatch;
    }
  }

  return null;
};

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
  const elementRef = useRef<HTMLDivElement>(null);

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
      if (!elementRef.current) return;

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentX = startX + (endX - startX) * easeOut;
      const currentY = startY + (endY - startY) * easeOut;
      const targetScale = 40 / startRect.width;
      const scale = 1 - ((1 - targetScale) * easeOut);
      const opacity = Math.max(0, 1 - (0.5 * progress));
      
      const x = currentX - startX;
      const y = currentY - startY;

      elementRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
      elementRef.current.style.opacity = opacity.toString();
      
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
      ref={elementRef}
      className="fixed z-50 pointer-events-none"
      style={{
        left: startRect.left + startRect.width / 2,
        top: startRect.top + startRect.height / 2,
        width: startRect.width,
        height: startRect.height,
        transform: `translate(0px, 0px) translate(-50%, -50%) scale(1)`,
        opacity: 1,
        transition: 'none',
        willChange: 'transform, opacity',
      }}
    >
      <Image
        src={imageUrl}
        alt="Flying product"
        fill
        unoptimized
        sizes={`${Math.ceil(startRect.width)}px`}
        className="object-cover rounded-lg shadow-2xl"
      />
    </div>
  );
}

function HomeSearchParamsSync({
  onQueryChange,
  onCategoryChange,
}: {
  onQueryChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    onQueryChange(searchParams.get('q') || '');
    onCategoryChange(searchParams.get('category') || '');
  }, [onCategoryChange, onQueryChange, searchParams]);

  return null;
}

function HomePageContent() {
  const INITIAL_VISIBLE_PRODUCTS = 10;
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilterSlug, setCategoryFilterSlug] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PRODUCTS);
  const [products, setProducts] = useState<Product[]>([]);
  const [personalizedProducts, setPersonalizedProducts] = useState<Product[]>([]);
  const [personalizedReasons, setPersonalizedReasons] = useState<Record<number, string>>({});
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
  const [recommendationBlockTitle, setRecommendationBlockTitle] = useState('Dành cho bạn');
  const [recommendationBlockSubtitle, setRecommendationBlockSubtitle] = useState(
    'Gợi ý theo hành vi mua sắm'
  );
  const [recommendationBlockDescription, setRecommendationBlockDescription] = useState(
    'Các sản phẩm được sắp theo lượt xem, tìm kiếm và tương tác gần đây của bạn.'
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flyingItems, setFlyingItems] = useState<Array<{ id: number; rect: DOMRect; imageUrl: string }>>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeDealIndex, setActiveDealIndex] = useState(0);
  
  const productImageRefs = useRef<Map<number, HTMLImageElement>>(new Map());
  const trackedRecommendationImpressionsRef = useRef<Set<string>>(new Set());

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
    let isActive = true;

    const applyFallbackRecommendations = async () => {
      const fallbackProducts = await productApi.getFeaturedProducts(4).catch(() => []);

      if (!isActive) {
        return;
      }

      setPersonalizedProducts(fallbackProducts);
      setPersonalizedReasons(
        fallbackProducts.reduce<Record<number, string>>((accumulator, product) => {
          accumulator[product.id] = product.is_featured
            ? 'sản phẩm nổi bật'
            : 'được nhiều khách hàng quan tâm';
          return accumulator;
        }, {})
      );
      setRecommendationBlockTitle('Xu hướng nổi bật');
      setRecommendationBlockSubtitle('Những lựa chọn đang được xem nhiều hôm nay');
      setRecommendationBlockDescription(
        'Tổng hợp các mẫu nổi bật, bán ổn và dễ so sánh để bạn bắt đầu ngay với những lựa chọn đáng xem nhất.'
      );
    };

    const loadPersonalizedRecommendations = async () => {
      if (!user?.id) {
        await applyFallbackRecommendations();
        return;
      }

      try {
        setPersonalizedLoading(true);
        const response = await recommendationApi.getRecommendations(user.id, {
          limit: 5,
          strategy: 'hybrid',
        });

        if (!response.recommendations.length) {
          await applyFallbackRecommendations();
          return;
        }

        const products = await Promise.all(
          response.recommendations.map((recommendation) =>
            productApi.getProductById(recommendation.productId).catch(() => null)
          )
        );

        if (!isActive) {
          return;
        }

        setPersonalizedProducts(products.filter((product): product is Product => Boolean(product)));
        setPersonalizedReasons(
          response.recommendations.reduce<Record<number, string>>((accumulator, recommendation) => {
            accumulator[recommendation.productId] = recommendation.reason;
            return accumulator;
          }, {})
        );
        setRecommendationBlockTitle('Dành cho bạn');
        setRecommendationBlockSubtitle('Gợi ý theo hành vi mua sắm');
        setRecommendationBlockDescription(
          'Các sản phẩm được sắp theo lượt xem, tìm kiếm và tương tác gần đây của bạn.'
        );
      } catch (error) {
        if (isActive) {
          console.error('Error loading personalized recommendations:', error);
          await applyFallbackRecommendations();
        }
      } finally {
        if (isActive) {
          setPersonalizedLoading(false);
        }
      }
    };

    void loadPersonalizedRecommendations();

    return () => {
      isActive = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || personalizedProducts.length === 0) {
      return;
    }

    personalizedProducts.forEach((product) => {
      const impressionKey = `homepage:${recommendationBlockTitle}:${product.id}`;
      if (trackedRecommendationImpressionsRef.current.has(impressionKey)) {
        return;
      }

      trackedRecommendationImpressionsRef.current.add(impressionKey);

      recommendationApi.trackBehavior({
        userId: user.id,
        behaviorType: 'view',
        productId: product.id,
        categoryId: product.category?.id,
        metadata: {
          event: 'impression',
          source: recommendationBlockTitle === 'Dành cho bạn'
            ? 'homepage_personalized'
            : 'homepage_fallback',
          recommendationReason: personalizedReasons[product.id],
          recommendationBlockTitle,
        },
      }).catch((error: unknown) => {
        trackedRecommendationImpressionsRef.current.delete(impressionKey);
        console.error('Failed to track homepage recommendation impression:', error);
      });
    });
  }, [user?.id, personalizedProducts, personalizedReasons, recommendationBlockTitle]);

  useEffect(() => {
    if (!categoryFilterSlug) {
      setSelectedCategory(null);
      return;
    }

    const matchedCategory = findCategoryInTree(categories, (category) =>
      category.slug === categoryFilterSlug || String(category.id) === categoryFilterSlug,
    );

    setSelectedCategory(matchedCategory?.id ?? null);
  }, [categories, categoryFilterSlug]);

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
        if (!isActive) {
          return;
        }
      }
    };

    runSearch();

    return () => {
      isActive = false;
    };
  }, [searchQuery, selectedCategory]);

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
    if (loading || isInitialLoad || typeof window === 'undefined') {
      return;
    }

    if (window.location.hash !== '#catalog') {
      return;
    }

    const scrollToCatalog = () => {
      const catalogSection = document.getElementById('catalog');
      if (!catalogSection) {
        return;
      }

      const topOffset = 120;
      const targetTop = catalogSection.getBoundingClientRect().top + window.scrollY - topOffset;

      window.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: 'smooth',
      });
    };

    const firstFrameId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scrollToCatalog);
    });

    return () => window.cancelAnimationFrame(firstFrameId);
  }, [loading, isInitialLoad, selectedCategory, filteredProducts.length]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
  }, [selectedCategory, searchQuery, sortBy]);

  const removeFlyingItem = useCallback((id: number) => {
    setFlyingItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const trackPersonalizedRecommendationClick = useCallback((product: Product) => {
    if (!user?.id) {
      return;
    }

    recommendationApi.trackBehavior({
      userId: user.id,
      behaviorType: 'view',
      productId: product.id,
      categoryId: product.category?.id,
      metadata: {
        source: 'homepage_personalized',
        recommendationReason: personalizedReasons[product.id],
      },
    }).catch((error: unknown) => {
      console.error('Failed to track personalized recommendation click:', error);
    });
  }, [user?.id, personalizedReasons]);

  if (loading && isInitialLoad) {
    return (
      <div className="min-h-[100dvh] bg-[#f5f1e8] px-4">
        <div className="mx-auto flex min-h-[100dvh] max-w-7xl items-center justify-center">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_30px_80px_-45px_rgba(28,25,23,0.35)] backdrop-blur">
            <div className="h-3 w-28 rounded-full bg-[#e8dcc6]" />
            <div className="mt-5 h-12 w-4/5 rounded-2xl bg-[#f2ebe0]" />
            <div className="mt-3 h-12 w-3/5 rounded-2xl bg-[#f2ebe0]" />
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-[1.5rem] border border-[#eee4d3] bg-[#fbf8f2] p-4">
                  <div className="h-4 w-14 rounded-full bg-[#eadfcd]" />
                  <div className="mt-4 h-8 w-16 rounded-xl bg-[#ede4d7]" />
                  <div className="mt-3 h-3 w-20 rounded-full bg-[#efe6da]" />
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm font-medium uppercase tracking-[0.18em] text-[#8a5a00]">
              Đang chuẩn bị danh mục
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-[#f5f1e8] px-4">
        <div className="mx-auto flex min-h-[100dvh] max-w-7xl items-center justify-center">
          <div className="max-w-md rounded-[2rem] border border-[#ead7d3] bg-white p-8 text-center shadow-[0_30px_80px_-45px_rgba(28,25,23,0.35)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f8ece9] text-[#a14f3b]">
              <WarningCircle className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-2xl font-heading font-semibold tracking-tight text-[#1c1917]">
              Có lỗi khi tải trang chủ
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#6b665d]">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#1c1917] px-6 py-3 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Tải lại dữ liệu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 min-h-screen bg-[#f5f1e8] sm:mt-10">
      <Suspense fallback={null}>
        <HomeSearchParamsSync
          onQueryChange={setSearchQuery}
          onCategoryChange={setCategoryFilterSlug}
        />
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
      
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(202,138,4,0.14),_transparent_32%),linear-gradient(135deg,_#faf6ef_0%,_#f4efe6_48%,_#f8f7f3_100%)] pb-10 pt-8 sm:pt-20 lg:min-h-[100dvh] lg:pt-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#CA8A04]/5 blur-[150px]" />
          <div className="hero-grid absolute inset-0 opacity-50" />
          <div className="animate-drift-slow absolute -top-16 right-10 h-48 w-48 rounded-full bg-[#0f172a]/[0.05] blur-3xl" />
          <div className="animate-drift-reverse absolute bottom-0 left-10 h-56 w-56 rounded-full bg-[#CA8A04]/[0.08] blur-3xl" />
        </div>

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] xl:gap-10">
            <div className="w-full">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8a5a00]">
                TechNova Selection Desk
              </p>
              <h1 className="mt-4 text-4xl font-heading font-semibold tracking-tighter text-[#171412] sm:text-5xl lg:text-[3.7rem] lg:leading-[0.96]">
                Chọn đúng thiết bị mà không phải
                <span className="block text-[#8a5a00]">
                  lội qua một biển thông số lặp lại.
                </span>
              </h1>

              <p className="mt-5 max-w-[62ch] text-base leading-7 text-[#5f5a52] sm:text-lg">
                Trang chủ này hoạt động như một bàn lọc mua sắm: chia rõ nhóm sản phẩm, làm nổi
                những mẫu có tỷ lệ giá trị tốt và giữ lại đủ ngữ cảnh để bạn quyết nhanh mà không
                mất phương hướng.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#catalog"
                  className="inline-flex items-center gap-2 rounded-full bg-[#171412] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_-18px_rgba(23,20,18,0.48)] transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  Khám phá sản phẩm
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/service"
                  className="inline-flex items-center gap-2 rounded-full border border-[#d8c8ae] bg-white/80 px-5 py-3 text-sm font-semibold text-[#2f2a24] backdrop-blur transition-all duration-300 hover:border-[#ca8a04] hover:text-[#8a5a00] active:scale-[0.98]"
                >
                  Xem dịch vụ tư vấn
                </a>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {bannerMetrics.map((metric) => (
                  <GlassCard
                    key={metric.label}
                    className="border-white/70 bg-white/80 p-4 shadow-[0_20px_40px_-28px_rgba(28,25,23,0.26)] backdrop-blur"
                  >
                    <div className="text-3xl font-heading font-semibold tracking-tight text-[#171412]">{metric.value}</div>
                    <p className="mt-1 text-sm text-[#6f675c]">{metric.label}</p>
                  </GlassCard>
                ))}
              </div>
            </div>

            <div className="relative group perspective-1000 w-full">
              <div className="relative z-10 mb-8 w-full transition-transform duration-700 ease-out group-hover:scale-[1.01] lg:mb-0">
                <div className="absolute -inset-4 rounded-[2.5rem] bg-[radial-gradient(circle_at_top,_rgba(202,138,4,0.18),_transparent_65%)] opacity-70 blur-2xl transition-opacity duration-700 group-hover:opacity-100" />
                
                <div className="relative overflow-hidden rounded-[2.2rem] border border-white/20 bg-[#0f172a] shadow-[0_30px_80px_rgba(15,23,42,0.22)] ring-1 ring-white/10">
                  <div className="relative aspect-[1.08/0.9] overflow-hidden bg-slate-900">
                    {featuredDeals.map((deal, index) => (
                      <div
                        key={deal.title}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                          index === activeDealIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                      >
                        <Image
                          src={deal.image}
                          alt={deal.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 40vw"
                          className={`object-cover transition-transform duration-[8s] ease-linear ${
                            index === activeDealIndex ? 'scale-110' : 'scale-100'
                          }`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/95 via-[#0f172a]/40 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent opacity-60" />
                      </div>
                    ))}
                  </div>

                  <div className="absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-md shadow-lg">
                    <CheckCircle className="h-4 w-4 text-[#f4c96a]" />
                    Lựa chọn đang nổi
                  </div>

                  <div className="absolute right-6 top-6 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] font-bold tracking-[0.2em] text-white/90 backdrop-blur-md">
                    <span>0{activeDealIndex + 1}</span>
                    <span className="text-white/40">/</span>
                    <span className="text-white/40">0{featuredDeals.length}</span>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 z-20 p-7 sm:p-8">
                    <div className="transform transition-all duration-700">
                      <p className="mb-4 inline-block rounded-full border border-[#ca8a04]/30 bg-[#ca8a04]/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#fde68a] backdrop-blur-sm">
                        Đề cử theo ngữ cảnh
                      </p>
                      
                      <div className="relative h-[110px]">
                        {featuredDeals.map((deal, index) => (
                          <div 
                            key={`text-${deal.title}`}
                            className={`absolute inset-0 transition-all duration-700 ease-out flex flex-col justify-end ${
                              index === activeDealIndex 
                                ? 'opacity-100 translate-y-0' 
                                : 'opacity-0 translate-y-4 pointer-events-none'
                            }`}
                          >
                            <h2 className="text-[1.9rem] font-heading font-semibold tracking-tight text-white drop-shadow-lg sm:text-[2.35rem]">
                              {deal.title}
                            </h2>
                            <p className="mt-3 text-sm leading-relaxed text-slate-200 drop-shadow-md line-clamp-2">
                              {deal.subtitle} Mỗi khung hình giữ cùng một bảng màu và chỉ thay đổi hoàn cảnh mua hàng để phần hero có nhịp nhưng không bị ồn.
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-2.5 rounded-full border border-white/60 bg-white/90 px-4 py-2.5 shadow-xl backdrop-blur-xl">
                  {featuredDeals.map((deal, index) => (
                    <button
                      key={`btn-${deal.title}`}
                      type="button"
                      onClick={() => setActiveDealIndex(index)}
                      className={`h-2 rounded-full transition-all duration-500 ease-out ${
                        index === activeDealIndex 
                          ? 'w-10 bg-[#CA8A04]' 
                          : 'w-2 bg-slate-300 hover:bg-slate-400 hover:w-4'
                      }`}
                      aria-label={`Xem ưu đãi ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {expertiseSignals.map((signal, index) => {
              const Icon = signal.icon;

              return (
                <GlassCard
                  key={signal.title}
                  className="group border-white/70 bg-white/80 p-5 shadow-[0_18px_40px_-24px_rgba(28,25,23,0.2)] backdrop-blur transition-transform duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ca8a04]/10 text-[#8a5a00]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-heading font-semibold tracking-tight text-[#171412]">{signal.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#625c54]">{signal.description}</p>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sticky top-28 z-40 border-b border-[#e6ddcf] bg-white/90 py-4 shadow-[0_12px_28px_-24px_rgba(28,25,23,0.42)] backdrop-blur-lg">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? 'bg-[#171412] text-white shadow-[0_12px_24px_-16px_rgba(23,20,18,0.5)]'
                  : 'bg-[#f1ece3] text-[#4f4a43] hover:bg-[#e8dece]'
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
                    ? 'bg-[#171412] text-white shadow-[0_12px_24px_-16px_rgba(23,20,18,0.5)]'
                    : 'bg-[#f1ece3] text-[#4f4a43] hover:bg-[#e8dece]'
                }`}
              >
                <span className="text-sm font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {(personalizedLoading || personalizedProducts.length > 0) && (
        <section className="py-12">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#8a5a00]">
                {recommendationBlockTitle}
              </p>
              <h2 className="mt-2 text-2xl font-heading font-semibold tracking-tight text-[#171412]">
                {recommendationBlockSubtitle}
              </h2>
              <p className="mt-2 max-w-[58ch] text-sm leading-6 text-[#625c54]">
                {recommendationBlockDescription}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {personalizedLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={`personalized-skeleton-${index}`}
                      className="overflow-hidden rounded-none border border-gray-200 bg-white"
                    >
                      <Skeleton className="aspect-[4/3.65] w-full" rounded="none" />
                      <div className="space-y-2.5 p-3 sm:p-4">
                        <Skeleton height="14px" className="w-2/3" />
                        <Skeleton height="20px" className="w-3/4" />
                        <Skeleton height="14px" className="w-full" />
                        <Skeleton height="24px" className="w-1/2" />
                      </div>
                    </div>
                  ))
                : personalizedProducts.map((product) => (
                    <div key={product.id}>
                      <ProductCard
                        product={product}
                        onProductClick={() => trackPersonalizedRecommendationClick(product)}
                      />
                    </div>
                  ))}
            </div>
          </div>
        </section>
      )}

      <section id="catalog" className="py-14">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8a5a00]">
                Danh mục mở rộng
              </p>
              <h2 className="mt-2 text-2xl font-heading font-semibold tracking-tight text-[#171412]">
                {selectedCategory === null
                  ? 'Tất Cả Sản Phẩm'
                  : findCategoryInTree(categories, (category) => category.id === selectedCategory)?.name}
              </h2>
              <p className="mt-1 text-sm text-[#6f675c]">
                {filteredProducts.length} sản phẩm
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <FadersHorizontal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f766a]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="cursor-pointer rounded-full border border-[#ddd3c3] bg-white px-10 py-2 text-sm text-[#171412] shadow-sm focus:border-[#ca8a04] focus:outline-none"
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

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {loading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={`product-skeleton-${index}`}
                  className="overflow-hidden rounded-none border border-gray-200 bg-white"
                >
                  <Skeleton className="aspect-[4/3.65] w-full" rounded="none" />
                  <div className="space-y-2.5 p-3 sm:p-4">
                    <Skeleton height="20px" className="w-3/4" />
                    <Skeleton height="14px" className="w-full" />
                    <Skeleton height="14px" className="w-5/6" />
                    <Skeleton height="24px" className="w-1/2" />
                    <Skeleton height="40px" className="w-full" rounded="lg" />
                  </div>
                </div>
              ))
            ) : (
              visibleProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
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
                className="rounded-full border border-[#d8c8ae] bg-white px-5 py-2.5 text-sm font-medium text-[#2f2a24] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ca8a04] active:scale-[0.98]"
              >
                Xem thêm
              </button>
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="rounded-[2rem] border border-dashed border-[#d7ccb9] bg-white/70 px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f2ebe0] text-[#8a5a00]">
                <MagnifyingGlass className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-heading font-semibold tracking-tight text-[#171412]">
                Không tìm thấy sản phẩm
              </h3>
              <p className="text-[#6b665d]">
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
  imageRef,
  onProductClick,
}: { 
  product: Product; 
  imageRef?: (el: HTMLImageElement | null) => void;
  onProductClick?: () => void;
}) {
  const localImageRef = useRef<HTMLImageElement>(null);
  const discount = product.compare_at_price 
    ? Math.round(((product.compare_at_price - product.base_price) / product.compare_at_price) * 100)
    : null;

  const primaryImage = product.images?.find(img => img.is_primary)?.image_url || 
                       product.images?.[0]?.image_url ||
                       getFallbackProductImage(product.id);
  const destinationHref = buildProductPath(product);
  const categoryLabel = product.category?.name ?? 'Thiết bị chọn lọc';
  const soldCount = product.sold_count ?? 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-none border border-[#ece4d7] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d8c6a3] hover:shadow-[0_18px_52px_rgba(15,23,42,0.11)]">
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,#fff7e6_0%,#f8f5ef_46%,#f3efe6_100%)]">
        {product.is_featured && (
          <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#171717] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-lg shadow-black/10 sm:left-4 sm:top-4 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.18em]">
            <Sparkle className="h-3 w-3 text-[#f6c453] sm:h-3.5 sm:w-3.5" />
            Nổi bật
          </div>
        )}

        {discount && (
          <div className="absolute right-3 top-3 z-10 rounded-full border border-red-100 bg-white/92 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-500 shadow-sm sm:right-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.16em]">
            -{discount}%
          </div>
        )}

        <Link
          href={destinationHref}
          className="relative block aspect-[4/3.65] overflow-hidden sm:aspect-[4/3.85]"
          onClick={onProductClick}
        >
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.045]"
            onLoad={(event) => {
              const target = event.currentTarget as HTMLImageElement;
              localImageRef.current = target;
              imageRef?.(target);
            }}
          />
        </Link>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#171717]/16 to-transparent sm:h-24" />
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a6a12] sm:mb-3 sm:text-[11px] sm:tracking-[0.16em]">
          <span className="inline-flex rounded-full bg-[#fbf6ed] px-2 py-0.5 text-[#7a6a4a] normal-case tracking-normal sm:px-2.5 sm:py-1">
            {categoryLabel}
          </span>
        </div>

        <Link href={destinationHref} className="group/title" onClick={onProductClick}>
          <h3 className="min-h-[2.5rem] line-clamp-2 font-heading text-base font-bold leading-snug text-[#111827] transition-colors group-hover/title:text-[#a16207] sm:min-h-[3rem] sm:text-[1.05rem]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 flex items-end gap-2 border-t border-[#efe7da] pt-3 sm:mt-4 sm:pt-4">
          <span className="text-[1.2rem] font-bold leading-none tracking-[-0.03em] text-[#111827] sm:text-[1.35rem]">
            {formatPrice(product.base_price)}
          </span>
          {product.compare_at_price && (
            <span className="pb-0.5 text-xs text-[#98a2b3] line-through sm:text-sm">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#7a6a4a] sm:mt-3 sm:gap-2 sm:text-xs">
          <CheckCircle className="h-3.5 w-3.5 text-[#c58a10]" />
          <span>Đã bán {soldCount.toLocaleString('vi-VN')}</span>
        </div>

      </div>
    </article>
  );
}
