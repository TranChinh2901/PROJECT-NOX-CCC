import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  color?: string;
  onClick?: () => void;
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  color = '#CA8A04',
  onClick,
  className = '',
}) => {
  return (
    <div 
      onClick={onClick}
      className={`
        p-6 rounded-xl bg-white border border-gray-100 shadow-sm
        cursor-pointer hover:shadow-md hover:scale-[1.02] 
        transition-all duration-200
        ${className}
      `}
      style={{ borderColor: `${color}20` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-heading font-bold text-gray-900 mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          {Icon ? (
            <Icon className="w-6 h-6" style={{ color }} />
          ) : (
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
