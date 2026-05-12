import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Home, ClipboardList, User, PlusCircle } from 'lucide-react-native';
import { Typography } from '@/components/ui/Typography';
import { COLORS } from '@/constants';

interface TabIconProps {
  Icon: any;
  label: string;
  focused: boolean;
}

function TabIcon({ Icon, label, focused }: TabIconProps) {
  return (
    <View className="items-center justify-center pt-2">
      <Icon 
        size={24} 
        color={focused ? COLORS.primary : COLORS.textLight} 
        strokeWidth={focused ? 2.5 : 2}
      />
      <Typography
        className={`text-[10px] mt-1 ${
          focused ? 'text-brand-blue font-bold' : 'text-text-light font-medium'
        }`}
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
          backgroundColor: '#fff',
          borderTopColor: '#f1f5f9',
          height: 85,
          paddingBottom: 25,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
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
      <Tabs.Screen
        name="book"
        options={{
          title: 'Book',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={PlusCircle} label="Book" focused={focused} />
          ),
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
