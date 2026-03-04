'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { GlassCard } from '../../ui/GlassCard';
import { Header } from '../../layout/Header';
import { Footer } from '../../layout/Footer';
import { ProductImage } from '../../common/ProductImage';
import { Skeleton } from '../../common/Skeleton';
import { productApi, categoryApi } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { Product, Category } from '@/types';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  ShoppingCart, 
  // Star, 
  Filter,
  // ChevronRight,
  // Laptop,
  // Smartphone,
  // Monitor,
  // Headphones,
  // Watch,
  // Camera,
  // Gamepad,
  // Speaker
} from 'lucide-react';

const featuredDeals = [
  { title: 'Giảm đến 30% Laptop', subtitle: 'Tiết kiệm cho thiết bị cao cấp', color: '#CA8A04', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=400&fit=crop' },
  { title: 'Bộ Sưu Tập Âm Thanh Mới', subtitle: 'Trải nghiệm âm thanh sống động', color: '#3B82F6', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=400&fit=crop' },
  { title: 'Phụ Kiện Gaming', subtitle: 'Nâng cấp thiết bị của bạn', color: '#8B5CF6', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop' },
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

export default function HomePage() {
  const INITIAL_VISIBLE_PRODUCTS = 10;
  const { addToCart: addToCartContext, itemCount } = useCart();
  const searchParams = useSearchParams();
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
  
  const productImageRefs = useRef<Map<number, HTMLImageElement>>(new Map());

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await categoryApi.getAllCategories();
        setCategories(categoriesData || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
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
    const queryParam = searchParams.get('q') || '';
    setSearchQuery(queryParam);
  }, [searchParams]);

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
          setError('Không thể tìm kiếm sản phẩm. Vui lòng thử lại sau.');
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
      <Header />

      {flyingItems.map((item) => (
        <FlyToCartAnimation
          key={item.id}
          startRect={item.rect}
          imageUrl={item.imageUrl}
          onComplete={() => removeFlyingItem(item.id)}
        />
      ))}
      
      <section className="relative bg-gradient-to-br from-white via-gray-50 to-white pt-28 pb-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#CA8A04]/5 rounded-full blur-[150px]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-gray-900 mb-4">
              TechNova Store
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Công nghệ cao cấp, giao đến tận nhà. Miễn phí vận chuyển đơn hàng từ 500.000đ.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm, thông số kỹ thuật..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#CA8A04] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/20 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {featuredDeals.map((deal, index) => (
              <GlassCard 
                key={index} 
                className="p-0 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                style={{ borderColor: `${deal.color}30` }}
              >
                <div className="relative h-40">
                  <img 
                    src={deal.image} 
                    alt={deal.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-lg font-heading font-bold text-white mb-1">
                      {deal.title}
                    </h3>
                    <p className="text-sm text-white/80">{deal.subtitle}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
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

      <section className="py-12 px-4 sm:px-6 lg:px-8">
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

  const handleAddToCart = () => {
    onAddToCart(localImageRef.current);
  };

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg">
      {product.is_featured && (
        <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full bg-[#CA8A04] text-white text-xs font-semibold shadow-sm">
          Nổi Bật
        </div>
      )}
      
      {discount && (
        <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-semibold shadow-sm">
          -{discount}%
        </div>
      )}

      <a href={`/product/${product.id}`} className="block aspect-square bg-gray-50 overflow-hidden">
        <img 
          ref={(el) => {
            localImageRef.current = el;
            imageRef?.(el);
          }}
          src={primaryImage} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </a>

      <div className="p-4">
        <a href={`/product/${product.id}`}>
          <h3 className="font-heading font-bold text-gray-900 mb-2 line-clamp-1 hover:text-[#CA8A04] transition-colors">
            {product.name}
          </h3>
        </a>

        {product.short_description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
            {product.short_description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(product.base_price)}
          </span>
          {product.compare_at_price && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!product.is_active}
          className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            product.is_active
              ? 'bg-[#CA8A04] text-white hover:bg-[#B47B04] active:scale-95 shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {product.is_active ? (
            <>
              <ShoppingCart className="w-4 h-4" />
              Thêm Vào Giỏ
            </>
          ) : (
            'Hết Hàng'
          )}
        </button>
      </div>
    </div>
  );
}
