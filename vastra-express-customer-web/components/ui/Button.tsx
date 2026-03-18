'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variants = {
    // Brand primary — #1A6FC4 per stylesheet
    primary:
      'bg-[#1A6FC4] text-white hover:bg-[#145DA0] hover:-translate-y-0.5 focus-visible:outline-[#1A6FC4] shadow-brand',
    secondary:
      'bg-[#E8F4FB] text-[#1A6FC4] hover:bg-[#A8D8F0] hover:text-[#145DA0]',
    accent:
      'bg-orange-500 text-white hover:bg-orange-600 focus-visible:outline-orange-500 shadow-sm',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
    ghost:
      'text-[#4A5A6B] hover:bg-[#E8F4FB] hover:text-[#1A6FC4]',
    outline:
      'border-2 border-[#1A6FC4] text-[#1A6FC4] bg-white hover:bg-[#E8F4FB]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
      {children}
    </button>
  );
}
