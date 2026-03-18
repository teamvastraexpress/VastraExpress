'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Address, PickupSlot, ServiceType } from '@/types';
import { Button } from '@/components/ui/Button';
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
  { value: 'WASH_FOLD',  label: 'Wash & Fold',  desc: 'Washed, dried and neatly folded',   emoji: '🧺' },
  { value: 'WASH_IRON',  label: 'Wash & Iron',  desc: 'Washed, dried and crispy ironed',   emoji: '👔' },
  { value: 'DRY_CLEAN',  label: 'Dry Clean',    desc: 'Professional dry cleaning',          emoji: '✨' },
  { value: 'IRON_ONLY',  label: 'Iron Only',    desc: 'Quick ironing service',              emoji: '🔥' },
];

const STEP_LABELS = [
  { step: 1, label: 'Address',  icon: MapPin   },
  { step: 2, label: 'Schedule', icon: Calendar },
  { step: 3, label: 'Service',  icon: Shirt    },
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

  const DATE_TABS = Array.from({ length: 3 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow'
      : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
    return { iso, label };
  });

  const [data, setData] = useState<BookingData>({
    addressId: '', pickupSlotId: '', serviceType: 'WASH_FOLD', isExpress: false, notes: '',
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
  const selectedSlot    = slots.find((s) => s.id === data.pickupSlotId);

  // ─── Shared card wrapper ───────────────────────────────────────────────────
  const stepCard = (children: React.ReactNode) => (
    <div
      className="rounded-2xl p-6 space-y-5"
      style={{
        background: 'white',
        border: '1px solid #A8D8F0',
        boxShadow: '0 4px 20px rgba(26,111,196,0.08)',
      }}
    >
      {children}
    </div>
  );

  const stepHeading = (text: string) => (
    <h2
      className="font-bold text-lg"
      style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
    >
      {text}
    </h2>
  );

  return (
    <div className="max-w-xl mx-auto space-y-6">

      {/* Page header */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
        >
          Book a Pickup
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
          3 simple steps to fresh laundry
        </p>
      </div>

      {/* ── Step indicator ── */}
      <div className="flex items-center">
        {STEP_LABELS.map(({ step, label, icon: Icon }, i) => {
          const done   = currentStep > step;
          const active = currentStep === step;
          return (
            <div key={step} className="flex items-center flex-1">
              {i > 0 && (
                <div
                  className="flex-1 h-0.5 transition-colors duration-300"
                  style={{ background: done || active ? '#1A6FC4' : '#A8D8F0' }}
                />
              )}
              <button
                onClick={() => { if (done) setCurrentStep(step as Step); }}
                disabled={!done && !active}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: active ? '#1A6FC4' : done ? '#E8F4FB' : '#F0F8FF',
                  color:      active ? 'white'   : done ? '#1A6FC4' : '#8FA3B1',
                  cursor:     done   ? 'pointer' : active ? 'default' : 'not-allowed',
                  fontFamily: 'var(--font-ui)',
                  boxShadow:  active ? '0 4px 12px rgba(26,111,196,0.25)' : 'none',
                }}
              >
                {done
                  ? <CheckCircle className="w-3.5 h-3.5" />
                  : <Icon className="w-3.5 h-3.5" />
                }
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{step}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Address ── */}
      {currentStep === 1 && stepCard(
        <>
          {stepHeading('Select Pickup Address')}

          {loadingAddresses ? (
            <Loading />
          ) : addresses.length === 0 ? (
            <div className="text-center py-8">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: '#E8F4FB' }}
              >
                <MapPin className="w-6 h-6" style={{ color: '#4EAEE5' }} />
              </div>
              <p className="font-medium mb-1" style={{ color: '#1B2A3B', fontFamily: 'var(--font-heading)' }}>
                No saved addresses
              </p>
              <p className="text-sm mb-4" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
                Add an address to continue
              </p>
              <Button variant="secondary" onClick={() => router.push('/addresses')}>
                Add an Address
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {addresses.map((addr) => {
                const selected = data.addressId === addr.id;
                return (
                  <button
                    key={addr.id}
                    onClick={() => setData((d) => ({ ...d, addressId: addr.id }))}
                    className="w-full text-left p-4 rounded-xl transition-all duration-200"
                    style={{
                      border: selected ? '2px solid #1A6FC4' : '1.5px solid #A8D8F0',
                      background: selected ? '#E8F4FB' : 'white',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin
                        className="w-4 h-4 mt-0.5 shrink-0"
                        style={{ color: selected ? '#1A6FC4' : '#4EAEE5' }}
                      />
                      <div>
                        {addr.isDefault && (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full mr-2"
                            style={{ background: '#E8F4FB', color: '#1A6FC4', border: '1px solid #A8D8F0' }}
                          >
                            Default
                          </span>
                        )}
                        <p
                          className="text-sm font-semibold"
                          style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
                        >
                          {addr.houseFlatNo}, {addr.street}
                        </p>
                        {addr.landmark && (
                          <p className="text-xs mt-0.5" style={{ color: '#8FA3B1' }}>{addr.landmark}</p>
                        )}
                        <p className="text-xs" style={{ color: '#8FA3B1' }}>
                          {addr.city?.name} — {addr.pincode}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex justify-between items-center pt-1">
            <button
              onClick={() => router.push('/addresses')}
              className="text-sm font-medium transition-colors hover:underline"
              style={{ color: '#1A6FC4', fontFamily: 'var(--font-body)' }}
            >
              + Add new address
            </button>
            <Button onClick={goToStep2} disabled={!data.addressId}>
              Next: Schedule →
            </Button>
          </div>
        </>
      )}

      {/* ── Step 2: Schedule ── */}
      {currentStep === 2 && stepCard(
        <>
          {stepHeading('Select Pickup Slot')}

          {/* Date tabs */}
          <div className="flex gap-2">
            {DATE_TABS.map(({ iso, label }) => {
              const active = selectedDate === iso;
              return (
                <button
                  key={iso}
                  onClick={() => { setSelectedDate(iso); fetchSlotsForDate(iso); }}
                  className="flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    border: active ? '2px solid #1A6FC4' : '1.5px solid #A8D8F0',
                    background: active ? '#1A6FC4' : 'white',
                    color: active ? 'white' : '#4A5A6B',
                    fontFamily: 'var(--font-ui)',
                    boxShadow: active ? '0 4px 12px rgba(26,111,196,0.20)' : 'none',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {loadingSlots ? (
            <Loading />
          ) : slots.length === 0 ? (
            <p
              className="text-sm py-4 text-center"
              style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}
            >
              No slots available for this date. Try another day.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {slots.map((slot) => {
                const full     = slot.currentBookings >= slot.maxCapacity;
                const selected = data.pickupSlotId === slot.id;
                const left     = slot.availableCapacity ?? (slot.maxCapacity - slot.currentBookings);
                return (
                  <button
                    key={slot.id}
                    onClick={() => setData((d) => ({ ...d, pickupSlotId: slot.id }))}
                    disabled={full}
                    className="w-full text-left p-3.5 rounded-xl transition-all duration-200"
                    style={{
                      border: selected ? '2px solid #1A6FC4'
                             : full    ? '1.5px solid #A8D8F0'
                             :           '1.5px solid #A8D8F0',
                      background: selected ? '#E8F4FB' : full ? '#F0F8FF' : 'white',
                      opacity: full ? 0.5 : 1,
                      cursor: full ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
                        >
                          {formatSlot(slot)}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#8FA3B1' }}>
                          {full ? 'Fully booked' : `${left} slot${left !== 1 ? 's' : ''} left`}
                        </p>
                      </div>
                      {selected && <CheckCircle className="w-5 h-5" style={{ color: '#1A6FC4' }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex justify-between pt-1">
            <Button variant="secondary" onClick={() => setCurrentStep(1)}>← Back</Button>
            <Button onClick={goToStep3} disabled={!data.pickupSlotId}>Next: Service →</Button>
          </div>
        </>
      )}

      {/* ── Step 3: Service ── */}
      {currentStep === 3 && stepCard(
        <>
          {stepHeading('Select Service')}

          {/* Service grid */}
          <div className="grid grid-cols-2 gap-3">
            {SERVICE_TYPES.map((s) => {
              const selected = data.serviceType === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setData((d) => ({ ...d, serviceType: s.value }))}
                  className="p-4 rounded-xl text-left transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    border: selected ? '2px solid #1A6FC4' : '1.5px solid #A8D8F0',
                    background: selected ? '#E8F4FB' : 'white',
                    boxShadow: selected ? '0 4px 12px rgba(26,111,196,0.12)' : 'none',
                  }}
                >
                  <div className="text-2xl mb-2">{s.emoji}</div>
                  <p
                    className="text-sm font-bold"
                    style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
                  >
                    {s.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
                    {s.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Express toggle */}
          <button
            onClick={() => setData((d) => ({ ...d, isExpress: !d.isExpress }))}
            className="w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200"
            style={{
              border: data.isExpress ? '2px solid #f97316' : '1.5px solid #A8D8F0',
              background: data.isExpress ? '#FFF7ED' : 'white',
            }}
          >
            <div className="text-left">
              <p
                className="text-sm font-semibold"
                style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
              >
                ⚡ Express Service
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
                Faster turnaround — 1.5× standard rate
              </p>
            </div>
            {/* Toggle pill */}
            <div
              className="w-10 h-5 rounded-full flex items-center px-0.5 transition-colors duration-200 flex-shrink-0"
              style={{ background: data.isExpress ? '#f97316' : '#A8D8F0' }}
            >
              <div
                className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: data.isExpress ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </div>
          </button>

          {/* Notes */}
          <Textarea
            label="Special Instructions (optional)"
            placeholder="e.g. Handle delicates carefully, use fragrance-free detergent…"
            value={data.notes}
            rows={3}
            onChange={(e) => setData((d) => ({ ...d, notes: e.target.value }))}
          />

          {/* Order summary */}
          <div
            className="rounded-xl p-4 space-y-2"
            style={{ background: '#F0F8FF', border: '1px solid #A8D8F0' }}
          >
            <p
              className="font-semibold text-sm mb-1"
              style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
            >
              Order Summary
            </p>
            {[
              { Icon: MapPin,   text: `${selectedAddress?.street}, ${selectedAddress?.city?.name}` },
              { Icon: Calendar, text: selectedSlot ? formatSlot(selectedSlot) : '—' },
              { Icon: Shirt,    text: `${serviceLabel(data.serviceType)}${data.isExpress ? ' · Express ⚡' : ''}` },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-start gap-2">
                <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#1A6FC4' }} />
                <span className="text-xs" style={{ color: '#4A5A6B', fontFamily: 'var(--font-body)' }}>
                  {text}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-1">
            <Button variant="secondary" onClick={() => setCurrentStep(2)}>← Back</Button>
            <Button onClick={handleSubmit} loading={submitting}>
              Confirm Booking 🎉
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
