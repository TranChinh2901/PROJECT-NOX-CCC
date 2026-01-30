import React from 'react';

interface LiquidButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  onClick,
  type = 'button'
}) => {
  const baseStyles = `
    inline-flex items-center justify-center
    font-semibold
    rounded-lg
    cursor-pointer
    transition-all duration-400 ease-out
    hover:-translate-y-0.5
    active:translate-y-0
    focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/50
  `;

  const variants = {
    primary: `
      bg-[#CA8A04] text-white
      hover:bg-[#B47B04]
      hover:shadow-[0_0_20px_rgba(202,138,4,0.3)]
    `,
    secondary: `
      bg-transparent text-[#FAFAF9]
      border-2 border-[#44403C]
      hover:border-[#CA8A04]
      hover:text-[#CA8A04]
    `,
    ghost: `
      bg-transparent text-[#A1A1AA]
      hover:text-[#FAFAF9]
      hover:bg-white/5
    `
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};
