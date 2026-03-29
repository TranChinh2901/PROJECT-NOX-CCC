'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { Address } from '@/types';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  DELIVERY_STORAGE_KEY,
  DELIVERY_SYNC_EVENT,
  readDeliveryAddressesFromStorage,
  syncDeliveryAddressesFromAccount,
  type DeliveryAddress,
} from '@/lib/delivery-address-sync';

interface SavedAddress extends Address {
  id: string;
  note?: string;
  isDefault: boolean;
}

const VIETNAM_CITY_OPTIONS = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Huế',
  'Nha Trang',
  'Đà Lạt',
  'Vũng Tàu',
  'Quy Nhơn',
  'Buôn Ma Thuột',
  'Biên Hòa',
  'Thủ Dầu Một',
  'Long Xuyên',
  'Rạch Giá',
  'Vinh',
  'Thanh Hóa',
  'Hạ Long',
  'Bắc Ninh',
  'Phan Thiết',
];

const mapDeliveryAddressToSavedAddress = (
  address: DeliveryAddress,
  index: number,
): SavedAddress => ({
  id: address.id,
  fullname: address.fullName,
  phone: address.phoneNumber,
  address: address.houseNumber,
  city: address.city,
  district: '',
  ward: '',
  postal_code: '',
  note: address.note,
  isDefault: index === 0,
});

const mergeSavedAddresses = (
  currentAddresses: SavedAddress[],
  deliveryAddresses: SavedAddress[],
): SavedAddress[] => {
  const deliveryIdSet = new Set(deliveryAddresses.map((address) => address.id));
  const merged = [...deliveryAddresses, ...currentAddresses.filter((address) => !deliveryIdSet.has(address.id))];

  if (merged.length === 0) {
    return merged;
  }

  const hasDefault = merged.some((address) => address.isDefault);
  if (hasDefault) {
    return merged;
  }

  return merged.map((address, index) => ({
    ...address,
    isDefault: index === 0,
  }));
};

const buildMapQuery = (address: SavedAddress): string => {
  return [address.address, address.city].filter(Boolean).join(', ');
};

export default function AddressesPage() {
  const { user, updateProfile } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddressHydrated, setIsAddressHydrated] = useState(false);
  const [formData, setFormData] = useState<SavedAddress>({
    id: '',
    fullname: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    postal_code: '',
    note: '',
    isDefault: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load addresses from user profile
  useEffect(() => {
    const profileAddresses: SavedAddress[] = [];

    if (user?.address) {
      try {
        const parsed = JSON.parse(user.address);
        if (Array.isArray(parsed)) {
          profileAddresses.push(...(parsed as SavedAddress[]));
        }
      } catch (error) {
        console.error('Failed to parse addresses:', error);
      }
    }

    const deliveryAddresses = readDeliveryAddressesFromStorage().map(mapDeliveryAddressToSavedAddress);
    const merged = mergeSavedAddresses(profileAddresses, deliveryAddresses);

    setAddresses(merged);
    setIsAddressHydrated(true);
  }, [user?.address]);

  useEffect(() => {
    const syncFromDelivery = () => {
      const deliveryAddresses = readDeliveryAddressesFromStorage().map(mapDeliveryAddressToSavedAddress);
      if (deliveryAddresses.length === 0) {
        return;
      }

      setAddresses((currentAddresses) => {
        const merged = mergeSavedAddresses(currentAddresses, deliveryAddresses);
        return JSON.stringify(currentAddresses) === JSON.stringify(merged) ? currentAddresses : merged;
      });
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === DELIVERY_STORAGE_KEY) {
        syncFromDelivery();
      }
    };

    window.addEventListener(DELIVERY_SYNC_EVENT, syncFromDelivery as EventListener);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(DELIVERY_SYNC_EVENT, syncFromDelivery as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!isAddressHydrated) {
      return;
    }

    syncDeliveryAddressesFromAccount(addresses);
  }, [addresses, isAddressHydrated]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Họ tên là bắt buộc';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Vui lòng nhập số điện thoại hợp lệ';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Số nhà/đường là bắt buộc';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'Thành phố là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof SavedAddress, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      let updatedAddresses: SavedAddress[];

      if (editingId) {
        updatedAddresses = addresses.map(addr => 
          addr.id === editingId ? { ...formData, id: editingId } : addr
        );
      } else {
        const newAddress: SavedAddress = {
          ...formData,
          id: Date.now().toString(),
        };
        updatedAddresses = [...addresses, newAddress];
      }

      if (formData.isDefault) {
        updatedAddresses = updatedAddresses.map(addr => ({
          ...addr,
          isDefault: addr.id === (editingId || formData.id),
        }));
      }

      if (updatedAddresses.length === 1) {
        updatedAddresses[0].isDefault = true;
      }

      await updateProfile({
        address: JSON.stringify(updatedAddresses),
      });

      setAddresses(updatedAddresses);
      resetForm();
    } catch (error) {
      console.error('Failed to save address:', error);
      alert('Failed to save address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (address: SavedAddress) => {
    setFormData(address);
    setEditingId(address.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const updatedAddresses = addresses.filter(addr => addr.id !== id);
      const wasDefault = addresses.find(addr => addr.id === id)?.isDefault;
      
      if (wasDefault && updatedAddresses.length > 0) {
        updatedAddresses[0].isDefault = true;
      }

      await updateProfile({
        address: JSON.stringify(updatedAddresses),
      });

      setAddresses(updatedAddresses);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete address:', error);
      alert('Failed to delete address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setIsLoading(true);
    try {
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id,
      }));

      await updateProfile({
        address: JSON.stringify(updatedAddresses),
      });

      setAddresses(updatedAddresses);
    } catch (error) {
      console.error('Failed to set default address:', error);
      alert('Failed to set default address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      fullname: '',
      phone: '',
      address: '',
      city: '',
      district: '',
      ward: '',
      postal_code: '',
      note: '',
      isDefault: false,
    });
    setEditingId(null);
    setIsFormOpen(false);
    setErrors({});
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8 pt-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Quản lý địa chỉ</h1>
            <p className="mt-2 text-gray-600">Thêm và quản lý địa chỉ giao hàng giống phần Giao đến</p>
          </div>

          {!isFormOpen && (
            <div className="mb-6">
              <Button
                variant="primary"
                onClick={() => setIsFormOpen(true)}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Thêm địa chỉ mới
              </Button>
            </div>
          )}

          {isFormOpen && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                    <input
                      type="text"
                      value={formData.fullname}
                      onChange={(e) => handleInputChange('fullname', e.target.value)}
                      placeholder="Nhập họ và tên"
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-[#CA8A04] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/20"
                    />
                    {errors.fullname && <p className="text-xs text-red-600 mt-1">{errors.fullname}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="098xxxxxxx"
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-[#CA8A04] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/20"
                    />
                    {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số nhà / đường</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Ví dụ: 24 Trần Kim Bảng"
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-[#CA8A04] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/20"
                  />
                  {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    list="manage-address-city-options"
                    placeholder="Chọn hoặc nhập thành phố"
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-[#CA8A04] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/20"
                  />
                  <datalist id="manage-address-city-options">
                    {VIETNAM_CITY_OPTIONS.map((cityOption) => (
                      <option key={cityOption} value={cityOption} />
                    ))}
                  </datalist>
                  {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (tuỳ chọn)</label>
                  <textarea
                    value={formData.note || ''}
                    onChange={(e) => handleInputChange('note', e.target.value)}
                    rows={2}
                    placeholder="Ví dụ: giao giờ hành chính"
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-[#CA8A04] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/20 resize-none"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                    className="w-4 h-4 text-[#CA8A04] border-gray-300 rounded focus:ring-[#CA8A04]"
                  />
                  <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                    Đặt làm địa chỉ mặc định
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isLoading}
                    disabled={isLoading}
                  >
                    {editingId ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={isLoading}
                  >
                    Huỷ
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {addresses.length === 0 && !isFormOpen && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No addresses yet</h3>
                <p className="mt-2 text-gray-600">Hãy thêm địa chỉ giao hàng đầu tiên để bắt đầu</p>
              </div>
            )}

            {addresses.map((address) => (
              <div
                key={address.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative"
              >
                {address.isDefault && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#CA8A04] text-white">
                      Default
                    </span>
                  </div>
                )}

                <div className="pr-20">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {address.fullname}
                  </h3>
                  <div className="space-y-1 text-gray-600">
                    <p>{address.phone}</p>
                    <p>{address.address}</p>
                    <p>{address.city}</p>
                    {address.note && <p className="italic text-gray-500">{address.note}</p>}
                  </div>

                  {buildMapQuery(address) && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Vị trí giao hàng</p>
                      <iframe
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(buildMapQuery(address))}&z=15&output=embed`}
                        title={`Bản đồ ${address.fullname}`}
                        loading="lazy"
                        className="w-full max-w-md h-36 rounded-lg border border-gray-200"
                      />
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(buildMapQuery(address))}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-2 text-xs text-[#B47B04] hover:text-[#8F5B00]"
                      >
                        Mở trên Google Maps
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(address)}
                    disabled={isLoading}
                  >
                    Sửa
                  </Button>

                  {!address.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                      disabled={isLoading}
                    >
                      Đặt mặc định
                    </Button>
                  )}

                  {deleteConfirmId === address.id ? (
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(address.id)}
                        disabled={isLoading}
                      >
                        Xác nhận xoá
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(null)}
                        disabled={isLoading}
                      >
                        Huỷ
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(address.id)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Xoá
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
