import { View, ActivityIndicator, Text } from 'react-native';

interface Props {
  label?: string;
}

export function LoadingSpinner({ label }: Props) {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <ActivityIndicator size="large" color="#1D4ED8" />
      {label && <Text className="text-gray-400 text-sm mt-3">{label}</Text>}
    </View>
  );
}
