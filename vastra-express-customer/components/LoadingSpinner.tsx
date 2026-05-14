import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';

interface Props {
  message?: string;
  size?: 'small' | 'large';
}

export default function LoadingSpinner({ message, size = 'large' }: Props) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white">
      <ActivityIndicator size={size} color="#1565a8" />
      <Text className="text-[#1a6fb5] text-sm font-medium opacity-90 text-center px-6">
        {message || 'Please wait while we spin things up...'}
      </Text>
    </View>
  );
}
