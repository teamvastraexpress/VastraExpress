import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAddressStore } from '@/store/addressStore';

export default function AddAddressScreen() {
  const router = useRouter();
  const { cities, citiesLoading, citiesError, fetchCities, addAddress } = useAddressStore();

  const [houseFlatNo, setHouseFlatNo] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [cityId, setCityId] = useState<number | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetchCities();
  }, []);

  const isValid: boolean =
    !!houseFlatNo.trim() && !!street.trim() && /^\d{6}$/.test(pincode) && cityId !== null;

  async function handleSave() {
    if (!isValid || !cityId) return;
    setSaving(true);
    setSaveError(null);
    try {
      await addAddress({
        houseFlatNo: houseFlatNo.trim(),
        street: street.trim(),
        landmark: landmark.trim() || null,
        pincode: pincode.trim(),
        cityId,
        isDefault,
      });
      router.back();
    } catch (e: any) {
      setSaveError(e.message ?? 'Could not save address. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-gray-50"
    >
      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 pt-14 pb-4 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-2xl text-gray-600">←</Text>
        </TouchableOpacity>
        <Text className="text-gray-800 text-xl font-bold">Add Address</Text>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="bg-white rounded-2xl border border-gray-100 p-4 gap-4">
          {/* House/Flat */}
          <View>
            <Text className="text-gray-600 text-sm font-medium mb-1.5">
              House / Flat No. *
            </Text>
            <TextInput
              value={houseFlatNo}
              onChangeText={setHouseFlatNo}
              placeholder="e.g. Flat 4B, Tower A"
              placeholderTextColor="#9CA3AF"
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50 text-sm"
            />
          </View>

          {/* Street */}
          <View>
            <Text className="text-gray-600 text-sm font-medium mb-1.5">
              Street / Area *
            </Text>
            <TextInput
              value={street}
              onChangeText={setStreet}
              placeholder="e.g. MG Road, Koramangala"
              placeholderTextColor="#9CA3AF"
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50 text-sm"
            />
          </View>

          {/* Landmark */}
          <View>
            <Text className="text-gray-600 text-sm font-medium mb-1.5">
              Landmark (optional)
            </Text>
            <TextInput
              value={landmark}
              onChangeText={setLandmark}
              placeholder="e.g. Opposite HDFC Bank"
              placeholderTextColor="#9CA3AF"
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50 text-sm"
            />
          </View>

          {/* Pincode */}
          <View>
            <Text className="text-gray-600 text-sm font-medium mb-1.5">
              Pincode *
            </Text>
            <TextInput
              value={pincode}
              onChangeText={(t) => setPincode(t.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit pincode"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={6}
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50 text-sm"
            />
          </View>

          {/* City */}
          <View>
            <Text className="text-gray-600 text-sm font-medium mb-1.5">City *</Text>
            {cities.length === 0 ? (
              <View className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 items-center">
                <Text className="text-gray-400 text-sm">
                  {citiesLoading
                    ? 'Loading cities...'
                    : citiesError
                    ? `Error: ${citiesError}`
                    : 'No cities available yet. Ask admin to add cities.'}
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {cities.map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    onPress={() => setCityId(city.id)}
                    className={`px-4 py-2 rounded-xl border ${
                      cityId === city.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        cityId === city.id ? 'text-primary-700' : 'text-gray-600'
                      }`}
                    >
                      {city.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Set default */}
          <TouchableOpacity
            onPress={() => setIsDefault((v) => !v)}
            className="flex-row items-center gap-3"
          >
            <View
              className={`w-5 h-5 rounded border-2 items-center justify-center ${
                isDefault ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
              }`}
            >
              {isDefault && <Text className="text-white text-xs font-bold">✓</Text>}
            </View>
            <Text className="text-gray-600 text-sm">Set as default address</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Save button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 pb-6">
        {saveError && (
          <View className="mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl">
            <Text className="text-red-600 text-sm font-medium">{saveError}</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isValid || saving}
          className={`rounded-xl py-4 items-center ${
            isValid && !saving ? 'bg-primary-600' : 'bg-gray-200'
          }`}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className={`font-semibold text-base ${isValid ? 'text-white' : 'text-gray-400'}`}>
              Save Address
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
