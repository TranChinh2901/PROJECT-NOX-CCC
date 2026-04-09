'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWishlist } from '../../../../contexts/WishlistContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { WishlistItemCard } from '../../../../components/wishlist/WishlistItemCard';
import { Button } from '../../../../components/common/Button';
import { Header } from '../../../../components/layout/Header';
import { Footer } from '../../../../components/layout/Footer';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { productApi, recommendationApi } from '@/lib/api';
import { Product } from '@/types';
import { buildProductPath, formatPrice } from '@/lib/utils';
import { ProductImage } from '@/components/common/ProductImage';

export default function WishlistPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, isLoading, clearWishlist } = useWishlist();
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [recommendationReasons, setRecommendationReasons] = useState<Record<number, string>>({});
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  const wishlistProductIds = useMemo(
    () =>
      new Set(
        items
          .map((item) => item.product_id ?? item.product?.id ?? item.variant?.product_id ?? item.variant?.product?.id)
          .filter((productId): productId is number => Number.isInteger(productId))
      ),
    [items]
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/account/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    let isActive = true;

    const loadRecommendations = async () => {
      if (!user?.id) {
        return;
      }

      try {
        setRecommendationLoading(true);
        const personalized = await recommendationApi.getRecommendations(user.id, {
          limit: 8,
          strategy: 'hybrid',
        });

        const filteredRecommendations = personalized.recommendations.filter(
          (recommendation) => !wishlistProductIds.has(recommendation.productId)
        );

        let reasons = filteredRecommendations.reduce<Record<number, string>>((accumulator, recommendation) => {
          accumulator[recommendation.productId] = recommendation.reason;
          return accumulator;
        }, {});

        const products = await Promise.all(
          filteredRecommendations.slice(0, 4).map((recommendation) =>
            productApi.getProductById(recommendation.productId).catch(() => null)
          )
        );

        let normalizedProducts = products.filter((product): product is Product => Boolean(product));

        if (normalizedProducts.length === 0) {
          const featuredProducts = await productApi.getFeaturedProducts(4).catch(() => []);
          normalizedProducts = featuredProducts.filter((product) => !wishlistProductIds.has(product.id)).slice(0, 4);
          reasons = normalizedProducts.reduce<Record<number, string>>((accumulator, product) => {
            accumulator[product.id] = 'gợi ý nổi bật để bạn cân nhắc thêm';
            return accumulator;
          }, {});
        }

        if (!isActive) {
          return;
        }

        setRecommendedProducts(normalizedProducts);
        setRecommendationReasons(reasons);
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.error('Failed to load wishlist recommendations:', error);
        const featuredProducts = await productApi.getFeaturedProducts(4).catch(() => []);
        const normalizedProducts = featuredProducts
          .filter((product) => !wishlistProductIds.has(product.id))
          .slice(0, 4);

        setRecommendedProducts(normalizedProducts);
        setRecommendationReasons(
          normalizedProducts.reduce<Record<number, string>>((accumulator, product) => {
            accumulator[product.id] = 'gợi ý nổi bật để bạn cân nhắc thêm';
            return accumulator;
          }, {})
        );
      } finally {
        if (isActive) {
          setRecommendationLoading(false);
        }
      }
    };

    void loadRecommendations();

    return () => {
      isActive = false;
    };
  }, [user?.id, wishlistProductIds]);

  if (authLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-32 pb-12">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-4">
              <div className="h-10 w-48 bg-gray-200 rounded" />
              <div className="grid grid-cols-1 gap-6 mt-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-56 w-full bg-white rounded-2xl border border-gray-200" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-32 pb-12">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-4">
              <div className="h-10 w-48 bg-gray-200 rounded" />
              <div className="grid grid-cols-1 gap-6 mt-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-56 w-full bg-white rounded-2xl border border-gray-200" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-32 pb-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 mb-2">Danh sách yêu thích</h1>
              <p className="text-gray-600">
                {items.length} sản phẩm đã được lưu
              </p>
            </div>

            {items.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  void clearWishlist();
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 self-start md:self-auto"
              >
                Xóa danh sách
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-white border border-gray-200 shadow-sm">
              <div className="w-20 h-20 bg-[#CA8A04]/10 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-10 h-10 text-[#CA8A04]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Danh sách yêu thích trống</h2>
              <p className="text-gray-600 mb-8 max-w-md">
                Hãy lưu những sản phẩm bạn yêu thích vào danh sách để xem lại sau.
                Chúng sẽ luôn ở đây chờ bạn.
              </p>
              <Link href="/">
                <Button variant="primary">Bắt đầu mua sắm</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {items.map((item) => (
                  <WishlistItemCard key={item.id} item={item} />
                ))}
              </div>

              {(recommendationLoading || recommendedProducts.length > 0) && (
                <section className="mt-14 border-t border-gray-200 pt-10">
                  <div className="mb-6">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#8a5a00]">
                      Gợi ý thêm
                    </p>
                    <h2 className="mt-2 text-2xl font-heading font-bold text-gray-900">
                      Có thể bạn cũng thích
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      Các lựa chọn bổ sung dựa trên hành vi gần đây và danh sách yêu thích của bạn.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {recommendationLoading
                      ? Array.from({ length: 4 }).map((_, index) => (
                          <div
                            key={`wishlist-recommendation-skeleton-${index}`}
                            className="h-80 rounded-2xl border border-gray-200 bg-white animate-pulse"
                          />
                        ))
                      : recommendedProducts.map((product) => (
                          <Link
                            key={product.id}
                            href={buildProductPath(product)}
                            className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md"
                          >
                            <div className="border-b border-gray-100 bg-gray-50 p-4">
                              <ProductImage
                                src={product.images?.find((image) => image.is_primary)?.image_url || product.images?.[0]?.image_url}
                                category={product.category?.slug || 'products'}
                                alt={product.name}
                                size="full"
                                className="aspect-square transition-transform duration-300 group-hover:scale-[1.03]"
                              />
                            </div>

                            <div className="space-y-3 p-5">
                              {recommendationReasons[product.id] ? (
                                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8a5a00]">
                                  {recommendationReasons[product.id]}
                                </p>
                              ) : null}
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                                  {product.category?.name || 'Danh mục công nghệ'}
                                </p>
                                <h3 className="mt-2 line-clamp-2 text-lg font-heading font-bold text-gray-900">
                                  {product.name}
                                </h3>
                              </div>
                              <p className="line-clamp-2 text-sm leading-6 text-gray-600">
                                {product.short_description || product.description}
                              </p>
                              <div className="flex items-end justify-between gap-3">
                                <div>
                                  <p className="text-lg font-bold text-gray-900">
                                    {formatPrice(product.base_price)}
                                  </p>
                                  {product.compare_at_price ? (
                                    <p className="text-sm text-gray-400 line-through">
                                      {formatPrice(product.compare_at_price)}
                                    </p>
                                  ) : null}
                                </div>
                                <span className="text-sm font-semibold text-[#8a5a00] transition-transform group-hover:translate-x-1">
                                  Xem chi tiết
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
