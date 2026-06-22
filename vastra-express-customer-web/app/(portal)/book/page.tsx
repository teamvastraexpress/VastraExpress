'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Address, PickupSlot, FacilityOption, FacilityOptionsResponse, ServiceType } from '@/types';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { formatSlot, getApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { CheckCircle, MapPin, Calendar, Shirt, Building2 } from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

interface BookingData {
  addressId: string;
  facilityId: string;
  pickupSlotId: string;
  serviceType: ServiceType;
  isExpress: boolean;
  notes: string;
}

const STEP_LABELS = [
  { step: 1, label: 'Address',  icon: MapPin   },
  { step: 2, label: 'Store',    icon: Building2 },
  { step: 3, label: 'Schedule', icon: Calendar },
  { step: 4, label: 'Service',  icon: Shirt    },
];

export default function BookPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [facilityOptions, setFacilityOptions] = useState<FacilityOption[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [facilityMessage, setFacilityMessage] = useState<string | null>(null);

  const openPricingCalculator = () => {
    if (typeof window === 'undefined') {
      router.push('/pricing?calc=1');
      return;
    }
    window.open('/pricing?calc=1', '_blank', 'noopener,noreferrer');
  };

  const DATE_TABS = Array.from({ length: 3 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow'
      : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
    return { iso, label };
  });

  const [data, setData] = useState<BookingData>({
    addressId: '',
    facilityId: '',
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

  function fetchSlotsForDate(date: string, facilityId: string) {
    setLoadingSlots(true);
    setSlots([]);
    setData((d) => ({ ...d, pickupSlotId: '' }));
    api.get<PickupSlot[]>(`/pickup-slots/available?date=${date}&facilityId=${facilityId}`)
      .then((r) => setSlots(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error('Failed to load slots'))
      .finally(() => setLoadingSlots(false));
  }

  function fetchFacilitiesForDate(date: string, addressId: string) {
    setLoadingFacilities(true);
    setFacilityMessage(null);
    setFacilityOptions([]);
    setData((d) => ({ ...d, facilityId: '', pickupSlotId: '' }));
    api.get<FacilityOptionsResponse>('/facility-allocator/options', {
      params: { addressId, pickupDate: date },
    })
      .then((r) => {
        const options = r.data?.options ?? [];
        setFacilityOptions(options);
        setFacilityMessage(r.data?.serviceable ? null : r.data?.message ?? null);
      })
      .catch((err) => {
        setFacilityMessage(getApiError(err));
      })
      .finally(() => setLoadingFacilities(false));
  }

  function goToStep2() {
    if (!data.addressId) { toast.error('Please select an address'); return; }
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    setSelectedDate(today);
    setCurrentStep(2);
    fetchFacilitiesForDate(today, data.addressId);
  }

  function goToStep3() {
    if (!data.facilityId) { toast.error('Please select a store'); return; }
    setCurrentStep(3);
    fetchSlotsForDate(selectedDate, data.facilityId);
  }

  function goToStep4() {
    if (!data.pickupSlotId) { toast.error('Please select a pickup slot'); return; }
    setCurrentStep(4);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const isSofaCleaning = data.serviceType === 'SOFA_CLEANING';
      const res = await api.post<{ id: string }>('/orders', {
        addressId: data.addressId,
        pickupSlotId: data.pickupSlotId,
        serviceType: data.serviceType,
        isExpress: isSofaCleaning ? false : data.isExpress,
        customerNotes: data.notes || undefined,
      });
      toast.success(
        isSofaCleaning
          ? 'Sofa cleaning request submitted! We will notify you once reviewed.'
          : 'Pickup booked successfully! 🎉',
      );
      router.replace(`/orders/${res.data.id}`);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedAddress = addresses.find((a) => a.id === data.addressId);
  const selectedFacility = facilityOptions.find((f) => String(f.facilityId) === data.facilityId);
  const selectedSlot    = slots.find((s) => s.id === data.pickupSlotId);
  const isSofaCleaning = data.serviceType === 'SOFA_CLEANING';

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
              Next: Store →
            </Button>
          </div>
        </>
      )}

      {/* ── Step 2: Store ── */}
      {currentStep === 2 && stepCard(
        <>
          {stepHeading('Select Store')}

          {/* Date tabs */}
          <div className="flex gap-2">
            {DATE_TABS.map(({ iso, label }) => {
              const active = selectedDate === iso;
              return (
                <button
                  key={iso}
                  onClick={() => {
                    setSelectedDate(iso);
                    if (data.addressId) fetchFacilitiesForDate(iso, data.addressId);
                  }}
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

          {loadingFacilities ? (
            <Loading />
          ) : facilityOptions.length === 0 ? (
            <p
              className="text-sm py-4 text-center"
              style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}
            >
              {facilityMessage ?? 'No stores available for this date.'}
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {facilityOptions.map((facility) => {
                const selected = data.facilityId === String(facility.facilityId);
                const slotPreview = facility.availableSlots
                  .slice(0, 3)
                  .map((s) => `${s.startTime}-${s.endTime}`)
                  .join(', ');
                const extra = facility.availableSlots.length > 3
                  ? ` +${facility.availableSlots.length - 3} more`
                  : '';
                return (
                  <button
                    key={facility.facilityId}
                    onClick={() => setData((d) => ({ ...d, facilityId: String(facility.facilityId) }))}
                    className="w-full text-left p-3.5 rounded-xl transition-all duration-200"
                    style={{
                      border: selected ? '2px solid #1A6FC4' : '1.5px solid #A8D8F0',
                      background: selected ? '#E8F4FB' : 'white',
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
                        >
                          {facility.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#8FA3B1' }}>
                          {facility.distanceKm} km · Slots: {slotPreview || 'None'}{extra}
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
            <Button onClick={goToStep3} disabled={!data.facilityId}>Next: Schedule →</Button>
          </div>
        </>
      )}

      {/* ── Step 3: Schedule ── */}
      {currentStep === 3 && stepCard(
        <>
          {stepHeading('Select Pickup Slot')}

          <p className="text-xs" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
            Date: {selectedDate || '—'}
          </p>

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
            <Button variant="secondary" onClick={() => setCurrentStep(2)}>← Back</Button>
            <Button onClick={goToStep4} disabled={!data.pickupSlotId}>Next: Service →</Button>
          </div>
        </>
      )}

      {/* ── Step 4: Service ── */}
      {currentStep === 4 && stepCard(
        <>
          {stepHeading('Service & Estimate')}

          {/* Express toggle */}
          <button
            onClick={() => {
              if (isSofaCleaning) return;
              setData((d) => ({ ...d, isExpress: !d.isExpress }));
            }}
            disabled={isSofaCleaning}
            className="w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200"
            style={{
              border: data.isExpress ? '2px solid #f97316' : '1.5px solid #A8D8F0',
              background: data.isExpress ? '#FFF7ED' : 'white',
              opacity: isSofaCleaning ? 0.6 : 1,
              cursor: isSofaCleaning ? 'not-allowed' : 'pointer',
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

          {isSofaCleaning && (
            <p className="text-xs" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
              Express service is not available for sofa cleaning requests.
            </p>
          )}

          {/* Sofa Cleaning special request */}
          <button
            onClick={() =>
              setData((d) => ({
                ...d,
                serviceType: d.serviceType === 'SOFA_CLEANING' ? 'WASH_FOLD' : 'SOFA_CLEANING',
                isExpress: d.serviceType === 'SOFA_CLEANING' ? d.isExpress : false,
              }))
            }
            className="w-full flex items-start justify-between gap-4 p-4 rounded-xl transition-all duration-200"
            style={{
              border: isSofaCleaning ? '2px solid #7c3aed' : '1.5px solid #A8D8F0',
              background: isSofaCleaning ? '#F5F3FF' : 'white',
            }}
          >
            <div className="text-left">
              <p
                className="text-sm font-semibold"
                style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
              >
                🛋️ Sofa Cleaning
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
                On-site cleaning crew visit — store approval required
              </p>
              {isSofaCleaning && (
                <div className="mt-2 text-xs" style={{ color: '#6B7280' }}>
                  • Store reviews availability
                  • Confirmation required before scheduling
                  • You will be notified of approval or decline
                </div>
              )}
            </div>
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
              style={{ borderColor: isSofaCleaning ? '#7c3aed' : '#CBD5E1' }}
            >
              {isSofaCleaning && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#7c3aed' }} />}
            </div>
          </button>

          {!data.isExpress && !isSofaCleaning && (
            <button
              onClick={openPricingCalculator}
              className="w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200"
              style={{ border: '1.5px solid #A8D8F0', background: 'white' }}
            >
              <div className="text-left">
                <p
                  className="text-sm font-semibold"
                  style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
                >
                  Calculate your bill
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
                  Get a tentative estimate before placing the order
                </p>
              </div>
              <span className="text-sm font-semibold" style={{ color: '#1A6FC4' }}>View rates →</span>
            </button>
          )}

          {/* Notes */}
          <Textarea
            label="Special Instructions (optional)"
            placeholder="e.g. Handle delicates carefully, use fragrance-free detergent…"
            value={data.notes}
            rows={3}
            variant="light"
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
              { Icon: Building2, text: selectedFacility?.name ?? '—' },
              { Icon: Calendar, text: selectedSlot ? formatSlot(selectedSlot) : '—' },
              {
                Icon: Shirt,
                text: isSofaCleaning
                  ? 'Sofa Cleaning (Special Request)'
                  : data.isExpress
                  ? 'Express Service ⚡'
                  : 'Standard Service',
              },
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
            <Button variant="secondary" onClick={() => setCurrentStep(3)}>← Back</Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {isSofaCleaning ? 'Submit Request' : 'Confirm Booking 🎉'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
