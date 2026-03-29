'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FormInput } from '@/components/common/FormInput';
import { Button } from '@/components/common/Button';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import PageSkeleton from '@/components/common/PageSkeleton';

interface FormData {
  fullname: string;
  phone_number: string;
  address: string;
}

interface FormErrors {
  fullname?: string;
  phone_number?: string;
  address?: string;
}

type ValidationDetail = {
  field?: string;
  message?: string;
};

type ProfileUpdateError = Error & {
  response?: {
    data?: {
      details?: ValidationDetail[];
    };
  };
};

const EditProfilePage: React.FC = () => {
  const { user, isLoading, updateProfile } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    fullname: '',
    phone_number: '',
    address: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        fullname: user.fullname || '',
        phone_number: user.phone_number || '',
        address: user.address || '',
      });
      if (user.avatar) {
        setAvatarPreview(user.avatar);
      }
    }
  }, [user]);

  if (isLoading) {
    return (
      <>
        <Header />
        <PageSkeleton rows={5} />
        <Footer />
      </>
    );
  }

  if (!user) {
    router.push('/account/login');
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Full name is required';
    } else if (formData.fullname.trim().length < 2) {
      newErrors.fullname = 'Full name must be at least 2 characters';
    }

    // Sanitize phone before validation
    const sanitizedPhone = formData.phone_number.replace(/[\s\-\(\)\+]/g, '');
    
    if (sanitizedPhone && !/^[0-9]{10,11}$/.test(sanitizedPhone)) {
      newErrors.phone_number = 'Phone number must be 10-11 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      if (avatarFile) {
        await authApi.uploadAvatar(avatarFile);
        toast.success('Avatar updated successfully');
      }

      const sanitizedPhone = formData.phone_number.replace(/[\s\-\(\)\+]/g, '');

      await updateProfile({
        fullname: formData.fullname,
        phone_number: sanitizedPhone || undefined,
        address: formData.address,
      });

      toast.success('Profile updated successfully!');
      router.push('/account/profile');
    } catch (error: unknown) {
      console.error('Profile update error:', error);

      const profileUpdateError = error as ProfileUpdateError;
      const details = profileUpdateError.response?.data?.details;
      if (Array.isArray(details) && details.length > 0) {
        const fieldErrors: FormErrors = {};
        details.forEach((detail) => {
          if (detail.field && detail.message) {
            fieldErrors[detail.field as keyof FormErrors] = detail.message;
          }
        });
        setErrors(fieldErrors);
        toast.error('Please fix the validation errors');
      } else {
        toast.error(profileUpdateError.message || 'Failed to update profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/account/profile');
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8 pt-32">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600 mt-1">Update your personal information</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-8">
              <div className="flex flex-col items-center mb-8">
                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 group-hover:border-[#CA8A04] transition-colors"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-gray-200 bg-gray-100 flex items-center justify-center group-hover:border-[#CA8A04] transition-colors">
                      <span className="text-4xl font-bold text-gray-400">
                        {user.fullname.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <p className="text-sm text-gray-500 mt-3">Click to upload new avatar</p>
                <p className="text-xs text-gray-400 mt-1">Max size: 5MB</p>
              </div>

              <div className="space-y-6">
                <FormInput
                  label="Full Name"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  error={errors.fullname}
                  placeholder="Enter your full name"
                  required
                />

                <FormInput
                  label="Email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-gray-50 cursor-not-allowed"
                  helperText="Email cannot be changed"
                />

                <FormInput
                  label="Phone Number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  error={errors.phone_number}
                  placeholder="Enter your phone number"
                  helperText="Format: 10-11 digits (e.g., 0912345678)"
                />

                <FormInput
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  error={errors.address}
                  placeholder="Enter your address"
                />
              </div>
            </div>

            <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EditProfilePage;
