import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon = '📭', title, subtitle }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-20 gap-3">
      <Text className="text-5xl">{icon}</Text>
      <Text className="text-gray-800 text-lg font-semibold text-center">{title}</Text>
      {subtitle ? (
        <Text className="text-gray-400 text-sm text-center">{subtitle}</Text>
      ) : null}
    </View>
  );
}
