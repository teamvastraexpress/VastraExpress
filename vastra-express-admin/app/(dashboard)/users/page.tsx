'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatDate, getApiError } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Loading';
import { Plus, ChevronLeft, ChevronRight, UserCheck, UserX, Shield } from 'lucide-react';
import type { User } from '@/types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface CreateStaffForm {
  name: string;
  mobileNumber: string;
  role: string;
  email?: string;
}

interface ChangeRoleForm {
  role: string;
}

const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'DRIVER', label: 'Driver' },
  { value: 'FACILITY_STAFF', label: 'Facility Staff' },
  { value: 'ADMIN', label: 'Admin' },
];

const ASSIGNABLE_ROLES = [
  { value: 'DRIVER', label: 'Driver' },
  { value: 'FACILITY_STAFF', label: 'Facility Staff' },
];

function roleBadgeClass(name: string) {
  if (name === 'ADMIN') return 'bg-purple-100 text-purple-700';
  if (name === 'DRIVER') return 'bg-blue-100 text-blue-700';
  if (name === 'FACILITY_STAFF') return 'bg-teal-100 text-teal-700';
  return 'bg-gray-100 text-gray-600';
}

function roleLabel(name: string) {
  return name.replace('_', ' ');
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [roleModal, setRoleModal] = useState<User | null>(null);
  const LIMIT = 20;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateStaffForm>();

  const {
    register: registerRole,
    handleSubmit: handleRoleSubmit,
    reset: resetRole,
    setValue: setRoleValue,
    formState: { isSubmitting: isRoleSubmitting },
  } = useForm<ChangeRoleForm>();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(roleFilter && { role: roleFilter }),
      });
      const res = await api.get(`/users?${params}`);
      const body = res.data;
      setUsers(body.data ?? body);
      setTotal(body.meta?.total ?? body.total ?? body.length ?? 0);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleToggleStatus(user: User) {
    try {
      await api.patch(`/users/${user.id}/status`, { isActive: !user.isActive });
      toast.success(`${user.name} ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleCreate(data: CreateStaffForm) {
    try {
      await api.post('/users', {
        name: data.name,
        mobileNumber: data.mobileNumber,
        role: data.role,
        ...(data.email?.trim() && { email: data.email.trim() }),
      });
      toast.success(`Account created for ${data.name}. They can now log in to set their password.`);
      setAddModal(false);
      reset();
      fetchUsers();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  function openRoleModal(user: User) {
    setRoleModal(user);
    setRoleValue('role', user.role.name);
  }

  async function handleChangeRole(data: ChangeRoleForm) {
    if (!roleModal) return;
    try {
      await api.patch(`/users/${roleModal.id}/role`, { role: data.role });
      toast.success(`Role updated to ${roleLabel(data.role)} for ${roleModal.name}`);
      setRoleModal(null);
      resetRole();
      fetchUsers();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users &amp; Staff</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage customers, drivers, and facility staff. Only admins can create staff accounts.
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setAddModal(true)}>
          Add Staff
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex gap-3 items-center">
          <div className="w-56">
            <Select
              options={ROLE_FILTER_OPTIONS}
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              placeholder=""
            />
          </div>
          <Button variant="outline" onClick={fetchUsers} loading={loading}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            {total} user{total !== 1 ? 's' : ''}
          </h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6"><TableSkeleton rows={8} cols={6} /></div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No users found</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['ID / Staff Code', 'Name', 'Mobile', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* ID: customerId for customers, employeeId for staff */}
                    <td className="px-6 py-3">
                      {user.customerId ? (
                        <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{user.customerId}</span>
                      ) : user.staffProfile?.employeeId ? (
                        <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{user.staffProfile.employeeId}</span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-800">{user.name}</td>
                    <td className="px-6 py-3 text-gray-600 font-mono text-xs">{user.mobileNumber}</td>

                    {/* Role */}
                    <td className="px-6 py-3">
                      <Badge className={roleBadgeClass(user.role.name)}>
                        {roleLabel(user.role.name)}
                      </Badge>
                    </td>

                    {/* Active/Inactive */}
                    <td className="px-6 py-3">
                      <Badge className={user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>

                    <td className="px-6 py-3 text-gray-500">{formatDate(user.createdAt)}</td>

                    {/* Actions */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {/* Change Role — only for DRIVER / FACILITY_STAFF */}
                        {(user.role.name === 'DRIVER' || user.role.name === 'FACILITY_STAFF') && (
                          <button
                            onClick={() => openRoleModal(user)}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                          >
                            <Shield className="w-3.5 h-3.5" /> Change Role
                          </button>
                        )}
                        {/* Activate / Deactivate */}
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`text-xs font-medium flex items-center gap-1 ${
                            user.isActive
                              ? 'text-red-600 hover:text-red-700'
                              : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {user.isActive ? (
                            <><UserX className="w-3.5 h-3.5" /> Deactivate</>
                          ) : (
                            <><UserCheck className="w-3.5 h-3.5" /> Activate</>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Prev
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* â”€â”€ Add Staff Modal â”€â”€ */}
      <Modal
        open={addModal}
        onClose={() => { setAddModal(false); reset(); }}
        title="Add Staff Member"
      >
        <p className="text-sm text-gray-500 mb-4 -mt-1">
          Create a staff account. A unique staff code is automatically assigned
          (<span className="font-mono font-medium text-gray-700">F001, F002…</span> for Facility Staff ·
          <span className="font-mono font-medium text-gray-700"> D001, D002…</span> for Drivers).
          They will set their own password on first login.
        </p>
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Ravi Kumar"
            required
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <Input
            label="Mobile Number"
            placeholder="9876543210"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            required
            error={errors.mobileNumber?.message}
            {...register('mobileNumber', {
              required: 'Mobile number is required',
              pattern: {
                value: /^[6-9]\d{9}$/,
                message: 'Must be a valid 10-digit Indian mobile number',
              },
            })}
          />
          <Select
            label="Role"
            required
            options={ASSIGNABLE_ROLES}
            placeholder="Select role"
            error={errors.role?.message}
            {...register('role', { required: 'Role is required' })}
          />
          <Input
            label="Email (optional)"
            type="email"
            placeholder="staff@example.com"
            error={errors.email?.message}
            {...register('email', {
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
            })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setAddModal(false); reset(); }}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* â”€â”€ Change Role Modal â”€â”€ */}
      <Modal
        open={!!roleModal}
        onClose={() => { setRoleModal(null); resetRole(); }}
        title="Change Role"
      >
        {roleModal && (
          <>
            <div className="mb-5 -mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-800">{roleModal.name}</p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{roleModal.mobileNumber}</p>
              <div className="mt-2">
                <span className="text-xs text-gray-500">Current role: </span>
                <Badge className={roleBadgeClass(roleModal.role.name)}>
                  {roleLabel(roleModal.role.name)}
                </Badge>
              </div>
            </div>
            <form onSubmit={handleRoleSubmit(handleChangeRole)} className="space-y-4">
              <Select
                label="Assign New Role"
                required
                options={ASSIGNABLE_ROLES}
                {...registerRole('role', { required: true })}
              />
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <p className="text-xs text-amber-700">
                  âš ï¸ The role change takes effect immediately. If changing to Facility Staff, the
                  member will need to log in to the Facility Portal (port 3002).
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setRoleModal(null); resetRole(); }}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isRoleSubmitting}>
                  Update Role
                </Button>
              </div>
            </form>
          </>
        )}
      </Modal>

    </div>
  );
}
