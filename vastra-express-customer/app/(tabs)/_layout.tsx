import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Home, ClipboardList, User } from 'lucide-react-native';
import { COLORS } from '@/constants';
import { Typography } from '@/components/ui/Typography';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TabIconProps {
  Icon: any;
  label: string;
  focused: boolean;
}

function TabIcon({ Icon, label, focused }: TabIconProps) {
  return (
    <View className="items-center justify-center pt-4">
      <View
        className={cn(
          "px-6 py-1.5 rounded-full items-center justify-center mb-1",
          focused ? "bg-primary-100" : "bg-transparent"
        )}
      >
        <Icon
          size={24}
          color={focused ? COLORS.primary : COLORS.textTertiary}
          strokeWidth={focused ? 2.5 : 1.8}
        />
      </View>
      <Typography
        variant="body-sm"
        className={cn(
          "font-bold",
          focused ? "text-text-primary" : "text-text-tertiary"
        )}
      >
        {label}
      </Typography>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 0.5,
          borderTopColor: COLORS.border,
          height: 90,
          paddingBottom: 20,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Home} label="Home" focused={focused} />
          ),
        }}
      />
      {/* Removed Book tab as requested */}
      <Tabs.Screen
        name="book"
        options={{
          href: null, // Hides it from the tab bar
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={ClipboardList} label="Orders" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={User} label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
