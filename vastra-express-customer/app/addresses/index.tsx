import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAddressStore } from '@/store/addressStore';
import EmptyState from '@/components/EmptyState';
import type { Address } from '@/types';

export default function AddressesScreen() {
  const router = useRouter();
  const { addresses, isLoading, fetchAddresses, deleteAddress, setDefault } =
    useAddressStore();

  useEffect(() => {
    fetchAddresses();
  }, []);

  function handleDelete(id: number) {
    Alert.alert('Delete Address', 'Remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteAddress(id),
      },
    ]);
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 pt-14 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-2xl text-gray-600">←</Text>
          </TouchableOpacity>
          <Text className="text-gray-800 text-xl font-bold">My Addresses</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/addresses/add')}
          className="bg-primary-600 rounded-xl px-4 py-2"
        >
          <Text className="text-white text-sm font-semibold">+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={addresses}
        keyExtractor={(a) => String(a.id)}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchAddresses}
            colors={['#7C3AED']}
            tintColor="#7C3AED"
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="📍"
            title="No addresses saved"
            subtitle="Add your first address to place orders"
          />
        }
        renderItem={({ item: addr }: { item: Address }) => (
          <View
            className={`bg-white rounded-2xl border p-4 mb-3 ${
              addr.isDefault ? 'border-primary-200' : 'border-gray-100'
            } shadow-sm`}
          >
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold">
                  {addr.houseFlatNo}, {addr.street}
                </Text>
                {addr.landmark ? (
                  <Text className="text-gray-400 text-xs mt-0.5">
                    Near {addr.landmark}
                  </Text>
                ) : null}
                <Text className="text-gray-400 text-xs mt-0.5">
                  {addr.city?.name ? `${addr.city.name} — ` : ''}{addr.pincode}
                </Text>
              </View>
              {addr.isDefault && (
                <View className="bg-primary-100 px-2 py-0.5 rounded-full">
                  <Text className="text-primary-600 text-xs font-medium">Default</Text>
                </View>
              )}
            </View>

            <View className="flex-row gap-2 pt-3 border-t border-gray-50">
              {!addr.isDefault && (
                <TouchableOpacity
                  onPress={() => setDefault(addr.id)}
                  className="flex-1 bg-primary-50 rounded-xl py-2 items-center"
                >
                  <Text className="text-primary-600 text-xs font-semibold">
                    Set Default
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => handleDelete(addr.id)}
                className="flex-1 bg-red-50 rounded-xl py-2 items-center"
              >
                <Text className="text-red-400 text-xs font-semibold">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}
