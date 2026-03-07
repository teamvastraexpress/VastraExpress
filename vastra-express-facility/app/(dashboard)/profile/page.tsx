'use client';

import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { getApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { User, BadgeCheck, Phone, Mail, Building2, Hash, Calendar } from 'lucide-react';
import type { User as UserType } from '@/types';

export default function ProfilePage() {
  const { user: storeUser } = useAuthStore();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get('/users/profile');
        setProfile(res.data);
      } catch (err) {
        toast.error(getApiError(err));
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) return <Loading fullPage />;

  const staffProfile = profile?.staffProfile;
  const facility = staffProfile?.facility;
  const employeeId = staffProfile?.employeeId ?? null;
  const roleName =
    profile?.role
      ? typeof profile.role === 'string'
        ? profile.role
        : (profile.role as any).name
      : 'FACILITY_STAFF';

  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Your account and facility details</p>
      </div>

      {/* Avatar + Name card */}
      <Card>
        <div className="flex items-center gap-5 p-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-700 font-bold text-2xl">
              {profile?.name?.charAt(0)?.toUpperCase() ?? 'S'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile?.name ?? '—'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <BadgeCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 font-medium">
                {roleName === 'FACILITY_STAFF' ? 'Facility Staff' : roleName}
              </span>
              {profile?.isActive ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
              ) : (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Inactive</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Employee ID card */}
      {employeeId && (
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Employee ID</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Hash className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="font-mono text-2xl font-bold text-indigo-700 tracking-widest">
                {employeeId}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Contact details */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Contact</h3>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
              <Phone className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Mobile</p>
              <p className="text-sm font-medium text-gray-900">{profile?.mobileNumber ?? '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-900">{profile?.email ?? '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Joined</p>
              <p className="text-sm font-medium text-gray-900">{joinedDate}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Facility details */}
      {facility && (
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Assigned Facility</h3>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Facility Name</p>
                <p className="text-sm font-medium text-gray-900">{facility.name}</p>
              </div>
            </div>

            {(facility as any).facilityCode && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Hash className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Facility Code</p>
                  <p className="font-mono text-sm font-bold text-indigo-600">{(facility as any).facilityCode}</p>
                </div>
              </div>
            )}

            {(facility as any).city && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-xs">📍</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400">City</p>
                  <p className="text-sm font-medium text-gray-900">{(facility as any).city?.name ?? '—'}</p>
                </div>
              </div>
            )}

            {(facility as any).address && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-500 text-xs">🏭</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Address</p>
                  <p className="text-sm font-medium text-gray-900">{(facility as any).address}</p>
                </div>
              </div>
            )}

            {(facility as any).contactNumber && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Facility Contact</p>
                  <p className="text-sm font-medium text-gray-900">{(facility as any).contactNumber}</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
