'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
}

export function Input({ label, error, hint, leftAddon, className, id, type, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  
  const isPassword = type === 'password';
  const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium"
          style={{ color: '#1B2A3B', fontFamily: 'var(--font-ui)' }}
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftAddon && (
          <span className="absolute left-3 select-none text-[#8FA3B1]">
            {leftAddon}
          </span>
        )}
        <input
          id={inputId}
          type={currentType}
          className={cn(
            'w-full rounded-xl border bg-white px-4 py-3 text-sm placeholder-[#8FA3B1] transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[#1A6FC4]/40 focus:border-[#1A6FC4]',
            'disabled:opacity-50 disabled:bg-[#F0F8FF]',
            error ? 'border-red-400' : 'border-[#A8D8F0] hover:border-[#4EAEE5]',
            leftAddon && 'pl-10',
            isPassword && 'pr-10',
            className,
          )}
          style={{ color: '#1B2A3B', fontFamily: 'var(--font-body)' }}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 focus:outline-none text-[#8FA3B1] hover:text-[#1A6FC4] transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500" style={{ fontFamily: 'var(--font-body)' }}>{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>{hint}</p>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string | number; label: string }[];
  children?: React.ReactNode;
}

export function Select({ label, error, options, children, className, id, ...props }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium"
          style={{ color: '#1B2A3B', fontFamily: 'var(--font-ui)' }}
        >
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          'w-full rounded-xl border bg-white px-4 py-3 text-sm transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-[#1A6FC4]/40 focus:border-[#1A6FC4]',
          'disabled:opacity-50',
          error ? 'border-red-400' : 'border-[#A8D8F0] hover:border-[#4EAEE5]',
          className,
        )}
        style={{ color: '#1B2A3B', fontFamily: 'var(--font-body)' }}
        {...props}
      >
        {children ?? options?.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-500" style={{ fontFamily: 'var(--font-body)' }}>{error}</p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium"
          style={{ color: '#1B2A3B', fontFamily: 'var(--font-ui)' }}
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'w-full rounded-xl border bg-white px-4 py-3 text-sm placeholder-[#8FA3B1] resize-none transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-[#1A6FC4]/40 focus:border-[#1A6FC4]',
          error ? 'border-red-400' : 'border-[#A8D8F0] hover:border-[#4EAEE5]',
          className,
        )}
        style={{ color: '#1B2A3B', fontFamily: 'var(--font-body)' }}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500" style={{ fontFamily: 'var(--font-body)' }}>{error}</p>
      )}
    </div>
  );
}
