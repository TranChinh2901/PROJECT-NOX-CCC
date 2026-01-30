import React, { CSSProperties } from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', style }) => {
  return (
    <div 
      className={`
        relative overflow-hidden
        rounded-2xl
        bg-white/5
        backdrop-blur-[16px]
        border border-white/10
        shadow-[0_8px_32px_rgba(0,0,0,0.1)]
        transition-all duration-500 ease-out
        hover:border-white/20
        hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]
        ${className}
      `}
      style={style}
    >
      {children}
    </div>
  );
};
