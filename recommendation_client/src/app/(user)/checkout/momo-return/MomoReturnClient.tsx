'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { orderApi } from '@/lib/api';
import { PaymentStatus } from '@/types';

const MOMO_LAST_SESSION_KEY = 'technova_momo_last_session';

type MomoSessionTrace = {
  order_id?: number;
  order_number?: string;
  request_id?: string;
  pay_url?: string;
  created_at?: string;
};

export default function MomoReturnClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  useEffect(() => {
    const callbackOrderId = Number(searchParams.get('orderId'));
    const callbackRequestId = searchParams.get('requestId') || '';
    const callbackResultCode = searchParams.get('resultCode') || '';
    const callbackMessage = searchParams.get('message') || '';
    const callbackTransId = searchParams.get('transId') || '';

    setRequestId(callbackRequestId);
    setResultCode(callbackResultCode);
    setMomoMessage(callbackMessage);
    setTransId(callbackTransId);

    try {
      const rawTrace = localStorage.getItem(MOMO_LAST_SESSION_KEY);
      if (rawTrace) {
        setTrace(JSON.parse(rawTrace) as MomoSessionTrace);
      }
    } catch (traceError) {
      console.error('Failed to parse MoMo trace data from localStorage', traceError);
    }

    if (!Number.isInteger(callbackOrderId) || callbackOrderId <= 0) {
      setError('Invalid MoMo callback order id.');
      setIsLoading(false);
      return;
    }

    setOrderId(callbackOrderId);

    const loadOrderStatus = async () => {
      try {
        setIsLoading(true);
        const order = await orderApi.getOrderById(callbackOrderId);
        setOrderNumber(order.order_number);
        setPaymentStatus(order.payment_status);
      } catch (loadError) {
        console.error('Failed to load order after MoMo callback:', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Unable to verify payment status.');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderStatus();
  }, [searchParams]);

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
