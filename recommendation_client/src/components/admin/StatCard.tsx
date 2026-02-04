'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { MiniSparkline } from './MiniSparkline';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  sparklineData?: number[];
  icon?: React.ReactNode;
  iconColor?: string;
  onClick?: () => void;
  loading?: boolean;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  change,
  sparklineData,
  icon,
  iconColor = 'text-[#3B82F6]',
  onClick,
  loading,
  subtitle,
  actions
}: StatCardProps) {
  if (loading) {
    return <StatCardSkeleton />;
  }

  return (
    <div
      className={cn(
        // Base styles
        "group relative",
        "bg-white rounded-xl p-6",
        "border border-slate-200",
        "transition-all duration-200",

        // Hover effects
        "hover:shadow-lg hover:border-[#3B82F6]/50",

        // Clickable styles
        onClick && "cursor-pointer hover:-translate-y-1"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={onClick ? `View details for ${title}` : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-slate-600 mb-1">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            "bg-[#3B82F6]/10 transition-colors",
            "group-hover:bg-[#3B82F6]/20"
          )}>
            <div className={cn("w-6 h-6", iconColor)}>
              {icon}
            </div>
          </div>
        )}
      </div>

      {/* Main Value and Trend */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Value */}
          <p className="text-3xl font-bold text-slate-900 mb-2 truncate">
            {value}
          </p>

          {/* Change Indicator */}
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-[#10B981] flex-shrink-0" />
              ) : (
                <TrendingDown className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
              )}
              <span className={cn(
                "text-sm font-semibold",
                change >= 0 ? "text-[#10B981]" : "text-[#EF4444]"
              )}>
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
              <span className="text-sm text-slate-500">vs last period</span>
            </div>
          )}
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 1 && (
          <div className="w-24 h-12 flex-shrink-0">
            <MiniSparkline
              data={sparklineData}
              color={change && change >= 0 ? '#10B981' : '#EF4444'}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      {actions && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          {actions}
        </div>
      )}

      {/* Click indicator */}
      {onClick && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="w-4 h-4 text-[#3B82F6]" />
        </div>
      )}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex items-start justify-between mb-4">
        <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="w-12 h-12 bg-slate-100 rounded-lg animate-pulse" />
      </div>
      <div className="h-9 w-48 bg-slate-200 rounded animate-pulse mb-2" />
      <div className="h-4 w-36 bg-slate-100 rounded animate-pulse" />
    </div>
  );
}
