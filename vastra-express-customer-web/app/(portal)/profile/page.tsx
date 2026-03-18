'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { User, Phone, Mail, Shield, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, setUser } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [name,    setName]    = useState(user?.name  ?? '');
  const [email,   setEmail]   = useState(user?.email ?? '');
  const [saving,  setSaving]  = useState(false);

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
    setName(user?.name  ?? '');
    setEmail(user?.email ?? '');
    setEditing(false);
  }

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  // ── shared panel shell ────────────────────────────────────────────────────
  const panel = (children: React.ReactNode) => (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'white',
        border: '1px solid rgba(168,216,240,0.5)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}
    >
      {children}
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-6">

      {/* ── Page header ── */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
        >
          My Profile
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
          Manage your account details
        </p>
      </div>

      {/* ── Avatar card ── */}
      {panel(
        <div className="flex items-center gap-4 p-1">
          {/* Initials avatar */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0"
            style={{
              background: 'linear-gradient(135deg, #1A6FC4 0%, #4EAEE5 100%)',
              boxShadow: '0 4px 16px rgba(26,111,196,0.30)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {initials}
          </div>

          <div>
            <p
              className="text-lg font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
            >
              {user.name}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <Shield className="w-3.5 h-3.5" style={{ color: '#1A6FC4' }} />
              <span
                className="text-xs font-semibold"
                style={{ color: '#1A6FC4', fontFamily: 'var(--font-body)' }}
              >
                Customer
              </span>
              {user.isActive && (
                <>
                  <span style={{ color: '#A8D8F0' }}>·</span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: '#22c55e', fontFamily: 'var(--font-body)' }}
                  >
                    Active
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Personal info ── */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{
          background: 'white',
          border: '1px solid rgba(168,216,240,0.5)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        }}
      >
        <div className="flex items-center justify-between">
          <p
            className="text-sm font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
          >
            Personal Information
          </p>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-medium transition-colors hover:underline"
              style={{ color: '#1A6FC4', fontFamily: 'var(--font-body)' }}
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
          <div className="space-y-4">
            {[
              { Icon: User,  label: 'Full Name',      value: user.name },
              { Icon: Phone, label: 'Mobile Number',  value: `+91 ${user.mobileNumber}` },
              ...(user.email
                ? [{ Icon: Mail, label: 'Email Address', value: user.email }]
                : []),
            ].map(({ Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: '#E8F4FB' }}
                >
                  <Icon className="w-4 h-4" style={{ color: '#1A6FC4' }} />
                </div>
                <div>
                  <p
                    className="text-xs mb-0.5"
                    style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: '#1B2A3B', fontFamily: 'var(--font-heading)' }}
                  >
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Account actions ── */}
      {panel(
        <>
          <p
            className="text-sm font-bold mb-4"
            style={{ fontFamily: 'var(--font-heading)', color: '#1B2A3B' }}
          >
            Account
          </p>
          <button
            onClick={logout}
            className="flex items-center gap-2.5 text-sm font-medium transition-all duration-200 px-3 py-2 rounded-lg hover:bg-red-50 -mx-1"
            style={{ color: '#dc2626', fontFamily: 'var(--font-body)' }}
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </>
      )}
    </div>
  );
}
