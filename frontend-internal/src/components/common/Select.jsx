import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = forwardRef(({
  label,
  error,
  helperText,
  options = [],
  children,
  className = '',
  id,
  required = false,
  placeholder = 'Pilih opsi...',
  ...props
}, ref) => {
  const selectId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-bold text-[#004582] tracking-wide uppercase"
        >
          {label} {required && <span className="text-[#DE0E86]">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          className={`w-full appearance-none bg-[#F0F6FB]/80 hover:bg-[#F0F6FB] focus:bg-white text-[#004582] font-medium text-sm rounded-[18px] py-3.5 pl-5 pr-11 shadow-input focus:shadow-input-focus outline-none transition-all duration-200 cursor-pointer ${
            error ? 'bg-red-50 text-red-900' : ''
          } ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {children || options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const label = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val}>
                {label}
              </option>
            );
          })}
        </select>

        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
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

Select.displayName = 'Select';

export default Select;
