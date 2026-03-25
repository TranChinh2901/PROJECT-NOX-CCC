'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Skeleton height="32px" width="200px" className="mb-2" />
          <Skeleton height="20px" width="300px" />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#CA8A04] to-[#B47B04] px-8 py-12">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Skeleton
                  width="96px"
                  height="96px"
                  rounded="full"
                  className="border-4 border-white"
                />
              </div>

              <div className="flex-1">
                <Skeleton height="32px" width="250px" className="mb-3" />
                <Skeleton height="20px" width="280px" />
              </div>

              <Skeleton width="120px" height="40px" rounded="md" />
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Skeleton height="14px" width="100px" className="mb-2" />
                <Skeleton height="18px" width="180px" />
              </div>

              <div className="space-y-1">
                <Skeleton height="14px" width="80px" className="mb-2" />
                <Skeleton height="18px" width="200px" />
              </div>

              <div className="space-y-1">
                <Skeleton height="14px" width="120px" className="mb-2" />
                <Skeleton height="18px" width="160px" />
              </div>

              <div className="space-y-1">
                <Skeleton height="14px" width="90px" className="mb-2" />
                <Skeleton height="18px" width="140px" />
              </div>

              <div className="space-y-1 md:col-span-2">
                <Skeleton height="14px" width="110px" className="mb-2" />
                <Skeleton height="18px" width="400px" />
              </div>

              <div className="space-y-1">
                <Skeleton height="14px" width="130px" className="mb-2" />
                <Skeleton height="18px" width="170px" />
              </div>

              <div className="space-y-1">
                <Skeleton height="14px" width="140px" className="mb-2" />
                <Skeleton height="26px" width="120px" rounded="full" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <Skeleton width="48px" height="48px" rounded="lg" />
              <div className="flex-1">
                <Skeleton height="18px" width="120px" className="mb-2" />
                <Skeleton height="14px" width="140px" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <Skeleton width="48px" height="48px" rounded="lg" />
              <div className="flex-1">
                <Skeleton height="18px" width="140px" className="mb-2" />
                <Skeleton height="14px" width="150px" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <Skeleton width="48px" height="48px" rounded="lg" />
              <div className="flex-1">
                <Skeleton height="18px" width="100px" className="mb-2" />
                <Skeleton height="14px" width="160px" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
