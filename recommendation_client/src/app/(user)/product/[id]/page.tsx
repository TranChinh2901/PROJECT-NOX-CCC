'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Header } from '../../../../components/layout/Header';
import { Footer } from '../../../../components/layout/Footer';
import { GlassCard } from '../../../../components/ui/GlassCard';
import { ProductImage } from '../../../../components/common/ProductImage';
import { productApi, reviewApi } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Product, ProductReviewsSummary, ProductVariant, Review } from '@/types';
import toast from 'react-hot-toast';
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Package,
  AlertTriangle,
  Check,
  ChevronRight,
  Truck,
  Shield,
  RotateCcw,
  Minus,
  Plus,
  User
} from 'lucide-react';

type ProductPageError = Error & {
  response?: {
    status?: number;
  };
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(price);
};

const getVariantStockQuantity = (variant?: ProductVariant) => {
  if (!variant) {
    return 0;
  }

  return variant.inventory?.reduce(
    (variantTotal, inventory) => variantTotal + Number(inventory.quantity_available || 0),
    0,
  ) ?? 0;
};

const getVariantLabel = (variant?: ProductVariant) => {
  if (!variant) {
    return 'Phiên bản mặc định';
  }

  const parts = [variant.size, variant.color, variant.material].filter(Boolean);
  return parts.length > 0 ? parts.join(' • ') : variant.sku;
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
      className="fixed z-50 pointer-events-none relative"
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

export default function ProductPage() {
  const params = useParams();
  const productId = Number(params.id);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsSummary, setReviewsSummary] = useState<ProductReviewsSummary | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flyingItems, setFlyingItems] = useState<Array<{ id: number; rect: DOMRect; imageUrl: string }>>([]);
  const productImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productData, reviewsData, relatedProductsData] = await Promise.all([
          productApi.getProductById(productId),
          reviewApi.getProductReviews(productId).catch(() => ({
            data: [],
            summary: {
              total_reviews: 0,
              average_rating: '0.0',
              rating_distribution: []
            },
            pagination: {
              total: 0,
              page: 1,
              limit: 10,
              total_pages: 0
            }
          })),
          productApi.getRelatedProducts(productId, 4).catch(() => [])
        ]);
        setProduct(productData);
        setReviews(reviewsData.data || []);
        setReviewsSummary(reviewsData.summary || null);
        setRelatedProducts(relatedProductsData || []);
        setError(null);
      } catch (err: unknown) {
        console.error('Error fetching product:', err);
        const productError = err as ProductPageError;

        if (productError.response?.status === 404) {
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

  useEffect(() => {
    const variants = product?.variants ?? [];
    if (variants.length === 0) {
      setSelectedVariantId(null);
      setQuantity(1);
      return;
    }

    const defaultVariant =
      variants.find((variant) => variant.is_active && getVariantStockQuantity(variant) > 0) ||
      variants.find((variant) => variant.is_active) ||
      variants[0];

    setSelectedVariantId(defaultVariant?.id ?? null);
    setQuantity(1);
  }, [product]);

  const { addToCart: addToCartContext } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const removeFlyingItem = useCallback((id: number) => {
    setFlyingItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const addToCart = async () => {
    if (!product) return;

    try {
      if (isOutOfStock) {
        toast.error('Sản phẩm hiện đang hết hàng');
        return;
      }

      if (!product.variants || product.variants.length === 0) {
        toast.error('Sản phẩm không có phiên bản nào khả dụng');
        return;
      }

      if (!selectedVariant) {
        toast.error('Vui lòng chọn phiên bản sản phẩm');
        return;
      }

      // Trigger flying animation
      if (productImageRef.current) {
        const rect = productImageRef.current.getBoundingClientRect();
        const imageUrl = productImageRef.current.src;

        setFlyingItems(prev => [...prev, {
          id: Date.now(),
          rect,
          imageUrl
        }]);
      }

      await addToCartContext(
        {
          variant_id: selectedVariant.id,
          quantity
        },
        product,
        selectedVariant
      );

      toast.success(`Đã thêm ${quantity} ${product.name} (${getVariantLabel(selectedVariant)}) vào giỏ hàng`);
    } catch (err: unknown) {
      console.error('Error adding to cart:', err);
      const productError = err as ProductPageError;

      if (productError.response?.status === 401) {
        toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      } else {
        toast.error('Không thể thêm vào giỏ hàng');
      }
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;

    if (!selectedVariantId) {
      toast.error('Sản phẩm không có phiên bản nào khả dụng');
      return;
    }

    await toggleWishlist(selectedVariantId);
  };

  // Calculate discount and rating from API data
  const selectedVariant = product?.variants?.find((variant) => variant.id === selectedVariantId)
    ?? product?.variants?.[0]
    ?? null;
  const selectedVariantPrice = selectedVariant?.final_price ?? product?.base_price ?? 0;
  const discount = product?.compare_at_price && selectedVariantPrice
    ? Math.round(((product.compare_at_price - selectedVariantPrice) / product.compare_at_price) * 100)
    : null;

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';
  const displayedAverageRating = reviewsSummary?.average_rating || averageRating;
  const totalReviews = reviewsSummary?.total_reviews ?? reviews.length;
  const ratingDistribution = new Map(
    (reviewsSummary?.rating_distribution || []).map((item) => [Number(item.rating), Number(item.count)])
  );

  const primaryImage = product?.images?.find(img => img.is_primary)?.image_url 
    || product?.images?.[0]?.image_url 
    || '/placeholder.png';

  const isWishlisted = selectedVariantId ? isInWishlist(selectedVariantId) : false;
  const selectedVariantStock = selectedVariant
    ? getVariantStockQuantity(selectedVariant)
    : Math.max(0, Number(product?.stock_quantity ?? 0));
  const stockQuantity = Math.max(0, selectedVariantStock);
  const isOutOfStock = !product?.is_active || !selectedVariant?.is_active || stockQuantity <= 0;
  const isLowStock = !isOutOfStock && stockQuantity <= 5;
  const canIncreaseQuantity = !isOutOfStock && quantity < stockQuantity;

  useEffect(() => {
    if (isOutOfStock) {
      setQuantity(1);
      return;
    }

    setQuantity((currentQuantity) => Math.min(currentQuantity, stockQuantity));
  }, [isOutOfStock, stockQuantity, selectedVariantId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-28 pb-16">
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
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-36 pb-16">
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
    <div className="min-h-screen bg-white">
      <Header />

      {flyingItems.map((item) => (
        <FlyToCartAnimation
          key={item.id}
          startRect={item.rect}
          imageUrl={item.imageUrl}
          onComplete={() => removeFlyingItem(item.id)}
        />
      ))}

      <main className="pt-36 pb-16">
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
                <Image
                  src={primaryImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  onLoad={(event) => {
                    productImageRef.current = event.currentTarget as HTMLImageElement;
                  }}
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
                      className={`w-5 h-5 ${i < Math.floor(Number(displayedAverageRating)) ? 'fill-[#CA8A04] text-[#CA8A04]' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-gray-900 font-medium">{displayedAverageRating}</span>
                <span className="text-gray-500">({totalReviews} đánh giá)</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {product.description}
              </p>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(selectedVariantPrice)}
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

              {product.variants && product.variants.length > 0 && (
                <div className="mb-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-500">
                      Phiên bản
                    </p>
                    {selectedVariant && (
                      <p className="text-sm text-gray-500">
                        SKU: <span className="font-medium text-gray-700">{selectedVariant.sku}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {product.variants.map((variant) => {
                      const variantStock = getVariantStockQuantity(variant);
                      const variantOutOfStock = !variant.is_active || variantStock <= 0;
                      const isSelected = variant.id === selectedVariantId;

                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => setSelectedVariantId(variant.id)}
                          className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                            isSelected
                              ? 'border-[#CA8A04] bg-[#fff7e6] shadow-sm'
                              : 'border-gray-200 bg-white hover:border-[#d8b15b]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {getVariantLabel(variant)}
                              </p>
                              <p className="mt-1 text-sm text-gray-500">
                                {formatPrice(variant.final_price)}
                              </p>
                            </div>
                            {variant.color_code && (
                              <span
                                className="mt-1 h-4 w-4 rounded-full border border-gray-200"
                                style={{ backgroundColor: variant.color_code }}
                                aria-hidden="true"
                              />
                            )}
                          </div>
                          <p className={`mt-2 text-sm ${
                            variantOutOfStock ? 'text-red-600' : variantStock <= 5 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {variantOutOfStock
                              ? 'Hết hàng'
                              : variantStock <= 5
                                ? `Còn ${variantStock} sản phẩm`
                                : `Sẵn kho ${variantStock} sản phẩm`}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={`mb-6 rounded-2xl border px-4 py-3 ${
                isOutOfStock
                  ? 'border-red-200 bg-red-50'
                  : isLowStock
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-emerald-200 bg-emerald-50'
              }`}>
                <div className="flex items-center gap-2">
                  {isOutOfStock ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : (
                    <Package className={`h-4 w-4 ${isLowStock ? 'text-amber-600' : 'text-emerald-600'}`} />
                  )}
                  <span className={`text-sm font-semibold ${
                    isOutOfStock
                      ? 'text-red-700'
                      : isLowStock
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                  }`}>
                    {isOutOfStock
                      ? `Phiên bản ${getVariantLabel(selectedVariant ?? undefined)} hiện đã hết hàng`
                      : isLowStock
                        ? `${getVariantLabel(selectedVariant ?? undefined)} sắp hết hàng, còn ${stockQuantity} sản phẩm`
                        : `${getVariantLabel(selectedVariant ?? undefined)} còn hàng, hiện có ${stockQuantity} sản phẩm`}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  Tình trạng kho đang hiển thị cho đúng phiên bản bạn đã chọn.
                </p>
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
                    onClick={() => {
                      if (canIncreaseQuantity) {
                        setQuantity(quantity + 1);
                      }
                    }}
                    disabled={!canIncreaseQuantity}
                    className="p-3 text-gray-500 hover:text-gray-900 transition-colors disabled:cursor-not-allowed disabled:text-gray-300"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={addToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                    !isOutOfStock
                      ? 'bg-[#CA8A04] text-white hover:bg-[#B47B04] active:scale-95 shadow-md'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {!isOutOfStock ? 'Thêm Vào Giỏ' : 'Hết Hàng'}
                </button>
              </div>

              {!isOutOfStock && (
                <p className="mb-8 text-sm text-gray-500">
                  Bạn có thể thêm tối đa {stockQuantity} sản phẩm cho phiên bản đang chọn.
                </p>
              )}

              <div className="flex items-center gap-4 mb-8">
                <button
                  onClick={handleToggleWishlist}
                  disabled={!selectedVariantId}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all bg-white shadow-sm ${
                    isWishlisted
                      ? 'border-[#CA8A04] text-[#CA8A04] bg-[#CA8A04]/10'
                      : 'border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                  aria-pressed={isWishlisted}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-[#CA8A04]' : ''}`} />
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
                Đánh Giá ({totalReviews})
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
                    <div className="text-5xl font-bold text-gray-900 mb-1">{displayedAverageRating}</div>
                    <div className="flex items-center gap-1 justify-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(Number(displayedAverageRating)) ? 'fill-[#CA8A04] text-[#CA8A04]' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-gray-500">{totalReviews} đánh giá</div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = ratingDistribution.get(stars) || 0;
                      const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
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

          {relatedProducts.length > 0 && (
            <section className="mt-16 border-t border-gray-200 pt-10">
              <div className="mb-6">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#8a5a00]">
                  Gợi ý cùng nhóm
                </p>
                <h2 className="mt-2 text-2xl font-heading font-bold text-gray-900">
                  Sản phẩm liên quan
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Các lựa chọn cùng danh mục để bạn so sánh nhanh hơn trước khi quyết định.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {relatedProducts.map((relatedProduct) => {
                  const relatedImage = relatedProduct.images?.find((image) => image.is_primary)?.image_url
                    || relatedProduct.images?.[0]?.image_url;
                  const relatedDiscount = relatedProduct.compare_at_price && relatedProduct.base_price
                    ? Math.round(((relatedProduct.compare_at_price - relatedProduct.base_price) / relatedProduct.compare_at_price) * 100)
                    : null;

                  return (
                    <a key={relatedProduct.id} href={`/product/${relatedProduct.id}`} className="group block">
                      <GlassCard className="h-full overflow-hidden border-gray-200 bg-white transition-transform duration-200 group-hover:-translate-y-1">
                        <div className="relative overflow-hidden border-b border-gray-100 bg-gray-50 p-4">
                          {relatedDiscount ? (
                            <div className="absolute left-4 top-4 z-10 rounded-full bg-[#111827] px-2.5 py-1 text-xs font-semibold text-white">
                              -{relatedDiscount}%
                            </div>
                          ) : null}
                          <ProductImage
                            src={relatedImage}
                            category={relatedProduct.category?.slug || 'products'}
                            alt={relatedProduct.name}
                            size="full"
                            className="aspect-square transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        </div>

                        <div className="space-y-3 p-5">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                              {relatedProduct.category?.name || 'Danh mục công nghệ'}
                            </p>
                            <h3 className="mt-2 line-clamp-2 text-lg font-heading font-bold text-gray-900">
                              {relatedProduct.name}
                            </h3>
                          </div>

                          <p className="line-clamp-2 text-sm leading-6 text-gray-600">
                            {relatedProduct.short_description || relatedProduct.description}
                          </p>

                          <div className="flex items-end justify-between gap-3">
                            <div>
                              <p className="text-lg font-bold text-gray-900">
                                {formatPrice(relatedProduct.base_price)}
                              </p>
                              {relatedProduct.compare_at_price ? (
                                <p className="text-sm text-gray-400 line-through">
                                  {formatPrice(relatedProduct.compare_at_price)}
                                </p>
                              ) : null}
                            </div>
                            <span className="text-sm font-semibold text-[#8a5a00] transition-transform group-hover:translate-x-1">
                              Xem chi tiết
                            </span>
                          </div>
                        </div>
                      </GlassCard>
                    </a>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
