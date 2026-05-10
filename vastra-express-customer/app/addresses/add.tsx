import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Check, Info } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useAddressStore } from '@/store/addressStore';
import { Typography } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    fetchCities();
    void requestLocation();
  }, []);

  const isValid: boolean =
    !!houseFlatNo.trim() &&
    !!street.trim() &&
    /^\d{6}$/.test(pincode) &&
    cityId !== null &&
    latitude !== null &&
    longitude !== null;

  const requestLocation = async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission is required to save an address.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);
    } catch (err: any) {
      setLocationError(err?.message ?? 'Unable to fetch GPS location.');
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    if (!isValid || !cityId) return;
    setSaving(true);
    setSaveError(null);
    try {
      await addAddress({
        houseFlatNo: houseFlatNo.trim(),
        street: street.trim(),
        landmark: landmark.trim() || null,
        pincode: pincode.trim(),
        latitude: latitude as number,
        longitude: longitude as number,
        cityId,
        isDefault,
      });
      router.back();
    } catch (e: any) {
      setSaveError(e.message ?? 'Could not save address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType, maxLength }: any) => (
    <View className="mb-4">
      <Typography variant="body-sm" className="mb-1.5 font-semibold text-text-dark">{label}</Typography>
      <View className="bg-white border border-brand-bubble/30 rounded-xl px-4 py-3">
        <TextInput
          className="text-text-dark text-base"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          keyboardType={keyboardType}
          maxLength={maxLength}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-offwhite">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-6 py-4 bg-white border-b border-brand-bubble/10 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Typography variant="heading-sm" className="flex-1 ml-2">Add New Address</Typography>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        >
          <Card className="p-5 mb-6">
            <Typography variant="heading-sm" className="mb-4">Address Details</Typography>
            
            <InputField 
              label="House / Flat No. *" 
              value={houseFlatNo} 
              onChangeText={setHouseFlatNo} 
              placeholder="e.g. Flat 4B, Tower A" 
            />
            
            <InputField 
              label="Street / Area *" 
              value={street} 
              onChangeText={setStreet} 
              placeholder="e.g. MG Road, Koramangala" 
            />
            
            <InputField 
              label="Landmark (optional)" 
              value={landmark} 
              onChangeText={setLandmark} 
              placeholder="e.g. Opposite HDFC Bank" 
            />
            
            <InputField 
              label="Pincode *" 
              value={pincode} 
              onChangeText={(t: string) => setPincode(t.replace(/\D/g, '').slice(0, 6))} 
              placeholder="6-digit pincode" 
              keyboardType="number-pad"
              maxLength={6}
            />

            <View className="mb-4">
              <Typography variant="body-sm" className="mb-2 font-semibold text-text-dark">City *</Typography>
              <View className="flex-row flex-wrap gap-2">
                {cities.map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    onPress={() => setCityId(city.id)}
                    className={cn(
                      "px-4 py-2 rounded-xl border",
                      cityId === city.id ? "bg-brand-blue border-brand-blue" : "bg-white border-brand-bubble/30"
                    )}
                  >
                    <Typography 
                      variant="body-sm" 
                      className={cn("font-bold", cityId === city.id ? "text-white" : "text-text-mid")}
                    >
                      {city.name}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>

          <Card className="p-5 mb-6">
            <View className="flex-row items-center justify-between mb-4">
               <Typography variant="heading-sm">GPS Location</Typography>
               <Button 
                variant="ghost" 
                size="sm" 
                onPress={requestLocation} 
                label={locating ? "Locating..." : "Refresh"}
                leftIcon={!locating ? <MapPin size={14} color={COLORS.primary} /> : <ActivityIndicator size="small" color={COLORS.primary} />}
               />
            </View>
            
            {locationError && (
              <View className="bg-red-50 p-3 rounded-lg mb-4 flex-row items-center">
                 <Info size={16} color={COLORS.danger} />
                 <Typography variant="body-sm" className="text-danger ml-2 flex-1">{locationError}</Typography>
              </View>
            )}

            <View className="flex-row gap-x-4">
               <View className="flex-1 bg-offwhite p-3 rounded-xl border border-brand-bubble/10">
                  <Typography variant="caption" className="mb-1">Latitude</Typography>
                  <Typography variant="body-md" className="font-bold">{latitude?.toFixed(6) || '—'}</Typography>
               </View>
               <View className="flex-1 bg-offwhite p-3 rounded-xl border border-brand-bubble/10">
                  <Typography variant="caption" className="mb-1">Longitude</Typography>
                  <Typography variant="body-md" className="font-bold">{longitude?.toFixed(6) || '—'}</Typography>
               </View>
            </View>
          </Card>

          <TouchableOpacity 
            onPress={() => setIsDefault(!isDefault)}
            className="flex-row items-center p-2 mb-6"
          >
             <View className={cn(
               "w-6 h-6 rounded-md border-2 items-center justify-center mr-3",
               isDefault ? "bg-brand-blue border-brand-blue" : "border-brand-bubble/30"
             )}>
                {isDefault && <Check size={16} color="white" />}
             </View>
             <Typography variant="body-md" className="font-medium">Set as default address</Typography>
          </TouchableOpacity>

          {saveError && (
            <View className="bg-red-50 p-4 rounded-xl mb-6">
               <Typography variant="body-sm" className="text-danger">{saveError}</Typography>
            </View>
          )}
        </ScrollView>

        <View className="p-6 bg-white border-t border-brand-bubble/20">
           <Button 
            label="Save Address" 
            size="lg" 
            isLoading={saving} 
            onPress={handleSave} 
            disabled={!isValid || saving}
            className="w-full"
           />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
