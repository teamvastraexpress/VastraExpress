import { View, ActivityIndicator, Text } from 'react-native';

interface Props {
  label?: string;
}

export function LoadingSpinner({ label }: Props) {
  return (
    <View className="flex-1 items-center justify-center py-20 bg-white">
      <ActivityIndicator size="large" color="#1565a8" />
      <Text className="text-[#1a6fb5] text-sm font-medium mt-4 opacity-90">
        {label || 'Please wait while we spin things up...'}
      </Text>
    </View>
  );
}
