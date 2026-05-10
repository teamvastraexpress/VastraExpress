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
    primary: 'bg-brand-blue shadow-brand',
    secondary: 'bg-brand-sky',
    outline: 'border-2 border-brand-blue bg-transparent',
    ghost: 'bg-transparent',
    danger: 'bg-danger',
  };

  const sizeStyles = {
    sm: 'py-2 px-4 rounded-md',
    md: 'py-3 px-7 rounded-lg',
    lg: 'py-4 px-10 rounded-xl',
  };

  const textStyles = {
    primary: 'text-white font-semibold',
    secondary: 'text-white font-semibold',
    outline: 'text-brand-blue font-semibold',
    ghost: 'text-brand-blue font-semibold',
    danger: 'text-white font-semibold',
  };

  const textSizeStyles = {
    sm: 'body-sm',
    md: 'body-md',
    lg: 'body-lg',
  } as const;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || isLoading}
      className={cn(
        'flex-row items-center justify-center transition-all duration-200',
        variantStyles[variant],
        sizeStyles[size],
        (disabled || isLoading) && 'opacity-50',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#1A6FC4' : '#FFFFFF'} />
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
