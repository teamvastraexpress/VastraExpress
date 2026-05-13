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
  brand:   'bg-white/10 text-[#4EAEE5]',
  sky:     'bg-[#4EAEE5]/20 text-[#4EAEE5]',
  success: 'bg-green-500/20 text-green-400',
  warning: 'bg-amber-500/20 text-amber-300',
  danger:  'bg-red-500/20 text-red-400',
  neutral: 'bg-white/10 text-white/80',
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
