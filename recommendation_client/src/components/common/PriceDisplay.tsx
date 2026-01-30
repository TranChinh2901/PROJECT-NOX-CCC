import React from 'react';

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  size?: 'sm' | 'md' | 'lg';
  showDiscount?: boolean;
  className?: string;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(price);
};

const sizeStyles = {
  sm: {
    current: 'text-lg',
    original: 'text-sm',
    discount: 'text-xs',
  },
  md: {
    current: 'text-xl',
    original: 'text-base',
    discount: 'text-sm',
  },
  lg: {
    current: 'text-3xl',
    original: 'text-xl',
    discount: 'text-sm',
  },
};

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  originalPrice,
  size = 'md',
  showDiscount = true,
  className = '',
}) => {
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  const styles = sizeStyles[size];

  return (
    <div className={`flex items-baseline gap-2 flex-wrap ${className}`}>
      <span className={`font-bold text-gray-900 ${styles.current}`}>
        {formatPrice(price)}
      </span>
      {originalPrice && (
        <>
          <span className={`text-gray-400 line-through ${styles.original}`}>
            {formatPrice(originalPrice)}
          </span>
          {showDiscount && discount && (
            <span className={`px-2 py-0.5 rounded bg-red-100 text-red-600 font-medium ${styles.discount}`}>
              -{discount}%
            </span>
          )}
        </>
      )}
    </div>
  );
};
