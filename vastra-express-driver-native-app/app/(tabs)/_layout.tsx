import { Tabs, Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { Loading } from '@/components/Loading';
import { colors } from '@/lib/utils';
import { LayoutDashboard, PackageSearch, Truck, User } from 'lucide-react-native';

export default function TabsLayout() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  if (!_hasHydrated) return <Loading fullPage />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.violet700,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray200,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pickups"
        options={{
          title: 'Pickups',
          tabBarIcon: ({ color, size }) => <PackageSearch size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="deliveries"
        options={{
          title: 'Deliveries',
          tabBarIcon: ({ color, size }) => <Truck size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
