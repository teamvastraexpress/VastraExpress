import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import type { SubscriptionPlan } from '@/types';

function formatDate(s?: string) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return s; }
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const {
    plans,
    mySubscription,
    walletHistory,
    isLoading,
    fetchPlans,
    fetchMySubscription,
    fetchWalletHistory,
    purchasePlan,
  } = useSubscriptionStore();

  useEffect(() => {
    fetchPlans();
    fetchMySubscription();
    fetchWalletHistory(1);
  }, []);

  async function handlePurchase(plan: SubscriptionPlan) {
    Alert.alert(
      `Subscribe to ${plan.name}`,
      `₹${plan.price} for ${plan.validityDays} days\nWallet: ₹${plan.walletAmount}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: async () => {
            try {
              const result = await purchasePlan(plan.id);
              // If backend returns razorpay order, handle payment
              // For now, show success (SUBSCRIPTION payment handled via Razorpay in production)
              await fetchMySubscription();
              Alert.alert('Subscribed! 🎉', `You're now on ${plan.name}`);
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Purchase failed');
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => {
            fetchPlans();
            fetchMySubscription();
            fetchWalletHistory(1);
          }}
          colors={['#7C3AED']}
          tintColor="#7C3AED"
        />
      }
    >
      {/* Header */}
      <View className="bg-primary-600 pt-14 pb-8 px-4">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Plans & Wallet</Text>
        </View>

        {mySubscription ? (
          <View className="bg-white/20 rounded-2xl p-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white font-semibold">{mySubscription.plan?.name}</Text>
              <View className="bg-green-400 px-2 py-0.5 rounded-full">
                <Text className="text-white text-xs font-bold">Active</Text>
              </View>
            </View>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-primary-200 text-xs">Wallet Balance</Text>
                <Text className="text-white text-3xl font-bold">
                  ₹{mySubscription.walletBalance ?? 0}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-primary-200 text-xs">Expires</Text>
                <Text className="text-white text-sm font-semibold mt-0.5">
                  {formatDate(mySubscription.expiresAt)}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="bg-white/20 rounded-2xl p-4 items-center">
            <Text className="text-white font-semibold text-lg">No Active Plan</Text>
            <Text className="text-primary-200 text-sm mt-1">
              Subscribe to save on every order
            </Text>
          </View>
        )}
      </View>

      <View className="px-4 -mt-4">
        {/* Plans */}
        <Text className="text-gray-700 font-bold text-base mb-3">Available Plans</Text>
        {isLoading && plans.length === 0 ? (
          <ActivityIndicator color="#7C3AED" className="py-8" />
        ) : plans.length === 0 ? (
          <View className="bg-white rounded-2xl border border-gray-100 p-8 items-center mb-4">
            <Text className="text-gray-400 text-sm">No plans available</Text>
          </View>
        ) : (
          plans.map((plan: SubscriptionPlan) => {
            const isCurrent = mySubscription?.plan?.id === plan.id;
            return (
              <View
                key={plan.id}
                className={`bg-white rounded-2xl border p-4 mb-3 ${
                  isCurrent ? 'border-primary-400' : 'border-gray-100'
                } shadow-sm`}
              >
                {isCurrent && (
                  <View className="bg-primary-100 self-start px-2 py-0.5 rounded-full mb-2">
                    <Text className="text-primary-600 text-xs font-bold">
                      ✅ Current Plan
                    </Text>
                  </View>
                )}
                <View className="flex-row items-start justify-between mb-3">
                  <View>
                    <Text className="text-gray-800 font-bold text-base">{plan.name}</Text>
                    {plan.description ? (
                      <Text className="text-gray-400 text-xs mt-0.5">{plan.description}</Text>
                    ) : null}
                  </View>
                  <View className="items-end">
                    <Text className="text-primary-600 text-2xl font-bold">
                      ₹{plan.price}
                    </Text>
                    <Text className="text-gray-400 text-xs">{plan.validityDays} days</Text>
                  </View>
                </View>

                {/* Benefits */}
                <View className="bg-primary-50 rounded-xl p-3 mb-3">
                  <View className="flex-row items-center gap-2 mb-1.5">
                    <Text className="text-sm">💰</Text>
                    <Text className="text-primary-700 text-sm font-medium">
                      ₹{plan.walletAmount} wallet credit
                    </Text>
                  </View>
                  {plan.discountPercent && plan.discountPercent > 0 ? (
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm">🏷️</Text>
                      <Text className="text-primary-700 text-sm font-medium">
                        {plan.discountPercent}% off on all orders
                      </Text>
                    </View>
                  ) : null}
                </View>

                {!isCurrent && (
                  <TouchableOpacity
                    onPress={() => handlePurchase(plan)}
                    className="bg-primary-600 rounded-xl py-3 items-center"
                  >
                    <Text className="text-white font-semibold">Subscribe Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        {/* Transaction history */}
        {walletHistory.length > 0 && (
          <>
            <Text className="text-gray-700 font-bold text-base mb-3 mt-2">
              Wallet History
            </Text>
            <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
              {walletHistory.slice(0, 10).map((txn, i) => (
                <View
                  key={txn.id}
                  className={`px-4 py-3 flex-row items-center justify-between ${
                    i > 0 ? 'border-t border-gray-50' : ''
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`w-9 h-9 rounded-full items-center justify-center ${
                        txn.type === 'CREDIT' ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      <Text>{txn.type === 'CREDIT' ? '↑' : '↓'}</Text>
                    </View>
                    <View>
                      <Text className="text-gray-700 text-sm font-medium">
                        {txn.description ?? (txn.type === 'CREDIT' ? 'Credit' : 'Debit')}
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        {txn.createdAt ? formatDate(txn.createdAt) : ''}
                      </Text>
                    </View>
                  </View>
                  <Text
                    className={`font-bold text-sm ${
                      txn.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {txn.type === 'CREDIT' ? '+' : '-'}₹{txn.amount}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
