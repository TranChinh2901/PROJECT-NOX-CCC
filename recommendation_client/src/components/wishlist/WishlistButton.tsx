import React from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '../../contexts/WishlistContext';

interface WishlistButtonProps {
  productId: number;
  className?: string;
  size?: number;
  variant?: 'icon' | 'full';
}

export const WishlistButton: React.FC<WishlistButtonProps> = ({
  productId,
  className = '',
  size = 24,
  variant = 'icon'
}) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(productId);
  const [isAnimating, setIsAnimating] = React.useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAnimating(true);
    await toggleWishlist(productId);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const iconClass = isWishlisted
    ? "fill-[#CA8A04] text-[#CA8A04]"
    : "text-[#A1A1AA] hover:text-[#CA8A04]";

  const animationClass = isAnimating ? "scale-125" : "scale-100";

  if (variant === 'full') {
    return (
        <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300 ${
          isWishlisted
            ? "border-[#CA8A04] bg-[#CA8A04]/10 text-[#CA8A04]"
            : "border-white/10 bg-white/5 text-[#A1A1AA] hover:border-[#CA8A04] hover:text-[#CA8A04]"
        } ${className}`}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={isWishlisted}
      >
        <Heart
          size={20}
          className={`transition-transform duration-300 ${isWishlisted ? "fill-[#CA8A04]" : ""} ${animationClass}`}
        />
        <span>{isWishlisted ? "Saved" : "Save for later"}</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-full transition-all duration-300 hover:bg-white/10 ${className}`}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={isWishlisted}
    >
      <Heart
        size={size}
        className={`transition-all duration-300 ${iconClass} ${animationClass}`}
      />
    </button>
  );
};
