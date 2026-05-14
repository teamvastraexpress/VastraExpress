import React from 'react';
import { Text, TextProps } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TypographyProps extends TextProps {
  variant? :
    | 'display-lg' | 'display-md' | 'display-sm'
    | 'heading-lg' | 'heading-md' | 'heading-sm'
    | 'body-lg' | 'body-md' | 'body-sm'
    | 'caption' | 'overline';
  children: React.ReactNode;
  className?: string;
}

export const Typography = ({ variant = 'body-md', children, className, ...props }: TypographyProps) => {
  const variantStyles: Record<string, string> = {
    'display-lg': 'text-4xl font-bold tracking-tight leading-tight text-text-primary',
    'display-md': 'text-3xl font-bold tracking-tight leading-tight text-text-primary',
    'display-sm': 'text-2xl font-bold tracking-tight leading-snug text-text-primary',
    'heading-lg': 'text-xl font-semibold tracking-tight text-text-primary',
    'heading-md': 'text-lg font-semibold tracking-normal text-text-primary',
    'heading-sm': 'text-base font-semibold text-text-primary',
    'body-lg':    'text-base leading-relaxed text-text-secondary',
    'body-md':    'text-sm leading-normal text-text-secondary',
    'body-sm':    'text-xs leading-relaxed text-text-secondary',
    'caption':    'text-[10px] uppercase tracking-widest text-text-tertiary',
    'overline':   'text-[11px] uppercase tracking-wider font-medium text-text-tertiary',
  };

  return (
    <Text
      className={cn(variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Text>
  );
};
