import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  MapPin, 
  Calendar, 
  Shirt, 
  Building2, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft,
  Info,
  Zap
} from 'lucide-react-native';
import api from '@/lib/api';
import { 
  Address, 
  PickupSlot, 
  FacilityOption, 
  FacilityOptionsResponse 
} from '@/types';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { COLORS } from '@/constants';
import { formatSlot, getApiError } from '@/lib/utils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { step: 1, label: 'Address', icon: MapPin },
  { step: 2, label: 'Facility', icon: Building2 },
  { step: 3, label: 'Schedule', icon: Calendar },
  { step: 4, label: 'Confirm', icon: CheckCircle },
];

export default function BookScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [facilityOptions, setFacilityOptions] = useState<FacilityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [bookingData, setBookingData] = useState({
    addressId: 0,
    facilityId: 0,
    pickupSlotId: 0,
    isExpress: false,
    notes: '',
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/addresses');
      const list = Array.isArray(res.data) ? res.data : res.data.data;
      setAddresses(list || []);
      if (list?.length === 1) {
        setBookingData(prev => ({ ...prev, addressId: list[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilities = async (date: string, addressId: number) => {
    setLoading(true);
    try {
      const res = await api.get<FacilityOptionsResponse>('/facility-allocator/options', {
        params: { addressId, pickupDate: date },
      });
      setFacilityOptions(res.data.options || []);
    } catch (err) {
      Alert.alert('Error', getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (date: string, facilityId: number) => {
    setLoading(true);
    try {
      const res = await api.get<PickupSlot[]>(`/pickup-slots/available?date=${date}&facilityId=${facilityId}`);
      setSlots(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      Alert.alert('Error', getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!bookingData.addressId) return Alert.alert('Error', 'Please select an address');
      setCurrentStep(2);
      fetchFacilities(selectedDate, bookingData.addressId);
    } else if (currentStep === 2) {
      if (!bookingData.facilityId) return Alert.alert('Error', 'Please select a facility');
      setCurrentStep(3);
      fetchSlots(selectedDate, bookingData.facilityId);
    } else if (currentStep === 3) {
      if (!bookingData.pickupSlotId) return Alert.alert('Error', 'Please select a pickup slot');
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as Step);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        addressId: bookingData.addressId,
        pickupSlotId: bookingData.pickupSlotId,
        isExpress: bookingData.isExpress,
        customerNotes: bookingData.notes || undefined,
      });
      Alert.alert('Success', 'Order placed successfully! 🎉', [
        { text: 'OK', onPress: () => router.replace(`/(tabs)/home`) }
      ]);
    } catch (err) {
      Alert.alert('Booking Failed', getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View className="flex-row justify-between px-6 py-4 bg-white border-b border-brand-bubble/20">
      {STEPS.map((s, i) => (
        <View key={s.step} className="flex-row items-center">
          <View className={cn(
            "w-8 h-8 rounded-full items-center justify-center",
            currentStep >= s.step ? "bg-brand-blue" : "bg-brand-bubble/20"
          )}>
            {currentStep > s.step ? (
              <CheckCircle size={16} color="white" />
            ) : (
              <Typography variant="body-sm" className={currentStep === s.step ? "text-white font-bold" : "text-text-light"}>
                {s.step}
              </Typography>
            )}
          </View>
          {i < STEPS.length - 1 && (
            <View className={cn("w-6 h-[2px] mx-1", currentStep > s.step ? "bg-brand-blue" : "bg-brand-bubble/20")} />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-offwhite">
      {renderStepIndicator()}
      
      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Step Content */}
        {currentStep === 1 && (
          <View>
            <Typography variant="heading-lg" className="mb-2">Pickup Address</Typography>
            <Typography variant="body-sm" className="mb-6 text-text-light">Where should we pick up your laundry?</Typography>
            
            {loading ? (
              <ActivityIndicator color={COLORS.primary} className="py-10" />
            ) : addresses.length === 0 ? (
              <Card className="p-8 items-center border-dashed border-2 border-brand-bubble/50">
                 <MapPin size={40} color={COLORS.textLight} />
                 <Typography variant="heading-sm" className="mt-4">No addresses saved</Typography>
                 <Button 
                   variant="outline" 
                   label="Add Address" 
                   className="mt-4" 
                   onPress={() => router.push('/addresses')} 
                 />
              </Card>
            ) : (
              addresses.map(addr => (
                <TouchableOpacity 
                  key={addr.id} 
                  onPress={() => setBookingData(prev => ({ ...prev, addressId: addr.id }))}
                >
                  <Card 
                    className={cn(
                      "p-4 mb-3 border-2", 
                      bookingData.addressId === addr.id ? "border-brand-blue bg-brand-hero" : "border-transparent"
                    )}
                  >
                    <View className="flex-row">
                      <MapPin size={20} color={bookingData.addressId === addr.id ? COLORS.primary : COLORS.textLight} />
                      <View className="ml-3 flex-1">
                        <Typography variant="heading-sm" className="text-sm">
                          {addr.houseFlatNo}, {addr.street}
                        </Typography>
                        <Typography variant="body-sm" className="text-xs text-text-light">
                          {addr.landmark ? `${addr.landmark}, ` : ''}{addr.city?.name} - {addr.pincode}
                        </Typography>
                      </View>
                      {bookingData.addressId === addr.id && (
                        <CheckCircle size={20} color={COLORS.primary} />
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {currentStep === 2 && (
          <View>
            <Typography variant="heading-lg" className="mb-2">Choose Facility</Typography>
            <Typography variant="body-sm" className="mb-6 text-text-light">Select a nearby laundry facility</Typography>
            
            {loading ? (
              <ActivityIndicator color={COLORS.primary} className="py-10" />
            ) : facilityOptions.length === 0 ? (
              <Typography className="text-center py-10 text-text-light">No facilities available for this location.</Typography>
            ) : (
              facilityOptions.map(fac => (
                <TouchableOpacity 
                  key={fac.facilityId} 
                  onPress={() => setBookingData(prev => ({ ...prev, facilityId: fac.facilityId }))}
                >
                  <Card 
                    className={cn(
                      "p-4 mb-3 border-2", 
                      bookingData.facilityId === fac.facilityId ? "border-brand-blue bg-brand-hero" : "border-transparent"
                    )}
                  >
                    <View className="flex-row items-center">
                      <Building2 size={20} color={bookingData.facilityId === fac.facilityId ? COLORS.primary : COLORS.textLight} />
                      <View className="ml-3 flex-1">
                        <Typography variant="heading-sm" className="text-sm">{fac.name}</Typography>
                        <Typography variant="body-sm" className="text-xs text-text-light">
                          {fac.distanceKm.toFixed(1)} km away · {fac.availableSlots.length} slots available
                        </Typography>
                      </View>
                      {bookingData.facilityId === fac.facilityId && (
                        <CheckCircle size={20} color={COLORS.primary} />
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {currentStep === 3 && (
          <View>
            <Typography variant="heading-lg" className="mb-2">Schedule Pickup</Typography>
            <Typography variant="body-sm" className="mb-6 text-text-light">When should we come by?</Typography>
            
            {loading ? (
              <ActivityIndicator color={COLORS.primary} className="py-10" />
            ) : slots.length === 0 ? (
              <Typography className="text-center py-10 text-text-light">No slots available for this date.</Typography>
            ) : (
              slots.map(slot => {
                const isFull = slot.currentBookings >= slot.maxCapacity;
                const isSelected = bookingData.pickupSlotId === slot.id;
                
                return (
                  <TouchableOpacity 
                    key={slot.id} 
                    disabled={isFull}
                    onPress={() => setBookingData(prev => ({ ...prev, pickupSlotId: slot.id }))}
                  >
                    <Card 
                      className={cn(
                        "p-4 mb-3 border-2", 
                        isSelected ? "border-brand-blue bg-brand-hero" : "border-transparent",
                        isFull && "opacity-50"
                      )}
                    >
                      <View className="flex-row items-center">
                        <Calendar size={20} color={isSelected ? COLORS.primary : COLORS.textLight} />
                        <View className="ml-3 flex-1">
                          <Typography variant="heading-sm" className="text-sm">{slot.startTime} - {slot.endTime}</Typography>
                          <Typography variant="body-sm" className="text-xs text-text-light">
                            {isFull ? 'Fully Booked' : `${slot.maxCapacity - slot.currentBookings} slots remaining`}
                          </Typography>
                        </View>
                        {isSelected && <CheckCircle size={20} color={COLORS.primary} />}
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {currentStep === 4 && (
          <View>
            <Typography variant="heading-lg" className="mb-2">Confirm Booking</Typography>
            <Typography variant="body-sm" className="mb-6 text-text-light">Review your order details</Typography>
            
            <Card className="p-4 mb-6">
               <View className="flex-row items-center mb-4 pb-4 border-b border-brand-bubble/10">
                  <View className="w-10 h-10 rounded-full bg-brand-hero items-center justify-center mr-3">
                    <Zap size={20} color={COLORS.primary} />
                  </View>
                  <View className="flex-1">
                    <Typography variant="heading-sm">Express Service</Typography>
                    <Typography variant="body-sm" className="text-xs text-text-light">1.5x rates for 24h delivery</Typography>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setBookingData(prev => ({ ...prev, isExpress: !prev.isExpress }))}
                    className={cn("w-12 h-6 rounded-full px-1 justify-center", bookingData.isExpress ? "bg-brand-blue" : "bg-gray-300")}
                  >
                    <View className={cn("w-4 h-4 rounded-full bg-white", bookingData.isExpress ? "self-end" : "self-start")} />
                  </TouchableOpacity>
               </View>

               <View className="space-y-4">
                  <View className="flex-row">
                    <MapPin size={16} color={COLORS.textLight} />
                    <View className="ml-2 flex-1">
                      <Typography variant="body-sm" className="font-semibold">Address</Typography>
                      <Typography variant="body-sm" className="text-text-light">
                        {addresses.find(a => a.id === bookingData.addressId)?.houseFlatNo}, {addresses.find(a => a.id === bookingData.addressId)?.street}
                      </Typography>
                    </View>
                  </View>

                  <View className="flex-row">
                    <Calendar size={16} color={COLORS.textLight} />
                    <View className="ml-2 flex-1">
                      <Typography variant="body-sm" className="font-semibold">Pickup Slot</Typography>
                      <Typography variant="body-sm" className="text-text-light">
                        {slots.find(s => s.id === bookingData.pickupSlotId) ? `${slots.find(s => s.id === bookingData.pickupSlotId)?.startTime} - ${slots.find(s => s.id === bookingData.pickupSlotId)?.endTime}` : 'Not selected'}
                      </Typography>
                    </View>
                  </View>

                  <View className="flex-row">
                    <Info size={16} color={COLORS.textLight} />
                    <View className="ml-2 flex-1">
                      <Typography variant="body-sm" className="font-semibold">Special Instructions</Typography>
                      <TextInput 
                        className="bg-offwhite border border-brand-bubble/20 rounded-lg p-3 mt-1 text-text-dark"
                        placeholder="Any notes for the driver?"
                        multiline
                        numberOfLines={3}
                        value={bookingData.notes}
                        onChangeText={(val) => setBookingData(prev => ({ ...prev, notes: val }))}
                      />
                    </View>
                  </View>
               </View>
            </Card>

            <View className="bg-brand-section p-4 rounded-2xl mb-8 flex-row items-start">
               <Info size={16} color={COLORS.primary} className="mt-0.5" />
               <Typography variant="body-sm" className="ml-3 text-brand-blue flex-1">
                 Our team will weigh the clothes at pickup and provide a final estimate.
               </Typography>
            </View>
          </View>
        )}
        
        <View className="h-20" />
      </ScrollView>

      {/* Footer Navigation */}
      <View className="p-6 bg-white border-t border-brand-bubble/20 flex-row gap-x-4">
        {currentStep > 1 && (
          <Button 
            variant="outline" 
            className="flex-1" 
            onPress={handleBack}
            leftIcon={<ChevronLeft size={20} color={COLORS.primary} />}
            label="Back"
          />
        )}
        <Button 
          className="flex-2" 
          style={{ flex: 2 }}
          onPress={currentStep === 4 ? handleSubmit : handleNext}
          isLoading={submitting}
          rightIcon={currentStep < 4 ? <ChevronRight size={20} color="white" /> : undefined}
          label={currentStep === 4 ? "Confirm Booking" : "Continue"}
        />
      </View>
    </SafeAreaView>
  );
}
