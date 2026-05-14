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
  brand:   { bg: 'bg-primary-50',        text: 'text-primary-500' },
  sky:     { bg: 'bg-primary-100',       text: 'text-primary-600' },
  success: { bg: 'bg-status-success-bg', text: 'text-status-success' },
  warning: { bg: 'bg-status-warning-bg', text: 'text-status-warning' },
  danger:  { bg: 'bg-status-error-bg',   text: 'text-status-error' },
  neutral: { bg: 'bg-gray-100',          text: 'text-text-secondary' },
};

export const Badge = ({ children, variant = 'neutral', size = 'md', className, labelClassName }: BadgeProps) => {
  const preset = PRESETS[variant];

  return (
    <View
      className={cn(
        'flex-row items-center rounded-full self-start',
        size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1',
        preset.bg,
        className
      )}
    >
      <Typography
        variant="caption"
        className={cn(
          'font-semibold normal-case',
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
