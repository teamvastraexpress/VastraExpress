import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Plus, Clock, CheckCircle, ShoppingBag, MapPin, User, ChevronRight } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import OrderCard from '@/components/OrderCard';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FadeInView } from '@/components/ui/FadeInView';
import { COLORS, ACTIVE_STATUSES } from '@/constants';
import type { Order } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { orders, isLoading, fetchOrders } = useOrderStore();

  useFocusEffect(
    React.useCallback(() => {
      fetchOrders();
    }, [])
  );

  const activeOrders = orders.filter((o: Order) =>
    ACTIVE_STATUSES.includes(o.status),
  );
  const completedCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const recentOrders = orders.slice(0, 5);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView className="flex-1 bg-offwhite">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchOrders}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header Section */}
        <FadeInView delay={100}>
          <View className="px-6 pt-8 pb-4 flex-row items-center justify-between">
            <View>
              <Typography variant="heading-lg" className="text-2xl">
                {getGreeting()}, {firstName}! 👋
              </Typography>
              <Typography variant="body-sm" className="text-text-light">
                Here's your laundry dashboard
              </Typography>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/profile')}
              className="w-12 h-12 rounded-full bg-brand-bubble/30 items-center justify-center border border-brand-bubble/20"
            >
              <User size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </FadeInView>

        {/* Stats Row */}
        <FadeInView delay={200}>
          <View className="px-6 py-4 flex-row gap-x-3">
            <Card className="flex-1 p-4 border-none bg-brand-hero">
              <View className="w-8 h-8 rounded-lg bg-white items-center justify-center mb-2">
                <Clock size={18} color={COLORS.primary} />
              </View>
              <Typography variant="heading-md" className="text-text-dark">{activeOrders.length}</Typography>
              <Typography variant="caption" className="text-[10px]">Active</Typography>
            </Card>
            <Card className="flex-1 p-4 border-none bg-green-50">
              <View className="w-8 h-8 rounded-lg bg-white items-center justify-center mb-2">
                <CheckCircle size={18} color="#22c55e" />
              </View>
              <Typography variant="heading-md" className="text-text-dark">{completedCount}</Typography>
              <Typography variant="caption" className="text-[10px]">Done</Typography>
            </Card>
            <Card className="flex-1 p-4 border-none bg-orange-50">
              <View className="w-8 h-8 rounded-lg bg-white items-center justify-center mb-2">
                <ShoppingBag size={18} color="#f97316" />
              </View>
              <Typography variant="heading-md" className="text-text-dark">{orders.length}</Typography>
              <Typography variant="caption" className="text-[10px]">Total</Typography>
            </Card>
          </View>
        </FadeInView>

        {/* Main CTA */}
        <FadeInView delay={300}>
          <View className="px-6 py-2">
             <Button 
              onPress={() => router.push('/(tabs)/book')}
              label="Book a Pickup"
              size="lg"
              leftIcon={<Plus size={20} color="white" />}
              className="w-full shadow-brand"
             />
          </View>
        </FadeInView>

        {/* Active Orders Section */}
        {activeOrders.length > 0 && (
          <View className="px-6 pt-6">
            <View className="flex-row items-center justify-between mb-4">
              <Typography variant="heading-sm">Active Orders</Typography>
            </View>
            {activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </View>
        )}

        {/* Recent Orders Section */}
        <View className="px-6 pt-6 pb-10">
          <View className="flex-row items-center justify-between mb-4">
            <Typography variant="heading-sm">Recent Orders</Typography>
            <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
              <Typography variant="body-sm" className="text-brand-blue font-semibold">
                View all →
              </Typography>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 && !isLoading ? (
            <Card variant="default" className="p-10 items-center border-dashed border-2 border-brand-bubble/50 bg-transparent">
              <Typography className="text-4xl mb-4">🧺</Typography>
              <Typography variant="heading-sm" className="text-center">No orders yet</Typography>
              <Typography variant="body-sm" className="text-center text-text-light mt-1 mb-6">
                Place your first order and enjoy fresh laundry!
              </Typography>
              <Button 
                variant="outline" 
                label="Book Now" 
                onPress={() => router.push('/(tabs)/book')} 
              />
            </Card>
          ) : (
            recentOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </View>

        {/* Quick Links */}
        <View className="px-6 pb-20">
          <Typography variant="heading-sm" className="mb-4">Quick Actions</Typography>
          <View className="flex-row flex-wrap gap-3">
             {[
               { label: 'Addresses', icon: MapPin, route: '/addresses', color: COLORS.secondary, bg: 'bg-brand-section' },
               { label: 'Profile', icon: User, route: '/(tabs)/profile', color: '#22c55e', bg: 'bg-green-50' },
             ].map((action, i) => (
               <TouchableOpacity 
                 key={i}
                 onPress={() => router.push(action.route as any)}
                 className={`flex-1 min-w-[45%] p-4 rounded-2xl ${action.bg} flex-row items-center`}
               >
                 <View className="w-10 h-10 rounded-xl bg-white items-center justify-center mr-3">
                    <action.icon size={20} color={action.color} />
                 </View>
                 <Typography variant="heading-sm" className="text-sm flex-1">{action.label}</Typography>
                 <ChevronRight size={16} color={COLORS.textLight} />
               </TouchableOpacity>
             ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
