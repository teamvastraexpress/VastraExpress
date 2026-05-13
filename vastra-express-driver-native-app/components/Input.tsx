import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, type ViewStyle, type TextInputProps } from 'react-native';
import { colors } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  hint,
  leftAddon,
  containerStyle,
  style,
  secureTextEntry,
  ...props
}: InputProps) {
  const [hidePassword, setHidePassword] = useState(secureTextEntry);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputRow}>
        {leftAddon && <View style={styles.addon}>{leftAddon}</View>}
        <TextInput
          placeholderTextColor={colors.gray400}
          secureTextEntry={hidePassword}
          style={[
            styles.input,
            leftAddon ? { paddingLeft: 40 } : null,
            secureTextEntry ? { paddingRight: 40 } : null,
            error ? { borderColor: colors.red400 } : null,
            style,
          ]}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setHidePassword(!hidePassword)}
            style={styles.eyeIcon}
          >
            {hidePassword ? (
              <Eye size={18} color={colors.gray400} />
            ) : (
              <EyeOff size={18} color={colors.gray400} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray700,
  },
  inputRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  addon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  input: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.gray900,
  },
  error: {
    fontSize: 11,
    color: colors.red500,
  },
  hint: {
    fontSize: 11,
    color: colors.gray400,
  },
});
