'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FormInput } from '@/components/common/FormInput';
import { Button } from '@/components/common/Button';
import { Address } from '@/types';

interface SavedAddress extends Address {
  id: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const { user, updateProfile } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SavedAddress>({
    id: '',
    fullname: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    postal_code: '',
    isDefault: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load addresses from user profile
  useEffect(() => {
    if (user?.address) {
      try {
        const parsed = JSON.parse(user.address);
        if (Array.isArray(parsed)) {
          setAddresses(parsed);
        }
      } catch (error) {
        console.error('Failed to parse addresses:', error);
      }
    }
  }, [user?.address]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Full name is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof SavedAddress, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      let updatedAddresses: SavedAddress[];

      if (editingId) {
        updatedAddresses = addresses.map(addr => 
          addr.id === editingId ? { ...formData, id: editingId } : addr
        );
      } else {
        const newAddress: SavedAddress = {
          ...formData,
          id: Date.now().toString(),
        };
        updatedAddresses = [...addresses, newAddress];
      }

      if (formData.isDefault) {
        updatedAddresses = updatedAddresses.map(addr => ({
          ...addr,
          isDefault: addr.id === (editingId || formData.id),
        }));
      }

      if (updatedAddresses.length === 1) {
        updatedAddresses[0].isDefault = true;
      }

      await updateProfile({
        address: JSON.stringify(updatedAddresses),
      });

      setAddresses(updatedAddresses);
      resetForm();
    } catch (error) {
      console.error('Failed to save address:', error);
      alert('Failed to save address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (address: SavedAddress) => {
    setFormData(address);
    setEditingId(address.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const updatedAddresses = addresses.filter(addr => addr.id !== id);
      const wasDefault = addresses.find(addr => addr.id === id)?.isDefault;
      
      if (wasDefault && updatedAddresses.length > 0) {
        updatedAddresses[0].isDefault = true;
      }

      await updateProfile({
        address: JSON.stringify(updatedAddresses),
      });

      setAddresses(updatedAddresses);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete address:', error);
      alert('Failed to delete address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setIsLoading(true);
    try {
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id,
      }));

      await updateProfile({
        address: JSON.stringify(updatedAddresses),
      });

      setAddresses(updatedAddresses);
    } catch (error) {
      console.error('Failed to set default address:', error);
      alert('Failed to set default address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      fullname: '',
      phone: '',
      address: '',
      city: '',
      district: '',
      ward: '',
      postal_code: '',
      isDefault: false,
    });
    setEditingId(null);
    setIsFormOpen(false);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Addresses</h1>
          <p className="mt-2 text-gray-600">Add and manage your delivery addresses</p>
        </div>

        {!isFormOpen && (
          <div className="mb-6">
            <Button
              variant="primary"
              onClick={() => setIsFormOpen(true)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Add New Address
            </Button>
          </div>
        )}

        {isFormOpen && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Full Name"
                  type="text"
                  value={formData.fullname}
                  onChange={(e) => handleInputChange('fullname', e.target.value)}
                  error={errors.fullname}
                  placeholder="Enter full name"
                  required
                />

                <FormInput
                  label="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  error={errors.phone}
                  placeholder="0123456789"
                  required
                />
              </div>

              <FormInput
                label="Address"
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                error={errors.address}
                placeholder="Street address, building, apartment"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="City"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  error={errors.city}
                  placeholder="Enter city"
                  required
                />

                <FormInput
                  label="District"
                  type="text"
                  value={formData.district || ''}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  error={errors.district}
                  placeholder="Enter district (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Ward"
                  type="text"
                  value={formData.ward || ''}
                  onChange={(e) => handleInputChange('ward', e.target.value)}
                  error={errors.ward}
                  placeholder="Enter ward (optional)"
                />

                <FormInput
                  label="Postal Code"
                  type="text"
                  value={formData.postal_code || ''}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  error={errors.postal_code}
                  placeholder="Enter postal code (optional)"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                  className="w-4 h-4 text-[#CA8A04] border-gray-300 rounded focus:ring-[#CA8A04]"
                />
                <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                  Set as default address
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {editingId ? 'Update Address' : 'Save Address'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {addresses.length === 0 && !isFormOpen && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No addresses yet</h3>
              <p className="mt-2 text-gray-600">Add your first delivery address to get started</p>
            </div>
          )}

          {addresses.map((address) => (
            <div
              key={address.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative"
            >
              {address.isDefault && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#CA8A04] text-white">
                    Default
                  </span>
                </div>
              )}

              <div className="pr-20">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {address.fullname}
                </h3>
                <div className="space-y-1 text-gray-600">
                  <p>{address.phone}</p>
                  <p>{address.address}</p>
                  <p>
                    {[address.ward, address.district, address.city, address.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(address)}
                  disabled={isLoading}
                >
                  Edit
                </Button>

                {!address.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(address.id)}
                    disabled={isLoading}
                  >
                    Set as Default
                  </Button>
                )}

                {deleteConfirmId === address.id ? (
                  <div className="flex gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(address.id)}
                      disabled={isLoading}
                    >
                      Confirm Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(null)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirmId(address.id)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
