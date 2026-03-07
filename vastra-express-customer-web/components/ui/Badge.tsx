import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  /** Pass Tailwind class string (e.g. from getStatusColor) or a preset name */
  variant?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant, size = 'md', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs',
        variant,
        !variant && 'bg-gray-100 text-gray-700',
        className
      )}
    >
      {children}
    </span>
  );
}
