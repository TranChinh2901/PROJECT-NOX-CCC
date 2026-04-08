'use client';

import React, { useState } from 'react';
import { feedbackApi } from '@/lib/api';

export function CustomerFeedbackForm() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = fullName.trim();
    const normalizedPhone = phoneNumber.trim();
    const normalizedMessage = message.trim();

    if (!normalizedName || !normalizedPhone || normalizedMessage.length < 8) {
      setError('Vui lòng nhập đủ thông tin và nội dung ý kiến tối thiểu 8 ký tự.');
      setIsSubmitted(false);
      return;
    }

    setIsSubmitting(true);
    setError('');
    setIsSubmitted(false);

    try {
      await feedbackApi.sendCustomerFeedback({
        fullName: normalizedName,
        phoneNumber: normalizedPhone,
        message: normalizedMessage,
      });

      setIsSubmitted(true);
      setMessage('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gửi ý kiến thất bại. Vui lòng thử lại.');
      setIsSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 sm:p-7">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-wide text-[#B47B04] font-semibold">Ý kiến khách hàng</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">Gửi tin nhắn góp ý cho TechNova</h2>
          <p className="text-sm text-gray-600 mt-2">Thông tin của bạn giúp đội ngũ cải thiện sản phẩm, giao hàng và dịch vụ hỗ trợ.</p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Họ và tên"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-[#CA8A04] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/20"
            />
            <input
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="Số điện thoại"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-[#CA8A04] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/20"
            />
          </div>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Nhập ý kiến của bạn..."
            rows={5}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-[#CA8A04] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/20 resize-y"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {isSubmitted && <p className="text-sm text-green-700">Cảm ơn bạn! Ý kiến đã được ghi nhận.</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#CA8A04] text-white text-sm font-semibold hover:bg-[#B47B04] transition-colors"
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi ý kiến'}
          </button>
        </form>
      </div>
    </section>
  );
}
