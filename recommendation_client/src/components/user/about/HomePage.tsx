'use client';

import React, { useState, useMemo } from 'react';
import { GlassCard } from '../../ui/GlassCard';
import { Header } from '../../layout/Header';
import { Footer } from '../../layout/Footer';
import { ProductImage } from '../../common/ProductImage';
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

const categories = [
  { id: 'all', name: 'Tất Cả', icon: null },
  { id: 'laptops', name: 'Laptop', icon: Laptop },
  { id: 'smartphones', name: 'Điện Thoại', icon: Smartphone },
  { id: 'desktops', name: 'Máy Tính Bàn', icon: Monitor },
  { id: 'audio', name: 'Âm Thanh', icon: Headphones },
  { id: 'wearables', name: 'Đồng Hồ Thông Minh', icon: Watch },
  { id: 'cameras', name: 'Máy Ảnh', icon: Camera },
  { id: 'gaming', name: 'Gaming', icon: Gamepad },
  { id: 'speakers', name: 'Loa', icon: Speaker },
];

const products = [
  {
    id: 1,
    name: 'Laptop Apex Pro',
    category: 'laptops',
    price: 62500000,
    originalPrice: 69900000,
    rating: 4.9,
    reviews: 128,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop',
    badge: 'Bán Chạy',
    specs: ['M3 Max', '32GB RAM', '1TB SSD'],
    inStock: true,
  },
  {
    id: 2,
    name: 'Điện Thoại Nova X',
    category: 'smartphones',
    price: 32475000,
    originalPrice: null,
    rating: 4.8,
    reviews: 256,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop',
    badge: 'Mới',
    specs: ['A18 Pro', '256GB', 'Titanium'],
    inStock: true,
  },
  {
    id: 3,
    name: 'Máy Tính Titan Pro',
    category: 'desktops',
    price: 124975000,
    originalPrice: 137250000,
    rating: 5.0,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=500&h=500&fit=crop',
    badge: 'Cao Cấp',
    specs: ['RTX 4090', '64GB RAM', '4TB SSD'],
    inStock: true,
  },
  {
    id: 4,
    name: 'Tai Nghe Sonic Pro',
    category: 'audio',
    price: 8750000,
    originalPrice: 11225000,
    rating: 4.7,
    reviews: 432,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
    badge: 'Giảm Giá',
    specs: ['ANC', '40 Giờ', 'Spatial Audio'],
    inStock: true,
  },
  {
    id: 5,
    name: 'Đồng Hồ Chrono',
    category: 'wearables',
    price: 19975000,
    originalPrice: null,
    rating: 4.6,
    reviews: 312,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    badge: null,
    specs: ['Health AI', '7 Ngày', 'GPS'],
    inStock: true,
  },
  {
    id: 6,
    name: 'Máy Ảnh Vision Pro',
    category: 'cameras',
    price: 47475000,
    originalPrice: 54975000,
    rating: 4.8,
    reviews: 67,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&h=500&fit=crop',
    badge: 'Pro',
    specs: ['8K Video', 'IBIS', 'Mirrorless'],
    inStock: false,
  },
  {
    id: 7,
    name: 'Máy Chơi Game X',
    category: 'gaming',
    price: 14975000,
    originalPrice: null,
    rating: 4.9,
    reviews: 892,
    image: 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=500&h=500&fit=crop',
    badge: 'Hot',
    specs: ['4K Gaming', '1TB SSD', 'Ray Tracing'],
    inStock: true,
  },
  {
    id: 8,
    name: 'Loa BassMaster',
    category: 'speakers',
    price: 7475000,
    originalPrice: 9975000,
    rating: 4.5,
    reviews: 234,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop',
    badge: 'Giảm Giá',
    specs: ['360° Sound', '24 Giờ', 'Chống Nước'],
    inStock: true,
  },
  {
    id: 9,
    name: 'Laptop Apex Air',
    category: 'laptops',
    price: 32475000,
    originalPrice: null,
    rating: 4.7,
    reviews: 445,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop',
    badge: null,
    specs: ['M3', '16GB RAM', '512GB SSD'],
    inStock: true,
  },
  {
    id: 10,
    name: 'Điện Thoại Nova Lite',
    category: 'smartphones',
    price: 17475000,
    originalPrice: 19975000,
    rating: 4.4,
    reviews: 678,
    image: 'https://images.unsplash.com/photo-1598327775667-6fe3a7c2d091?w=500&h=500&fit=crop',
    badge: 'Giá Tốt',
    specs: ['A17', '128GB', 'Nhôm'],
    inStock: true,
  },
  {
    id: 11,
    name: 'Màn Hình Studio 5K',
    category: 'desktops',
    price: 39975000,
    originalPrice: null,
    rating: 4.8,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&h=500&fit=crop',
    badge: 'Mới',
    specs: ['5K Retina', 'P3 Color', 'USB-C'],
    inStock: true,
  },
  {
    id: 12,
    name: 'Tai Nghe Buds Pro',
    category: 'audio',
    price: 6225000,
    originalPrice: 7475000,
    rating: 4.6,
    reviews: 892,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop',
    badge: 'Phổ Biến',
    specs: ['ANC', '30 Giờ', 'Spatial Audio'],
    inStock: true,
  },
];

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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{id: number, quantity: number}[]>([]);
  const [sortBy, setSortBy] = useState('featured');

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.specs.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    switch (sortBy) {
      case 'price-low':
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered = [...filtered].sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        filtered = [...filtered].sort((a, b) => b.reviews - a.reviews);
        break;
    }
    
    return filtered;
  }, [selectedCategory, searchQuery, sortBy]);

  const addToCart = (productId: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing) {
        return prev.map(item => 
          item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: productId, quantity: 1 }];
    });
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
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
                {cat.icon && <cat.icon className="w-4 h-4" />}
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
                {selectedCategory === 'all' ? 'Tất Cả Sản Phẩm' : categories.find(c => c.id === selectedCategory)?.name}
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
                onAddToCart={() => addToCart(product.id)}
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
  product: typeof products[0]; 
  onAddToCart: () => void;
}) {
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg">
      {product.badge && (
        <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full bg-[#CA8A04] text-white text-xs font-semibold shadow-sm">
          {product.badge}
        </div>
      )}
      
  10{discount && (
        <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-semibold shadow-sm">
          -{discount}%
        </div>
      )}

      <a href={`/product/${product.id}`} className="block aspect-square bg-gray-50 overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </a>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-[#CA8A04] text-[#CA8A04]" />
            <span className="text-sm font-medium text-gray-900">{product.rating}</span>
          </div>
          <span className="text-xs text-gray-500">({product.reviews} đánh giá)</span>
        </div>

        <a href={`/product/${product.id}`}>
          <h3 className="font-heading font-bold text-gray-900 mb-2 line-clamp-1 hover:text-[#CA8A04] transition-colors">
            {product.name}
          </h3>
        </a>

        <div className="flex flex-wrap gap-1 mb-3">
          {product.specs.slice(0, 2).map((spec, i) => (
            <span 
              key={i}
              className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600"
            >
              {spec}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        <button
          onClick={onAddToCart}
          disabled={!product.inStock}
          className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            product.inStock
              ? 'bg-[#CA8A04] text-white hover:bg-[#B47B04] active:scale-95 shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {product.inStock ? (
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
