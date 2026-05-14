import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, ActivityIndicator, View } from 'react-native';
import { Typography } from './Typography';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  labelClassName?: string;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  label,
  leftIcon,
  rightIcon,
  className,
  labelClassName,
  disabled,
  children,
  ...props
}: ButtonProps) => {
  const variantStyles = {
    primary:   'bg-primary-400',
    secondary: 'bg-primary-50',
    outline:   'border border-border bg-white',
    ghost:     'bg-transparent',
    danger:    'bg-status-error',
  };

  const sizeStyles = {
    sm: 'py-2.5 px-5 rounded-lg',
    md: 'py-3.5 px-6 rounded-xl',
    lg: 'py-4 px-8 rounded-2xl',
  };

  const textStyles = {
    primary:   'text-white font-semibold',
    secondary: 'text-primary-400 font-semibold',
    outline:   'text-text-primary font-semibold',
    ghost:     'text-primary-400 font-semibold',
    danger:    'text-white font-semibold',
  };

  const textSizeStyles = {
    sm: 'body-sm',
    md: 'body-md',
    lg: 'body-md',
  } as const;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled || isLoading}
      className={cn(
        'flex-row items-center justify-center',
        variantStyles[variant],
        sizeStyles[size],
        (disabled || isLoading) && 'opacity-40',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' || variant === 'secondary' ? '#4DA6FF' : '#FFFFFF'}
        />
      ) : (
        <View className="flex-row items-center justify-center">
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          {label ? (
            <Typography
              variant={textSizeStyles[size]}
              className={cn(textStyles[variant], labelClassName)}
            >
              {label}
            </Typography>
          ) : (
            children
          )}
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};
