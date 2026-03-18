'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Address, City } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { getApiError } from '@/lib/utils';
import { MapPin, Plus, Trash2, Star, PencilLine } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddressForm {
  houseFlatNo: string;
  street: string;
  landmark: string;
  pincode: string;
  cityId: string;
  isDefault: boolean;
}

const empty: AddressForm = {
  houseFlatNo: '', street: '', landmark: '', pincode: '', cityId: '', isDefault: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(empty);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadData() {
    try {
      const [addrRes, cityRes] = await Promise.all([
        api.get<Address[] | { data: Address[] }>('/addresses'),
        api.get<City[]>('/addresses/cities'),
      ]);
      const addrs = Array.isArray(addrRes.data) ? addrRes.data : (addrRes.data as { data: Address[] }).data ?? [];
      const cityList = Array.isArray(cityRes.data) ? cityRes.data : [];
      setAddresses(addrs);
      setCities(cityList);
    } catch {
      toast.error('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function startAdd() {
    setEditingId(null);
    setForm(empty);
    setShowForm(true);
  }

  function startEdit(addr: Address) {
    setEditingId(addr.id);
    setForm({
      houseFlatNo: addr.houseFlatNo,
      street: addr.street,
      landmark: addr.landmark ?? '',
      pincode: addr.pincode,
      cityId: addr.cityId,
      isDefault: addr.isDefault,
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(empty);
  }

  async function handleSave() {
    if (!form.houseFlatNo.trim() || !form.street.trim() || !form.pincode.trim() || !form.cityId) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/addresses/${editingId}`, form);
        toast.success('Address updated');
      } else {
        await api.post('/addresses', form);
        toast.success('Address added');
      }
      cancelForm();
      await loadData();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await api.delete(`/addresses/${id}`);
      toast.success('Address removed');
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await api.patch(`/addresses/${id}`, { isDefault: true });
      await loadData();
      toast.success('Default address updated');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  const f = (field: keyof AddressForm, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
          >
            Addresses
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
            {addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}
          </p>
        </div>
        {!showForm && (
          <Button onClick={startAdd} size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Add Address
          </Button>
        )}
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{
            background: 'white',
            border: '2px solid #A8D8F0',
            boxShadow: '0 4px 20px rgba(26,111,196,0.08)',
          }}
        >
          {/* Form header */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: '#E8F4FB' }}
            >
              <MapPin className="w-4 h-4" style={{ color: '#1A6FC4' }} />
            </div>
            <h2
              className="font-bold text-lg"
              style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
            >
              {editingId ? 'Edit Address' : 'New Address'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Flat / House No *"
              placeholder="e.g. B-204"
              value={form.houseFlatNo}
              onChange={(e) => f('houseFlatNo', e.target.value)}
            />
            <Input
              label="Street / Area *"
              placeholder="e.g. MG Road"
              value={form.street}
              onChange={(e) => f('street', e.target.value)}
            />
            <Input
              label="Landmark"
              placeholder="e.g. Near City Mall"
              value={form.landmark}
              onChange={(e) => f('landmark', e.target.value)}
            />
            <Input
              label="Pincode *"
              placeholder="6-digit pincode"
              maxLength={6}
              value={form.pincode}
              onChange={(e) => f('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <Select
              label="City *"
              value={form.cityId}
              onChange={(e) => f('cityId', e.target.value)}
            >
              <option value="">Select city</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>

          {/* Default checkbox */}
          <label
            className="flex items-center gap-2.5 cursor-pointer select-none w-fit"
          >
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => f('isDefault', e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: '#1A6FC4' }}
            />
            <span className="text-sm font-medium" style={{ color: '#4A5A6B', fontFamily: 'var(--font-body)' }}>
              Set as default address
            </span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button onClick={handleSave} loading={saving}>
              {editingId ? 'Update Address' : 'Save Address'}
            </Button>
            <Button variant="secondary" onClick={cancelForm}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Address list */}
      {isLoading ? (
        <Loading />
      ) : addresses.length === 0 ? (
        /* Empty state */
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            background: 'white',
            border: '1px solid #A8D8F0',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#E8F4FB' }}
          >
            <MapPin className="w-7 h-7" style={{ color: '#4EAEE5' }} />
          </div>
          <p
            className="font-semibold mb-1"
            style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
          >
            No addresses saved
          </p>
          <p className="text-sm" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
            Add your home or office address for quick booking
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'white',
                border: addr.isDefault ? '1.5px solid #A8D8F0' : '1px solid rgba(168,216,240,0.4)',
                boxShadow: addr.isDefault
                  ? '0 4px 16px rgba(26,111,196,0.10)'
                  : '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Address info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: addr.isDefault ? '#E8F4FB' : '#F0F8FF' }}
                  >
                    <MapPin
                      className="w-4 h-4"
                      style={{ color: addr.isDefault ? '#1A6FC4' : '#4EAEE5' }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p
                        className="font-semibold text-sm"
                        style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
                      >
                        {addr.houseFlatNo}, {addr.street}
                      </p>
                      {addr.isDefault && (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{
                            background: '#E8F4FB',
                            color: '#1A6FC4',
                            border: '1px solid #A8D8F0',
                          }}
                        >
                          <Star className="w-3 h-3" />
                          Default
                        </span>
                      )}
                    </div>
                    {addr.landmark && (
                      <p className="text-xs mb-0.5" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
                        {addr.landmark}
                      </p>
                    )}
                    <p className="text-xs" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
                      {addr.city?.name} — {addr.pincode}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-[#E8F4FB]"
                      title="Set as default"
                      style={{ color: '#8FA3B1' }}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(addr)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-[#E8F4FB] hover:text-[#1A6FC4]"
                    title="Edit"
                    style={{ color: '#8FA3B1' }}
                  >
                    <PencilLine className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={deletingId === addr.id}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    title="Delete"
                    style={{ color: '#8FA3B1' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
