import React from 'react';
import Image from 'next/image';

export interface ProductImageProps {
  src?: string;
  category: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  priority?: boolean;
}

const fallbackEmojis: Record<string, string> = {
  laptops: '💻',
  smartphones: '📱',
  desktops: '🖥️',
  audio: '🎧',
  wearables: '⌚',
  cameras: '📷',
  gaming: '🎮',
  speakers: '🔊',
};

const sizeStyles = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
  full: 'w-full h-full',
};

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  category,
  alt,
  size = 'md',
  className = '',
  priority = false,
}) => {
  const hasRealImage = src && !src.includes('emoji') && !src.includes('placeholder');
  
  if (hasRealImage) {
    return (
      <div className={`${sizeStyles[size]} relative overflow-hidden rounded-xl bg-gray-100 ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeStyles[size]} rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center shadow-inner ${className}`}>
      <span className="text-4xl select-none" role="img" aria-label={alt}>
        {fallbackEmojis[category] || '📦'}
      </span>
    </div>
  );
};
