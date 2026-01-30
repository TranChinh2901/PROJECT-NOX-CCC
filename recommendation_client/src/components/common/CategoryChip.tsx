import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface CategoryChipProps {
  label: string;
  icon?: LucideIcon;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  label,
  icon: Icon,
  isActive = false,
  onClick,
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer select-none';
  
  const activeStyles = isActive
    ? 'bg-[#CA8A04] text-white shadow-md'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200';

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${activeStyles} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{label}</span>
    </button>
  );
};
