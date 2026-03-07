import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '@/store/subscriptionStore';

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return s; }
}

export default function WalletScreen() {
  const router = useRouter();
  const {
    mySubscription,
    walletHistory,
    fetchMySubscription,
    fetchWalletHistory,
    isLoading,
  } = useSubscriptionStore();

  useEffect(() => {
    fetchMySubscription();
    fetchWalletHistory(1);
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => {
            fetchMySubscription();
            fetchWalletHistory(1);
          }}
          colors={['#7C3AED']}
          tintColor="#7C3AED"
        />
      }
    >
      {/* Header */}
      <View className="bg-primary-600 pt-14 pb-10 px-6">
        <Text className="text-white text-xl font-bold">Wallet</Text>

        {mySubscription ? (
          <View className="mt-4 items-center">
            <Text className="text-primary-200 text-sm">Available Balance</Text>
            <Text className="text-white text-5xl font-bold mt-1">
              ₹{mySubscription.walletBalance ?? 0}
            </Text>
            <View className="mt-3 bg-white/20 px-4 py-1.5 rounded-full">
              <Text className="text-white text-sm font-medium">
                {mySubscription.plan?.name ?? 'Subscription'}
              </Text>
            </View>
          </View>
        ) : (
          <View className="mt-4 items-center">
            <Text className="text-primary-200 text-sm">No active subscription</Text>
            <TouchableOpacity
              onPress={() => router.push('/subscription')}
              className="mt-3 bg-white rounded-xl px-6 py-2.5"
            >
              <Text className="text-primary-600 font-bold">Subscribe Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View className="px-4 -mt-4">
        {/* Subscription card */}
        {mySubscription && (
          <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
            <Text className="text-gray-700 font-semibold mb-3">Plan Details</Text>
            <View className="gap-2">
              {[
                ['Plan', mySubscription.plan?.name ?? '—'],
                ['Expires', mySubscription.expiresAt ? formatDate(mySubscription.expiresAt) : '—'],
                ['Auto Renew', mySubscription.autoRenew ? '✅ Yes' : '❌ No'],
                ['Status', mySubscription.status ?? '—'],
              ].map(([k, v]) => (
                <View key={k} className="flex-row justify-between">
                  <Text className="text-gray-400 text-sm">{k}</Text>
                  <Text className="text-gray-700 text-sm font-medium">{v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Transaction history */}
        <Text className="text-gray-700 font-semibold mb-3">
          Transaction History
        </Text>
        {walletHistory.length === 0 ? (
          <View className="bg-white rounded-2xl border border-gray-100 p-10 items-center">
            <Text className="text-3xl mb-2">💸</Text>
            <Text className="text-gray-500 text-sm text-center">
              No transactions yet
            </Text>
          </View>
        ) : (
          <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
            {walletHistory.map((txn, i) => (
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
                    <Text className="text-base">
                      {txn.type === 'CREDIT' ? '↑' : '↓'}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-gray-700 text-sm font-medium">
                      {txn.description ?? (txn.type === 'CREDIT' ? 'Credit' : 'Debit')}
                    </Text>
                    <Text className="text-gray-400 text-xs mt-0.5">
                      {txn.createdAt ? formatDate(txn.createdAt) : '—'}
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
        )}
      </View>
    </ScrollView>
  );
}
