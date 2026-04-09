import React, { CSSProperties } from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  hover?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', style, hover = false }) => {
  return (
    <div 
      className={`
        relative overflow-hidden
        rounded-2xl
        bg-white
        border border-slate-200
        shadow-[0_4px_14px_rgba(15,23,42,0.06)]
        transition-[box-shadow,border-color] duration-200 ease-out
        ${hover ? 'hover:border-slate-300 hover:shadow-[0_8px_20px_rgba(15,23,42,0.10)]' : ''}
        ${className}
      `}
      style={style}
    >
      {children}
    </div>
  );
};
