'use client';

import React, { useState } from 'react';
import { Menu, X, Search, ShoppingCart, User, MapPin } from 'lucide-react';

interface HeaderProps {
  cartItemCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ cartItemCount = 0 }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);

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
            <a href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CA8A04] to-[#B47B04] flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-gray-900 font-heading font-bold text-xl hidden sm:block">
                TechNova
              </span>
            </a>

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
              <button className="hidden sm:flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                <User className="w-5 h-5" />
                <div className="flex flex-col items-start">
                  <span className="text-xs">Xin chào</span>
                  <span className="font-medium text-gray-900">Tài khoản</span>
                </div>
              </button>

              <button 
                className="relative flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                onMouseEnter={() => setShowCartPreview(true)}
                onMouseLeave={() => setShowCartPreview(false)}
              >
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#CA8A04] rounded-full text-xs text-white flex items-center justify-center font-bold">
                      {cartItemCount > 9 ? '9+' : cartItemCount}
                    </span>
                  )}
                </div>
                <span className="font-medium text-gray-900 hidden sm:block">Giỏ hàng</span>

                {showCartPreview && cartItemCount > 0 && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-2xl p-4 z-50">
                    <p className="text-sm text-gray-900 font-medium mb-2">
                      {cartItemCount} sản phẩm trong giỏ
                    </p>
                    <button className="w-full py-2 bg-[#CA8A04] text-white rounded-lg text-sm font-medium hover:bg-[#B47B04] transition-colors">
                      Xem giỏ hàng
                    </button>
                  </div>
                )}
              </button>

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
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Xin chào</p>
                <p className="text-gray-900 font-medium">Tài khoản của bạn</p>
              </div>
            </div>
            
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
