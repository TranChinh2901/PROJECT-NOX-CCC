'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { buildProductPath, formatPrice } from '@/lib/utils';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { productApi, recommendationApi } from '@/lib/api';
import { Product } from '@/types';
import { ProductImage } from '@/components/common/ProductImage';

export default function CartPage() {
  const { cart, isLoading, updateQuantity, removeItem, bulkRemoveItems, refreshCart } = useCart();
  const { user } = useAuth();

  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [recommendationReasons, setRecommendationReasons] = useState<Record<number, string>>({});
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  const trackedRecommendationImpressionsRef = useRef<Set<string>>(new Set());

  const cartProductIds = useMemo(
    () =>
      new Set(
        (cart?.items ?? [])
          .map((item) => item.variant?.product?.id ?? item.variant?.product_id)
          .filter((productId): productId is number => Number.isInteger(productId))
      ),
    [cart?.items]
  );

  useBodyScrollLock(showConfirmDialog);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshCart();
    }, 500);
    return () => clearTimeout(timer);
  }, [refreshCart]);

  const isSelectAll = cart?.items && cart.items.length > 0 && selectedItems.size === cart.items.length;
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < (cart?.items?.length || 0);
  const hasSelection = selectedItems.size > 0;

  const toggleSelectItem = (itemId: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isSelectAll) {
      setSelectedItems(new Set());
    } else {
      const allIds = cart?.items?.map(item => item.id) || [];
      setSelectedItems(new Set(allIds));
    }
  };

  const clearSelection = () => setSelectedItems(new Set());

  // Dialog handlers
  const handleBulkDelete = () => setShowConfirmDialog(true);
  const cancelBulkDelete = () => {
    if (!isBulkDeleting) {
      setShowConfirmDialog(false);
    }
  };

  // Bulk delete logic
  const confirmBulkDelete = async () => {
    setIsBulkDeleting(true);
    const itemsToDelete = Array.from(selectedItems);

    try {
      await bulkRemoveItems(itemsToDelete);
      toast.success(`Đã xóa ${itemsToDelete.length} sản phẩm khỏi giỏ hàng`);
      clearSelection();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Không thể xóa sản phẩm. Vui lòng thử lại.');
    } finally {
      setIsBulkDeleting(false);
      setShowConfirmDialog(false);
    }
  };

  // Update checkbox indeterminate state
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  // Clean up selection when cart items change
  useEffect(() => {
    if (cart?.items) {
      const validIds = new Set(cart.items.map(item => item.id));
      setSelectedItems(prev => {
        const filtered = new Set([...prev].filter(id => validIds.has(id)));
        return filtered.size === prev.size ? prev : filtered;
      });
    }
  }, [cart?.items]);

  // Close dialog on Escape key
  useEffect(() => {
    if (!showConfirmDialog) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBulkDeleting) {
        cancelBulkDelete();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showConfirmDialog, isBulkDeleting]);

  useEffect(() => {
    let isActive = true;

    const loadCartRecommendations = async () => {
      if (!cart?.items?.length) {
        setRecommendedProducts([]);
        setRecommendationReasons({});
        return;
      }

      try {
        setRecommendationLoading(true);

        let products: Product[] = [];
        let reasons: Record<number, string> = {};

        if (user?.id) {
          const personalized = await recommendationApi.getRecommendations(user.id, {
            limit: 8,
            strategy: 'hybrid',
          });

          const filteredRecommendations = personalized.recommendations.filter(
            (recommendation) => !cartProductIds.has(recommendation.productId)
          );

          const resolvedProducts = await Promise.all(
            filteredRecommendations.slice(0, 4).map((recommendation) =>
              productApi.getProductById(recommendation.productId).catch(() => null)
            )
          );

          products = resolvedProducts.filter((product): product is Product => Boolean(product));
          reasons = filteredRecommendations.reduce<Record<number, string>>((accumulator, recommendation) => {
            accumulator[recommendation.productId] = recommendation.reason;
            return accumulator;
          }, {});
        }

        if (products.length === 0) {
          const featuredProducts = await productApi.getFeaturedProducts(4).catch(() => []);
          products = featuredProducts.filter((product) => !cartProductIds.has(product.id)).slice(0, 4);
          reasons = products.reduce<Record<number, string>>((accumulator, product) => {
            accumulator[product.id] = 'gợi ý nổi bật để mua kèm';
            return accumulator;
          }, {});
        }

        if (!isActive) {
          return;
        }

        setRecommendedProducts(products);
        setRecommendationReasons(reasons);
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.error('Failed to load cart recommendations:', error);
        const featuredProducts = await productApi.getFeaturedProducts(4).catch(() => []);
        const filteredFeaturedProducts = featuredProducts
          .filter((product) => !cartProductIds.has(product.id))
          .slice(0, 4);

        setRecommendedProducts(filteredFeaturedProducts);
        setRecommendationReasons(
          filteredFeaturedProducts.reduce<Record<number, string>>((accumulator, product) => {
            accumulator[product.id] = 'gợi ý nổi bật để mua kèm';
            return accumulator;
          }, {})
        );
      } finally {
        if (isActive) {
          setRecommendationLoading(false);
        }
      }
    };

    void loadCartRecommendations();

    return () => {
      isActive = false;
    };
  }, [user?.id, cart?.items, cartProductIds]);

  const trackCartRecommendationClick = useCallback((product: Product) => {
    if (!user?.id) {
      return;
    }

    recommendationApi.trackBehavior({
      userId: user.id,
      behaviorType: 'view',
      productId: product.id,
      categoryId: product.category?.id,
      metadata: {
        source: 'cart_recommendation',
        recommendationReason: recommendationReasons[product.id],
      },
    }).catch((error: unknown) => {
      console.error('Failed to track cart recommendation click:', error);
    });
  }, [user?.id, recommendationReasons]);

  useEffect(() => {
    if (!user?.id || recommendedProducts.length === 0) {
      return;
    }

    recommendedProducts.forEach((product) => {
      const impressionKey = `cart:${product.id}`;
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
          source: 'cart_recommendation',
          recommendationReason: recommendationReasons[product.id],
        },
      }).catch((error: unknown) => {
        trackedRecommendationImpressionsRef.current.delete(impressionKey);
        console.error('Failed to track cart recommendation impression:', error);
      });
    });
  }, [user?.id, recommendedProducts, recommendationReasons]);

  const handleIncreaseQuantity = async (itemId: number, currentQuantity: number) => {
    try {
      await updateQuantity(itemId, { quantity: currentQuantity + 1 });
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleDecreaseQuantity = async (itemId: number, currentQuantity: number) => {
    if (currentQuantity <= 1) {
      return;
    }
    try {
      await updateQuantity(itemId, { quantity: currentQuantity - 1 });
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeItem(itemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const subtotal = cart?.items?.reduce((sum, item) => {
    const price = item.variant?.final_price || item.unit_price || 0;
    return sum + price * item.quantity;
  }, 0) || 0;

  const shipping = subtotal > 500000 ? 0 : 30000;
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax;

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-lg p-6 h-40 shadow-sm"></div>
                  ))}
                </div>
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg p-6 h-64 shadow-sm"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-[calc(100vh-200px)] bg-gray-50 flex items-center justify-center mt-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 mb-6 bg-gray-100 rounded-full">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h2>
            <p className="text-gray-600 mb-8">
              Bạn chưa thêm sản phẩm nào vào giỏ hàng.
            </p>
            <Link href="/">
              <Button variant="primary" size="lg">
                Tiếp tục mua sắm
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8 mt-24">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Giỏ Hàng</h1>
            <p className="text-gray-600 mt-1">
              {cart.item_count} {cart.item_count === 1 ? 'sản phẩm' : 'sản phẩm'} trong giỏ hàng
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.items && cart.items.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3">
                  <input
                    type="checkbox"
                    ref={selectAllCheckboxRef}
                    checked={isSelectAll || false}
                    onChange={toggleSelectAll}
                    disabled={isBulkDeleting}
                    className="w-5 h-5 text-[#CA8A04] border-gray-300 rounded focus:ring-[#CA8A04] focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Chọn tất cả sản phẩm"
                  />
                  <span className="text-gray-700 font-medium select-none">
                    {isSelectAll ? 'Bỏ chọn tất cả' : 'Chọn tất cả'} ({cart.items.length} sản phẩm)
                  </span>
                </div>
              )}
              {cart.items.map((item) => {
                const variant = item.variant;
                const product = variant?.product;

                const price = variant?.final_price ?? product?.base_price ?? item.unit_price ?? 0;
                const itemTotal = price * item.quantity;
                const productName = product?.name || variant?.sku || 'Sản phẩm';
                const productImage = product?.images?.find(img => img.is_primary)?.image_url
                  || product?.images?.[0]?.image_url;

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-lg shadow-sm p-6 flex gap-4 hover:shadow-md transition-all ${selectedItems.has(item.id)
                      ? 'ring-2 ring-[#CA8A04] bg-amber-50/30'
                      : ''
                      }`}
                  >
                    {/* Checkbox column */}
                    <div className="flex-shrink-0 flex items-start pt-1">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        disabled={isBulkDeleting}
                        className="w-5 h-5 text-[#CA8A04] border-gray-300 rounded focus:ring-[#CA8A04] focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        aria-label={`Chọn ${productName}`}
                      />
                    </div>

                    {/* Rest of the item content - wrap in flex container */}
                    <div className="flex-1 flex flex-col sm:flex-row gap-4">
                      <div className="flex-shrink-0">
                        <div className="relative w-full sm:w-24 h-48 sm:h-24 bg-gray-100 rounded-lg overflow-hidden">
                          {productImage ? (
                            <img
                              src={productImage}
                              alt={productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full text-gray-400">
                              <svg
                                className="w-8 h-8"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                          {productName}
                        </h3>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-2">
                          {variant?.size && <span>Kích cỡ: {variant.size}</span>}
                          {variant?.color && (
                            <span className="flex items-center gap-1">
                              Màu: {variant.color}
                              {variant.color_code && (
                                <span
                                  className="inline-block w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: variant.color_code }}
                                ></span>
                              )}
                            </span>
                          )}
                          {variant?.sku && <span>SKU: {variant.sku}</span>}
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {formatPrice(price)}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4">
                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                          <button
                            onClick={() => handleDecreaseQuantity(item.id, item.quantity)}
                            disabled={item.quantity <= 1}
                            className="px-3 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-l-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Giảm số lượng"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="px-4 py-1 text-gray-900 font-medium min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleIncreaseQuantity(item.id, item.quantity)}
                            className="px-3 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-r-lg transition-colors"
                            aria-label="Tăng số lượng"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 mb-2">
                            {formatPrice(itemTotal)}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-sm text-red-600 hover:text-red-700 hover:underline transition-colors"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-28">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Tóm Tắt Đơn Hàng</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển</span>
                    <span>{shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Thuế (10%)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Tổng cộng</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <Link href="/checkout" className="block">
                    <Button variant="primary" size="lg" fullWidth>
                      Tiến Hành Thanh Toán
                    </Button>
                  </Link>
                  <Link href="/" className="block">
                    <Button variant="outline" size="lg" fullWidth>
                      Tiếp Tục Mua Sắm
                    </Button>
                  </Link>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">Thanh toán an toàn</p>
                      <p>Thông tin thanh toán của bạn được bảo vệ</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {(recommendationLoading || recommendedProducts.length > 0) && (
            <section className="mt-14 border-t border-gray-200 pt-10">
              <div className="mb-6">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#8a5a00]">
                  Gợi ý mua kèm
                </p>
                <h2 className="mt-2 text-2xl font-heading font-bold text-gray-900">
                  Có thể bạn sẽ cần thêm
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Các sản phẩm bổ sung được chọn theo hành vi mua sắm và nội dung trong giỏ hàng của bạn.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {recommendationLoading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={`cart-recommendation-skeleton-${index}`}
                        className="h-80 rounded-2xl border border-gray-200 bg-white animate-pulse"
                      />
                    ))
                  : recommendedProducts.map((product) => (
                      <Link
                        key={product.id}
                        href={buildProductPath(product)}
                        onClick={() => trackCartRecommendationClick(product)}
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
        </div>
      </div>

      {/* Bulk Action Bar */}
      {hasSelection && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-40 transform transition-transform duration-300 ease-out">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <span className="text-gray-900 font-semibold text-lg">
                  Đã chọn <span className="text-[#CA8A04]">{selectedItems.size}</span> sản phẩm
                </span>
                <button
                  onClick={clearSelection}
                  disabled={isBulkDeleting}
                  className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Bỏ chọn
                </button>
              </div>
              <Button
                variant="danger"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting || selectedItems.size === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa {selectedItems.size} sản phẩm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add padding to prevent content overlap with bulk action bar */}
      {hasSelection && <div className="h-20 sm:h-16" />}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-none p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={cancelBulkDelete}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div className="relative mx-4 w-full max-w-md overscroll-contain rounded-2xl bg-white shadow-2xl transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                {/* Warning Icon */}
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>

                <h3
                  id="dialog-title"
                  className="text-xl font-bold text-gray-900 mb-2"
                >
                  Xác nhận xóa sản phẩm
                </h3>

                <p
                  id="dialog-description"
                  className="text-gray-600 mb-6 leading-relaxed"
                >
                  Bạn có chắc chắn muốn xóa <span className="font-semibold text-gray-900">{selectedItems.size} sản phẩm</span> khỏi giỏ hàng?
                  <br />
                  <span className="text-sm text-gray-500">Hành động này không thể hoàn tác.</span>
                </p>

                <div className="flex gap-3 w-full">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={cancelBulkDelete}
                    disabled={isBulkDeleting}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={confirmBulkDelete}
                    loading={isBulkDeleting}
                    disabled={isBulkDeleting}
                  >
                    {isBulkDeleting ? 'Đang xóa...' : `Xóa ${selectedItems.size} sản phẩm`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}
