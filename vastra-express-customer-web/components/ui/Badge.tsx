import { cn } from '@/lib/utils';

type BadgePreset = 'brand' | 'sky' | 'success' | 'warning' | 'danger' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  /**
   * Either a preset name ('brand' | 'sky' | 'success' | 'warning' | 'danger' | 'neutral')
   * or a raw Tailwind class string (e.g. from getStatusColor).
   */
  variant?: BadgePreset | string;
  size?: 'sm' | 'md';
  className?: string;
}

const PRESETS: Record<BadgePreset, string> = {
  brand:   'bg-blue-50 text-blue-700',
  sky:     'bg-sky-50 text-sky-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger:  'bg-red-50 text-red-700',
  neutral: 'bg-gray-100 text-gray-600',
};

const PRESET_KEYS = Object.keys(PRESETS) as BadgePreset[];

export function Badge({ children, variant, size = 'md', className }: BadgeProps) {
  const isPreset = variant && PRESET_KEYS.includes(variant as BadgePreset);
  const presetClass = isPreset ? PRESETS[variant as BadgePreset] : undefined;
  const fallbackClass = !variant ? PRESETS.neutral : undefined;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs',
        // Preset or pass-through or default neutral
        presetClass ?? (!isPreset && variant ? variant : fallbackClass),
        className,
      )}
    >
      {children}
    </span>
  );
}
