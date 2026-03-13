'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FormInput } from '@/components/common/FormInput';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RoleType } from '@/types/auth.types';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Vui lòng nhập địa chỉ email hợp lệ';
    }

    if (!password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
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
      const authResponse = await login({ email, password });
      
      const redirectTo =
        searchParams.get('redirect') ||
        (authResponse.user.role === RoleType.ADMIN ? '/admin' : '/');
      router.push(redirectTo);
    } catch (error) {
      setErrors({
        general: error instanceof Error
          ? error.message
          : 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập và thử lại.',
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chào Mừng Trở Lại</h1>
              <p className="text-gray-600">Đăng nhập vào tài khoản để tiếp tục</p>
            </div>

            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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
                label="Mật Khẩu"
                type="password"
                id="password"
                name="password"
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                disabled={isLoading}
                autoComplete="current-password"
                required
              />

              <div className="flex justify-end">
                <Link
                  href="/account/forgot-password"
                  className="text-sm text-[#CA8A04] hover:text-[#B47B04] font-medium transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
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
                Chưa có tài khoản?{' '}
                <Link
                  href="/account/signup"
                  className="text-[#CA8A04] hover:text-[#B47B04] font-semibold transition-colors"
                >
                  Đăng ký miễn phí
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Bằng việc đăng nhập, bạn đồng ý với{' '}
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-32">
          <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CA8A04] mx-auto"></div>
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
        <Footer />
      </>
    }>
      <LoginForm />
    </Suspense>
  );
}
