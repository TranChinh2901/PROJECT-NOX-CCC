'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { GlassCard } from '../../ui/GlassCard';
import { Header } from '../../layout/Header';
import { Footer } from '../../layout/Footer';
import { ProductImage } from '../../common/ProductImage';
import { productApi, categoryApi, cartApi } from '@/lib/api';
import { Product, Category } from '@/types';
import toast from 'react-hot-toast';
import { 
  Search, 
  ShoppingCart, 
  Star, 
  Filter,
  ChevronRight,
  Laptop,
  Smartphone,
  Monitor,
  Headphones,
  Watch,
  Camera,
  Gamepad,
  Speaker
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

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{id: number, quantity: number}[]>([]);
  const [sortBy, setSortBy] = useState('featured');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, categoriesData] = await Promise.all([
          productApi.getAllProducts({ limit: 50 }),
          categoryApi.getAllCategories()
        ]);
        setProducts(productsData.data || []);
        setCategories(categoriesData || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        toast.error('Không thể tải dữ liệu sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (selectedCategory !== null) {
      filtered = filtered.filter(p => p.category_id === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
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
  }, [products, selectedCategory, searchQuery, sortBy]);

  const addToCart = async (product: Product) => {
    try {
      if (!product.variants || product.variants.length === 0) {
        toast.error('Sản phẩm không có phiên bản nào khả dụng');
        return;
      }
      
      const defaultVariant = product.variants[0];
      await cartApi.addToCart({
        variant_id: defaultVariant.id,
        quantity: 1
      });
      
      toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
      
      setCart(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) {
          return prev.map(item => 
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [...prev, { id: product.id, quantity: 1 }];
      });
    } catch (err: any) {
      console.error('Error adding to cart:', err);
      if (err.response?.status === 401) {
        toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      } else {
        toast.error('Không thể thêm vào giỏ hàng');
      }
    }
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
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
      <Header cartItemCount={cartItemCount} />
      
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
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={() => addToCart(product)}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
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
  onAddToCart 
}: { 
  product: Product; 
  onAddToCart: () => void;
}) {
  const discount = product.compare_at_price 
    ? Math.round(((product.compare_at_price - product.base_price) / product.compare_at_price) * 100)
    : null;

  const primaryImage = product.images?.find(img => img.is_primary)?.image_url || 
                       product.images?.[0]?.image_url ||
                       'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop';

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
          onClick={onAddToCart}
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
