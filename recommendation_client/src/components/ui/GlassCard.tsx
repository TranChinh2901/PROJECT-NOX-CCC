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
        backdrop-blur-[16px]
        border border-slate-200
        shadow-[0_8px_24px_rgba(15,23,42,0.08)]
        transition-all duration-500 ease-out
        ${hover ? 'hover:border-slate-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.12)]' : ''}
        ${className}
      `}
      style={style}
    >
      {children}
    </div>
  );
};
