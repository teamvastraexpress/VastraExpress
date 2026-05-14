import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** 'default' | 'elevated' | 'outline' */
  variant?: 'default' | 'elevated' | 'outline';
}

export function Card({ children, className, variant = 'default' }: CardProps) {
  const variants = {
    default:  'bg-white rounded-2xl border border-[#A8D8F0]/30 shadow-sm hover:shadow-md transition-shadow duration-200',
    elevated: 'bg-white rounded-2xl border border-[#A8D8F0]/20 shadow-brand-lg hover:shadow-brand-xl transition-shadow duration-200',
    outline:  'bg-white rounded-2xl border border-[#A8D8F0]/40 transition-shadow duration-200',
  };

  return (
    <div className={cn(variants[variant], className)}>
      {children}
    </div>
  );
}
