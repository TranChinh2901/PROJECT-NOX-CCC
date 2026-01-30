'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FormInput } from '@/components/common/FormInput';
import { Button } from '@/components/common/Button';
import { GenderType } from '@/types/auth.types';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    fullname?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: {
      fullname?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!fullname.trim()) {
      newErrors.fullname = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
        gender: GenderType.MALE,
        date_of_birth: new Date().toISOString(),
      });

      router.push('/');
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : 'Failed to create account. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Sign up to get started</p>
          </div>

          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormInput
              label="Full Name"
              type="text"
              id="fullname"
              name="fullname"
              placeholder="Enter your full name"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              error={errors.fullname}
              disabled={isLoading}
              autoComplete="name"
              required
            />

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

            <FormInput
              label="Password"
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              disabled={isLoading}
              autoComplete="new-password"
              required
            />

            <FormInput
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm your password"
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
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/account/login"
                className="text-[#CA8A04] hover:text-[#B47B04] font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          By signing up, you agree to our{' '}
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
  );
}
