import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAddressStore } from '@/store/addressStore';
import { useOrderStore } from '@/store/orderStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { SERVICE_LABELS, SERVICE_ICONS } from '@/constants';
import type { ServiceType, Address, PickupSlot } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3;

interface StepIndicatorProps {
  currentStep: Step;
}

// ─── Step Indicator ──────────────────────────────────────────────────────────
function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { n: 1, label: 'Address' },
    { n: 2, label: 'Schedule' },
    { n: 3, label: 'Service' },
  ];
  return (
    <View className="flex-row items-center justify-center px-6 py-4">
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <View className="items-center">
            <View
              className={`w-8 h-8 rounded-full items-center justify-center ${
                currentStep >= s.n ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  currentStep >= s.n ? 'text-white' : 'text-gray-400'
                }`}
              >
                {s.n}
              </Text>
            </View>
            <Text
              className={`text-xs mt-1 ${
                currentStep >= s.n ? 'text-primary-600 font-medium' : 'text-gray-400'
              }`}
            >
              {s.label}
            </Text>
          </View>
          {i < steps.length - 1 && (
            <View
              className={`flex-1 h-0.5 mx-2 mb-4 ${
                currentStep > s.n ? 'bg-primary-400' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Step 1: Pick Address ────────────────────────────────────────────────────
function Step1Address({
  selected,
  onSelect,
}: {
  selected: number | null;
  onSelect: (id: number) => void;
}) {
  const router = useRouter();
  const { addresses, isLoading, fetchAddresses } = useAddressStore();

  useEffect(() => {
    fetchAddresses();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator color="#7C3AED" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Text className="text-gray-500 text-sm mb-4">
        Choose where we pick up your laundry
      </Text>
      {addresses.map((addr: Address) => (
        <TouchableOpacity
          key={addr.id}
          onPress={() => onSelect(addr.id)}
          className={`rounded-2xl border p-4 mb-3 ${
            selected === addr.id
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 bg-white'
          }`}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-base">📍</Text>
                <Text className="text-gray-800 font-semibold text-sm flex-1">
                  {addr.houseFlatNo}, {addr.street}
                </Text>
              </View>
              {addr.landmark ? (
                <Text className="text-gray-400 text-xs ml-6">
                  Near {addr.landmark}
                </Text>
              ) : null}
              <Text className="text-gray-400 text-xs ml-6 mt-0.5">
                {addr.city?.name ? `${addr.city.name} – ` : ''}{addr.pincode}
              </Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border-2 ml-3 mt-0.5 items-center justify-center ${
                selected === addr.id ? 'border-primary-600' : 'border-gray-300'
              }`}
            >
              {selected === addr.id && (
                <View className="w-2.5 h-2.5 rounded-full bg-primary-600" />
              )}
            </View>
          </View>
          {addr.isDefault && (
            <View className="ml-6 mt-2">
              <View className="bg-primary-100 self-start px-2 py-0.5 rounded-full">
                <Text className="text-primary-600 text-xs font-medium">Default</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        onPress={() => router.push('/addresses/add')}
        className="border-2 border-dashed border-gray-300 rounded-2xl p-4 items-center"
      >
        <Text className="text-primary-600 font-semibold">+ Add New Address</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step 2: Pick Slot ───────────────────────────────────────────────────────
function Step2Schedule({
  selectedSlot,
  onSelectSlot,
}: {
  selectedSlot: number | null;
  onSelectSlot: (id: number) => void;
}) {
  const { availableSlots, isSlotsLoading, fetchAvailableSlots } = useOrderStore();

  // Next 7 days
  const days: { label: string; value: string }[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split('T')[0];
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' :
      d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    return { label, value };
  });

  const [selectedDay, setSelectedDay] = useState(days[0].value);

  useEffect(() => {
    fetchAvailableSlots(selectedDay);
    // Auto-refresh every 30 seconds so cutoff times and capacity update live
    const interval = setInterval(() => fetchAvailableSlots(selectedDay), 30_000);
    return () => clearInterval(interval);
  }, [selectedDay]);

  return (
    <View className="flex-1">
      <Text className="text-gray-500 text-sm mb-4">
        Choose your preferred pickup date & time
      </Text>

      {/* Day selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <View className="flex-row gap-2 pb-1">
          {days.map((d) => (
            <TouchableOpacity
              key={d.value}
              onPress={() => setSelectedDay(d.value)}
              className={`px-4 py-2 rounded-xl ${
                selectedDay === d.value ? 'bg-primary-600' : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedDay === d.value ? 'text-white' : 'text-gray-600'
                }`}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Slots */}
      {isSlotsLoading ? (
        <ActivityIndicator color="#7C3AED" className="py-8" />
      ) : availableSlots.length === 0 ? (
        <View className="items-center py-10">
          <Text className="text-3xl mb-2">😕</Text>
          <Text className="text-gray-500 text-sm">No slots available for this date</Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-3">
          {availableSlots.map((slot: PickupSlot) => {
            const full = slot.currentBookings >= slot.maxCapacity;
            const sel = selectedSlot === slot.id;
            return (
              <TouchableOpacity
                key={slot.id}
                onPress={() => !full && onSelectSlot(slot.id)}
                disabled={full}
                className={`flex-row items-center gap-2 px-4 py-3 rounded-xl border ${
                  sel
                    ? 'border-primary-500 bg-primary-50'
                    : full
                    ? 'border-gray-100 bg-gray-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <Text className={`text-sm font-semibold ${
                  sel ? 'text-primary-700' : full ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {slot.startTime} – {slot.endTime}
                </Text>
                {full && (
                  <View className="bg-red-100 px-1.5 py-0.5 rounded">
                    <Text className="text-red-500 text-xs">Full</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── Step 3: Service & Notes ─────────────────────────────────────────────────
const SERVICES: ServiceType[] = ['WASH_FOLD', 'DRY_CLEAN', 'IRON_ONLY'];

function Step3Service({
  serviceType,
  onSelectService,
  isExpress,
  onToggleExpress,
  notes,
  onNotesChange,
}: {
  serviceType: ServiceType | null;
  onSelectService: (s: ServiceType) => void;
  isExpress: boolean;
  onToggleExpress: (v: boolean) => void;
  notes: string;
  onNotesChange: (s: string) => void;
}) {
  return (
    <View className="flex-1 gap-4">
      <Text className="text-gray-500 text-sm">
        Select service type and any special instructions
      </Text>

      {/* Service cards */}
      <View className="gap-3">
        {SERVICES.map((svc) => (
          <TouchableOpacity
            key={svc}
            onPress={() => onSelectService(svc)}
            className={`flex-row items-center p-4 rounded-2xl border ${
              serviceType === svc
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <View className="w-12 h-12 rounded-xl bg-primary-100 items-center justify-center mr-3">
              <Text className="text-2xl">{SERVICE_ICONS[svc]}</Text>
            </View>
            <View className="flex-1">
              <Text className={`font-semibold ${
                serviceType === svc ? 'text-primary-700' : 'text-gray-800'
              }`}>
                {SERVICE_LABELS[svc]}
              </Text>
              <Text className="text-gray-400 text-xs mt-0.5">
                {svc === 'WASH_FOLD' && 'Washed, dried & neatly folded'}
                {svc === 'DRY_CLEAN' && 'Professional dry cleaning'}
                {svc === 'IRON_ONLY' && 'Pressed & wrinkle-free'}
              </Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border-2 ${
                serviceType === svc ? 'border-primary-600' : 'border-gray-300'
              } items-center justify-center`}
            >
              {serviceType === svc && (
                <View className="w-2.5 h-2.5 rounded-full bg-primary-600" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Express toggle */}
      <View className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex-row items-center justify-between">
        <View>
          <Text className="text-gray-800 font-semibold">⚡ Express Service</Text>
          <Text className="text-gray-400 text-xs mt-0.5">
            Priority processing — faster turnaround
          </Text>
        </View>
        <Switch
          value={isExpress}
          onValueChange={onToggleExpress}
          trackColor={{ false: '#E5E7EB', true: '#7C3AED' }}
          thumbColor="#fff"
        />
      </View>

      {/* Notes */}
      <View>
        <Text className="text-gray-600 text-sm font-medium mb-2">
          Special Instructions (optional)
        </Text>
        <TextInput
          value={notes}
          onChangeText={onNotesChange}
          placeholder="e.g. Handle delicates with care..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-sm"
          style={{ textAlignVertical: 'top', minHeight: 80 }}
        />
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function NewOrderScreen() {
  const router = useRouter();
  const { createOrder, isLoading } = useOrderStore();
  const { mySubscription } = useSubscriptionStore();

  const [step, setStep] = useState<Step>(1);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [slotId, setSlotId] = useState<number | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [isExpress, setIsExpress] = useState(false);
  const [notes, setNotes] = useState('');
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);

  function canGoNext() {
    if (step === 1) return addressId !== null;
    if (step === 2) return slotId !== null;
    if (step === 3) return serviceType !== null;
    return false;
  }

  async function handleSubmit() {
    if (!addressId || !slotId || !serviceType) return;
    try {
      const order = await createOrder({
        addressId,
        pickupSlotId: slotId,
        serviceType,
        isExpress,
        customerNotes: notes || undefined,
        subscriptionId: mySubscription?.id,
      });
      setPlacedOrderId(order.id);
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not place order. Please try again.');
    }
  }

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (placedOrderId !== null) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        {/* Circle */}
        <View className="w-28 h-28 rounded-full bg-primary-100 items-center justify-center mb-6">
          <Text style={{ fontSize: 56 }}>🎉</Text>
        </View>

        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          Order Placed!
        </Text>
        <Text className="text-gray-500 text-center text-sm mb-1">
          Your laundry is on its way to being fresh.
        </Text>
        <Text className="text-gray-400 text-center text-xs mb-10">
          Order #{placedOrderId}
        </Text>

        {/* Steps preview */}
        <View className="w-full bg-gray-50 rounded-2xl p-5 mb-8 gap-3">
          {[
            { icon: '📦', text: 'We\'ll confirm your pickup slot' },
            { icon: '🚗', text: 'Driver assigned for pickup' },
            { icon: '🧺', text: 'Laundry cleaned at facility' },
            { icon: '🏠', text: 'Delivered back to your door' },
          ].map((item, i) => (
            <View key={i} className="flex-row items-center gap-3">
              <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              <Text className="text-gray-600 text-sm">{item.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => router.replace(`/order/${placedOrderId}`)}
          className="w-full bg-primary-600 rounded-xl py-4 items-center mb-3"
        >
          <Text className="text-white font-semibold text-base">Track My Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/orders')}
          className="w-full bg-gray-100 rounded-xl py-4 items-center"
        >
          <Text className="text-gray-700 font-medium text-base">View All Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stepTitles = ['Choose Address', 'Schedule Pickup', 'Service Type'];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-100 pt-14 pb-2">
        <View className="flex-row items-center px-4 mb-2">
          <TouchableOpacity
            onPress={() => (step > 1 ? setStep((s) => (s - 1) as Step) : router.back())}
            className="mr-3"
          >
            <Text className="text-2xl text-gray-600">←</Text>
          </TouchableOpacity>
          <Text className="text-gray-800 text-lg font-bold flex-1">
            {stepTitles[step - 1]}
          </Text>
        </View>
        <StepIndicator currentStep={step} />
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && (
          <Step1Address selected={addressId} onSelect={setAddressId} />
        )}
        {step === 2 && (
          <Step2Schedule selectedSlot={slotId} onSelectSlot={setSlotId} />
        )}
        {step === 3 && (
          <Step3Service
            serviceType={serviceType}
            onSelectService={setServiceType}
            isExpress={isExpress}
            onToggleExpress={setIsExpress}
            notes={notes}
            onNotesChange={setNotes}
          />
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 pb-6">
        {step < 3 ? (
          <TouchableOpacity
            onPress={() => setStep((s) => (s + 1) as Step)}
            disabled={!canGoNext()}
            className={`rounded-xl py-4 items-center ${
              canGoNext() ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <Text className={`font-semibold text-base ${canGoNext() ? 'text-white' : 'text-gray-400'}`}>
              Continue →
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canGoNext() || isLoading}
            className={`rounded-xl py-4 items-center ${
              canGoNext() && !isLoading ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className={`font-semibold text-base ${canGoNext() ? 'text-white' : 'text-gray-400'}`}>
                Place Order 🎉
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
