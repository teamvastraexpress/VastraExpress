'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { getApiError } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Loading';
import { User, Shield, Server, Building2, MapPin, Plus, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Facility, City, FacilityStaffOption } from '@/types';

const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi (NCT)', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const INDIA_STATE_CITIES: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kakinada', 'Kadapa', 'Anantapur'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Bomdila'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon'],
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Purnia'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Ambikapur'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Calangute'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Nadiad', 'Morbi', 'Mehsana'],
  'Haryana': ['Faridabad', 'Gurugram', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Rewari'],
  'Himachal Pradesh': ['Shimla', 'Solan', 'Dharamshala', 'Mandi', 'Kullu', 'Manali', 'Hamirpur', 'Baddi'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Dumka'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Davanagere', 'Ballari', 'Vijayapura', 'Shivamogga', 'Tumakuru', 'Udupi', 'Hassan'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Malappuram', 'Kottayam', 'Kannur', 'Kasaragod'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Ratlam', 'Satna', 'Dewas', 'Rewa', 'Chhindwara'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Thane', 'Navi Mumbai', 'Pimpri-Chinchwad', 'Vasai-Virar'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Ukhrul'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Williamnagar'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Wokha', 'Tuensang'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Firozpur', 'Pathankot', 'Hoshiarpur', 'Sangrur'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar', 'Sri Ganganagar'],
  'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Mahabubnagar', 'Nalgonda', 'Sangareddy'],
  'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailasahar', 'Ambassa'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Meerut', 'Varanasi', 'Prayagraj', 'Bareilly', 'Aligarh', 'Moradabad', 'Noida', 'Mathura', 'Gorakhpur', 'Saharanpur'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Mussoorie'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Baharampur', 'Kharagpur'],
  'Andaman and Nicobar Islands': ['Port Blair', 'Car Nicobar', 'Diglipur'],
  'Chandigarh': ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Silvassa', 'Daman', 'Diu'],
  'Delhi (NCT)': ['New Delhi', 'Dwarka', 'Rohini', 'Pitampura', 'Lajpat Nagar', 'Saket', 'Janakpuri', 'Karol Bagh', 'Connaught Place', 'Preet Vihar', 'Vasant Kunj'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Sopore', 'Baramulla', 'Udhampur'],
  'Ladakh': ['Leh', 'Kargil'],
  'Lakshadweep': ['Kavaratti', 'Agatti', 'Minicoy'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
};

interface ProfileForm { name: string }
interface CityForm { name: string; state: string }
interface FacilityForm { name: string; cityId: string; address: string; contactNumber: string; staffUserIds: string[] }

export default function SettingsPage() {
  // Read both user and token reactively from the store
  const { user, setAuth, token, logout } = useAuthStore();

  // ─── Profile ────────────────────────────────────────────────────────────────
  const [savingProfile, setSavingProfile] = useState(false);
  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({ defaultValues: { name: user?.name ?? '' } });

  const onSaveProfile = async (data: ProfileForm) => {
    setSavingProfile(true);
    try {
      const res = await api.put('/users/profile', { name: data.name });
      if (user && token) {
        setAuth({ ...user, name: res.data?.name ?? data.name }, token);
      }
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSavingProfile(false);
    }
  };

  // ─── Cities ─────────────────────────────────────────────────────────────────
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [cityModal, setCityModal] = useState<{ open: boolean; data?: City }>({ open: false });
  const [stateFilter, setStateFilter] = useState('');
  const {
    register: regCity,
    handleSubmit: handleCity,
    reset: resetCity,
    setValue: setCityValue,
    watch: watchCity,
    formState: { isSubmitting: citySubmitting, errors: cityErrors },
  } = useForm<CityForm>();
  const selectedState = watchCity('state') ?? '';

  const fetchCities = useCallback(async () => {
    setCitiesLoading(true);
    try {
      const res = await api.get('/cities?includeInactive=true');
      setCities(res.data ?? []);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setCitiesLoading(false);
    }
  }, []);

  useEffect(() => { fetchCities(); }, [fetchCities]);

  const openAddCity = () => { resetCity({ name: '', state: '' }); setCityModal({ open: true }); };
  const openEditCity = (c: City) => {
    setCityValue('name', c.name);
    setCityValue('state', c.state);
    setCityModal({ open: true, data: c });
  };

  const onSaveCity = async (data: CityForm) => {
    try {
      if (cityModal.data) {
        await api.put(`/cities/${cityModal.data.id}`, data);
        toast.success('City updated');
      } else {
        await api.post('/cities', data);
        toast.success('City created');
      }
      setCityModal({ open: false });
      fetchCities();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const toggleCity = async (city: City) => {
    try {
      await api.put(`/cities/${city.id}`, { isActive: !city.isActive });
      toast.success(city.isActive ? 'City deactivated' : 'City activated');
      fetchCities();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  // ─── Facilities ──────────────────────────────────────────────────────────────
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [facilityModal, setFacilityModal] = useState<{ open: boolean; data?: Facility }>({ open: false });
  const [facilityStaff, setFacilityStaff] = useState<FacilityStaffOption[]>([]);
  const {
    register: regFacility,
    handleSubmit: handleFacility,
    reset: resetFacility,
    setValue: setFacilityValue,
    watch: watchFacility,
    formState: { isSubmitting: facilitySubmitting, errors: facilityErrors },
  } = useForm<FacilityForm>();

  const selectedStaffIds = watchFacility('staffUserIds') ?? [];

  const fetchFacilities = useCallback(async () => {
    setFacilitiesLoading(true);
    try {
      const [facRes, staffRes] = await Promise.all([
        api.get('/facilities?includeInactive=true'),
        api.get('/facilities/staff'),
      ]);
      setFacilities(facRes.data ?? []);
      setFacilityStaff(staffRes.data ?? []);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setFacilitiesLoading(false);
    }
  }, []);

  useEffect(() => { fetchFacilities(); }, [fetchFacilities]);

  const openAddFacility = () => {
    resetFacility({ name: '', cityId: '', address: '', contactNumber: '', staffUserIds: [] });
    setFacilityModal({ open: true });
  };
  const openEditFacility = (f: Facility) => {
    setFacilityValue('name', f.name);
    setFacilityValue('cityId', String(f.cityId));
    setFacilityValue('address', f.address);
    setFacilityValue('contactNumber', f.contactNumber);
    // Pre-select currently assigned staff
    const assignedIds = (f.staff ?? []).map((s) => String(s.userId));
    setFacilityValue('staffUserIds', assignedIds);
    setFacilityModal({ open: true, data: f });
  };

  const onSaveFacility = async (data: FacilityForm) => {
    const body = {
      name: data.name,
      cityId: Number(data.cityId),
      address: data.address,
      contactNumber: data.contactNumber,
      staffUserIds: (data.staffUserIds ?? []).map(Number),
    };
    try {
      if (facilityModal.data) {
        await api.put(`/facilities/${facilityModal.data.id}`, body);
        toast.success('Facility updated');
      } else {
        await api.post('/facilities', body);
        toast.success('Facility created');
      }
      setFacilityModal({ open: false });
      fetchFacilities();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const toggleFacility = async (f: Facility) => {
    try {
      await api.patch(`/facilities/${f.id}/status`, { isActive: !f.isActive });
      toast.success(f.isActive ? 'Facility deactivated' : 'Facility activated');
      fetchFacilities();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account, facilities, and cities</p>
      </div>

      {/* ── Admin Profile ───────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="font-semibold text-gray-900">Admin Profile</h2>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
            {user?.name?.slice(0, 2).toUpperCase() ?? 'AD'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name ?? 'Admin'}</p>
            <p className="text-sm text-gray-500">{user?.mobileNumber}</p>
            <span className="text-xs text-blue-600 font-medium mt-0.5 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
              {user?.role?.name ?? 'ADMIN'}
            </span>
          </div>
        </div>
        <form onSubmit={handleProfile(onSaveProfile)} className="space-y-4 max-w-sm">
          <Input
            label="Display Name"
            placeholder="Your name"
            error={profileErrors.name?.message}
            {...regProfile('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
          />
          <Input label="Mobile Number" value={user?.mobileNumber ?? ''} disabled readOnly />
          <Button type="submit" loading={savingProfile}>Save Profile</Button>
        </form>
      </Card>

      {/* ── Cities ──────────────────────────────────────────────────────────── */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Cities</h2>
          </div>
          <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openAddCity}>
            Add City
          </Button>
        </div>
        {/* State filter */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
          >
            <option value="">All States</option>
            {INDIA_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        {citiesLoading ? (
          <div className="p-6"><TableSkeleton rows={3} cols={3} /></div>
        ) : cities.filter((c) => !stateFilter || c.state === stateFilter).length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            {stateFilter ? `No cities in ${stateFilter}` : 'No cities yet'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['City', 'State', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cities.filter((c) => !stateFilter || c.state === stateFilter).map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-medium text-gray-800">{c.name}</td>
                    <td className="px-6 py-3 text-gray-500">{c.state}</td>
                    <td className="px-6 py-3">
                      <Badge className={c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditCity(c)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant={c.isActive ? 'danger' : 'outline'} onClick={() => toggleCity(c)}>
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Facilities ──────────────────────────────────────────────────────── */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Facilities</h2>
          </div>
          <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openAddFacility}>
            Add Facility
          </Button>
        </div>
        {facilitiesLoading ? (
          <div className="p-6"><TableSkeleton rows={3} cols={4} /></div>
        ) : facilities.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No facilities yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Facility / Code', 'City', 'Assigned Staff', 'Contact', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {facilities.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-800">{f.name}</p>
                      <p className="text-xs text-indigo-600 font-mono mt-0.5">{f.facilityCode}</p>
                      <p className="text-xs text-gray-400 truncate max-w-xs">{f.address}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{f.city?.name ?? `#${f.cityId}`}</td>
                    <td className="px-6 py-3">
                      {f.staff && f.staff.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {f.staff.map((s) => (
                            <span key={s.userId} className="text-xs text-gray-700">{s.user.name}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-500">{f.contactNumber}</td>
                    <td className="px-6 py-3">
                      <Badge className={f.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                        {f.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditFacility(f)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant={f.isActive ? 'danger' : 'outline'} onClick={() => toggleFacility(f)}>
                          {f.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Security ────────────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <Shield className="w-4 h-4 text-green-600" />
          </div>
          <h2 className="font-semibold text-gray-900">Security</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-800">Authentication</p>
              <p className="text-xs text-gray-500">Mobile OTP-based authentication is active</p>
            </div>
            <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full">Active</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-800">Session</p>
              <p className="text-xs text-gray-500">JWT tokens expire after 7 days</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>Sign Out</Button>
          </div>
        </div>
      </Card>

      {/* ── System Info ─────────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Server className="w-4 h-4 text-gray-600" />
          </div>
          <h2 className="font-semibold text-gray-900">System Info</h2>
        </div>
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          {([
            ['Application', 'Vastra Express Admin'],
            ['Backend URL', process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'],
            ['Version', '1.0.0'],
            ['Stack', 'Next.js + NestJS + Prisma'],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="contents">
              <span className="text-gray-500 font-medium">{label}</span>
              <span className="text-gray-800 font-mono text-xs truncate">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── City Modal ──────────────────────────────────────────────────────── */}
      <Modal
        open={cityModal.open}
        onClose={() => setCityModal({ open: false })}
        title={cityModal.data ? 'Edit City' : 'Add City'}
        size="sm"
      >
        <form onSubmit={handleCity(onSaveCity)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">State <span className="text-red-500">*</span></label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...regCity('state', { required: 'State is required' })}
              onChange={(e) => { regCity('state').onChange(e); setCityValue('name', ''); }}
            >
              <option value="">Select a state…</option>
              {INDIA_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {cityErrors.state && <p className="text-xs text-red-500 mt-1">{cityErrors.state.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">City <span className="text-red-500">*</span></label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              disabled={!selectedState}
              {...regCity('name', { required: 'City is required' })}
            >
              <option value="">{selectedState ? 'Select a city…' : 'Select a state first'}</option>
              {(INDIA_STATE_CITIES[selectedState] ?? []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {cityErrors.name && <p className="text-xs text-red-500 mt-1">{cityErrors.name.message}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setCityModal({ open: false })}>Cancel</Button>
            <Button type="submit" loading={citySubmitting}>{cityModal.data ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* ── Facility Modal ──────────────────────────────────────────────────── */}
      <Modal
        open={facilityModal.open}
        onClose={() => setFacilityModal({ open: false })}
        title={facilityModal.data ? 'Edit Facility' : 'Add Facility'}
      >
        <form onSubmit={handleFacility(onSaveFacility)} className="space-y-4">
          <Input
            label="Facility Name"
            placeholder="Andheri Processing Centre"
            error={facilityErrors.name?.message}
            {...regFacility('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">City <span className="text-red-500">*</span></label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...regFacility('cityId', { required: 'City is required' })}
            >
              <option value="">Select a city…</option>
              {cities.filter((c) => c.isActive).map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
            {facilityErrors.cityId && <p className="text-xs text-red-500 mt-1">{facilityErrors.cityId.message}</p>}
          </div>
          <Input
            label="Address"
            placeholder="Shop 4, Industrial Estate, Andheri West"
            error={facilityErrors.address?.message}
            {...regFacility('address', { required: 'Address is required', minLength: { value: 5, message: 'At least 5 characters' } })}
          />
          <Input
            label="Contact Number"
            placeholder="9876543210"
            type="tel"
            error={facilityErrors.contactNumber?.message}
            {...regFacility('contactNumber', {
              required: 'Contact number is required',
              pattern: { value: /^[6-9]\d{9}$/, message: 'Valid 10-digit Indian mobile number required' },
            })}
          />

          {/* ── Assign Staff (multi-select checkboxes) ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Assign Staff <span className="text-xs text-gray-400 font-normal">(optional)</span>
            </label>
            {facilityStaff.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No facility staff accounts exist yet. Create staff first from Users page.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {facilityStaff.map((s) => {
                  const isChecked = selectedStaffIds.includes(String(s.userId));
                  return (
                    <label key={s.userId} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        value={String(s.userId)}
                        checked={isChecked}
                        onChange={(e) => {
                          const current = (watchFacility('staffUserIds') ?? []) as string[];
                          if (e.target.checked) {
                            setFacilityValue('staffUserIds', [...current, String(s.userId)]);
                          } else {
                            setFacilityValue('staffUserIds', current.filter((id) => id !== String(s.userId)));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{s.mobileNumber}</p>
                        {s.currentFacility && !isChecked && (
                          <p className="text-xs text-amber-600 mt-0.5">Currently at {s.currentFacility.name}</p>
                        )}
                      </div>
                      {s.employeeId && (
                        <span className="text-xs text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded-full">{s.employeeId}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setFacilityModal({ open: false })}>Cancel</Button>
            <Button type="submit" loading={facilitySubmitting}>{facilityModal.data ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
