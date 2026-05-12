import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

interface BadgeProps {
  children: React.ReactNode;
  bg?: string;
  textColor?: string;
  style?: ViewStyle;
}

export function Badge({ children, bg = '#F3F4F6', textColor = '#4B5563', style }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: textColor }]}>
        {typeof children === 'string' ? children : children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
