'use client';

import { useId, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface MiniSparklineProps {
  data: number[];
  color?: string;
  className?: string;
}

export function MiniSparkline({
  data,
  color = '#3B82F6',
  className
}: MiniSparklineProps) {
  const gradientId = useId().replace(/:/g, '');
  const { path, viewBox } = useMemo(() => {
    if (data.length < 2) return { path: '', viewBox: '0 0 100 40' };

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const width = 100;
    const height = 40;
    const padding = 2;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    });

    const pathData = `M ${points.join(' L ')}`;

    return {
      path: pathData,
      viewBox: `0 0 ${width} ${height}`
    };
  }, [data]);

  if (data.length < 2) {
    return (
      <div className={cn("w-full h-full flex items-center justify-center", className)}>
        <span className="text-xs text-slate-400">No data</span>
      </div>
    );
  }

  return (
    <svg
      viewBox={viewBox}
      className={cn("w-full h-full", className)}
      preserveAspectRatio="none"
    >
      {/* Area fill */}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path
        d={`${path} L 100,40 L 0,40 Z`}
        fill={`url(#${gradientId})`}
      />

      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
