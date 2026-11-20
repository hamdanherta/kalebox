import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  rightElement,
  className = '',
  id,
  type = 'text',
  required = false,
  ...props
}, ref) => {
  const inputId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-[#004582] tracking-wide uppercase"
        >
          {label} {required && <span className="text-[#DE0E86]">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          className={`w-full bg-[#F0F6FB]/80 hover:bg-[#F0F6FB] focus:bg-white text-[#004582] placeholder:text-slate-400 font-medium text-sm rounded-[18px] py-3.5 ${
            Icon ? 'pl-11' : 'pl-5'
          } ${rightElement ? 'pr-12' : 'pr-5'} shadow-input focus:shadow-input-focus outline-none transition-all duration-200 ${
            error ? 'bg-red-50 text-red-900 placeholder:text-red-300' : ''
          } ${className}`}
          {...props}
        />

        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            {rightElement}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs font-semibold text-red-600 pl-1">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-xs text-slate-500 pl-1">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
