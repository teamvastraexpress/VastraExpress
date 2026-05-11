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
              <Typography variant="display-sm" className="text-2xl text-text-dark font-bold">
                {getGreeting()}, {firstName}!
              </Typography>
              <Typography variant="body-sm" className="text-text-light">
                Here's your laundry dashboard
              </Typography>
            </View>
          </View>
        </FadeInView>

        {/* Stats Row */}
        <FadeInView delay={200}>
          <View className="px-6 py-4 flex-row gap-x-3">
            <Card className="flex-1 p-4 border-none bg-brand-section shadow-sm">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-brand-hero items-center justify-center mr-3">
                  <Clock size={20} color={COLORS.primary} />
                </View>
                <View>
                  <Typography variant="heading-md" className="text-text-dark leading-tight">{activeOrders.length}</Typography>
                  <Typography variant="caption" className="text-[10px] lowercase text-text-light">Active</Typography>
                </View>
              </View>
            </Card>
            <Card className="flex-1 p-4 border-none bg-green-50 shadow-sm">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-white items-center justify-center mr-3">
                  <CheckCircle size={20} color={COLORS.success} />
                </View>
                <View>
                  <Typography variant="heading-md" className="text-text-dark leading-tight">{completedCount}</Typography>
                  <Typography variant="caption" className="text-[10px] lowercase text-text-light">Completed</Typography>
                </View>
              </View>
            </Card>
            <Card className="flex-1 p-4 border-none bg-orange-50 shadow-sm">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-white items-center justify-center mr-3">
                  <ShoppingBag size={20} color="#f97316" />
                </View>
                <View>
                  <Typography variant="heading-md" className="text-text-dark leading-tight">{orders.length}</Typography>
                  <Typography variant="caption" className="text-[10px] lowercase text-text-light">Total</Typography>
                </View>
              </View>
            </Card>
          </View>
        </FadeInView>

        {/* Recent Orders Section */}
        <View className="px-6 pt-4">
          <View className="flex-row items-center justify-between mb-4">
            <Typography variant="heading-sm" className="text-text-dark">Recent Orders</Typography>
            <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
              <Typography variant="body-sm" className="text-brand-blue font-semibold">
                View all →
              </Typography>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 && !isLoading ? (
            <Card variant="outline" className="p-10 items-center border-dashed border-2 border-brand-bubble/40 bg-white">
              <Typography className="text-4xl mb-4">🧺</Typography>
              <Typography variant="heading-sm" className="text-center text-text-dark">No orders yet</Typography>
              <Typography variant="body-sm" className="text-center text-text-light mt-1 mb-6 px-4">
                Book your first pickup and enjoy fresh laundry!
              </Typography>
              <Button 
                label="Book a Pickup" 
                onPress={() => router.push('/(tabs)/book')} 
                className="px-8 shadow-brand"
              />
            </Card>
          ) : (
            recentOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View className="px-6 pt-8 pb-20">
          <Typography variant="heading-sm" className="mb-4 text-text-dark">Quick Actions</Typography>
          <View className="flex-row flex-wrap gap-3">
             {[
               { label: 'Book Pickup', icon: '🛺', route: '/(tabs)/book', bg: 'bg-brand-section', textColor: COLORS.primary },
               { label: 'My Orders', icon: '📦', route: '/(tabs)/orders', bg: 'bg-orange-50', textColor: '#f97316' },
               { label: 'Addresses', icon: '📍', route: '/addresses', bg: 'bg-indigo-50', textColor: '#6366f1' },
               { label: 'Profile', icon: '👤', route: '/(tabs)/profile', bg: 'bg-green-50', textColor: COLORS.success },
             ].map((action, i) => (
               <TouchableOpacity 
                 key={i}
                 onPress={() => router.push(action.route as any)}
                 className={`w-[48%] p-4 rounded-2xl ${action.bg} items-center justify-center border border-white/50 shadow-sm`}
               >
                 <View className="w-12 h-12 rounded-2xl bg-white items-center justify-center mb-2 shadow-sm">
                    <Typography className="text-2xl">{action.icon}</Typography>
                 </View>
                 <Typography variant="body-sm" className="font-bold text-center" style={{ color: action.textColor }}>{action.label}</Typography>
               </TouchableOpacity>
             ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
