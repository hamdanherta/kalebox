import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Button = ({
  children,
  variant = 'primary', // primary, secondary, light, danger, ghost
  size = 'md',        // sm, md, lg
  className = '',
  isLoading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  type = 'button',
  onClick,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-[#DE0E86] text-white hover:bg-[#C50B75] shadow-md shadow-[#DE0E86]/20',
    secondary: 'bg-[#004582] text-white hover:bg-[#003362] shadow-md shadow-[#004582]/20',
    light: 'bg-[#F0F6FB] text-[#004582] hover:bg-[#E2EDF7]',
    danger: 'bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-md shadow-[#DC2626]/20',
    ghost: 'bg-transparent text-[#004582] hover:bg-[#F0F6FB]',
  };

  const sizeStyles = {
    sm: 'text-xs font-semibold px-4 py-2 rounded-[16px] gap-1.5',
    md: 'text-sm font-semibold px-6 py-3 rounded-[20px] gap-2',
    lg: 'text-base font-bold px-8 py-3.5 rounded-[24px] gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center font-sans tracking-tight transition-all duration-200 select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variantStyles[variant] || variantStyles.primary,
        sizeStyles[size] || sizeStyles.md,
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Memproses...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 flex-shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 flex-shrink-0" />}
        </>
      )}
    </button>
  );
};

export default Button;
