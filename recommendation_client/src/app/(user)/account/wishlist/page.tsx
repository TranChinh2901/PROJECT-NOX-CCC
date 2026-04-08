'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWishlist } from '../../../../contexts/WishlistContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { WishlistItemCard } from '../../../../components/wishlist/WishlistItemCard';
import { Button } from '../../../../components/common/Button';
import { Header } from '../../../../components/layout/Header';
import { Footer } from '../../../../components/layout/Footer';
import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, isLoading, clearWishlist } = useWishlist();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/account/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-32 pb-12">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {items.map((item) => (
                <WishlistItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
