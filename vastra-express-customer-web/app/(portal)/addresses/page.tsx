'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Address, City } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { getApiError } from '@/lib/utils';
import { MapPin, Plus, Trash2, Star } from 'lucide-react';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Addresses</h1>
          <p className="text-sm text-gray-500 mt-1">{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
        </div>
        {!showForm && (
          <Button onClick={startAdd} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Address
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="p-5 space-y-4 border-2 border-blue-200">
          <h2 className="font-semibold text-gray-900">{editingId ? 'Edit Address' : 'New Address'}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => f('isDefault', e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-sm text-gray-700">Set as default address</span>
          </label>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} loading={saving}>
              {editingId ? 'Update Address' : 'Save Address'}
            </Button>
            <Button variant="secondary" onClick={cancelForm}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Address List */}
      {isLoading ? (
        <Loading />
      ) : addresses.length === 0 ? (
        <Card className="p-10 text-center">
          <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">No addresses saved</p>
          <p className="text-sm text-gray-500 mt-1">Add your home or office address for quick booking</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <Card key={addr.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-medium text-gray-900 text-sm">
                        {addr.houseFlatNo}, {addr.street}
                      </p>
                      {addr.isDefault && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5">
                          <Star className="w-3 h-3" /> Default
                        </span>
                      )}
                    </div>
                    {addr.landmark && <p className="text-xs text-gray-500">{addr.landmark}</p>}
                    <p className="text-xs text-gray-500">{addr.city?.name} — {addr.pincode}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
                      title="Set as default"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(addr)}
                    className="text-xs text-gray-400 hover:text-blue-600 transition-colors font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={deletingId === addr.id}
                    className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
