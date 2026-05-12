import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.violet700, text: colors.white },
  secondary: { bg: colors.gray100, text: colors.gray900 },
  danger: { bg: colors.red600, text: colors.white },
  ghost: { bg: 'transparent', text: colors.gray600 },
  outline: { bg: colors.white, text: colors.gray700, border: colors.gray300 },
  success: { bg: colors.emerald600, text: colors.white },
};

const sizeStyles: Record<Size, { px: number; py: number; fontSize: number }> = {
  sm: { px: 12, py: 6, fontSize: 13 },
  md: { px: 16, py: 10, fontSize: 14 },
  lg: { px: 20, py: 12, fontSize: 16 },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  style,
  textStyle,
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          paddingHorizontal: s.px,
          paddingVertical: s.py,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border ?? 'transparent',
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <Text
          style={[
            styles.text,
            { color: v.text, fontSize: s.fontSize },
            textStyle,
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 8,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
