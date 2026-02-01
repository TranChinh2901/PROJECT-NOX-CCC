'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Search, ShoppingCart, User, MapPin, LogOut, Package, MapPinIcon, UserCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export const Header: React.FC = () => {
  const { itemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Khuyến Mãi Hôm Nay', href: '#deals' },
    { label: 'Dịch Vụ Khách Hàng', href: '#service' },
    { label: 'Thẻ Quà Tặng', href: '#giftcards' },
    { label: 'Bán Hàng', href: '#sell' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className={`bg-white border-b border-gray-200 shadow-sm transition-all ${isScrolled ? 'py-2' : 'py-3'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CA8A04] to-[#B47B04] flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-gray-900 font-heading font-bold text-xl hidden sm:block">
                TechNova
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 cursor-pointer transition-colors ml-4">
              <MapPin className="w-4 h-4" />
              <div className="flex flex-col">
                <span className="text-xs">Giao đến</span>
                <span className="font-medium text-gray-900">TP. Hồ Chí Minh</span>
              </div>
            </div>

            <div className="flex-1 max-w-2xl mx-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full pl-4 pr-12 py-2.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-500 focus:border-[#CA8A04] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/20 transition-all"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-[#CA8A04] flex items-center justify-center hover:bg-[#B47B04] transition-colors">
                  <Search className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {isAuthenticated && user ? (
                <div 
                  className="relative"
                  onMouseEnter={() => setShowUserDropdown(true)}
                  onMouseLeave={() => setShowUserDropdown(false)}
                >
                  <div className="flex">
                    <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors pb-2">
                      {user?.avatar ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200">
                          <Image 
                            src={user.avatar} 
                            alt={user.fullname || 'User'} 
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#CA8A04] to-[#B47B04] flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {user?.fullname?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col items-start">
                        <span className="text-xs">Xin chào</span>
                        <span className="font-medium text-gray-900 max-w-[100px] truncate">
                          {user?.fullname || user?.email?.split('@')[0]}
                        </span>
                      </div>
                    </button>
                  </div>

                  {showUserDropdown && (
                    <div className="absolute top-full right-0 w-56 bg-white rounded-xl border border-gray-200 shadow-2xl py-2 z-50">
                      <Link 
                        href="/account/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <UserCircle className="w-4 h-4" />
                        <span>Tài khoản của tôi</span>
                      </Link>
                      <Link 
                        href="/account/orders"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Package className="w-4 h-4" />
                        <span>Đơn hàng</span>
                      </Link>
                      <Link 
                        href="/account/addresses"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <MapPinIcon className="w-4 h-4" />
                        <span>Địa chỉ</span>
                      </Link>
                      <hr className="my-2 border-gray-200" />
                      <button 
                        onClick={async () => {
                          await logout();
                          window.location.href = '/';
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link 
                    href="/account/login"
                    className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link 
                    href="/account/signup"
                    className="px-4 py-2 bg-[#CA8A04] text-white rounded-lg text-sm font-medium hover:bg-[#B47B04] transition-colors"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}

              <Link
                href="/cart"
                className="relative flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                onMouseEnter={() => setShowCartPreview(true)}
                onMouseLeave={() => setShowCartPreview(false)}
              >
                <div className="relative" data-cart-icon>
                  <ShoppingCart className="w-6 h-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#CA8A04] rounded-full text-xs text-white flex items-center justify-center font-bold">
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </div>
                <span className="font-medium text-gray-900 hidden sm:block">Giỏ hàng</span>

                {showCartPreview && itemCount > 0 && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-2xl p-4 z-50">
                    <p className="text-sm text-gray-900 font-medium mb-2">
                      {itemCount} sản phẩm trong giỏ
                    </p>
                    <div className="w-full py-2 bg-[#CA8A04] text-white rounded-lg text-sm font-medium hover:bg-[#B47B04] transition-colors text-center">
                      Xem giỏ hàng
                    </div>
                  </div>
                )}
              </Link>

              <button 
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 py-2 overflow-x-auto scrollbar-hide">
            <button className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-[#CA8A04] transition-colors whitespace-nowrap">
              <Menu className="w-4 h-4" />
              Tất cả
            </button>
            
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-4 py-4 space-y-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                  {user?.avatar ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                      <Image 
                        src={user.avatar} 
                        alt={user.fullname || 'User'} 
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#CA8A04] to-[#B47B04] flex items-center justify-center">
                      <span className="text-white font-bold">
                        {user?.fullname?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Xin chào</p>
                    <p className="text-gray-900 font-medium">
                      {user?.fullname || user?.email?.split('@')[0]}
                    </p>
                  </div>
                </div>

                <Link
                  href="/account/profile"
                  className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserCircle className="w-5 h-5" />
                  <span>Tài khoản của tôi</span>
                </Link>

                <Link
                  href="/account/orders"
                  className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Package className="w-5 h-5" />
                  <span>Đơn hàng</span>
                </Link>

                <Link
                  href="/account/addresses"
                  className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MapPinIcon className="w-5 h-5" />
                  <span>Địa chỉ</span>
                </Link>

                <hr className="border-gray-200" />

                <button
                  onClick={async () => {
                    await logout();
                    setIsMenuOpen(false);
                    window.location.href = '/';
                  }}
                  className="flex items-center gap-3 text-red-600 hover:text-red-700 transition-colors w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Xin chào</p>
                    <p className="text-gray-900 font-medium">Khách</p>
                  </div>
                </div>

                <Link
                  href="/account/login"
                  className="block w-full py-2.5 text-center bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Đăng nhập
                </Link>

                <Link
                  href="/account/signup"
                  className="block w-full py-2.5 text-center bg-[#CA8A04] text-white rounded-lg hover:bg-[#B47B04] transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Đăng ký
                </Link>
              </>
            )}

            <hr className="border-gray-200" />
            
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
