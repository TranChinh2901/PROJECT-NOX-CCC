'use client';

import React, { Suspense, useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Skeleton } from '@/components/common/Skeleton';
import { productApi, recommendationApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types';
import { buildProductPath } from '@/lib/utils';
import { 
  BadgeCheck,
  Search, 
  Filter,
  Sparkles,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(price);
};

function SearchSearchParamsSync({
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

function ProductCard({ product }: { product: Product }) {
  const discount = product.compare_at_price 
    ? Math.round(((product.compare_at_price - product.base_price) / product.compare_at_price) * 100)
    : null;

  const primaryImage = product.images?.find(img => img.is_primary)?.image_url || 
                       product.images?.[0]?.image_url ||
                       'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop';
  const destinationHref = buildProductPath(product);
  const categoryLabel = product.category?.name ?? 'Thiết bị chọn lọc';
  const soldCount = product.sold_count ?? 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-none border border-[#ece4d7] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d8c6a3] hover:shadow-[0_18px_52px_rgba(15,23,42,0.11)]">
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,#fff7e6_0%,#f8f5ef_46%,#f3efe6_100%)]">
        {product.is_featured && (
          <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#171717] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-lg shadow-black/10 sm:left-4 sm:top-4 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.18em]">
            <Sparkles className="h-3 w-3 text-[#f6c453] sm:h-3.5 sm:w-3.5" />
            Nổi bật
          </div>
        )}

        {discount && (
          <div className="absolute right-3 top-3 z-10 rounded-full border border-red-100 bg-white/92 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-500 shadow-sm sm:right-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.16em]">
            -{discount}%
          </div>
        )}

        <Link href={destinationHref} className="relative block aspect-[4/3.65] overflow-hidden sm:aspect-[4/3.85]">
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.045]"
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

        <Link href={destinationHref} className="group/title">
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
          <BadgeCheck className="h-3.5 w-3.5 text-[#c58a10]" />
          <span>Đã bán {soldCount.toLocaleString('vi-VN')}</span>
        </div>
      </div>
    </article>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState('relevance');
  const [products, setProducts] = useState<Product[]>([]);
  const selectedCategory: number | null = null;
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const [loading, setLoading] = useState(true);
  const trackedSearchRef = useRef<string | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, selectedCategory]);

  useEffect(() => {
    let isActive = true;

    const runSearch = async () => {
      try {
        setLoading(true);
        if (!searchQuery.trim()) {
           // display empty or fetching all
           const productsData = await productApi.getAllProducts({ limit: 50 });
           if (isActive) {
             setProducts(productsData.data || []);
           }
           setLoading(false);
           return;
        }

        const response = await productApi.searchProducts(searchQuery, 100);
        if (isActive) {
          setProducts(response.data || []);
        }
      } catch (err) {
        if (isActive) {
          console.error('Error searching products:', err);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    runSearch();

    return () => {
      isActive = false;
    };
  }, [searchQuery]);

  useEffect(() => {
    const normalizedQuery = searchQuery.trim();

    if (!user?.id || normalizedQuery.length < 2) {
      return;
    }

    const trackingKey = `${user.id}:${normalizedQuery.toLowerCase()}`;
    if (trackedSearchRef.current === trackingKey) {
      return;
    }

    trackedSearchRef.current = trackingKey;

    recommendationApi.trackBehavior({
      userId: user.id,
      behaviorType: 'search',
      metadata: {
        query: normalizedQuery,
        page: 'search',
      },
    }).catch((trackingError: unknown) => {
      trackedSearchRef.current = null;
      console.error('Failed to track search behavior:', trackingError);
    });
  }, [user?.id, searchQuery]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Category filter
    if (selectedCategory !== null) {
      filtered = filtered.filter(p => p.category_id === selectedCategory);
    }
    
    // Sorting
    switch (sortBy) {
      case 'latest':
        filtered = [...filtered].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'topsales':
        filtered = [...filtered].sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0));
        break;
      case 'price_asc':
        filtered = [...filtered].sort((a, b) => a.base_price - b.base_price);
        break;
      case 'price_desc':
        filtered = [...filtered].sort((a, b) => b.base_price - a.base_price);
        break;
      case 'relevance':
      default:
        // Assume API returns in relevance order
        break;
    }
    
    return filtered;
  }, [products, sortBy, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-24 sm:pt-32">
      <Suspense fallback={null}>
        <SearchSearchParamsSync onQueryChange={setSearchQuery} />
      </Suspense>
      <Header />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8 items-start">
        {/* Left Sidebar Filter */}
        <aside className="w-full md:w-64 flex-shrink-0 lg:w-72 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
            <Filter className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-heading font-bold uppercase tracking-wider text-gray-900">
              Bộ lọc tìm kiếm
            </h2>
          </div>

          <div className="bg-white p-5 rounded-none border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 tracking-wide uppercase text-sm">Vận chuyển từ</h3>
            <div className="space-y-3">
              {[
                { id: 'ha-noi', label: 'Hà Nội' },
                { id: 'hcm', label: 'TP. Hồ Chí Minh' },
                { id: 'da-nang', label: 'Đà Nẵng' },
              ].map((loc) => (
                <label key={loc.id} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded text-[#CA8A04] focus:ring-[#CA8A04] border-gray-300 pointer-events-none" />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{loc.label}</span>
                </label>
              ))}
              <button className="text-sm text-[#B47B04] hover:text-[#8a5a00] flex items-center gap-1 mt-2">
                Thêm <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>



          <div className="bg-white p-5 rounded-none border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 tracking-wide uppercase text-sm">Thương hiệu</h3>
            <div className="space-y-3">
              {[
                { id: 'apple', label: 'Apple' },
                { id: 'samsung', label: 'Samsung' },
                { id: 'logitech', label: 'Logitech' },
              ].map((brand) => (
                <label key={brand.id} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded text-[#CA8A04] focus:ring-[#CA8A04] border-gray-300 pointer-events-none" />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{brand.label}</span>
                </label>
              ))}
            </div>
          </div>

        </aside>

        {/* Right Main Content */}
        <div className="flex-1 w-full flex flex-col min-h-[500px]">
          <div className="mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-500" />
            <h1 className="text-xl text-gray-900 font-medium">
              Kết quả tìm kiếm cho <span className="text-[#CA8A04] font-bold">&apos;{searchQuery}&apos;</span>
            </h1>
          </div>

          {/* Shopee-style Sort Toolbar */}
          <div className="bg-gray-100 p-3 rounded-sm flex flex-wrap items-center justify-between gap-4 border border-gray-200 shadow-sm mb-6">
            <div className="flex items-center gap-3 font-medium text-sm">
              <span className="text-gray-600 mr-2">Sắp xếp theo</span>
              <button 
                onClick={() => setSortBy('relevance')}
                className={`px-4 py-2 rounded-sm transition-colors ${sortBy === 'relevance' ? 'bg-[#CA8A04] text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-800'}`}
              >
                Liên quan
              </button>
              <button 
                onClick={() => setSortBy('latest')}
                className={`px-4 py-2 rounded-sm transition-colors ${sortBy === 'latest' ? 'bg-[#CA8A04] text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-800'}`}
              >
                Mới nhất
              </button>
              <button 
                onClick={() => setSortBy('topsales')}
                className={`px-4 py-2 rounded-sm transition-colors ${sortBy === 'topsales' ? 'bg-[#CA8A04] text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-800'}`}
              >
                Bán chạy
              </button>
              
              <select
                value={['price_asc', 'price_desc'].includes(sortBy) ? sortBy : 'price_default'}
                onChange={(e) => {
                  if (e.target.value !== 'price_default') {
                    setSortBy(e.target.value);
                  }
                }}
                className={`pl-3 pr-8 py-2 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#CA8A04] cursor-pointer appearance-none bg-white border border-gray-200 text-gray-800`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
              >
                <option value="price_default" disabled>Giá</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
              </select>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="font-medium"><span className="text-[#CA8A04]">{filteredProducts.length === 0 ? 0 : currentPage}</span>/{totalPages}</span>
              <div className="flex items-center gap-1 border border-gray-200 rounded overflow-hidden">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || filteredProducts.length === 0} 
                  className="px-3 py-1.5 bg-white text-gray-600 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || filteredProducts.length === 0} 
                  className="px-3 py-1.5 bg-white text-gray-600 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:opacity-50 border-l border-gray-200 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 flex-1 content-start">
            {loading ? (
              Array.from({ length: 15 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="overflow-hidden rounded-none border border-gray-200 bg-white"
                >
                  <Skeleton className="aspect-[4/3.65] w-full" rounded="none" />
                  <div className="space-y-2.5 p-3 sm:p-4">
                    <Skeleton height="20px" className="w-3/4" />
                    <Skeleton height="14px" className="w-full" />
                    <Skeleton height="24px" className="w-1/2" />
                  </div>
                </div>
              ))
            ) : paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : null}
          </div>

          {/* Bottom Pagination Bar */}
          {totalPages > 1 && (
            <div className="mt-10 mb-6 flex justify-center">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="mx-1 p-2 h-10 w-10 flex items-center justify-center border border-gray-200 rounded-sm bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNumber = i + 1;
                  if (
                    pageNumber === 1 || 
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`mx-1 w-10 h-10 flex items-center justify-center rounded-sm text-sm font-medium transition-colors ${
                          currentPage === pageNumber
                            ? 'bg-[#CA8A04] text-white border border-[#CA8A04]'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return <span key={pageNumber} className="mx-1 text-gray-400">...</span>;
                  }
                  return null;
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="mx-1 p-2 h-10 w-10 flex items-center justify-center border border-gray-200 rounded-sm bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 mt-10 border border-dashed border-gray-300 bg-white rounded-lg">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-heading font-medium text-gray-900 mb-2">
                Không tìm thấy kết quả nào
              </h3>
              <p className="text-gray-500">
                Vui lòng thử lại với các từ khóa khác hoặc xóa bộ lọc.
              </p>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}
