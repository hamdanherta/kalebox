import React from 'react';
import { cn } from '../../utils/cn';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-[#F0F6FB] text-[#004582]',
    primary: 'bg-[#FDF2F8] text-[#DE0E86]',
    secondary: 'bg-[#F0F6FB] text-[#004582]',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
    info: 'bg-sky-50 text-sky-700',
    purple: 'bg-violet-50 text-violet-700',
    dark: 'bg-slate-800 text-white',
  };

  const sizeStyles = {
    sm: 'text-[11px] font-semibold px-2.5 py-0.5 rounded-full',
    md: 'text-xs font-semibold px-3 py-1 rounded-full',
    lg: 'text-sm font-semibold px-4 py-1.5 rounded-full',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center tracking-tight select-none',
        variantStyles[variant] || variantStyles.default,
        sizeStyles[size] || sizeStyles.md,
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
