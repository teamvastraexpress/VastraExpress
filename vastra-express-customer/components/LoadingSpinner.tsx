import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';

interface Props {
  message?: string;
  size?: 'small' | 'large';
}

export default function LoadingSpinner({ message, size = 'large' }: Props) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-gray-50">
      <ActivityIndicator size={size} color="#7C3AED" />
      {message ? (
        <Text className="text-gray-500 text-sm">{message}</Text>
      ) : null}
    </View>
  );
}
