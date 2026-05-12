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
        {/* Header Section */}
        <View className="px-6 pt-8 pb-6">
          <Typography variant="display-sm" className="text-2xl text-text-dark font-bold">My Profile</Typography>
          <Typography variant="body-sm" className="text-text-light">Manage your account details</Typography>
        </View>

        <View className="px-6 pb-20">
          {/* User Card */}
          <Card className="p-6 mb-6 flex-row items-center">
            <View className="w-20 h-20 rounded-full bg-brand-blue items-center justify-center shadow-lg">
              <Typography className="text-white text-2xl font-bold">{initials}</Typography>
            </View>
            <View className="ml-5">
              <Typography variant="heading-lg" className="text-text-dark mb-1">{user?.name || 'Customer'}</Typography>
              <View className="flex-row items-center">
                <View className="flex-row items-center bg-brand-hero/50 px-2 py-0.5 rounded-md border border-brand-bubble/30">
                  <Shield size={12} color={COLORS.primary} />
                  <Typography variant="caption" className="ml-1 text-brand-blue normal-case font-bold">Customer</Typography>
                </View>
                <View className="w-1 h-1 rounded-full bg-text-light mx-2" />
                <Typography variant="caption" className="text-success normal-case font-bold">Active</Typography>
              </View>
            </View>
          </Card>

          {/* Personal Information */}
          <Card className="p-6 mb-6">
            <View className="flex-row justify-between items-center mb-6">
              <Typography variant="heading-sm" className="text-text-dark">Personal Information</Typography>
              <TouchableOpacity onPress={() => router.push('/profile/edit' as any)}>
                <Typography variant="body-sm" className="text-brand-blue font-semibold">Edit</Typography>
              </TouchableOpacity>
            </View>

            <View className="gap-y-6">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-brand-section items-center justify-center mr-4">
                  <User size={20} color={COLORS.primary} />
                </View>
                <View>
                  <Typography variant="caption" className="text-[10px] text-text-light normal-case">Full Name</Typography>
                  <Typography variant="body-md" className="text-text-dark font-bold">{user?.name || '—'}</Typography>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-brand-section items-center justify-center mr-4">
                  <Phone size={20} color={COLORS.primary} />
                </View>
                <View>
                  <Typography variant="caption" className="text-[10px] text-text-light normal-case">Mobile Number</Typography>
                  <Typography variant="body-md" className="text-text-dark font-bold">+91 {user?.mobileNumber || '—'}</Typography>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-brand-section items-center justify-center mr-4">
                  <Mail size={20} color={COLORS.primary} />
                </View>
                <View>
                  <Typography variant="caption" className="text-[10px] text-text-light normal-case">Email Address</Typography>
                  <Typography variant="body-md" className="text-text-dark font-bold">{user?.email || '—'}</Typography>
                </View>
              </View>
            </View>
          </Card>

          {/* Account */}
          <Card className="p-6">
             <Typography variant="heading-sm" className="text-text-dark mb-6">Account</Typography>
             
             <TouchableOpacity 
               onPress={handleLogout}
               className="flex-row items-center py-2"
             >
               <View className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center mr-4">
                 <LogOut size={20} color={COLORS.danger} />
               </View>
               <Typography variant="body-md" className="text-danger font-bold">Log out</Typography>
             </TouchableOpacity>
          </Card>

          <View className="items-center mt-10">
             <Typography variant="caption" className="text-text-light opacity-50 normal-case">Vastra Express v1.0.0</Typography>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
