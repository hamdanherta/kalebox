import React, { forwardRef } from 'react';

export const Textarea = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  id,
  rows = 4,
  required = false,
  ...props
}, ref) => {
  const textareaId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-bold text-[#004582] tracking-wide uppercase"
        >
          {label} {required && <span className="text-[#DE0E86]">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        required={required}
        className={`w-full bg-[#F0F6FB]/80 hover:bg-[#F0F6FB] focus:bg-white text-[#004582] placeholder:text-slate-400 font-medium text-sm rounded-[18px] p-4 shadow-input focus:shadow-input-focus outline-none transition-all duration-200 resize-y ${
          error ? 'bg-red-50 text-red-900 placeholder:text-red-300' : ''
        } ${className}`}
        {...props}
      />

      {error && (
        <p className="text-xs font-semibold text-red-600 pl-1">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-xs text-slate-500 pl-1">{helperText}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
