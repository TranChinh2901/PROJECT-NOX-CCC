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
  iconColor = 'text-[rgb(var(--admin-primary))]',
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
        "border border-[rgb(var(--admin-border))]",
        "shadow-[var(--shadow-card)]",
        "transition-all duration-300 ease-out",

        // Hover effects
        "hover:shadow-[var(--shadow-card-hover)] hover:border-[rgb(var(--admin-primary))]/30",

        // Clickable styles
        onClick && "cursor-pointer hover:-translate-y-0.5"
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
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[rgb(var(--admin-text-muted))] uppercase tracking-wider mb-1">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-[rgb(var(--admin-text-subtle))]">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br from-[rgb(var(--admin-primary))]/10 to-[rgb(var(--admin-primary))]/5",
            "transition-all duration-300",
            "group-hover:from-[rgb(var(--admin-primary))]/15 group-hover:to-[rgb(var(--admin-primary))]/10",
            "group-hover:scale-105"
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
          <p className="text-3xl font-bold text-[rgb(var(--admin-text))] mb-3 truncate tracking-tight">
            {value}
          </p>

          {/* Change Indicator */}
          {change !== undefined && (
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md",
                change >= 0 
                  ? "bg-[rgb(var(--admin-success))]/10" 
                  : "bg-[rgb(var(--admin-error))]/10"
              )}>
                {change >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-[rgb(var(--admin-success))] flex-shrink-0" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-[rgb(var(--admin-error))] flex-shrink-0" />
                )}
                <span className={cn(
                  "text-sm font-bold",
                  change >= 0 ? "text-[rgb(var(--admin-success))]" : "text-[rgb(var(--admin-error))]"
                )}>
                  {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
              </div>
              <span className="text-xs text-[rgb(var(--admin-text-muted))] font-medium">so với kỳ trước</span>
            </div>
          )}
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 1 && (
          <div className="w-28 h-14 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
            <MiniSparkline
              data={sparklineData}
              color={change && change >= 0 ? 'rgb(var(--admin-success))' : 'rgb(var(--admin-error))'}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      {actions && (
        <div className="mt-5 pt-5 border-t border-[rgb(var(--admin-border))]">
          {actions}
        </div>
      )}

      {/* Click indicator */}
      {onClick && (
        <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0.5">
          <ArrowRight className="w-4 h-4 text-[rgb(var(--admin-primary))]" />
        </div>
      )}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgb(var(--admin-border))] shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between mb-5">
        <div className="h-4 w-28 bg-[rgb(var(--admin-border))] rounded animate-pulse" />
        <div className="w-12 h-12 bg-[rgb(var(--admin-background))] rounded-xl animate-pulse" />
      </div>
      <div className="h-9 w-40 bg-[rgb(var(--admin-border))] rounded animate-pulse mb-3" />
      <div className="h-6 w-32 bg-[rgb(var(--admin-background))] rounded animate-pulse" />
    </div>
  );
}
