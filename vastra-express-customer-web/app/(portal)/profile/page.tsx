'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { getApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { User, Phone, Mail, Shield, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, setUser } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const res = await api.put('/users/profile', { name: name.trim(), email: email.trim() || undefined });
      setUser(res.data);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setEditing(false);
  }

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account details</p>
      </div>

      {/* Avatar card */}
      <Card className="p-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">{user.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs text-blue-600 font-medium">Customer</span>
            {user.isActive && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-emerald-600 font-medium">Active</span>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Info */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-gray-700">Personal Information</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <Input
              label="Full Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Optional"
            />
            <div className="flex gap-3 pt-1">
              <Button onClick={handleSave} loading={saving}>Save Changes</Button>
              <Button variant="secondary" onClick={cancelEdit}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Full Name</p>
                <p className="font-medium text-gray-900">{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Mobile Number</p>
                <p className="font-medium text-gray-900">+91 {user.mobileNumber}</p>
              </div>
            </div>
            {user.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Email Address</p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Account actions */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Account</h2>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </Card>
    </div>
  );
}
