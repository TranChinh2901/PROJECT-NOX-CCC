'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '../../../../components/layout/Header';
import { Footer } from '../../../../components/layout/Footer';
import { GlassCard } from '../../../../components/ui/GlassCard';
import { productApi, reviewApi, cartApi } from '@/lib/api';
import { Product, Review } from '@/types';
import toast from 'react-hot-toast';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Check,
  ChevronRight,
  Truck,
  Shield,
  RotateCcw,
  Minus,
  Plus,
  User
} from 'lucide-react';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(price);
};

export default function ProductPage() {
  const params = useParams();
  const productId = Number(params.id);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  const [cart, setCart] = useState<{id: number, quantity: number}[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productData, reviewsData] = await Promise.all([
          productApi.getProductById(productId),
          reviewApi.getProductReviews(productId).catch(() => [])
        ]);
        setProduct(productData);
        setReviews(reviewsData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching product:', err);
        if (err.response?.status === 404) {
          setError('Không tìm thấy sản phẩm');
        } else {
          setError('Không thể tải thông tin sản phẩm');
        }
        toast.error('Không thể tải sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  const addToCart = async () => {
    if (!product) return;
    
    try {
      if (!product.variants || product.variants.length === 0) {
        toast.error('Sản phẩm không có phiên bản nào khả dụng');
        return;
      }
      
      const defaultVariant = product.variants[0];
      await cartApi.addToCart({
        variant_id: defaultVariant.id,
        quantity
      });
      
      toast.success(`Đã thêm ${quantity} ${product.name} vào giỏ hàng`);
      
      setCart(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) {
          return prev.map(item => 
            item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
          );
        }
        return [...prev, { id: product.id, quantity }];
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

  // Calculate discount and rating from API data
  const discount = product?.compare_at_price && product?.base_price
    ? Math.round(((product.compare_at_price - product.base_price) / product.compare_at_price) * 100)
    : null;

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  const primaryImage = product?.images?.find(img => img.is_primary)?.image_url 
    || product?.images?.[0]?.image_url 
    || '/placeholder.png';

  if (loading) {
    return (
      <div className="min-h-screen bg-white mt-10">
        <Header cartItemCount={cartItemCount} />
        <main className="pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#CA8A04] mb-4"></div>
                <p className="text-gray-600">Đang tải sản phẩm...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white mt-10">
        <Header cartItemCount={cartItemCount} />
        <main className="pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <p className="text-xl text-gray-900 mb-4">{error || 'Không tìm thấy sản phẩm'}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-[#CA8A04] text-white rounded-lg hover:bg-[#B47B04] transition-colors"
                >
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white mt-10">
      <Header cartItemCount={cartItemCount} />
      
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <span className="hover:text-gray-900 cursor-pointer">Trang Chủ</span>
            <ChevronRight className="w-4 h-4" />
            <span className="hover:text-gray-900 cursor-pointer">{product.category?.name || 'Sản phẩm'}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div className="relative">
              <GlassCard className="aspect-square overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#CA8A04]/5 to-transparent z-10" />
                <img 
                  src={primaryImage} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </GlassCard>
              
              {product.is_featured && (
                <div className="absolute top-4 left-4 z-20 px-4 py-2 rounded-full bg-[#CA8A04] text-white text-sm font-semibold shadow-md">
                  Nổi Bật
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < Math.floor(Number(averageRating)) ? 'fill-[#CA8A04] text-[#CA8A04]' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="text-gray-900 font-medium">{averageRating}</span>
                <span className="text-gray-500">({reviews.length} đánh giá)</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {product.description}
              </p>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(product.base_price)}
                </span>
                {product.compare_at_price && discount && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      {formatPrice(product.compare_at_price)}
                    </span>
                    <span className="px-2 py-1 rounded bg-red-100 text-red-600 text-sm font-medium">
                      Tiết kiệm {discount}%
                    </span>
                  </>
                )}
              </div>

              {product.short_description && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {product.short_description.split(',').map((spec, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm border border-gray-200"
                    >
                      {spec.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-12 text-center text-gray-900 font-semibold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={addToCart}
                  disabled={!product.is_active}
                  className={`flex-1 py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                    product.is_active
                      ? 'bg-[#CA8A04] text-white hover:bg-[#B47B04] active:scale-95 shadow-md'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {product.is_active ? 'Thêm Vào Giỏ' : 'Hết Hàng'}
                </button>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all bg-white shadow-sm">
                  <Heart className="w-5 h-5" />
                  <span className="hidden sm:inline">Yêu Thích</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all bg-white shadow-sm">
                  <Share2 className="w-5 h-5" />
                  <span className="hidden sm:inline">Chia Sẻ</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex flex-col items-center text-center gap-2">
                  <Truck className="w-6 h-6 text-[#CA8A04]" />
                  <span className="text-xs text-gray-600">Miễn Phí Vận Chuyển</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <Shield className="w-6 h-6 text-[#CA8A04]" />
                  <span className="text-xs text-gray-600">Bảo Hành 2 Năm</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <RotateCcw className="w-6 h-6 text-[#CA8A04]" />
                  <span className="text-xs text-gray-600">Đổi Trả 30 Ngày</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 mb-8">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-4 text-sm font-medium transition-colors relative ${
                  activeTab === 'description' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Mô Tả & Tính Năng
                {activeTab === 'description' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CA8A04]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-4 text-sm font-medium transition-colors relative ${
                  activeTab === 'reviews' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Đánh Giá ({reviews.length})
                {activeTab === 'reviews' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CA8A04]" />
                )}
              </button>
            </div>
          </div>

          {activeTab === 'description' ? (
            <div className="prose max-w-none">
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-4">
                Mô Tả Sản Phẩm
              </h3>
              <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.length > 0 && (
                <div className="flex items-center gap-8 p-6 rounded-xl bg-gray-50 border border-gray-200 mb-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-gray-900 mb-1">{averageRating}</div>
                    <div className="flex items-center gap-1 justify-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < Math.floor(Number(averageRating)) ? 'fill-[#CA8A04] text-[#CA8A04]' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <div className="text-sm text-gray-500">{reviews.length} đánh giá</div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = reviews.filter(r => r.rating === stars).length;
                      const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                      return (
                        <div key={stars} className="flex items-center gap-3">
                          <span className="text-sm text-gray-500 w-16">{stars} sao</span>
                          <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div 
                              className="h-full bg-[#CA8A04] rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500 w-12 text-right">
                            {percentage}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="p-6 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{review.user?.fullname || 'Người dùng ẩn danh'}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>
                        {review.is_verified_purchase && (
                          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-600 text-xs">
                            <Check className="w-3 h-3" />
                            Đã Mua Hàng
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < review.rating ? 'fill-[#CA8A04] text-[#CA8A04]' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      {review.title && (
                        <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                      )}
                      <p className="text-gray-600 leading-relaxed mb-4">{review.content}</p>
                      <button className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                        Hữu ích ({review.helpful_count})
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Chưa có đánh giá nào cho sản phẩm này</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
