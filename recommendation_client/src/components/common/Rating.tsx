import React from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

const sizeStyles = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export const Rating: React.FC<RatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = true,
  reviewCount,
  className = '',
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[...Array(maxRating)].map((_, i) => (
          <Star
            key={i}
            className={`${sizeStyles[size]} ${
              i < fullStars
                ? 'fill-[#CA8A04] text-[#CA8A04]'
                : i === fullStars && hasHalfStar
                ? 'fill-[#CA8A04]/50 text-[#CA8A04]'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-gray-900 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-sm text-gray-500">
          ({reviewCount} đánh giá)
        </span>
      )}
    </div>
  );
};
