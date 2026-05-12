import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/lib/utils';

interface LoadingProps {
  fullPage?: boolean;
  label?: string;
}

export function Loading({ fullPage = false, label }: LoadingProps) {
  if (fullPage) {
    return (
      <View style={styles.fullPage}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>VE</Text>
        </View>
        <ActivityIndicator size="large" color={colors.violet700} style={{ marginTop: 16 }} />
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size="small" color={colors.violet700} />
      {label && <Text style={styles.inlineLabel}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  fullPage: {
    flex: 1,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: colors.violet700,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    color: colors.gray500,
    marginTop: 8,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 32,
  },
  inlineLabel: {
    fontSize: 13,
    color: colors.gray500,
  },
});
