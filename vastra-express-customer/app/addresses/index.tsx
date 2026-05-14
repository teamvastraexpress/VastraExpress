import React, { useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Plus, Trash2, Check, Star } from 'lucide-react-native';
import { useAddressStore } from '@/store/addressStore';
import { Typography } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants';
import type { Address } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AddressesScreen() {
  const router = useRouter();
  const { addresses, isLoading, fetchAddresses, deleteAddress, setDefault } =
    useAddressStore();

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleDelete = (id: number) => {
    Alert.alert('Delete Address', 'Are you sure you want to remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteAddress(id),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={22} color={COLORS.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Typography variant="heading-md" className="flex-1 ml-2">My Addresses</Typography>
        <TouchableOpacity 
          onPress={() => router.push('/addresses/add')}
          className="w-10 h-10 rounded-xl bg-primary-400 items-center justify-center"
          activeOpacity={0.8}
        >
          <Plus size={20} color="white" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
      <View className="h-[0.5px] bg-border" />

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchAddresses}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center justify-center py-20 px-6">
              <View className="w-20 h-20 bg-primary-50 rounded-full items-center justify-center mb-6">
                <MapPin size={32} color={COLORS.primary} strokeWidth={1.5} />
              </View>
              <Typography variant="heading-md" className="text-center mb-2">No addresses found</Typography>
              <Typography variant="body-md" className="text-center text-text-tertiary px-4">
                Add an address to start booking your laundry pickups!
              </Typography>
              <Button 
                label="Add New Address" 
                className="mt-8 w-full"
                onPress={() => router.push('/addresses/add')}
                leftIcon={<Plus size={18} color="white" />}
                size="lg"
              />
            </View>
          ) : null
        }
        renderItem={({ item: addr }: { item: Address }) => (
          <Card 
            className={cn(
              "p-4 mb-4 border rounded-2xl", 
              addr.isDefault ? "border-primary-400 bg-primary-50" : "border-border bg-white"
            )}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-2">
                   <Typography variant="heading-sm" className="text-sm">
                    {addr.houseFlatNo}, {addr.street}
                  </Typography>
                  {addr.isDefault && (
                    <Badge variant="brand" size="sm" className="ml-2">
                      Default
                    </Badge>
                  )}
                </View>
                
                {addr.landmark ? (
                  <Typography variant="body-sm" className="text-text-tertiary mb-1">
                    Near {addr.landmark}
                  </Typography>
                ) : null}
                <Typography variant="body-sm" className="text-text-tertiary">
                  {addr.city?.name ? `${addr.city.name} — ` : ''}{addr.pincode}
                </Typography>
              </View>
              
              <TouchableOpacity 
                onPress={() => handleDelete(addr.id)}
                className="w-10 h-10 rounded-xl bg-status-error-bg items-center justify-center"
              >
                <Trash2 size={16} color={COLORS.danger} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {!addr.isDefault && (
              <TouchableOpacity 
                onPress={() => setDefault(addr.id)}
                className="mt-4 pt-4 border-t border-border flex-row items-center justify-center"
                activeOpacity={0.6}
              >
                <Check size={16} color={COLORS.primary} strokeWidth={2} />
                <Typography variant="body-sm" className="text-primary-400 font-semibold ml-2">
                  Set as Default Address
                </Typography>
              </TouchableOpacity>
            )}
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
