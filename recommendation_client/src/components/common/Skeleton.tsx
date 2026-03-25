import React from 'react';

export type SkeletonRounded = 'none' | 'sm' | 'md' | 'lg' | 'full';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  width?: string;
  height?: string;
  rounded?: SkeletonRounded;
}

const roundedStyles: Record<SkeletonRounded, string> = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '16px',
  rounded = 'md',
  ...props
}) => {
  const baseStyles = 'bg-gray-200 animate-pulse';
  
  const classes = [
    baseStyles,
    roundedStyles[rounded],
    className,
  ].join(' ');

  const styles: React.CSSProperties = {
    width,
    height,
  };

  return (
    <div 
      className={classes} 
      style={styles}
      {...props}
    />
  );
};

export default Skeleton;
