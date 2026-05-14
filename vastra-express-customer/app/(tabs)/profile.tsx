import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  MapPin,
  ClipboardList,
  LogOut,
  ChevronRight,
  Mail,
  Phone,
  HelpCircle,
  Shield,
  FileText,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { Typography } from '@/components/ui/Typography';
import { COLORS } from '@/constants';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    const performLogout = async () => {
      try {
        await logout();
        router.replace('/(auth)/login');
      } catch (err) {
        console.error('Logout failed:', err);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to logout?')) {
        performLogout();
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: performLogout },
      ]);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const menuItems = [
    { label: 'Edit Profile', icon: User, route: '/profile/edit' as any },
    { label: 'My Addresses', icon: MapPin, route: '/addresses' as any },
    { label: 'Order History', icon: ClipboardList, route: '/(tabs)/orders' as any },
  ];

  const supportItems = [
    { label: 'Help & FAQ', icon: HelpCircle, route: '/help' as any },
    { label: 'Privacy Policy', icon: Shield, route: '/privacy' as any },
    { label: 'Terms of Service', icon: FileText, route: '/terms' as any },
  ];

  const renderMenuItem = (item: { label: string; icon: any; route: any }, index: number, isLast: boolean) => (
    <TouchableOpacity
      key={index}
      onPress={() => router.push(item.route)}
      activeOpacity={0.5}
      className={`flex-row items-center py-4 ${!isLast ? 'border-b border-border-light' : ''}`}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-4"
        style={{ backgroundColor: COLORS.primaryBg }}
      >
        <item.icon size={18} color={COLORS.primary} strokeWidth={1.8} />
      </View>
      <Typography variant="body-md" className="flex-1 text-text-primary font-medium">
        {item.label}
      </Typography>
      <ChevronRight size={18} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-14 pb-8">
          <View className="flex-row items-center">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Typography className="text-white text-xl font-bold">{initials}</Typography>
            </View>
            <View className="flex-1">
              <Typography variant="heading-lg">{user?.name || 'Customer'}</Typography>
              <Typography variant="body-sm" className="text-text-tertiary mt-0.5">
                +91 {user?.mobileNumber || '—'}
              </Typography>
            </View>
          </View>
        </View>

        <View className="h-2 bg-surface-secondary" />

        {/* Account Section */}
        <View className="px-6 pt-6 pb-2">
          <Typography variant="overline" className="mb-2">Account</Typography>
          {menuItems.map((item, i) => renderMenuItem(item, i, i === menuItems.length - 1))}
        </View>

        <View className="h-2 bg-surface-secondary" />

        {/* Support Section */}
        <View className="px-6 pt-6 pb-2">
          <Typography variant="overline" className="mb-2">Support</Typography>
          {supportItems.map((item, i) => renderMenuItem(item, i, i === supportItems.length - 1))}
        </View>

        <View className="h-2 bg-surface-secondary" />

        {/* Logout */}
        <View className="px-6 pt-4 pb-24">
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.5}
            className="flex-row items-center py-4"
          >
            <View className="w-10 h-10 rounded-xl bg-status-error-bg items-center justify-center mr-4">
              <LogOut size={18} color={COLORS.danger} strokeWidth={1.8} />
            </View>
            <Typography variant="body-md" className="text-status-error font-medium">
              Log out
            </Typography>
          </TouchableOpacity>

          <View className="items-center mt-8">
            <Typography variant="body-sm" className="text-text-tertiary opacity-50">
              Vastra Express v1.0.0
            </Typography>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
