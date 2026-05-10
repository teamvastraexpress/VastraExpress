import React from 'react';
import { Text, TextProps } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TypographyProps extends TextProps {
  variant?: 
    | 'display-lg' | 'display-md' | 'display-sm' 
    | 'heading-lg' | 'heading-md' | 'heading-sm' 
    | 'body-lg' | 'body-md' | 'body-sm' 
    | 'caption';
  children: React.ReactNode;
  className?: string;
}

export const Typography = ({ variant = 'body-md', children, className, ...props }: TypographyProps) => {
  const variantStyles = {
    'display-lg': 'text-5xl font-extrabold tracking-tight leading-tight text-text-dark',
    'display-md': 'text-4xl font-bold tracking-tight leading-tight text-text-dark',
    'display-sm': 'text-3xl font-bold tracking-tight leading-normal text-text-dark',
    'heading-lg': 'text-2xl font-bold tracking-tight text-text-dark',
    'heading-md': 'text-xl font-bold tracking-normal text-text-dark',
    'heading-sm': 'text-lg font-semibold text-text-dark',
    'body-lg': 'text-base leading-relaxed text-text-mid',
    'body-md': 'text-base leading-normal text-text-mid',
    'body-sm': 'text-sm leading-relaxed text-text-mid',
    'caption': 'text-xs uppercase tracking-widest text-text-light',
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
