import React from 'react';
import { cn } from '../../utils/cn';

export const Card = ({
  children,
  className = '',
  hover = false,
  padding = 'p-6 md:p-8',
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-[32px] shadow-card transition-all duration-300',
        padding,
        hover && 'hover:-translate-y-1 hover:shadow-card-hover cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
