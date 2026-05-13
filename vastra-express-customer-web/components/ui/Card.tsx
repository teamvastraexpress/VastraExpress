import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** 'default' | 'elevated' | 'outline' */
  variant?: 'default' | 'elevated' | 'outline';
}

export function Card({ children, className, variant = 'default' }: CardProps) {
  const variants = {
    default:  'bg-[#07111C] rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200',
    elevated: 'bg-[#07111C] rounded-2xl border border-white/10 shadow-brand-lg hover:shadow-brand-xl transition-shadow duration-200',
    outline:  'bg-[#07111C] rounded-2xl border border-white/10 transition-shadow duration-200',
  };

  return (
    <div className={cn(variants[variant], className)}>
      {children}
    </div>
  );
}
