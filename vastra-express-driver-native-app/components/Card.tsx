import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  subtext?: string;
}

export function KpiCard({
  label,
  value,
  icon,
  iconBg = colors.violet100,
  subtext,
}: KpiCardProps) {
  return (
    <Card style={styles.kpiCard}>
      <View style={styles.kpiRow}>
        <View style={styles.kpiContent}>
          <Text style={styles.kpiLabel}>{label}</Text>
          <Text style={styles.kpiValue}>{value}</Text>
          {subtext && <Text style={styles.kpiSubtext}>{subtext}</Text>}
        </View>
        <View style={[styles.kpiIcon, { backgroundColor: iconBg }]}>
          {icon}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiCard: {
    padding: 20,
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  kpiContent: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 13,
    color: colors.gray500,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray900,
  },
  kpiSubtext: {
    fontSize: 11,
    color: colors.gray400,
    marginTop: 4,
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
