'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { FormInput } from '@/components/common/FormInput';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
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
      // Placeholder: API not ready yet
      // TODO: Replace with actual password reset API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setIsSuccess(true);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
            <p className="text-gray-600">Enter your email to receive password reset instructions</p>
          </div>

          {isSuccess ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Check your email</p>
                <p className="text-sm text-green-600 mt-1">
                  We&apos;ve sent password reset instructions to <strong>{email}</strong>
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center">
                  Didn&apos;t receive the email? Check your spam folder or try again.
                </p>

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail('');
                  }}
                >
                  Try Another Email
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <FormInput
                label="Email Address"
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                disabled={isLoading}
                autoComplete="email"
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
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link
                href="/account/login"
                className="text-[#CA8A04] hover:text-[#B47B04] font-semibold transition-colors"
              >
                Back to login
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-[#CA8A04] hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-[#CA8A04] hover:underline">
            Privacy Policy
          </Link>
        </p>
       </div>
      </div>
      <Footer />
     </>
   );
 }
