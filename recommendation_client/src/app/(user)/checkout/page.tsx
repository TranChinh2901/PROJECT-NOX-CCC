'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { orderApi, paymentApi } from '@/lib/api';
import { PaymentMethod } from '@/types/product.types';
import type { Address } from '@/types';
import { formatPrice } from '@/lib/utils';
import {
  DELIVERY_STORAGE_KEY,
  DELIVERY_SYNC_EVENT,
  readDeliveryAddressesFromStorage,
} from '@/lib/delivery-address-sync';

interface FormErrors {
  fullname?: string;
  phone?: string;
  address?: string;
  city?: string;
  selectedAddress?: string;
  paymentMethod?: string;
}

type SavedAddressOption = {
  id: string;
  fullname: string;
  phone: string;
  address: string;
  city: string;
  note?: string;
  isDefault?: boolean;
};

const mapUserAddressItem = (item: unknown): SavedAddressOption | null => {
  const id = typeof (item as { id?: unknown })?.id === 'string' ? (item as { id: string }).id : '';
  const fullname = typeof (item as { fullname?: unknown })?.fullname === 'string' ? (item as { fullname: string }).fullname : '';
  const phone = typeof (item as { phone?: unknown })?.phone === 'string' ? (item as { phone: string }).phone : '';
  const address = typeof (item as { address?: unknown })?.address === 'string' ? (item as { address: string }).address : '';
  const city = typeof (item as { city?: unknown })?.city === 'string' ? (item as { city: string }).city : '';

  if (!id || !fullname || !phone || !address || !city) {
    return null;
  }

  return {
    id,
    fullname,
    phone,
    address,
    city,
    note: typeof (item as { note?: unknown })?.note === 'string' ? (item as { note: string }).note : '',
    isDefault: Boolean((item as { isDefault?: unknown })?.isDefault),
  };
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionLabel, setSubmissionLabel] = useState('Place Order');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string>('');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressOption[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  const [shippingAddress, setShippingAddress] = useState<Address>({
    fullname: user?.fullname || '',
    phone: user?.phone_number || '',
    address: '',
    city: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.COD);
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/account/login?redirect=/checkout');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const syncAddresses = () => {
      const fromDeliveryStorage = readDeliveryAddressesFromStorage().map((address) => ({
        id: address.id,
        fullname: address.fullName,
        phone: address.phoneNumber,
        address: address.houseNumber,
        city: address.city,
        note: address.note,
        isDefault: false,
      }));

      const fromProfile = (() => {
        if (!user?.address) {
          return [] as SavedAddressOption[];
        }

        try {
          const parsed = JSON.parse(user.address);
          if (!Array.isArray(parsed)) {
            return [] as SavedAddressOption[];
          }

          return parsed
            .map(mapUserAddressItem)
            .filter((item): item is SavedAddressOption => Boolean(item));
        } catch {
          return [] as SavedAddressOption[];
        }
      })();

      const source = fromProfile.length > 0 ? fromProfile : fromDeliveryStorage;
      setSavedAddresses(source);
      setSelectedAddressId((current) => {
        const exists = source.some((address) => address.id === current);
        if (exists) {
          return current;
        }

        const defaultAddress = source.find((address) => address.isDefault) || source[0];
        return defaultAddress?.id || '';
      });
    };

    syncAddresses();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === DELIVERY_STORAGE_KEY) {
        syncAddresses();
      }
    };

    window.addEventListener(DELIVERY_SYNC_EVENT, syncAddresses as EventListener);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(DELIVERY_SYNC_EVENT, syncAddresses as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, [user]);

  useEffect(() => {
    const selected = savedAddresses.find((address) => address.id === selectedAddressId);
    if (!selected) {
      return;
    }

    setShippingAddress({
      fullname: selected.fullname,
      phone: selected.phone,
      address: selected.address,
      city: selected.city,
    });
  }, [savedAddresses, selectedAddressId]);

  useEffect(() => {
    if (!selectedAddressId) {
      setShowAddressPicker(true);
    }
  }, [selectedAddressId]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!selectedAddressId) {
      newErrors.selectedAddress = 'Please choose a saved delivery address';
    }

    if (!paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!validateForm()) {
      return;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      setFormError('Your cart is empty');
      return;
    }

    if (!cart.id) {
      setFormError('Invalid cart data');
      return;
    }

    setIsSubmitting(true);

    try {
      setSubmissionLabel(
        paymentMethod === PaymentMethod.E_WALLET ? 'Redirecting to MoMo...' : 'Processing...'
      );

      const orderData = {
        cart_id: cart.id,
        shipping_address: shippingAddress,
        billing_address: shippingAddress,
        payment_method: paymentMethod,
      };

      const order = await orderApi.createOrder(orderData);

      if (paymentMethod === PaymentMethod.E_WALLET) {
        const momoPayment = await paymentApi.createMomoPayment(order.id);

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'technova_momo_last_session',
            JSON.stringify({
              order_id: momoPayment.order_id,
              order_number: momoPayment.order_number,
              request_id: momoPayment.request_id,
              pay_url: momoPayment.pay_url,
              created_at: new Date().toISOString(),
            })
          );
          await clearCart();
          window.location.href = momoPayment.pay_url;
          return;
        }
      }

      setOrderNumber(order.order_number);
      setOrderSuccess(true);

      await clearCart();
    } catch (error) {
      console.error('Order creation failed:', error);
      setFormError(
        error instanceof Error 
          ? error.message 
          : 'Failed to create order. Please try again.'
      );
    } finally {
      setSubmissionLabel('Place Order');
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CA8A04] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Placed Successfully!
            </h1>
            <p className="text-gray-600 mb-6">
              Your order has been confirmed and is being processed.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Order Number</p>
              <p className="text-2xl font-bold text-[#CA8A04]">{orderNumber}</p>
            </div>
            <p className="text-gray-600 mb-8">
              We&apos;ve sent a confirmation email with your order details.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => router.push('/account/orders')}
              >
                View Orders
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push('/')}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Your cart is empty
            </h1>
            <p className="text-gray-600 mb-6">
              Add some items to your cart before checking out.
            </p>
            <Button onClick={() => router.push('/')}>
              Browse Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = cart.total_amount || 0;
  const shippingFee = 30000;
  const total = subtotal + shippingFee;
  const selectedAddress = savedAddresses.find((address) => address.id === selectedAddressId) || null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Shipping Address
              </h2>
              {savedAddresses.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-800">Bạn chưa có địa chỉ nào trong Quản lý địa chỉ.</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3"
                    onClick={() => router.push('/account/addresses')}
                  >
                    Thêm địa chỉ ngay
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedAddress && (
                    <div className="w-full text-left rounded-lg border border-[#CA8A04] bg-amber-50 p-4">
                      <p className="font-semibold text-gray-900">{selectedAddress.fullname}</p>
                      <p className="text-sm text-gray-700 mt-1">{selectedAddress.phone}</p>
                      <p className="text-sm text-gray-700">{selectedAddress.address}</p>
                      <p className="text-sm text-gray-700">{selectedAddress.city}</p>
                      {selectedAddress.note && (
                        <p className="text-xs text-gray-500 italic mt-1">{selectedAddress.note}</p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddressPicker((current) => !current)}
                    >
                      {showAddressPicker ? 'Ẩn danh sách địa chỉ' : 'Đổi địa chỉ khác'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.push('/account/addresses')}
                    >
                      Quản lý địa chỉ / thêm mới
                    </Button>
                  </div>

                  {showAddressPicker && (
                    <div className="space-y-2">
                      {savedAddresses.map((address) => {
                        const isSelected = address.id === selectedAddressId;

                        return (
                          <button
                            key={address.id}
                            type="button"
                            onClick={() => {
                              setSelectedAddressId(address.id);
                              setShowAddressPicker(false);
                              setErrors((prev) => ({ ...prev, selectedAddress: undefined }));
                            }}
                            className={`w-full text-left rounded-lg border p-4 transition-colors ${
                              isSelected
                                ? 'border-[#CA8A04] bg-amber-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <p className="font-semibold text-gray-900">{address.fullname}</p>
                            <p className="text-sm text-gray-700 mt-1">{address.phone}</p>
                            <p className="text-sm text-gray-700">{address.address}</p>
                            <p className="text-sm text-gray-700">{address.city}</p>
                            {address.note && <p className="text-xs text-gray-500 italic mt-1">{address.note}</p>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {errors.selectedAddress && (
                <p className="mt-3 text-sm text-red-600">{errors.selectedAddress}</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Payment Method
              </h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#CA8A04] transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={PaymentMethod.COD}
                    checked={paymentMethod === PaymentMethod.COD}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value as PaymentMethod);
                      setErrors((prev) => ({ ...prev, paymentMethod: undefined }));
                    }}
                    className="w-4 h-4 text-[#CA8A04] focus:ring-[#CA8A04]"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Cash on Delivery</p>
                    <p className="text-sm text-gray-600">Pay when you receive your order</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#CA8A04] transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={PaymentMethod.CREDIT_CARD}
                    checked={paymentMethod === PaymentMethod.CREDIT_CARD}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value as PaymentMethod);
                      setErrors((prev) => ({ ...prev, paymentMethod: undefined }));
                    }}
                    className="w-4 h-4 text-[#CA8A04] focus:ring-[#CA8A04]"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Credit Card</p>
                    <p className="text-sm text-gray-600">Reserved for future gateway integration</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#CA8A04] transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={PaymentMethod.E_WALLET}
                    checked={paymentMethod === PaymentMethod.E_WALLET}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value as PaymentMethod);
                      setErrors((prev) => ({ ...prev, paymentMethod: undefined }));
                    }}
                    className="w-4 h-4 text-[#CA8A04] focus:ring-[#CA8A04]"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">MoMo Sandbox</p>
                    <p className="text-sm text-gray-600">Create order first, then redirect to MoMo test payment page</p>
                  </div>
                </label>
              </div>
              {errors.paymentMethod && (
                <p className="mt-2 text-sm text-red-600">{errors.paymentMethod}</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <p className="text-gray-900">
                        Variant ID: {formatPrice(item.variant_id)}
                      </p>
                      <p className="text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-900">
                      {formatPrice(item.total_price)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>{formatPrice(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {formError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              <Button
                type="button"
                onClick={handleSubmitOrder}
                fullWidth
                loading={isSubmitting}
                disabled={isSubmitting}
                className="mt-6"
              >
                {isSubmitting ? submissionLabel : paymentMethod === PaymentMethod.E_WALLET ? 'Pay with MoMo Sandbox' : 'Place Order'}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By placing your order, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
