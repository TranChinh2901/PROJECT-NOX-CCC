import React from 'react';
import { Skeleton } from './Skeleton';

export interface PageSkeletonProps {
  rows?: number;
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({ rows = 3 }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Title Skeleton */}
        <div className="mb-2">
          <Skeleton height="32px" width="300px" />
        </div>

        {/* Subtitle Skeleton */}
        <div className="mb-8">
          <Skeleton height="20px" width="400px" />
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Content Rows */}
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="mb-4">
              <Skeleton height="24px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageSkeleton;
