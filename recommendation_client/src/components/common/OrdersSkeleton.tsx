'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export const OrdersSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton width="200px" height="32px" rounded="md" className="mb-2" />
          <Skeleton width="300px" height="20px" rounded="md" />
        </div>

        {/* Desktop Table Skeleton */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <Skeleton width="120px" height="16px" rounded="md" />
                </th>
                <th className="px-6 py-3 text-left">
                  <Skeleton width="100px" height="16px" rounded="md" />
                </th>
                <th className="px-6 py-3 text-left">
                  <Skeleton width="80px" height="16px" rounded="md" />
                </th>
                <th className="px-6 py-3 text-left">
                  <Skeleton width="60px" height="16px" rounded="md" />
                </th>
                <th className="px-6 py-3 text-right">
                  <Skeleton width="80px" height="16px" rounded="md" className="ml-auto" />
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton width="140px" height="20px" rounded="md" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton width="110px" height="20px" rounded="md" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton width="100px" height="28px" rounded="full" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton width="80px" height="20px" rounded="md" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Skeleton width="100px" height="32px" rounded="md" className="ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Skeleton */}
        <div className="md:hidden space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <Skeleton width="140px" height="18px" rounded="md" className="mb-2" />
                  <Skeleton width="100px" height="14px" rounded="md" />
                </div>
                <Skeleton width="80px" height="28px" rounded="full" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton width="100px" height="24px" rounded="md" />
                <Skeleton width="60px" height="32px" rounded="md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrdersSkeleton;
