'use client';

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import toast from 'react-hot-toast';
import { User, Phone, Mail, Briefcase, Building2, BadgeCheck } from 'lucide-react';

export default function ProfilePage() {
  const { user, setAuth, token, isLoading } = useAuthStore();

  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/profile');
      if (token) setAuth(res.data, token);
    } catch {
      toast.error('Could not refresh profile');
    }
  }, [token, setAuth]);

  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  if (!user) return <Loading label="Loading profile..." />;

  const roleName = typeof user.role === 'string' ? user.role : user.role?.name ?? 'Driver';
  const staff = user.staffProfile;

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your account details</p>
      </div>

      {/* Avatar + Name */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
            <span className="text-violet-700 font-bold text-2xl">
              {user.name?.charAt(0)?.toUpperCase() ?? 'D'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.name ?? 'Driver'}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full">
                {roleName}
              </span>
              {user.isActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  <BadgeCheck className="w-3 h-3" />
                  Active
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Contact Info */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Mobile Number</p>
              <p className="text-sm font-medium text-gray-900">{user.mobileNumber}</p>
            </div>
          </div>
          {user.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Staff Info */}
      {staff && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Employment Details</h3>
          <div className="space-y-3">
            {staff.employeeId && (
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Employee ID</p>
                  <p className="text-sm font-medium text-gray-900">{staff.employeeId}</p>
                </div>
              </div>
            )}
            {staff.facility && (
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Assigned Facility</p>
                  <p className="text-sm font-medium text-gray-900">{staff.facility.name}</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <p className="text-xs text-gray-400 text-center">
        To update your profile details, please contact your admin or facility manager.
      </p>
    </div>
  );
}
