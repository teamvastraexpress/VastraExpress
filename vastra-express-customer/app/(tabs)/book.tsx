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
import { useOrderStore } from '@/store/orderStore';
import { 
  Address, 
  PickupSlot, 
  FacilityOption, 
  FacilityOptionsResponse 
} from '@/types';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { COLORS, SERVICE_LABELS } from '@/constants';
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
    serviceType: 'WASH_FOLD' as any,
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

  const { createOrder } = useOrderStore();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const newOrder = await createOrder({
        addressId: bookingData.addressId,
        pickupSlotId: bookingData.pickupSlotId,
        serviceType: bookingData.serviceType,
        isExpress: bookingData.isExpress,
        customerNotes: bookingData.notes || undefined,
      });
      Alert.alert('Success', 'Order placed successfully!', [
        { text: 'OK', onPress: () => router.replace(`/order/${newOrder.id}`) }
      ]);
    } catch (err) {
      Alert.alert('Booking Failed', getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View className="flex-row justify-between px-6 py-4 bg-white">
      {STEPS.map((s, i) => (
        <View key={s.step} className="flex-row items-center">
          <View className={cn(
            "w-8 h-8 rounded-full items-center justify-center",
            currentStep >= s.step ? "bg-primary-400" : "bg-gray-100"
          )}>
            {currentStep > s.step ? (
              <CheckCircle size={16} color="white" />
            ) : (
              <Typography variant="body-sm" className={currentStep === s.step ? "text-white font-bold" : "text-text-tertiary"}>
                {s.step}
              </Typography>
            )}
          </View>
          {i < STEPS.length - 1 && (
            <View className={cn("w-6 h-[1.5px] mx-1", currentStep > s.step ? "bg-primary-400" : "bg-gray-100")} />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-2">
        <Typography variant="display-sm">Book Pickup</Typography>
        <Typography variant="body-md" className="text-text-tertiary mt-1">
          Step {currentStep} of 4
        </Typography>
      </View>
      {renderStepIndicator()}
      <View className="h-[0.5px] bg-border" />
      
      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Step Content */}
        {currentStep === 1 && (
          <View>
            
            {loading ? (
              <ActivityIndicator color={COLORS.primary} className="py-10" />
            ) : addresses.length === 0 ? (
              <View className="p-8 items-center rounded-2xl border border-dashed border-neutral-300">
                 <MapPin size={32} color={COLORS.neutral400} strokeWidth={1.5} />
                 <Typography variant="heading-sm" className="mt-4">No addresses saved</Typography>
                 <Button 
                   variant="outline" 
                   label="Add Address" 
                   className="mt-4" 
                   onPress={() => router.push('/addresses')} 
                 />
              </View>
            ) : (
              addresses.map(addr => (
                <TouchableOpacity 
                  key={addr.id} 
                  onPress={() => setBookingData(prev => ({ ...prev, addressId: addr.id }))}
                >
                  <Card 
                    className={cn(
                      "p-4 mb-3 border rounded-2xl", 
                      bookingData.addressId === addr.id ? "border-primary-400 bg-primary-50" : "border-border bg-white"
                    )}
                  >
                    <View className="flex-row">
                      <MapPin size={18} color={bookingData.addressId === addr.id ? COLORS.primary : COLORS.textTertiary} strokeWidth={1.8} />
                      <View className="ml-3 flex-1">
                        <Typography variant="heading-sm" className="text-sm">
                          {addr.houseFlatNo}, {addr.street}
                        </Typography>
                        <Typography variant="body-sm" className="text-xs text-text-tertiary">
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
            {loading ? (
              <ActivityIndicator color={COLORS.primary} className="py-10" />
            ) : facilityOptions.length === 0 ? (
              <Typography className="text-center py-10 text-text-tertiary">No facilities available for this location.</Typography>
            ) : (
              facilityOptions.map(fac => (
                <TouchableOpacity 
                  key={fac.facilityId} 
                  onPress={() => setBookingData(prev => ({ ...prev, facilityId: fac.facilityId }))}
                >
                  <Card 
                    className={cn(
                      "p-4 mb-3 border rounded-2xl", 
                      bookingData.facilityId === fac.facilityId ? "border-primary-400 bg-primary-50" : "border-border bg-white"
                    )}
                  >
                    <View className="flex-row items-center">
                      <Building2 size={18} color={bookingData.facilityId === fac.facilityId ? COLORS.primary : COLORS.textTertiary} strokeWidth={1.8} />
                      <View className="ml-3 flex-1">
                        <Typography variant="heading-sm" className="text-sm">{fac.name}</Typography>
                        <Typography variant="body-sm" className="text-xs text-text-tertiary">
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
            {loading ? (
              <ActivityIndicator color={COLORS.primary} className="py-10" />
            ) : slots.length === 0 ? (
              <Typography className="text-center py-10 text-text-tertiary">No slots available for this date.</Typography>
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
                        "p-4 mb-3 border rounded-2xl", 
                        isSelected ? "border-primary-400 bg-primary-50" : "border-border bg-white",
                        isFull && "opacity-50"
                      )}
                    >
                      <View className="flex-row items-center">
                        <Calendar size={18} color={isSelected ? COLORS.primary : COLORS.textTertiary} strokeWidth={1.8} />
                        <View className="ml-3 flex-1">
                          <Typography variant="heading-sm" className="text-sm">{slot.startTime} - {slot.endTime}</Typography>
                          <Typography variant="body-sm" className="text-xs text-text-tertiary">
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
            <Typography variant="body-sm" className="mb-6 text-text-tertiary">Review your order details</Typography>
            
            <Card className="p-4 mb-6">
               <View className="flex-row items-center mb-4 pb-4 border-b border-border">
                 <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: '#FFFBEB' }}>
                    <Zap size={18} color="#F59E0B" strokeWidth={1.8} />
                  </View>
                  <View className="flex-1">
                    <Typography variant="heading-sm">Express Service</Typography>
                    <Typography variant="body-sm" className="text-xs text-text-tertiary">1.5x rates for 24h delivery</Typography>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setBookingData(prev => ({ ...prev, isExpress: !prev.isExpress }))}
                    className={cn("w-12 h-7 rounded-full px-0.5 justify-center", bookingData.isExpress ? "bg-primary-400" : "bg-gray-200")}
                  >
                    <View className={cn("w-5 h-5 rounded-full bg-white shadow-sm", bookingData.isExpress ? "self-end" : "self-start")} />
                  </TouchableOpacity>
               </View>

               <View className="mb-6">
                  <Typography variant="body-sm" className="mb-3 font-semibold text-text-primary">Service Type</Typography>
                  <View className="flex-row flex-wrap gap-2">
                    {Object.entries(SERVICE_LABELS).map(([key, label]) => (
                      <TouchableOpacity
                        key={key}
                        onPress={() => setBookingData(prev => ({ ...prev, serviceType: key as any }))}
                        className={cn(
                          "px-4 py-2.5 rounded-xl border",
                          bookingData.serviceType === key ? "bg-primary-400 border-primary-400" : "bg-white border-border"
                        )}
                      >
                        <Typography 
                          variant="body-sm" 
                          className={cn("font-semibold", bookingData.serviceType === key ? "text-white" : "text-text-primary")}
                        >
                          {label}
                        </Typography>
                      </TouchableOpacity>
                    ))}
                  </View>
               </View>

               <View className="gap-y-4">
                  <View className="flex-row">
                    <MapPin size={16} color={COLORS.textTertiary} strokeWidth={1.8} />
                    <View className="ml-3 flex-1">
                      <Typography variant="body-sm" className="font-medium text-text-primary">Address</Typography>
                      <Typography variant="body-sm" className="text-text-tertiary">
                        {addresses.find(a => a.id === bookingData.addressId)?.houseFlatNo}, {addresses.find(a => a.id === bookingData.addressId)?.street}
                      </Typography>
                    </View>
                  </View>

                  <View className="flex-row">
                    <Calendar size={16} color={COLORS.textTertiary} strokeWidth={1.8} />
                    <View className="ml-3 flex-1">
                      <Typography variant="body-sm" className="font-medium text-text-primary">Pickup Slot</Typography>
                      <Typography variant="body-sm" className="text-text-tertiary">
                        {slots.find(s => s.id === bookingData.pickupSlotId) ? `${slots.find(s => s.id === bookingData.pickupSlotId)?.startTime} - ${slots.find(s => s.id === bookingData.pickupSlotId)?.endTime}` : 'Not selected'}
                      </Typography>
                    </View>
                  </View>

                  <View className="flex-row">
                    <Info size={16} color={COLORS.textTertiary} strokeWidth={1.8} />
                    <View className="ml-3 flex-1">
                      <Typography variant="body-sm" className="font-medium text-text-primary">Notes</Typography>
                      <TextInput 
                        className="border border-border rounded-xl p-3 mt-1 text-text-primary text-sm bg-surface-secondary"
                        placeholder="Any notes for the driver?"
                        placeholderTextColor={COLORS.textTertiary}
                        multiline
                        numberOfLines={3}
                        value={bookingData.notes}
                        onChangeText={(val) => setBookingData(prev => ({ ...prev, notes: val }))}
                      />
                    </View>
                  </View>
               </View>
            </Card>

            <View className="rounded-xl p-4 mb-8 flex-row items-start" style={{ backgroundColor: COLORS.primaryBg }}>
               <Info size={16} color={COLORS.primary} strokeWidth={1.8} />
               <Typography variant="body-sm" className="ml-3 text-primary-600 flex-1">
                 Our team will weigh the clothes at pickup and provide a final estimate.
               </Typography>
            </View>
          </View>
        )}
        
        <View className="h-20" />
      </ScrollView>

      {/* Footer Navigation */}
      <View className="px-6 py-4 bg-white border-t border-border flex-row gap-x-3">
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
