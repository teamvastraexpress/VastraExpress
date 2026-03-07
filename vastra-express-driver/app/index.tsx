import { ActivityIndicator, View } from 'react-native';

/**
 * Root index — acts as a splash/loading screen.
 * The AuthGate in _layout.tsx handles the redirect:
 *   - authenticated  → /(tabs)/home
 *   - unauthenticated → /(auth)/login
 */
export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#1D4ED8" />
    </View>
  );
}
