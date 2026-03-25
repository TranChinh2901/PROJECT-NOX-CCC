'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Hash,
  MapPin,
  Package,
  Receipt,
  Truck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import OrdersSkeleton from '@/components/common/OrdersSkeleton';
import { orderApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { OrderDetail, OrderStatus, OrderStatusHistoryEntry, PaymentMethod, PaymentStatus } from '@/types';

const statusClasses: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
  [OrderStatus.PROCESSING]: 'bg-purple-100 text-purple-800',
  [OrderStatus.SHIPPED]: 'bg-indigo-100 text-indigo-800',
  [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
  [OrderStatus.REFUNDED]: 'bg-gray-100 text-gray-800',
};

const paymentStatusClasses: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [PaymentStatus.PAID]: 'bg-green-100 text-green-800',
  [PaymentStatus.FAILED]: 'bg-red-100 text-red-800',
  [PaymentStatus.REFUNDED]: 'bg-gray-100 text-gray-800',
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.COD]: 'Cash on delivery',
  [PaymentMethod.CREDIT_CARD]: 'Credit card',
  [PaymentMethod.BANK_TRANSFER]: 'Bank transfer',
  [PaymentMethod.E_WALLET]: 'E-wallet',
};

const getStatusLabel = (value?: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ') : 'Unknown';

const formatDate = (value?: Date | string) => {
  if (!value) return 'N/A';

  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (value?: Date | string) => {
  if (!value) return 'N/A';

  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatAddressLines = (address?: Record<string, unknown> | null): string[] => {
  if (!address) return [];

  const primary = [address.fullname, address.phone].filter(Boolean).map(String);
  const secondary = [
    address.address,
    address.street,
    address.ward,
    address.district,
    address.city,
    address.country,
    address.postal_code,
  ]
    .filter(Boolean)
    .map(String);

  return [...primary, ...secondary];
};

const renderStatusHistoryTitle = (entry: OrderStatusHistoryEntry) => {
  if (entry.previous_status) {
    return `${getStatusLabel(entry.previous_status)} -> ${getStatusLabel(entry.status)}`;
  }

  return getStatusLabel(entry.status);
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = Number(params.id);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/account/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || Number.isNaN(orderId)) {
      if (!Number.isNaN(orderId)) {
        setIsLoading(false);
      }
      return;
    }

    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await orderApi.getOrderById(orderId);
        setOrder(response);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load order details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [isAuthenticated, orderId]);

  const shippingLines = useMemo(
    () => formatAddressLines((order?.shipping_address as Record<string, unknown> | undefined) ?? null),
    [order?.shipping_address]
  );

  const billingLines = useMemo(
    () => formatAddressLines((order?.billing_address as Record<string, unknown> | undefined) ?? null),
    [order?.billing_address]
  );

  if (authLoading || isLoading) {
    return (
      <>
        <Header />
        <OrdersSkeleton />
        <Footer />
      </>
    );
  }

  if (Number.isNaN(orderId)) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white py-12 pt-32">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
              Invalid order id.
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white py-12 pt-32">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
              {error || 'Order not found.'}
            </div>
            <div className="mt-6">
              <Button variant="outline" onClick={() => router.push('/account/orders')}>
                Back to Orders
              </Button>
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
      <div className="min-h-screen bg-[#fcfcfb] py-12 pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <button
                type="button"
                onClick={() => router.push('/account/orders')}
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to orders
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Order #{order.order_number}</h1>
              <p className="mt-2 text-gray-600">Placed on {formatDateTime(order.created_at)}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${statusClasses[order.status]}`}>
                {getStatusLabel(order.status)}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                  paymentStatusClasses[order.payment_status]
                }`}
              >
                Payment: {getStatusLabel(order.payment_status)}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
            <div className="space-y-6">
              <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-[#CA8A04]" />
                    <h2 className="text-lg font-semibold text-gray-900">Items</h2>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start">
                      <div className="h-24 w-24 overflow-hidden rounded-2xl bg-gray-100">
                        {item.product?.primary_image ? (
                          <img
                            src={item.product.primary_image}
                            alt={item.product?.name || item.product_snapshot.product_name || 'Order item'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <Package className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {item.product?.name || item.product_snapshot.product_name || `Item #${item.id}`}
                            </h3>
                            <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-500">
                              {item.variant?.sku && <span>SKU: {item.variant.sku}</span>}
                              {item.variant?.size && <span>Size: {item.variant.size}</span>}
                              {item.variant?.color && <span>Color: {item.variant.color}</span>}
                              {item.variant?.material && <span>Material: {item.variant.material}</span>}
                            </div>
                            {item.product_snapshot.product_description && (
                              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                                {item.product_snapshot.product_description}
                              </p>
                            )}
                            {item.product?.id && (
                              <div className="mt-3">
                                <Link
                                  href={`/product/${item.product.id}`}
                                  className="text-sm font-medium text-[#CA8A04] transition hover:text-[#B47B04]"
                                >
                                  View product
                                </Link>
                              </div>
                            )}
                          </div>

                          <div className="grid min-w-[180px] gap-2 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                            <div className="flex items-center justify-between gap-4">
                              <span>Qty</span>
                              <span className="font-semibold text-gray-900">{item.quantity}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span>Unit price</span>
                              <span className="font-semibold text-gray-900">{formatPrice(Number(item.unit_price))}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span>Line total</span>
                              <span className="font-semibold text-gray-900">{formatPrice(Number(item.total_price))}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-[#CA8A04]" />
                    <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
                  </div>
                  <div className="space-y-1 text-sm leading-6 text-gray-600">
                    {shippingLines.length > 0 ? shippingLines.map((line) => <p key={line}>{line}</p>) : <p>No shipping address found.</p>}
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <Receipt className="h-5 w-5 text-[#CA8A04]" />
                    <h2 className="text-lg font-semibold text-gray-900">Billing Address</h2>
                  </div>
                  <div className="space-y-1 text-sm leading-6 text-gray-600">
                    {billingLines.length > 0 ? billingLines.map((line) => <p key={line}>{line}</p>) : <p>No billing address found.</p>}
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <Truck className="h-5 w-5 text-[#CA8A04]" />
                  <h2 className="text-lg font-semibold text-gray-900">Order Timeline</h2>
                </div>

                <div className="space-y-4">
                  {order.status_history.length > 0 ? (
                    order.status_history.map((entry, index) => (
                      <div key={`${entry.status}-${entry.created_at}-${index}`} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="mt-1 h-3 w-3 rounded-full bg-[#CA8A04]" />
                          {index < order.status_history.length - 1 && <div className="mt-2 h-full w-px bg-gray-200" />}
                        </div>
                        <div className="pb-4">
                          <p className="font-semibold text-gray-900">{renderStatusHistoryTitle(entry)}</p>
                          <p className="mt-1 text-sm text-gray-500">{formatDateTime(entry.created_at)}</p>
                          {entry.notes && <p className="mt-2 text-sm text-gray-600">{entry.notes}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No status updates recorded yet.</p>
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>

                <div className="mt-5 space-y-4 text-sm">
                  <div className="flex items-start justify-between gap-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      <span>Order number</span>
                    </div>
                    <span className="text-right font-semibold text-gray-900">{order.order_number}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      <span>Placed</span>
                    </div>
                    <span className="text-right font-semibold text-gray-900">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Payment method</span>
                    </div>
                    <span className="text-right font-semibold text-gray-900">
                      {paymentMethodLabels[order.payment_method] ?? getStatusLabel(order.payment_method)}
                    </span>
                  </div>
                  {order.tracking_number && (
                    <div className="flex items-start justify-between gap-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        <span>Tracking</span>
                      </div>
                      <span className="text-right font-semibold text-gray-900">{order.tracking_number}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t border-gray-100 pt-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatPrice(Number(order.subtotal))}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>{formatPrice(Number(order.shipping_amount))}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Tax</span>
                      <span>{formatPrice(Number(order.tax_amount))}</span>
                    </div>
                    {Number(order.discount_amount) > 0 && (
                      <div className="flex items-center justify-between text-green-700">
                        <span>Discount</span>
                        <span>-{formatPrice(Number(order.discount_amount))}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-base font-semibold text-gray-900">
                      <span>Total</span>
                      <span>{formatPrice(Number(order.total_amount))}</span>
                    </div>
                  </div>
                </div>

                {order.notes && (
                  <div className="mt-6 rounded-2xl bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-900">Order notes</p>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{order.notes}</p>
                  </div>
                )}
              </section>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
