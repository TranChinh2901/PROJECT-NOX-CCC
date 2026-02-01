import React from 'react';
import { Skeleton } from './Skeleton';

export const AddressesSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton height="36px" width="280px" rounded="md" className="mb-2" />
          <Skeleton height="20px" width="360px" rounded="md" />
        </div>

        <div className="mb-6">
          <Skeleton height="40px" width="160px" rounded="md" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <Skeleton
                height="24px"
                width="200px"
                rounded="md"
                className="mb-2"
              />

              <Skeleton
                height="20px"
                width="150px"
                rounded="md"
                className="mb-4"
              />

              <Skeleton
                height="20px"
                width="100%"
                rounded="md"
                className="mb-1"
              />

              <Skeleton
                height="20px"
                width="80%"
                rounded="md"
                className="mb-4"
              />

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <Skeleton height="36px" width="80px" rounded="md" />
                <Skeleton height="36px" width="120px" rounded="md" />
                <Skeleton height="36px" width="80px" rounded="md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddressesSkeleton;
