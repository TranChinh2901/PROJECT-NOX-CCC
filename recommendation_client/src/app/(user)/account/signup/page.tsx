'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FormInput } from '@/components/common/FormInput';
import { Button } from '@/components/common/Button';
import { GenderType } from '@/types/auth.types';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    fullname?: string;
    email?: string;
    phoneNumber?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateForm = (): boolean => {
    const newErrors: {
      fullname?: string;
      email?: string;
      phoneNumber?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!fullname.trim()) {
      newErrors.fullname = 'Họ tên là bắt buộc';
    }

    if (!email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Vui lòng nhập địa chỉ email hợp lệ';
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Số điện thoại là bắt buộc';
    } else if (!validatePhoneNumber(phoneNumber)) {
      newErrors.phoneNumber = 'Vui lòng nhập số điện thoại hợp lệ (10-11 số)';
    }

    if (!password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await signup({
        fullname,
        email,
        password,
        phone_number: phoneNumber,
        gender: GenderType.MALE,
        date_of_birth: new Date().toISOString(),
      });

      router.push('/account/login');
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : 'Tạo tài khoản thất bại. Vui lòng thử lại.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 pt-32">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tạo Tài Khoản</h1>
              <p className="text-gray-600">Đăng ký để bắt đầu</p>
            </div>

            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <FormInput
                label="Họ và Tên"
                type="text"
                id="fullname"
                name="fullname"
                placeholder="Nhập họ và tên của bạn"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                error={errors.fullname}
                disabled={isLoading}
                autoComplete="name"
                required
              />

              <FormInput
                label="Địa Chỉ Email"
                type="email"
                id="email"
                name="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                disabled={isLoading}
                autoComplete="email"
                required
              />

              <FormInput
                label="Số Điện Thoại"
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                placeholder="Nhập số điện thoại của bạn"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                error={errors.phoneNumber}
                disabled={isLoading}
                autoComplete="tel"
                required
              />

              <FormInput
                label="Mật Khẩu"
                type="password"
                id="password"
                name="password"
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                disabled={isLoading}
                autoComplete="new-password"
                required
              />

              <FormInput
                label="Xác Nhận Mật Khẩu"
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Xác nhận mật khẩu của bạn"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                disabled={isLoading}
                autoComplete="new-password"
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Đang tạo tài khoản...' : 'Đăng Ký'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Hoặc</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <Link
                  href="/account/login"
                  className="text-[#CA8A04] hover:text-[#B47B04] font-semibold transition-colors"
                >
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Bằng việc đăng ký, bạn đồng ý với{' '}
            <Link href="/terms" className="text-[#CA8A04] hover:underline">
              Điều Khoản Dịch Vụ
            </Link>{' '}
            và{' '}
            <Link href="/privacy" className="text-[#CA8A04] hover:underline">
              Chính Sách Bảo Mật
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
