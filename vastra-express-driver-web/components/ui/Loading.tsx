import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Loading({ fullPage = false, label }: { fullPage?: boolean; label?: string }) {
  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center z-50">
        <div className="w-10 h-10 bg-violet-700 rounded-xl flex items-center justify-center mb-4">
          <span className="text-white font-bold text-sm">VE</span>
        </div>
        <Loader2 className="w-6 h-6 text-violet-700 animate-spin" />
        {label && <p className="text-sm text-gray-500 mt-2">{label}</p>}
      </div>
    );
  }
  return (
    <div className={cn('flex items-center justify-center gap-2 py-8')}>
      <Loader2 className="w-5 h-5 text-violet-700 animate-spin" />
      {label && <span className="text-sm text-gray-500">{label}</span>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
