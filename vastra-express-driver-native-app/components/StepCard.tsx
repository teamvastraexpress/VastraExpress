import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { Button } from './Button';
import { colors } from '@/lib/utils';

export interface StepDef {
  key: string;
  label: string;
  description: string;
  icon: string;
  requiresWeight?: boolean;
}

interface StepCardProps {
  step: StepDef;
  isDone: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  loading: boolean;
  accentColor?: string;
  onAction: () => void;
}

export function StepCard({
  step,
  isDone,
  isCurrent,
  isLocked,
  loading,
  accentColor,
  onAction,
}: StepCardProps) {
  return (
    <View
      style={[
        styles.card,
        isDone && styles.done,
        isCurrent && [styles.current, accentColor ? { borderColor: accentColor } : null],
        isLocked && styles.locked,
      ]}
    >
      <Text style={styles.emoji}>{isDone ? '✅' : step.icon}</Text>
      <View style={styles.content}>
        <Text style={styles.label}>{step.label}</Text>
        <Text style={styles.desc}>{step.description}</Text>
      </View>
      {isCurrent && (
        <Button
          size="sm"
          variant={step.requiresWeight ? 'success' : (accentColor ? 'success' : 'primary')}
          loading={loading}
          onPress={onAction}
        >
          {step.label}
        </Button>
      )}
      {isDone && <CheckCircle2 size={20} color={colors.green600} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.gray50,
  },
  done: {
    backgroundColor: colors.green50,
    borderColor: colors.green200,
  },
  current: {
    backgroundColor: colors.violet50,
    borderColor: colors.primary300,
  },
  locked: {
    opacity: 0.5,
  },
  emoji: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray900,
  },
  desc: {
    fontSize: 11,
    color: colors.gray500,
    marginTop: 2,
  },
});
