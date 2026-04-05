'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FormInput } from '@/components/common/FormInput';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import PageSkeleton from '@/components/common/PageSkeleton';
import { useAuth } from '@/contexts/AuthContext';

type FormErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export default function ChangePasswordPage() {
  const { isLoading, user, changePassword, logout } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <>
        <Header />
        <PageSkeleton rows={4} />
        <Footer />
      </>
    );
  }

  if (!user) {
    router.push('/account/login');
    return null;
  }

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!currentPassword) {
      nextErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }

    if (!newPassword) {
      nextErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (newPassword.length < 6) {
      nextErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    } else if (newPassword === currentPassword) {
      nextErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin mật khẩu');
      return;
    }

    try {
      setIsSubmitting(true);
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      toast.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      await logout();
      router.push('/account/login');
    } catch (error) {
      console.error('Change password error:', error);
      toast.error(error instanceof Error ? error.message : 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8 pt-32">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Change Password</h1>
            <p className="mt-1 text-gray-600">Update your password to keep your account secure.</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
          >
            <div className="border-b border-gray-100 bg-gradient-to-r from-[#CA8A04] to-[#B47B04] px-8 py-10">
              <h2 className="text-2xl font-bold text-white">Security</h2>
              <p className="mt-2 max-w-xl text-white/90">
                After changing your password, you&apos;ll be asked to sign in again on this device.
              </p>
            </div>

            <div className="space-y-6 p-8">
              <FormInput
                type="password"
                label="Current Password"
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(event.target.value);
                  if (errors.currentPassword) {
                    setErrors((current) => ({ ...current, currentPassword: undefined }));
                  }
                }}
                error={errors.currentPassword}
                autoComplete="current-password"
              />

              <FormInput
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  if (errors.newPassword) {
                    setErrors((current) => ({ ...current, newPassword: undefined }));
                  }
                }}
                error={errors.newPassword}
                helperText="Mật khẩu mới phải có ít nhất 6 ký tự và khác mật khẩu hiện tại."
                autoComplete="new-password"
              />

              <FormInput
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  if (errors.confirmPassword) {
                    setErrors((current) => ({ ...current, confirmPassword: undefined }));
                  }
                }}
                error={errors.confirmPassword}
                autoComplete="new-password"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-8 py-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/account/profile')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                Save New Password
              </Button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
