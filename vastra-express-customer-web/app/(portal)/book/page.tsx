'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Address, PickupSlot, ServiceType } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select, Textarea } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { formatSlot, getApiError, serviceLabel } from '@/lib/utils';
import toast from 'react-hot-toast';
import { CheckCircle, MapPin, Calendar, Shirt } from 'lucide-react';

type Step = 1 | 2 | 3;

interface BookingData {
  addressId: string;
  pickupSlotId: string;
  serviceType: ServiceType;
  isExpress: boolean;
  notes: string;
}

const SERVICE_TYPES: { value: ServiceType; label: string; desc: string; emoji: string }[] = [
  { value: 'WASH_FOLD', label: 'Wash & Fold', desc: 'Washed, dried and neatly folded', emoji: '🧺' },
  { value: 'WASH_IRON', label: 'Wash & Iron', desc: 'Washed, dried and crispy ironed', emoji: '👔' },
  { value: 'DRY_CLEAN', label: 'Dry Clean', desc: 'Professional dry cleaning', emoji: '✨' },
  { value: 'IRON_ONLY', label: 'Iron Only', desc: 'Quick ironing service', emoji: '🪣' },
];

const STEP_LABELS = [
  { step: 1, label: 'Address', icon: MapPin },
  { step: 2, label: 'Schedule', icon: Calendar },
  { step: 3, label: 'Service', icon: Shirt },
];

export default function BookPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Build the next 3 available dates (today + 2 days) in IST
  const DATE_TABS = Array.from({ length: 3 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
    return { iso, label };
  });

  const [data, setData] = useState<BookingData>({
    addressId: '',
    pickupSlotId: '',
    serviceType: 'WASH_FOLD',
    isExpress: false,
    notes: '',
  });

  useEffect(() => {
    api.get<{ data: Address[] }>('/addresses').then((r) => {
      const list = Array.isArray(r.data) ? r.data : r.data.data;
      setAddresses(list ?? []);
      if (list?.length === 1) setData((d) => ({ ...d, addressId: list[0].id }));
    }).catch(() => {}).finally(() => setLoadingAddresses(false));
  }, []);

  function fetchSlotsForDate(date: string) {
    setLoadingSlots(true);
    setSlots([]);
    setData((d) => ({ ...d, pickupSlotId: '' }));
    api.get<PickupSlot[]>(`/pickup-slots/available?date=${date}`)
      .then((r) => setSlots(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error('Failed to load slots'))
      .finally(() => setLoadingSlots(false));
  }

  function goToStep2() {
    if (!data.addressId) { toast.error('Please select an address'); return; }
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    setSelectedDate(today);
    setCurrentStep(2);
    fetchSlotsForDate(today);
  }

  function goToStep3() {
    if (!data.pickupSlotId) { toast.error('Please select a pickup slot'); return; }
    setCurrentStep(3);
  }

  async function handleSubmit() {
    if (!data.serviceType) { toast.error('Please select a service'); return; }
    setSubmitting(true);
    try {
      const res = await api.post<{ id: string }>('/orders', {
        addressId: data.addressId,
        pickupSlotId: data.pickupSlotId,
        serviceType: data.serviceType,
        isExpress: data.isExpress,
        customerNotes: data.notes || undefined,
      });
      toast.success('Pickup booked successfully! 🎉');
      router.replace(`/orders/${res.data.id}`);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedAddress = addresses.find((a) => a.id === data.addressId);
  const selectedSlot = slots.find((s) => s.id === data.pickupSlotId);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Book a Pickup</h1>
        <p className="text-sm text-gray-500 mt-1">3 simple steps to fresh laundry</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map(({ step, label, icon: Icon }, i) => {
          const done = currentStep > step;
          const active = currentStep === step;
          return (
            <div key={step} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 flex-1 ${i > 0 ? 'justify-center' : ''}`}>
                {i > 0 && <div className={`flex-1 h-0.5 ${done || active ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                <button
                  onClick={() => {
                    if (done) setCurrentStep(step as Step);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    active ? 'bg-blue-600 text-white shadow'
                      : done ? 'bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!done && !active}
                >
                  {done ? <CheckCircle className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{step}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1 — Address */}
      {currentStep === 1 && (
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Select Pickup Address</h2>

          {loadingAddresses ? (
            <Loading />
          ) : addresses.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-3">No saved addresses found.</p>
              <Button variant="secondary" onClick={() => router.push('/addresses')}>
                Add an Address
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {addresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => setData((d) => ({ ...d, addressId: addr.id }))}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    data.addressId === addr.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${data.addressId === addr.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div>
                      {addr.isDefault && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-medium mr-2">
                          Default
                        </span>
                      )}
                      <p className="text-sm font-medium text-gray-900">
                        {addr.houseFlatNo}, {addr.street}
                      </p>
                      {addr.landmark && <p className="text-xs text-gray-500">{addr.landmark}</p>}
                      <p className="text-xs text-gray-500">{addr.city?.name} — {addr.pincode}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => router.push('/addresses')}
              className="text-sm text-blue-600 hover:underline"
            >
              + Add new address
            </button>
            <Button onClick={goToStep2} disabled={!data.addressId}>
              Next: Schedule →
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2 — Schedule */}
      {currentStep === 2 && (
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Select Pickup Slot</h2>

          {/* Date tabs */}
          <div className="flex gap-2">
            {DATE_TABS.map(({ iso, label }) => (
              <button
                key={iso}
                onClick={() => { setSelectedDate(iso); fetchSlotsForDate(iso); }}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                  selectedDate === iso
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loadingSlots ? (
            <Loading />
          ) : slots.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No available slots right now. Please try again later.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setData((d) => ({ ...d, pickupSlotId: slot.id }))}
                  disabled={slot.currentBookings >= slot.maxCapacity}
                  className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${
                    data.pickupSlotId === slot.id
                      ? 'border-blue-600 bg-blue-50'
                      : slot.currentBookings >= slot.maxCapacity
                      ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{formatSlot(slot)}</p>
                      <p className="text-xs text-gray-500">
                        {slot.availableCapacity ?? (slot.maxCapacity - slot.currentBookings)} slot{(slot.availableCapacity ?? (slot.maxCapacity - slot.currentBookings)) !== 1 ? 's' : ''} left
                      </p>
                    </div>
                    {data.pickupSlotId === slot.id && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="secondary" onClick={() => setCurrentStep(1)}>← Back</Button>
            <Button onClick={goToStep3} disabled={!data.pickupSlotId}>
              Next: Service →
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3 — Service */}
      {currentStep === 3 && (
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Select Service</h2>

          <div className="grid grid-cols-2 gap-3">
            {SERVICE_TYPES.map((s) => (
              <button
                key={s.value}
                onClick={() => setData((d) => ({ ...d, serviceType: s.value }))}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  data.serviceType === s.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-2xl mb-1">{s.emoji}</div>
                <p className="text-sm font-semibold text-gray-900">{s.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </button>
            ))}
          </div>

          {/* Express toggle */}
          <div
            onClick={() => setData((d) => ({ ...d, isExpress: !d.isExpress }))}
            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
              data.isExpress ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-gray-900">⚡ Express Service</p>
              <p className="text-xs text-gray-500">Faster turnaround — additional charges apply</p>
            </div>
            <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${data.isExpress ? 'bg-orange-500' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${data.isExpress ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>

          <Textarea
            label="Special Instructions (optional)"
            placeholder="E.g. Handle delicates carefully, use fragrance-free detergent…"
            value={data.notes}
            rows={3}
            onChange={(e) => setData((d) => ({ ...d, notes: e.target.value }))}
          />

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
            <p className="font-semibold text-gray-700 mb-2">Order Summary</p>
            <div className="flex gap-1 text-gray-600">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span className="text-xs">{selectedAddress?.street}, {selectedAddress?.city?.name}</span>
            </div>
            <div className="flex gap-1 text-gray-600">
              <Calendar className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span className="text-xs">{selectedSlot ? formatSlot(selectedSlot) : '—'}</span>
            </div>
            <div className="flex gap-1 text-gray-600">
              <Shirt className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span className="text-xs">{serviceLabel(data.serviceType)}{data.isExpress ? ' (Express)' : ''}</span>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="secondary" onClick={() => setCurrentStep(2)}>← Back</Button>
            <Button onClick={handleSubmit} loading={submitting}>
              Confirm Booking 🎉
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
