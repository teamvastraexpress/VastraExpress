import { View, Text } from 'react-native';

interface Props {
  emoji?: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ emoji = '📭', title, subtitle }: Props) {
  return (
    <View className="flex-1 items-center justify-center py-20 px-8">
      <Text className="text-5xl mb-4">{emoji}</Text>
      <Text className="text-gray-700 text-lg font-bold text-center mb-1">{title}</Text>
      {subtitle && <Text className="text-gray-400 text-sm text-center">{subtitle}</Text>}
    </View>
  );
}
