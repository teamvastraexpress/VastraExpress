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
import {
  MapPin,
  Zap,
  Sofa,
  Shirt,
  Sparkles,
  Flame,
  CheckCircle,
  Package,
  Car,
  Home,
  Search,
  Bell,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react-native';
import { useAddressStore } from '@/store/addressStore';
import { useOrderStore } from '@/store/orderStore';
import { SERVICE_LABELS } from '@/constants';
import type { ServiceType, Address, PickupSlot, FacilityOption } from '@/types';

const SERVICE_ICON_MAP: Record<string, any> = {
  WASH_FOLD: Shirt,
  WASH_IRON: Shirt,
  DRY_CLEAN: Sparkles,
  IRON_ONLY: Flame,
  SOFA_CLEANING: Sofa,
};

// ─── Types ──────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4;

interface StepIndicatorProps {
  currentStep: Step;
}

// ─── Step Indicator ──────────────────────────────────────────────────────────
function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { n: 1, label: 'Address' },
    { n: 2, label: 'Facility' },
    { n: 3, label: 'Schedule' },
    { n: 4, label: 'Service' },
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
                <MapPin size={16} color="#6366f1" />
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

// ─── Step 2: Pick Facility ───────────────────────────────────────────────────
function Step2Facility({
  addressId,
  selectedFacility,
  onSelectFacility,
  selectedDate,
  onSelectDate,
}: {
  addressId: number | null;
  selectedFacility: number | null;
  onSelectFacility: (id: number) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const { facilityOptions, isFacilitiesLoading, facilityError, fetchFacilityOptions } = useOrderStore();

  // Next 7 days
  const days: { label: string; value: string }[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split('T')[0];
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' :
      d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    return { label, value };
  });

  useEffect(() => {
    if (!addressId) return;
    fetchFacilityOptions(addressId, selectedDate);
  }, [addressId, selectedDate]);

  return (
    <View className="flex-1">
      <Text className="text-gray-500 text-sm mb-4">
        Choose a nearby facility and pickup date
      </Text>

      {/* Day selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <View className="flex-row gap-2 pb-1">
          {days.map((d) => (
            <TouchableOpacity
              key={d.value}
              onPress={() => onSelectDate(d.value)}
              className={`px-4 py-2 rounded-xl ${
                selectedDate === d.value ? 'bg-primary-600' : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedDate === d.value ? 'text-white' : 'text-gray-600'
                }`}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {isFacilitiesLoading ? (
        <ActivityIndicator color="#7C3AED" className="py-8" />
      ) : facilityOptions.length === 0 ? (
        <View className="items-center py-10">
          <AlertCircle size={32} color="#9CA3AF" />
          <Text className="text-gray-500 text-sm mt-2">
            {facilityError ?? 'No facilities available for this date'}
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {facilityOptions.map((facility: FacilityOption) => {
            const selected = selectedFacility === facility.facilityId;
            const slotPreview = facility.availableSlots
              .slice(0, 3)
              .map((s) => `${s.startTime}-${s.endTime}`)
              .join(', ');
            const extraSlots = facility.availableSlots.length > 3
              ? ` +${facility.availableSlots.length - 3} more`
              : '';

            return (
              <TouchableOpacity
                key={facility.facilityId}
                onPress={() => onSelectFacility(facility.facilityId)}
                className={`rounded-2xl border p-4 ${
                  selected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-800 font-semibold text-sm">
                    {facility.name}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    {facility.distanceKm} km
                  </Text>
                </View>
                <Text className="text-gray-400 text-xs mt-1">
                  Slots: {slotPreview || 'None'}{extraSlots}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── Step 3: Pick Slot ───────────────────────────────────────────────────────
function Step3Schedule({
  selectedSlot,
  onSelectSlot,
  selectedDate,
  facilityId,
}: {
  selectedSlot: number | null;
  onSelectSlot: (id: number) => void;
  selectedDate: string;
  facilityId: number | null;
}) {
  const { availableSlots, isSlotsLoading, fetchAvailableSlots } = useOrderStore();

  useEffect(() => {
    if (!facilityId) return;
    fetchAvailableSlots(selectedDate, facilityId);
    // Auto-refresh every 30 seconds so cutoff times and capacity update live
    const interval = setInterval(() => fetchAvailableSlots(selectedDate, facilityId), 30_000);
    return () => clearInterval(interval);
  }, [selectedDate, facilityId]);

  return (
    <View className="flex-1">
      <Text className="text-gray-500 text-sm mb-4">
        Choose your preferred pickup time
      </Text>

      {/* Slots */}
      {isSlotsLoading ? (
        <ActivityIndicator color="#7C3AED" className="py-8" />
      ) : availableSlots.length === 0 ? (
        <View className="items-center py-10">
          <AlertCircle size={32} color="#9CA3AF" />
          <Text className="text-gray-500 text-sm mt-2">No slots available for this date</Text>
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

// ─── Step 4: Service & Notes ─────────────────────────────────────────────────
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
  const isSofaCleaning = serviceType === 'SOFA_CLEANING';

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
              {React.createElement(SERVICE_ICON_MAP[svc] || Shirt, { size: 24, color: serviceType === svc ? '#7C3AED' : '#6B7280' })}
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
          <View className="flex-row items-center gap-1.5">
            <Zap size={16} color="#F59E0B" />
            <Text className="text-gray-800 font-semibold">Express Service</Text>
          </View>
          <Text className="text-gray-400 text-xs mt-0.5">
            Priority processing — faster turnaround
          </Text>
        </View>
        <Switch
          value={isExpress}
          onValueChange={onToggleExpress}
          disabled={isSofaCleaning}
          trackColor={{ false: '#E5E7EB', true: '#7C3AED' }}
          thumbColor="#fff"
        />
      </View>

      {isSofaCleaning && (
        <Text className="text-xs text-gray-400">
          Express service is not available for sofa cleaning requests.
        </Text>
      )}

      {/* Sofa Cleaning special request */}
      <TouchableOpacity
        onPress={() => onSelectService(isSofaCleaning ? 'WASH_FOLD' : 'SOFA_CLEANING')}
        className={`flex-row items-start p-4 rounded-2xl border ${
          isSofaCleaning
            ? 'border-violet-500 bg-violet-50'
            : 'border-gray-200 bg-white'
        }`}
      >
        <View className="w-12 h-12 rounded-xl bg-violet-100 items-center justify-center mr-3">
          <Sofa size={24} color={isSofaCleaning ? '#7C3AED' : '#6B7280'} />
        </View>
        <View className="flex-1">
          <Text className={`font-semibold ${
            isSofaCleaning ? 'text-violet-700' : 'text-gray-800'
          }`}>
            Sofa Cleaning
          </Text>
          <Text className="text-gray-400 text-xs mt-0.5">
            On-site crew visit — facility approval required
          </Text>
          {isSofaCleaning && (
            <Text className="text-gray-500 text-xs mt-1">
              We will confirm or decline after checking availability.
            </Text>
          )}
        </View>
        <View
          className={`w-5 h-5 rounded-full border-2 ${
            isSofaCleaning ? 'border-violet-600' : 'border-gray-300'
          } items-center justify-center`}
        >
          {isSofaCleaning && (
            <View className="w-2.5 h-2.5 rounded-full bg-violet-600" />
          )}
        </View>
      </TouchableOpacity>

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

  const [step, setStep] = useState<Step>(1);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [facilityId, setFacilityId] = useState<number | null>(null);
  const [slotId, setSlotId] = useState<number | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [isExpress, setIsExpress] = useState(false);
  const [notes, setNotes] = useState('');
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);
  const [placedOrderService, setPlacedOrderService] = useState<ServiceType | null>(null);
  const [pickupDate, setPickupDate] = useState<string>(
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
  );

  function handleSelectAddress(id: number) {
    setAddressId(id);
    setFacilityId(null);
    setSlotId(null);
  }

  function handleSelectFacility(id: number) {
    setFacilityId(id);
    setSlotId(null);
  }

  function handleSelectDate(date: string) {
    setPickupDate(date);
    setFacilityId(null);
    setSlotId(null);
  }

  function handleSelectService(type: ServiceType) {
    setServiceType(type);
    if (type === 'SOFA_CLEANING') {
      setIsExpress(false);
    }
  }

  function canGoNext() {
    if (step === 1) return addressId !== null;
    if (step === 2) return facilityId !== null;
    if (step === 3) return slotId !== null;
    if (step === 4) return serviceType !== null;
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
      });
      setPlacedOrderId(order.id);
      setPlacedOrderService(serviceType);
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not place order. Please try again.');
    }
  }

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (placedOrderId !== null) {
    const isSofaRequest = placedOrderService === 'SOFA_CLEANING';
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        {/* Circle */}
        <View className="w-28 h-28 rounded-full bg-primary-100 items-center justify-center mb-6">
          {isSofaRequest ? (
            <Sofa size={56} color="#7C3AED" />
          ) : (
            <CheckCircle size={56} color="#22C55E" />
          )}
        </View>

        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          {isSofaRequest ? 'Request Submitted!' : 'Order Placed!'}
        </Text>
        <Text className="text-gray-500 text-center text-sm mb-1">
          {isSofaRequest
            ? 'We will review your request and notify you once it is approved or declined.'
            : 'Your laundry is on its way to being fresh.'}
        </Text>
        <Text className="text-gray-400 text-center text-xs mb-10">
          Order #{placedOrderId}
        </Text>

        {/* Steps preview */}
        <View className="w-full bg-gray-50 rounded-2xl p-5 mb-8 gap-3">
          {(isSofaRequest
            ? [
                { Icon: Search, text: 'Facility reviews your request' },
                { Icon: CheckCircle, text: 'We confirm or decline availability' },
                { Icon: Bell, text: 'You will receive a notification' },
              ]
            : [
                { Icon: Package, text: 'We\'ll confirm your pickup slot' },
                { Icon: Car, text: 'Driver assigned for pickup' },
                { Icon: Shirt, text: 'Laundry cleaned at facility' },
                { Icon: Home, text: 'Delivered back to your door' },
              ]
          ).map((item, i) => (
            <View key={i} className="flex-row items-center gap-3">
              <item.Icon size={20} color="#6B7280" />
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

  const stepTitles = ['Choose Address', 'Select Facility', 'Schedule Pickup', 'Service Type'];

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
          <Step1Address selected={addressId} onSelect={handleSelectAddress} />
        )}
        {step === 2 && (
          <Step2Facility
            addressId={addressId}
            selectedFacility={facilityId}
            onSelectFacility={handleSelectFacility}
            selectedDate={pickupDate}
            onSelectDate={handleSelectDate}
          />
        )}
        {step === 3 && (
          <Step3Schedule
            selectedSlot={slotId}
            onSelectSlot={setSlotId}
            selectedDate={pickupDate}
            facilityId={facilityId}
          />
        )}
        {step === 4 && (
          <Step3Service
            serviceType={serviceType}
            onSelectService={handleSelectService}
            isExpress={isExpress}
            onToggleExpress={setIsExpress}
            notes={notes}
            onNotesChange={setNotes}
          />
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 pb-6">
        {step < 4 ? (
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
                Place Order
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
