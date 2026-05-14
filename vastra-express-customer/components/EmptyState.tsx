import React from 'react';
import { View } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { Typography } from './ui/Typography';
import { COLORS } from '@/constants';

interface Props {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon, title, subtitle }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-20">
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-5"
        style={{ backgroundColor: COLORS.primaryBg }}
      >
        {icon || <Inbox size={32} color={COLORS.primary} strokeWidth={1.5} />}
      </View>
      <Typography variant="heading-md" className="text-center mb-2">{title}</Typography>
      {subtitle ? (
        <Typography variant="body-md" className="text-center text-text-tertiary">{subtitle}</Typography>
      ) : null}
    </View>
  );
}
