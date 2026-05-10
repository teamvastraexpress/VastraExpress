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
  Settings,
  HelpCircle,
  Shield
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { Typography } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
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

  const menuGroups = [
    {
      title: 'Account',
      items: [
        { label: 'Edit Profile', icon: User, route: '/profile/edit' as any },
        { label: 'My Addresses', icon: MapPin, route: '/addresses' as any },
        { label: 'Order History', icon: ClipboardList, route: '/(tabs)/orders' as any },
      ]
    },
    {
      title: 'Support',
      items: [
        { label: 'Help & FAQ', icon: HelpCircle, route: '/help' as const },
        { label: 'Privacy Policy', icon: Shield, route: '/privacy' as const },
        { label: 'Terms of Service', icon: Settings, route: '/terms' as const },
      ]
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-offwhite">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="bg-brand-blue pt-10 pb-20 px-6 items-center">
           <View className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/10 items-center justify-center mb-4">
              <Typography className="text-white text-3xl font-bold">{initials}</Typography>
           </View>
           <Typography variant="heading-lg" className="text-white">{user?.name || 'Customer'}</Typography>
           <View className="flex-row items-center mt-2 opacity-80">
              <Phone size={14} color="white" />
              <Typography variant="body-sm" className="text-white ml-2">+91 {user?.mobileNumber || '—'}</Typography>
           </View>
           {user?.email && (
             <View className="flex-row items-center mt-1 opacity-80">
                <Mail size={14} color="white" />
                <Typography variant="body-sm" className="text-white ml-2">{user.email}</Typography>
             </View>
           )}
        </View>

        <View className="px-6 -mt-10 mb-10">
          {menuGroups.map((group, groupIdx) => (
            <View key={groupIdx} className="mb-6">
              <Typography variant="caption" className="mb-3 ml-2 text-text-light">{group.title}</Typography>
              <Card className="p-0 overflow-hidden">
                {group.items.map((item, itemIdx) => (
                  <TouchableOpacity 
                    key={itemIdx}
                    onPress={() => router.push(item.route)}
                    className={`flex-row items-center p-4 ${itemIdx < group.items.length - 1 ? 'border-b border-brand-bubble/10' : ''}`}
                  >
                    <View className="w-10 h-10 rounded-xl bg-brand-hero/50 items-center justify-center mr-4">
                      <item.icon size={20} color={COLORS.primary} />
                    </View>
                    <Typography variant="body-md" className="flex-1 font-medium">{item.label}</Typography>
                    <ChevronRight size={18} color={COLORS.textLight} />
                  </TouchableOpacity>
                ))}
              </Card>
            </View>
          ))}

          {/* Logout Button */}
          <TouchableOpacity 
            onPress={handleLogout}
            className="flex-row items-center justify-center bg-red-50 p-4 rounded-2xl border border-red-100"
          >
            <LogOut size={20} color={COLORS.danger} />
            <Typography variant="heading-sm" className="text-danger ml-2">Logout</Typography>
          </TouchableOpacity>

          <View className="items-center mt-8">
             <Typography variant="caption" className="text-text-light opacity-50">Vastra Express v1.0.0</Typography>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
