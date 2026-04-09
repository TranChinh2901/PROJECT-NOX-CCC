"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Menu,
  X,
  Search,
  ShoppingCart,
  User,
  MapPin,
  LogOut,
  Package,
  MapPinIcon,
  UserCircle,
  Heart,
  ShieldCheck,
  Trash2,
  Bell,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { NotificationBell } from "@/components/notifications";
import { RoleType } from "@/types/auth.types";
import { navigationApi, type NavigationItem } from "@/lib/api/navigation.api";
import {
  DELIVERY_STORAGE_KEY,
  DELIVERY_SYNC_EVENT,
  readDeliveryAddressesFromStorage,
  type DeliveryAddress,
} from "@/lib/delivery-address-sync";

function HeaderSearchParamsSync({
  onQueryChange,
}: {
  onQueryChange: (query: string) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    onQueryChange(searchParams.get("q") || "");
  }, [onQueryChange, searchParams]);

  return null;
}

const DEFAULT_DELIVERY_ADDRESSES: DeliveryAddress[] = [
  {
    id: "dn-q1",
    fullName: "Hoàng Văn Chuẩn",
    phoneNumber: "0985981024",
    city: "Đà Nẵng",
    houseNumber: "24 Trần Kim Bảng",
    note: "Giao giờ hành chính",
  },
];
const VIETNAM_CITY_OPTIONS = [
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "Huế",
  "Nha Trang",
  "Đà Lạt",
  "Vũng Tàu",
  "Quy Nhơn",
  "Buôn Ma Thuột",
  "Biên Hòa",
  "Thủ Dầu Một",
  "Long Xuyên",
  "Rạch Giá",
  "Vinh",
  "Thanh Hóa",
  "Hạ Long",
  "Bắc Ninh",
  "Phan Thiết",
];

const headerContainerClass =
  "mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8";

export const Header: React.FC = () => {
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showDeliveryPanel, setShowDeliveryPanel] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [navLinks, setNavLinks] = useState<NavigationItem[]>([]);
  const [deliveryAddresses, setDeliveryAddresses] = useState<DeliveryAddress[]>(
    DEFAULT_DELIVERY_ADDRESSES,
  );
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] =
    useState<string>(DEFAULT_DELIVERY_ADDRESSES[0].id);
  const [isDeliveryStorageHydrated, setIsDeliveryStorageHydrated] =
    useState(false);
  const [deliveryFullNameInput, setDeliveryFullNameInput] = useState("");
  const [deliveryPhoneNumberInput, setDeliveryPhoneNumberInput] = useState("");
  const [deliveryCityInput, setDeliveryCityInput] = useState("");
  const [deliveryHouseNumberInput, setDeliveryHouseNumberInput] = useState("");
  const [deliveryNoteInput, setDeliveryNoteInput] = useState("");
  const selectedDeliveryAddress =
    deliveryAddresses.find(
      (address) => address.id === selectedDeliveryAddressId,
    ) || deliveryAddresses[0];
  const selectedDeliveryText = selectedDeliveryAddress
    ? `${selectedDeliveryAddress.houseNumber}, ${selectedDeliveryAddress.city}`
    : user?.address || "your address";
  const selectedDeliveryMapQuery = selectedDeliveryAddress
    ? `${selectedDeliveryAddress.houseNumber}, ${selectedDeliveryAddress.city}`
    : user?.address || "";
  const userMenuRef = useRef<HTMLDivElement>(null);
  const cartPreviewRef = useRef<HTMLDivElement>(null);
  const deliveryPanelRef = useRef<HTMLDivElement>(null);
  const cartPreviewCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const openCartPreview = () => {
    if (cartPreviewCloseTimerRef.current) {
      clearTimeout(cartPreviewCloseTimerRef.current);
      cartPreviewCloseTimerRef.current = null;
    }
    setShowCartPreview(true);
  };

  const scheduleCloseCartPreview = () => {
    if (cartPreviewCloseTimerRef.current) {
      clearTimeout(cartPreviewCloseTimerRef.current);
    }
    cartPreviewCloseTimerRef.current = setTimeout(() => {
      setShowCartPreview(false);
    }, 180);
  };

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
    const syncFromStorage = () => {
      const storedAddresses = readDeliveryAddressesFromStorage();
      if (storedAddresses.length === 0) {
        setIsDeliveryStorageHydrated(true);
        return;
      }

      setDeliveryAddresses(storedAddresses);
      setSelectedDeliveryAddressId((currentSelectedId) => {
        const stillExists = storedAddresses.some(
          (address) => address.id === currentSelectedId,
        );
        return stillExists ? currentSelectedId : storedAddresses[0].id;
      });
      setIsDeliveryStorageHydrated(true);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === DELIVERY_STORAGE_KEY) {
        syncFromStorage();
      }
    };

    syncFromStorage();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(
      DELIVERY_SYNC_EVENT,
      syncFromStorage as EventListener,
    );

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        DELIVERY_SYNC_EVENT,
        syncFromStorage as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (!isDeliveryStorageHydrated) {
      return;
    }

    if (deliveryAddresses.length === 0) {
      return;
    }

    window.localStorage.setItem(
      DELIVERY_STORAGE_KEY,
      JSON.stringify(deliveryAddresses),
    );
  }, [deliveryAddresses, isDeliveryStorageHydrated]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserDropdown(false);
      }

      if (cartPreviewRef.current && !cartPreviewRef.current.contains(target)) {
        setShowCartPreview(false);
      }

      if (
        deliveryPanelRef.current &&
        !deliveryPanelRef.current.contains(target)
      ) {
        setShowDeliveryPanel(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowUserDropdown(false);
        setShowCartPreview(false);
        setShowDeliveryPanel(false);
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      if (cartPreviewCloseTimerRef.current) {
        clearTimeout(cartPreviewCloseTimerRef.current);
        cartPreviewCloseTimerRef.current = null;
      }
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
    const targetUrl =
      trimmedQuery.length >= 2
        ? `/search?q=${encodeURIComponent(trimmedQuery)}`
        : "/";
    router.push(targetUrl);
  };

  const handleSaveDeliveryAddress = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const city = deliveryCityInput.trim();
    const houseNumber = deliveryHouseNumberInput.trim();
    const fullName = deliveryFullNameInput.trim();
    const phoneNumber = deliveryPhoneNumberInput.trim();
    const note = deliveryNoteInput.trim();

    if (!city || !houseNumber || !fullName || !phoneNumber) {
      return;
    }

    const newAddress: DeliveryAddress = {
      id: `${Date.now()}`,
      fullName,
      phoneNumber,
      city,
      houseNumber,
      note,
    };

    setDeliveryAddresses((currentAddresses) => [
      newAddress,
      ...currentAddresses,
    ]);
    setSelectedDeliveryAddressId(newAddress.id);
    setDeliveryFullNameInput("");
    setDeliveryPhoneNumberInput("");
    setDeliveryCityInput("");
    setDeliveryHouseNumberInput("");
    setDeliveryNoteInput("");
  };

  const handleRemoveDeliveryAddress = (addressId: string) => {
    setDeliveryAddresses((currentAddresses) => {
      const nextAddresses = currentAddresses.filter(
        (address) => address.id !== addressId,
      );

      if (nextAddresses.length === 0) {
        return currentAddresses;
      }

      if (selectedDeliveryAddressId === addressId) {
        setSelectedDeliveryAddressId(nextAddresses[0].id);
      }

      return nextAddresses;
    });
  };

  return (
    <>
      <Suspense fallback={null}>
        <HeaderSearchParamsSync onQueryChange={setSearchValue} />
      </Suspense>
      <header className="fixed top-0 left-0 right-0 z-50">
        <div
          className={`bg-white border-b border-gray-200 shadow-sm transition-all ${isScrolled ? "py-1.5" : "py-2"}`}
        >
          <div className={headerContainerClass}>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center flex-shrink-0"
                aria-label="TechNova home"
              >
                <Image
                  src="/technova-mark.svg"
                  alt="TechNova logo"
                  width={48}
                  height={48}
                  className="h-12 w-12 sm:hidden"
                  priority
                />
                <Image
                  src="/technova-logo.svg"
                  alt="TechNova logo"
                  width={288}
                  height={80}
                  className="hidden h-16 w-auto sm:block"
                  priority
                />
              </Link>

              <div
                ref={deliveryPanelRef}
                className="hidden md:flex relative ml-4"
                onBlur={handleBlurWithin(setShowDeliveryPanel)}
              >
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={showDeliveryPanel}
                  aria-controls="delivery-address-panel"
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 cursor-pointer transition-colors max-w-[220px]"
                  onClick={() => setShowDeliveryPanel((current) => !current)}
                >
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-xs">Giao đến</span>
                    <span className="font-medium text-gray-900 truncate">
                      {selectedDeliveryText.length > 20
                        ? selectedDeliveryText.slice(0, 15) + "..."
                        : selectedDeliveryText}
                    </span>
                  </div>
                </button>

                {showDeliveryPanel && (
                  <div
                    id="delivery-address-panel"
                    role="dialog"
                    aria-label="Chọn địa chỉ giao hàng"
                    className="absolute top-full left-0 mt-2 w-[340px] bg-white rounded-xl border border-gray-200 shadow-2xl p-4 z-50"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      Địa chỉ giao hàng
                    </p>
                    <p className="text-xs text-gray-500 mt-1 mb-3">
                      Chọn địa chỉ có sẵn hoặc thêm địa chỉ mới.
                    </p>

                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {deliveryAddresses.map((address) => {
                        const isSelected =
                          address.id === selectedDeliveryAddressId;

                        return (
                          <div
                            key={address.id}
                            className={`w-full rounded-lg px-3 py-2 border transition-colors ${
                              isSelected
                                ? "border-[#CA8A04] bg-amber-50 text-gray-900"
                                : "border-gray-200 text-gray-700"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <button
                                type="button"
                                className="text-left flex-1"
                                onClick={() =>
                                  setSelectedDeliveryAddressId(address.id)
                                }
                              >
                                <p className="text-sm font-medium">
                                  {address.houseNumber}
                                </p>
                                <p className="text-xs">{address.city}</p>
                                {address.fullName && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {address.fullName}
                                  </p>
                                )}
                                {address.phoneNumber && (
                                  <p className="text-xs text-gray-600">
                                    {address.phoneNumber}
                                  </p>
                                )}
                                {address.note && (
                                  <p className="text-xs text-gray-500 italic">
                                    {address.note}
                                  </p>
                                )}
                              </button>
                              <button
                                type="button"
                                aria-label="Xoá địa chỉ"
                                className="text-red-500 hover:text-red-600 transition-colors mt-0.5"
                                onClick={() =>
                                  handleRemoveDeliveryAddress(address.id)
                                }
                                disabled={deliveryAddresses.length === 1}
                                title={
                                  deliveryAddresses.length === 1
                                    ? "Cần tối thiểu 1 địa chỉ"
                                    : "Xoá địa chỉ"
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <form
                      className="mt-3 space-y-2"
                      onSubmit={handleSaveDeliveryAddress}
                    >
                      <input
                        type="text"
                        value={deliveryFullNameInput}
                        onChange={(event) =>
                          setDeliveryFullNameInput(event.target.value)
                        }
                        placeholder="Họ và tên"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-[#CA8A04] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/20"
                      />
                      <input
                        type="tel"
                        value={deliveryPhoneNumberInput}
                        onChange={(event) =>
                          setDeliveryPhoneNumberInput(event.target.value)
                        }
                        placeholder="Số điện thoại"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-[#CA8A04] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/20"
                      />
                      <input
                        type="text"
                        value={deliveryHouseNumberInput}
                        onChange={(event) =>
                          setDeliveryHouseNumberInput(event.target.value)
                        }
                        placeholder="Số nhà / đường"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-[#CA8A04] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/20"
                      />
                      <input
                        type="text"
                        value={deliveryCityInput}
                        onChange={(event) =>
                          setDeliveryCityInput(event.target.value)
                        }
                        list="vn-city-options"
                        placeholder="Thành phố"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-[#CA8A04] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/20"
                      />
                      <textarea
                        value={deliveryNoteInput}
                        onChange={(event) =>
                          setDeliveryNoteInput(event.target.value)
                        }
                        placeholder="Ghi chú (tuỳ chọn)"
                        rows={2}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-[#CA8A04] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/20 resize-none"
                      />
                      <datalist id="vn-city-options">
                        {VIETNAM_CITY_OPTIONS.map((cityOption) => (
                          <option key={cityOption} value={cityOption} />
                        ))}
                      </datalist>
                      <button
                        type="submit"
                        className="w-full py-2 bg-[#CA8A04] text-white rounded-lg text-sm font-medium hover:bg-[#B47B04] transition-colors"
                      >
                        Lưu địa chỉ mới
                      </button>
                    </form>

                    {selectedDeliveryMapQuery && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">
                          Vị trí giao đến trên bản đồ
                        </p>
                        <iframe
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedDeliveryMapQuery)}&z=15&output=embed`}
                          title="Bản đồ địa chỉ giao hàng"
                          loading="lazy"
                          className="w-full h-32 rounded-lg border border-gray-200"
                        />
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedDeliveryMapQuery)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block mt-2 text-xs text-[#B47B04] hover:text-[#8F5B00]"
                        >
                          Mở trên Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="hidden md:block flex-1 max-w-2xl mx-4">
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
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md bg-[#CA8A04] hover:bg-[#B47B04] transition-colors"
                  >
                    <Search className="h-3.5 w-3.5 text-white" />
                  </button>
                </form>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 ml-auto">
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
                              alt={user.fullname || "User"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#CA8A04] to-[#B47B04] flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {user?.fullname?.[0]?.toUpperCase() || "U"}
                            </span>
                          </div>
                        )}
                        <div className="hidden sm:flex flex-col items-start">
                          <span className="text-xs">Xin chào</span>
                          <span className="font-medium text-gray-900 max-w-[100px] truncate">
                            {user?.fullname || user?.email?.split("@")[0]}
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
                          href="/account/notifications"
                          role="menuitem"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Bell className="w-4 h-4" />
                          <span>Thông báo</span>
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
                            window.location.href = "/";
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

                {isAuthenticated && user && (
                  <NotificationBell
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    settingsHref="/account/notifications/settings"
                    listHref="/account/notifications"
                  />
                )}

                <Link
                  href="/account/wishlist"
                  aria-label={`Yêu thích${wishlistCount > 0 ? `, ${wishlistCount} mục` : ""}`}
                  className="relative flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <div className="relative">
                    <Heart className="w-6 h-6" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#CA8A04] rounded-full text-xs text-white flex items-center justify-center font-bold">
                        {wishlistCount > 9 ? "9+" : wishlistCount}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-gray-900 hidden sm:block">
                    Yêu thích
                  </span>
                </Link>

                <div
                  ref={cartPreviewRef}
                  className="relative"
                  onMouseEnter={openCartPreview}
                  onMouseLeave={scheduleCloseCartPreview}
                  onFocus={openCartPreview}
                  onBlur={handleBlurWithin(setShowCartPreview)}
                >
                  <Link
                    href="/cart"
                    aria-label={`Mở giỏ hàng${itemCount > 0 ? `, ${itemCount} sản phẩm` : ""}`}
                    className="relative flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    onClick={() => setShowCartPreview(false)}
                  >
                    <div className="relative" data-cart-icon>
                      <ShoppingCart className="w-6 h-6" />
                      {itemCount > 0 && (
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#CA8A04] rounded-full text-xs text-white flex items-center justify-center font-bold">
                          {itemCount > 9 ? "9+" : itemCount}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-gray-900 hidden sm:block">
                      Giỏ hàng
                    </span>
                  </Link>

                  {showCartPreview && (
                    <div
                      id="cart-preview-panel"
                      className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-2xl p-4 z-50"
                      role="dialog"
                      aria-label="Xem trước giỏ hàng"
                      onMouseEnter={openCartPreview}
                      onMouseLeave={scheduleCloseCartPreview}
                    >
                      <p className="text-sm text-gray-900 font-medium mb-2">
                        {itemCount > 0
                          ? `${itemCount} sản phẩm trong giỏ`
                          : "Giỏ hàng của bạn đang trống"}
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
                  aria-label={
                    isMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"
                  }
                  className="md:hidden w-11 h-11 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Search Bar */}
            <div className="md:hidden mt-3 mb-1">
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
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md bg-[#CA8A04] hover:bg-[#B47B04] transition-colors"
                >
                  <Search className="h-3.5 w-3.5 text-white" />
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border-b border-gray-200">
          <div className={headerContainerClass}>
            <div className="flex items-center gap-6 py-2 overflow-x-auto scrollbar-hide">
              <button className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-[#CA8A04] transition-colors whitespace-nowrap">
                <Menu className="w-4 h-4" />
                Tất cả
              </button>

              <Link
                href="/service"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
              >
                Ý kiến khách hàng
              </Link>

              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
                  target={link.target === "_blank" ? "_blank" : undefined}
                  rel={link.target === "_blank" ? "noreferrer" : undefined}
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
                          alt={user.fullname || "User"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#CA8A04] to-[#B47B04] flex items-center justify-center">
                        <span className="text-white font-bold">
                          {user?.fullname?.[0]?.toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Xin chào</p>
                      <p className="text-gray-900 font-medium">
                        {user?.fullname || user?.email?.split("@")[0]}
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
                      window.location.href = "/";
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
                  target={link.target === "_blank" ? "_blank" : undefined}
                  rel={link.target === "_blank" ? "noreferrer" : undefined}
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
