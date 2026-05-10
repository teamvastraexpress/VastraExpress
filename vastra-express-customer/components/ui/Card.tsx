import React from 'react';
import { View, ViewProps } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outline';
  className?: string;
  children: React.ReactNode;
}

export const Card = ({ variant = 'default', className, children, ...props }: CardProps) => {
  const variantStyles = {
    default: 'bg-white rounded-2xl shadow-sm border border-brand-bubble/40',
    elevated: 'bg-white rounded-2xl shadow-md',
    outline: 'bg-transparent rounded-2xl border-2 border-brand-bubble/20',
  };

  return (
    <View 
      className={cn(variantStyles[variant], 'overflow-hidden', className)} 
      {...props}
    >
      {children}
    </View>
  );
};
