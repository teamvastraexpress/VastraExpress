import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import {
  Plus,
  Clock,
  CheckCircle,
  ShoppingBag,
  MapPin,
  User,
  ChevronRight,
  Shirt,
  Package,
  Navigation,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { useAddressStore } from '@/store/addressStore';
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
  const { orders, isLoading: ordersLoading, fetchOrders } = useOrderStore();
  const { addresses, fetchAddresses } = useAddressStore();

  useFocusEffect(
    React.useCallback(() => {
      fetchOrders();
      fetchAddresses();
    }, [])
  );

  const isLoading = ordersLoading;

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
    <View className="flex-1 bg-white">
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
        {/* Header */}
        <FadeInView delay={0}>
          <View className="px-6 pt-14 pb-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Typography variant="display-sm">
                  {getGreeting()},
                </Typography>
                <Typography variant="display-md" className="text-primary-400 -mt-1">
                  {firstName}
                </Typography>

                {/* Default Address */}
                {addresses.find(a => a.isDefault) && (
                  <TouchableOpacity 
                    onPress={() => router.push('/addresses')}
                    activeOpacity={0.7}
                    className="flex-row items-center mt-3 py-1"
                  >
                    <View className="w-8 h-8 rounded-full bg-primary-50 items-center justify-center mr-2">
                      <MapPin size={16} color={COLORS.primary} strokeWidth={2} />
                    </View>
                    <View className="flex-1">
                      <Typography variant="body-md" className="text-text-primary font-medium" numberOfLines={1}>
                        {addresses.find(a => a.isDefault)?.houseFlatNo}, {addresses.find(a => a.isDefault)?.street}
                      </Typography>
                    </View>
                    <ChevronRight size={16} color={COLORS.textTertiary} className="ml-2" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </FadeInView>

        {/* Stats Row */}
        <FadeInView delay={100}>
          <View className="px-6 py-5 flex-row gap-x-3">
            {[
              {
                icon: <Clock size={18} color={COLORS.primary} strokeWidth={1.8} />,
                bg: COLORS.primaryBg,
                value: activeOrders.length,
                label: 'Active',
              },
              {
                icon: <CheckCircle size={18} color={COLORS.success} strokeWidth={1.8} />,
                bg: '#ECFDF5',
                value: completedCount,
                label: 'Done',
              },
              {
                icon: <ShoppingBag size={18} color="#F59E0B" strokeWidth={1.8} />,
                bg: '#FFFBEB',
                value: orders.length,
                label: 'Total',
              },
            ].map(({ icon, bg, value, label }) => (
              <View
                key={label}
                className="flex-1 rounded-2xl p-4"
                style={{ backgroundColor: bg }}
              >
                <View className="flex-row items-center mb-2">
                  {icon}
                </View>
                <Typography variant="display-sm" className="text-text-primary">
                  {value}
                </Typography>
                <Typography variant="body-sm" className="text-text-tertiary mt-0.5">
                  {label}
                </Typography>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* Recent Orders */}
        <FadeInView delay={200}>
          <View className="px-6 pt-2 pb-32">
            <View className="flex-row items-center justify-between mb-4">
              <Typography variant="heading-lg">Recent Orders</Typography>
              <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
                <Typography variant="body-sm" className="text-primary-400 font-semibold">
                  View all
                </Typography>
              </TouchableOpacity>
            </View>

            {recentOrders.length === 0 && !isLoading ? (
              <View className="bg-surface-secondary rounded-2xl p-10 items-center border border-border-light border-dashed">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: COLORS.primaryBg }}
                >
                  <Shirt size={28} color={COLORS.primary} strokeWidth={1.5} />
                </View>
                <Typography variant="heading-sm" className="text-center mb-1">No orders yet</Typography>
                <Typography variant="body-sm" className="text-center text-text-tertiary mb-6">
                  Book your first pickup and enjoy fresh laundry
                </Typography>
                <Button
                  label="Book a Pickup"
                  onPress={() => router.push('/(tabs)/book')}
                  size="md"
                />
              </View>
            ) : (
              recentOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            )}
          </View>
        </FadeInView>
      </ScrollView>

      {/* Floating Book Button */}
      <View className="absolute bottom-6 left-6 right-6">
        <Button
          label="Book a Pickup"
          size="lg"
          onPress={() => router.push('/(tabs)/book')}
          className="shadow-brand"
          leftIcon={<Plus size={20} color="white" strokeWidth={2.5} />}
        />
      </View>
    </View>
  );
}
