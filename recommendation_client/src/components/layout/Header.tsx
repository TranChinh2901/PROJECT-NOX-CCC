  'use client';

  import React, { Suspense, useEffect, useRef, useState } from 'react';
  import Link from 'next/link';
  import Image from 'next/image';
  import { useRouter, useSearchParams } from 'next/navigation';
  import { Menu, X, Search, ShoppingCart, User, MapPin, LogOut, Package, MapPinIcon, UserCircle, Heart, ShieldCheck } from 'lucide-react';
  import { useCart } from '@/contexts/CartContext';
  import { useAuth } from '@/contexts/AuthContext';
  import { useWishlist } from '@/contexts/WishlistContext';
  import { RoleType } from '@/types/auth.types';
  import { navigationApi, type NavigationItem } from '@/lib/api/navigation.api';

  function HeaderSearchParamsSync({
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

  export const Header: React.FC = () => {
    const { itemCount } = useCart();
    const { wishlistCount } = useWishlist();
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showCartPreview, setShowCartPreview] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [navLinks, setNavLinks] = useState<NavigationItem[]>([]);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const cartPreviewRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 50);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
      let isMounted = true;

      const loadNavigation = async () => {
        try {
          const response = await navigationApi.getHeaderNavigation();
          if (isMounted) {
            setNavLinks(response);
          }
        } catch {
          if (isMounted) {
            setNavLinks([]);
          }
        }
      };

      loadNavigation();

      return () => {
        isMounted = false;
      };
    }, []);

    useEffect(() => {
      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target as Node;

        if (userMenuRef.current && !userMenuRef.current.contains(target)) {
          setShowUserDropdown(false);
        }

        if (cartPreviewRef.current && !cartPreviewRef.current.contains(target)) {
          setShowCartPreview(false);
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setShowUserDropdown(false);
          setShowCartPreview(false);
          setIsMenuOpen(false);
        }
      };

      document.addEventListener('pointerdown', handlePointerDown);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('pointerdown', handlePointerDown);
        document.removeEventListener('keydown', handleEscape);
      };
    }, []);

    const handleBlurWithin =
      (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
      (event: React.FocusEvent<HTMLDivElement>) => {
        const nextFocused = event.relatedTarget;

        if (!nextFocused || !event.currentTarget.contains(nextFocused as Node)) {
          setter(false);
        }
      };

    const handleSearch = () => {
      const trimmedQuery = searchValue.trim();
      const targetUrl = trimmedQuery.length >= 2 ? `/?q=${encodeURIComponent(trimmedQuery)}` : '/';
      router.push(targetUrl);
    };

    return (
      <>
        <Suspense fallback={null}>
          <HeaderSearchParamsSync onQueryChange={setSearchValue} />
        </Suspense>
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

              <div className="hidden md:flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 cursor-pointer transition-colors ml-4 max-w-[150px]">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs">Giao đến</span>
                  <span className="font-medium text-gray-900 truncate">
                    {user?.address || 'your address'}
                  </span>
                </div>
              </div>

              <div className="flex-1 max-w-2xl mx-4">
                <form
                  className="relative"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSearch();
                  }}
                >
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    aria-label="Tìm kiếm sản phẩm"
                    className="w-full pl-4 pr-12 py-2.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-500 focus:border-[#CA8A04] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/20 transition-all"
                  />
                  <button
                    type="submit"
                    aria-label="Tìm kiếm"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-md bg-[#CA8A04] flex items-center justify-center hover:bg-[#B47B04] transition-colors"
                  >
                    <Search className="w-4 h-4 text-white" />
                  </button>
                </form>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                {isAuthenticated && user ? (
                  <div
                    ref={userMenuRef}
                    className="relative"
                    onMouseEnter={() => setShowUserDropdown(true)}
                    onMouseLeave={() => setShowUserDropdown(false)}
                    onFocus={() => setShowUserDropdown(true)}
                    onBlur={handleBlurWithin(setShowUserDropdown)}
                  >
                    <div className="flex">
                      <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={showUserDropdown}
                        aria-controls="user-account-menu"
                        aria-label="Mở menu tài khoản"
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors pb-2"
                        onClick={() => setShowUserDropdown(true)}
                      >
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
                      <div
                        id="user-account-menu"
                        className="absolute top-full right-0 w-56 bg-white rounded-xl border border-gray-200 shadow-2xl py-2 z-50"
                        role="menu"
                      >
                        <Link 
                          href="/account/profile"
                          role="menuitem"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <UserCircle className="w-4 h-4" />
                          <span>Tài khoản của tôi</span>
                        </Link>
                        <Link 
                          href="/account/orders"
                          role="menuitem"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          <span>Đơn hàng</span>
                        </Link>
                        <Link
                          href="/account/wishlist"
                          role="menuitem"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          <span>Yêu thích</span>
                        </Link>
                        <Link 
                          href="/account/addresses"
                          role="menuitem"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <MapPinIcon className="w-4 h-4" />
                          <span>Địa chỉ</span>
                        </Link>
                        {user.role === RoleType.ADMIN && (
                          <Link
                            href="/admin"
                            role="menuitem"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#B47B04] hover:bg-amber-50 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Admin Panel</span>
                          </Link>
                        )}
                        <hr className="my-2 border-gray-200" />
                        <button 
                          type="button"
                          onClick={async () => {
                            await logout();
                            setShowUserDropdown(false);
                            window.location.href = '/';
                          }}
                          role="menuitem"
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
                  href="/account/wishlist"
                  aria-label={`Yêu thích${wishlistCount > 0 ? `, ${wishlistCount} mục` : ''}`}
                  className="relative flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <div className="relative">
                    <Heart className="w-6 h-6" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#CA8A04] rounded-full text-xs text-white flex items-center justify-center font-bold">
                        {wishlistCount > 9 ? '9+' : wishlistCount}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-gray-900 hidden sm:block">Yêu thích</span>
                </Link>

                <div
                  ref={cartPreviewRef}
                  className="relative"
                  onMouseEnter={() => setShowCartPreview(true)}
                  onMouseLeave={() => setShowCartPreview(false)}
                  onFocus={() => setShowCartPreview(true)}
                  onBlur={handleBlurWithin(setShowCartPreview)}
                >
                  <Link
                    href="/cart"
                    aria-label={`Mở giỏ hàng${itemCount > 0 ? `, ${itemCount} sản phẩm` : ''}`}
                    className="relative flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    onClick={() => setShowCartPreview(false)}
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
                  </Link>

                  {showCartPreview && (
                    <div
                      id="cart-preview-panel"
                      className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-2xl p-4 z-50"
                      role="dialog"
                      aria-label="Xem trước giỏ hàng"
                    >
                      <p className="text-sm text-gray-900 font-medium mb-2">
                        {itemCount > 0 ? `${itemCount} sản phẩm trong giỏ` : 'Giỏ hàng của bạn đang trống'}
                      </p>
                      <Link
                        href="/cart"
                        onClick={() => setShowCartPreview(false)}
                        className="block w-full py-2 bg-[#CA8A04] text-white rounded-lg text-sm font-medium hover:bg-[#B47B04] transition-colors text-center"
                      >
                        Xem giỏ hàng
                      </Link>
                    </div>
                  )}
                </div>

                <button 
                  type="button"
                  aria-label={isMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
                  className="md:hidden w-11 h-11 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
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
                <Link
                  key={link.id}
                  href={link.href}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
                  target={link.target === '_blank' ? '_blank' : undefined}
                  rel={link.target === '_blank' ? 'noreferrer' : undefined}
                >
                  {link.label}
                </Link>
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
                    href="/account/wishlist"
                    className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Heart className="w-5 h-5" />
                    <span>Yêu thích</span>
                  </Link>

                  <Link
                    href="/account/addresses"
                    className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <MapPinIcon className="w-5 h-5" />
                    <span>Địa chỉ</span>
                  </Link>

                  {user?.role === RoleType.ADMIN && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 text-[#B47B04] hover:text-[#8F5B00] transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ShieldCheck className="w-5 h-5" />
                      <span>Admin Panel</span>
                    </Link>
                  )}

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
                <Link
                  key={link.id}
                  href={link.href}
                  className="block text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                  target={link.target === '_blank' ? '_blank' : undefined}
                  rel={link.target === '_blank' ? 'noreferrer' : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
        </header>
      </>
    );
  };
