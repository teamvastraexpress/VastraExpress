'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  variant?: 'dark' | 'light';
}

export function Input({ label, error, hint, leftAddon, className, id, type, variant = 'dark', ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const isPassword = type === 'password';
  const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const isDark = variant === 'dark';
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className={cn('block text-sm font-medium', isDark ? 'text-[#E2E8F0]' : 'text-slate-700')}
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftAddon && (
          <span className={cn('absolute left-3 select-none', isDark ? 'text-[#8FA3B1]' : 'text-slate-400')}>
            {leftAddon}
          </span>
        )}
        <input
          id={inputId}
          type={currentType}
          className={cn(
            'w-full rounded-xl border-none px-4 py-3 text-sm transition-all duration-150',
            isDark ? 'bg-white/[0.05] text-white placeholder-white/40' : 'bg-slate-100 text-slate-900 placeholder-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-[#4EAEE5]/40',
            isDark ? 'disabled:opacity-50 disabled:bg-white/5' : 'disabled:opacity-50 disabled:bg-slate-50',
            error && 'ring-2 ring-red-400',
            leftAddon && 'pl-10',
            isPassword && 'pr-10',
            className,
          )}
          style={{ fontFamily: 'var(--font-body)' }}
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
        <p className={cn('text-xs', isDark ? 'text-[#8FA3B1]' : 'text-slate-500')} style={{ fontFamily: 'var(--font-body)' }}>{hint}</p>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string | number; label: string }[];
  children?: React.ReactNode;
  variant?: 'dark' | 'light';
}

export function Select({ label, error, options, children, className, id, variant = 'dark', ...props }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const isDark = variant === 'dark';
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className={cn('block text-sm font-medium', isDark ? 'text-[#E2E8F0]' : 'text-slate-700')}
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          'w-full rounded-xl border-none px-4 py-3 text-sm transition-all duration-150',
          isDark ? 'bg-white/[0.05] text-white' : 'bg-slate-100 text-slate-900',
          'focus:outline-none focus:ring-2 focus:ring-[#4EAEE5]/40',
          'disabled:opacity-50',
          error && 'ring-2 ring-red-400',
          className,
        )}
        style={{ fontFamily: 'var(--font-body)' }}
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
  variant?: 'dark' | 'light';
}

export function Textarea({ label, error, className, id, variant = 'dark', ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const isDark = variant === 'dark';
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className={cn('block text-sm font-medium', isDark ? 'text-[#E2E8F0]' : 'text-slate-700')}
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'w-full rounded-xl border-none px-4 py-3 text-sm resize-none transition-all duration-150',
          isDark ? 'bg-white/[0.05] text-white placeholder-white/40' : 'bg-slate-100 text-slate-900 placeholder-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-[#4EAEE5]/40',
          error && 'ring-2 ring-red-400',
          className,
        )}
        style={{ fontFamily: 'var(--font-body)' }}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500" style={{ fontFamily: 'var(--font-body)' }}>{error}</p>
      )}
    </div>
  );
}
