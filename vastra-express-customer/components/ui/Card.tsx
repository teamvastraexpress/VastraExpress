import React from 'react';
import { View, ViewProps } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outline' | 'flat';
  className?: string;
  children: React.ReactNode;
}

export const Card = ({ variant = 'default', className, children, ...props }: CardProps) => {
  const variantStyles = {
    default:  'bg-white rounded-2xl border border-border',
    elevated: 'bg-white rounded-2xl shadow-elevated',
    outline:  'bg-white rounded-2xl border border-border-light',
    flat:     'bg-surface-secondary rounded-2xl',
  };

  return (
    <View
      className={cn(variantStyles[variant], className)}
      {...props}
    >
      {children}
    </View>
  );
};
