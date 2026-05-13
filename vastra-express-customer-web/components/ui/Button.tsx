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
    // Brand primary — glowing cyan for dark mode
    primary:
      'bg-[#4EAEE5] text-[#07111C] hover:bg-[#63BCEE] hover:-translate-y-0.5 focus-visible:outline-[#4EAEE5] shadow-brand',
    secondary:
      'bg-white/10 text-[#4EAEE5] hover:bg-white/20 hover:text-white',
    accent:
      'bg-orange-500 text-white hover:bg-orange-600 focus-visible:outline-orange-500 shadow-sm',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
    ghost:
      'text-white/80 hover:bg-white/10 hover:text-[#4EAEE5]',
    outline:
      'border-2 border-[#4EAEE5] text-[#4EAEE5] bg-transparent hover:bg-white/10',
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
