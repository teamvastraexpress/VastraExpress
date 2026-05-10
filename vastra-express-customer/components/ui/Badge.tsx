import React from 'react';
import { View } from 'react-native';
import { Typography } from './Typography';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type BadgePreset = 'brand' | 'sky' | 'success' | 'warning' | 'danger' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgePreset;
  size?: 'sm' | 'md';
  className?: string;
  labelClassName?: string;
}

const PRESETS: Record<BadgePreset, { bg: string; text: string }> = {
  brand:   { bg: 'bg-brand-hero', text: 'text-brand-blue' },
  sky:     { bg: 'bg-brand-bubble', text: 'text-brand-sky' },
  success: { bg: 'bg-green-100', text: 'text-green-700' },
  warning: { bg: 'bg-orange-100', text: 'text-orange-700' },
  danger:  { bg: 'bg-red-100', text: 'text-red-700' },
  neutral: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

export const Badge = ({ children, variant = 'neutral', size = 'md', className, labelClassName }: BadgeProps) => {
  const preset = PRESETS[variant];

  return (
    <View
      className={cn(
        'inline-flex flex-row items-center rounded-full self-start',
        size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-0.5',
        preset.bg,
        className
      )}
    >
      <Typography
        variant="caption"
        className={cn(
          'font-bold lowercase first-letter:uppercase',
          preset.text,
          size === 'sm' ? 'text-[10px]' : 'text-[11px]',
          labelClassName
        )}
      >
        {children}
      </Typography>
    </View>
  );
};
