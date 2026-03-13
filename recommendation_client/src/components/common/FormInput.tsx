import React, { useId } from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  name,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const helperTextId = `${inputId}-helper`;
  const describedBy = [ariaDescribedBy, error ? errorId : undefined, helperText && !error ? helperTextId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          name={name}
          aria-describedby={describedBy}
          aria-invalid={error ? true : ariaInvalid}
          className={`
            w-full px-4 py-2.5 rounded-lg border transition-all
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error 
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
              : 'border-gray-200 focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/20'
            }
            bg-white text-gray-900 placeholder-gray-400
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p id={helperTextId} className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
