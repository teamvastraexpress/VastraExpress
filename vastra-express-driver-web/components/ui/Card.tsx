import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm', className)}>
      {children}
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass?: string;
  subtext?: string;
}

export function KpiCard({ label, value, icon, colorClass = 'bg-violet-50 text-violet-700', subtext }: KpiCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorClass)}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
