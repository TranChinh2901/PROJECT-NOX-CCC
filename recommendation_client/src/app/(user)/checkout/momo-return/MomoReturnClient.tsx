'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { orderApi, paymentApi, recommendationApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentStatus } from '@/types';
import type { MomoCallbackPayload } from '@/lib/api/payment.api';

const MOMO_LAST_SESSION_KEY = 'technova_momo_last_session';
const MOMO_CALLBACK_FIELDS: Array<keyof MomoCallbackPayload> = [
  'partnerCode',
  'orderId',
  'requestId',
  'amount',
  'orderInfo',
  'orderType',
  'transId',
  'resultCode',
  'message',
  'payType',
  'responseTime',
  'extraData',
  'signature',
];

type MomoSessionTrace = {
  order_id?: number;
  order_number?: string;
  request_id?: string;
  pay_url?: string;
  created_at?: string;
};

const getOrderIdFromExtraData = (extraData: string | null): number | null => {
  if (!extraData) return null;

  try {
    const decoded = JSON.parse(atob(extraData)) as { orderId?: unknown };
    const orderId = Number(decoded.orderId);
    return Number.isInteger(orderId) && orderId > 0 ? orderId : null;
  } catch {
    return null;
  }
};

export default function MomoReturnClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [requestId, setRequestId] = useState<string>('');
  const [resultCode, setResultCode] = useState<string>('');
  const [momoMessage, setMomoMessage] = useState<string>('');
  const [transId, setTransId] = useState<string>('');
  const [trace, setTrace] = useState<MomoSessionTrace | null>(null);
  const [copyStatus, setCopyStatus] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);
  const trackedPurchaseOrderIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const rawCallbackOrderId = searchParams.get('orderId') || '';
    const callbackOrderId = Number(rawCallbackOrderId);
    const callbackRequestId = searchParams.get('requestId') || '';
    const callbackResultCode = searchParams.get('resultCode') || '';
    const callbackMessage = searchParams.get('message') || '';
    const callbackTransId = searchParams.get('transId') || '';
    let storedTrace: MomoSessionTrace | null = null;

    setRequestId(callbackRequestId);
    setResultCode(callbackResultCode);
    setMomoMessage(callbackMessage);
    setTransId(callbackTransId);

    try {
      const rawTrace = localStorage.getItem(MOMO_LAST_SESSION_KEY);
      if (rawTrace) {
        storedTrace = JSON.parse(rawTrace) as MomoSessionTrace;
        setTrace(storedTrace);
      }
    } catch (traceError) {
      console.error('Failed to parse MoMo trace data from localStorage', traceError);
    }

    const resolvedOrderId =
      Number.isInteger(callbackOrderId) && callbackOrderId > 0
        ? callbackOrderId
        : getOrderIdFromExtraData(searchParams.get('extraData')) ?? storedTrace?.order_id ?? null;

    if (!resolvedOrderId) {
      setError('Invalid MoMo callback order id.');
      setIsLoading(false);
      return;
    }

    setOrderId(resolvedOrderId);

    const loadOrderStatus = async () => {
      try {
        setIsLoading(true);
        const callbackPayload = MOMO_CALLBACK_FIELDS.reduce((payload, field) => {
          payload[field] = searchParams.get(field) || '';
          return payload;
        }, {} as MomoCallbackPayload);

        if (callbackPayload.signature) {
          await paymentApi.confirmMomoReturn(callbackPayload);
        }

        const order = await orderApi.getOrderById(resolvedOrderId);
        setOrderNumber(order.order_number);
        setPaymentStatus(order.payment_status);

        if (
          user?.id &&
          order.payment_status === PaymentStatus.PAID &&
          !trackedPurchaseOrderIdsRef.current.has(order.id)
        ) {
          trackedPurchaseOrderIdsRef.current.add(order.id);

          await Promise.all(
            order.items.map((item) =>
              recommendationApi.trackBehavior({
                userId: user.id,
                behaviorType: 'purchase',
                productId: item.product?.id,
                metadata: {
                  source: 'momo_return',
                  orderId: order.id,
                  orderNumber: order.order_number,
                  variantId: item.variant_id,
                  quantity: item.quantity,
                },
              }).catch((trackingError: unknown) => {
                console.error('Failed to track purchase from MoMo return:', trackingError);
              })
            )
          );
        }
      } catch (loadError) {
        console.error('Failed to load order after MoMo callback:', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Unable to verify payment status.');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderStatus();
  }, [searchParams, user?.id]);

  const statusText = useMemo(() => {
    if (paymentStatus === PaymentStatus.PAID) {
      return 'Payment completed successfully.';
    }

    if (paymentStatus === PaymentStatus.FAILED) {
      return 'Payment failed. Please retry from your order detail.';
    }

    if (paymentStatus === PaymentStatus.PENDING) {
      return 'Payment is being processed. Please check again in your order detail.';
    }

    return 'Unable to determine payment status.';
  }, [paymentStatus]);

  const handleCopyTrace = async () => {
    const summary = [
      `OrderId: ${orderId ?? trace?.order_id ?? 'N/A'}`,
      `OrderNumber: ${orderNumber || trace?.order_number || 'N/A'}`,
      `RequestId: ${requestId || trace?.request_id || 'N/A'}`,
      `ResultCode: ${resultCode || 'N/A'}`,
      `Message: ${momoMessage || 'N/A'}`,
      `TransId: ${transId || 'N/A'}`,
      `PayUrl: ${trace?.pay_url || 'N/A'}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setCopyStatus('Copied transaction details');
    } catch (copyError) {
      console.error('Copy transaction details failed', copyError);
      setCopyStatus('Copy failed');
    }
  };

  const handleRetryPayment = async () => {
    const targetOrderId = orderId ?? trace?.order_id;

    if (!targetOrderId) {
      setError('Missing order id for payment retry.');
      return;
    }

    try {
      setIsRetrying(true);
      setError(null);

      const momoPayment = await paymentApi.createMomoPayment(targetOrderId);

      localStorage.setItem(
        MOMO_LAST_SESSION_KEY,
        JSON.stringify({
          order_id: momoPayment.order_id,
          order_number: momoPayment.order_number,
          request_id: momoPayment.request_id,
          pay_url: momoPayment.pay_url,
          created_at: new Date().toISOString(),
        })
      );

      window.location.href = momoPayment.pay_url;
    } catch (retryError) {
      console.error('Failed to retry MoMo payment:', retryError);
      setError(retryError instanceof Error ? retryError.message : 'Unable to create a new MoMo payment session.');
    } finally {
      setIsRetrying(false);
    }
  };

  const canRetryPayment =
    !isLoading &&
    !error &&
    !!(orderId ?? trace?.order_id) &&
    paymentStatus !== PaymentStatus.PAID;

  return (
    <div className="min-h-screen bg-gray-50 py-12 pt-32">
      <div className="mx-auto max-w-2xl px-4">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">MoMo Payment Result</h1>

          {isLoading ? (
            <p className="mt-4 text-gray-600">Checking payment status...</p>
          ) : error ? (
            <p className="mt-4 text-red-600">{error}</p>
          ) : (
            <div className="mt-4 space-y-2">
              <p className="text-gray-700">Order: <span className="font-semibold">{orderNumber}</span></p>
              <p className="text-gray-700">Status: <span className="font-semibold">{paymentStatus}</span></p>
              <p className="text-gray-600">{statusText}</p>
            </div>
          )}

          <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
            <p className="text-gray-700">MoMo OrderId: <span className="font-medium">{orderId ?? trace?.order_id ?? 'N/A'}</span></p>
            <p className="text-gray-700">RequestId: <span className="font-medium">{requestId || trace?.request_id || 'N/A'}</span></p>
            <p className="text-gray-700">ResultCode: <span className="font-medium">{resultCode || 'N/A'}</span></p>
            <p className="text-gray-700">Message: <span className="font-medium">{momoMessage || 'N/A'}</span></p>
            <p className="text-gray-700">TransId: <span className="font-medium">{transId || 'N/A'}</span></p>
            <div className="mt-2">
              <Button type="button" variant="outline" onClick={handleCopyTrace}>
                Copy Support Info
              </Button>
              {copyStatus ? <p className="mt-2 text-xs text-gray-600">{copyStatus}</p> : null}
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button variant="outline" onClick={() => router.push('/account/orders')}>
              All Orders
            </Button>
            {canRetryPayment && (
              <Button type="button" onClick={handleRetryPayment} loading={isRetrying}>
                Retry with New Session
              </Button>
            )}
            {orderId && (
              <Button onClick={() => router.push(`/account/orders/${orderId}`)}>
                View Order
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
