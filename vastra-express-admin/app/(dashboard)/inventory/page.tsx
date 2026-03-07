'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { getApiError } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Loading';
import { Plus, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { InventoryItem } from '@/types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const CATEGORIES = ['DETERGENT', 'PACKAGING', 'TAG', 'MACHINERY', 'MISC'];

interface CreateItemForm {
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  facilityId: number;
}

interface Facility {
  id: number;
  name: string;
}

interface TransactionForm {
  transactionType: string;
  quantityChange: number;
  notes: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [txModal, setTxModal] = useState<InventoryItem | null>(null);
  const LIMIT = 20;

  const { register: regCreate, handleSubmit: hsCreate, reset: resetCreate, formState: { errors: errC, isSubmitting: submitting1 } } = useForm<CreateItemForm>();
  const { register: regTx, handleSubmit: hsTx, reset: resetTx, formState: { isSubmitting: submitting2 } } = useForm<TransactionForm>();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        lowStockOnly: String(lowStockOnly),
        ...(categoryFilter && { category: categoryFilter }),
      });
      const res = await api.get(`/inventory?${params}`);
      const body = res.data;
      setItems(body.data ?? body);
      setTotal(body.meta?.total ?? body.total ?? body.length ?? 0);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, lowStockOnly]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    api.get('/facilities').then((res) => setFacilities(res.data ?? [])).catch(() => {});
  }, []);

  async function handleCreate(data: CreateItemForm) {
    try {
      await api.post('/inventory', data);
      toast.success('Inventory item created');
      setAddModal(false);
      resetCreate();
      fetchItems();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleTransaction(data: TransactionForm) {
    if (!txModal) return;
    try {
      await api.post('/inventory/transaction', {
        inventoryItemId: txModal.id,
        transactionType: data.transactionType,
        quantityChange: Number(data.quantityChange),
        notes: data.notes,
      });
      toast.success('Transaction logged');
      setTxModal(null);
      resetTx();
      fetchItems();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage facility stock and transactions</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setAddModal(true)}>
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="w-48">
            <Select
              options={[{ value: '', label: 'All Categories' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              placeholder=""
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }}
              className="rounded border-gray-300 text-blue-600"
            />
            Low stock only
          </label>
          <Button variant="outline" onClick={fetchItems} loading={loading}>Refresh</Button>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{total} item{total !== 1 ? 's' : ''}</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6"><TableSkeleton rows={8} cols={6} /></div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No items found</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Item', 'Category', 'Quantity', 'Unit', 'Threshold', 'Stock Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => {
                  const isLow = item.quantity <= item.lowStockThreshold;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-800">{item.itemName}</td>
                      <td className="px-6 py-3">
                        <Badge className="bg-gray-100 text-gray-600">{item.category}</Badge>
                      </td>
                      <td className={`px-6 py-3 font-semibold ${isLow ? 'text-red-600' : 'text-gray-800'}`}>
                        {item.quantity}
                      </td>
                      <td className="px-6 py-3 text-gray-500">{item.unit}</td>
                      <td className="px-6 py-3 text-gray-500">{item.lowStockThreshold}</td>
                      <td className="px-6 py-3">
                        {isLow ? (
                          <Badge className="bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700">OK</Badge>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => setTxModal(item)}
                          className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                        >
                          Log Transaction
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1} leftIcon={<ChevronLeft className="w-4 h-4" />}>Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add Item Modal */}
      <Modal open={addModal} onClose={() => { setAddModal(false); resetCreate(); }} title="Add Inventory Item">
        <form onSubmit={hsCreate(handleCreate)} className="space-y-4">
          <Input label="Item Name" required placeholder="Detergent 5kg" error={errC.itemName?.message} {...regCreate('itemName', { required: 'Required' })} />
          <Select label="Category" required options={CATEGORIES.map((c) => ({ value: c, label: c }))} placeholder="Select category" error={errC.category?.message} {...regCreate('category', { required: 'Required' })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Opening Quantity" type="number" placeholder="0" {...regCreate('quantity', { valueAsNumber: true })} />
            <Input label="Unit" placeholder="kg / pieces" required error={errC.unit?.message} {...regCreate('unit', { required: 'Required' })} />
          </div>
          <Input label="Low Stock Threshold" type="number" placeholder="10" required {...regCreate('lowStockThreshold', { valueAsNumber: true, required: 'Required' })} />
          {facilities.length > 0 ? (
            <Select
              label="Facility"
              required
              options={[
                { value: '', label: 'Select facility…' },
                ...facilities.map((f) => ({ value: String(f.id), label: f.name })),
              ]}
              placeholder="Select facility…"
              error={errC.facilityId?.message}
              {...regCreate('facilityId', { valueAsNumber: true, required: 'Facility is required' })}
            />
          ) : (
            <Input label="Facility ID" type="number" placeholder="1" required error={errC.facilityId?.message} {...regCreate('facilityId', { valueAsNumber: true, required: 'Required' })} />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setAddModal(false); resetCreate(); }}>Cancel</Button>
            <Button type="submit" loading={submitting1}>Create</Button>
          </div>
        </form>
      </Modal>

      {/* Log Transaction Modal */}
      <Modal open={!!txModal} onClose={() => { setTxModal(null); resetTx(); }} title={`Log Transaction — ${txModal?.itemName ?? ''}`}>
        <form onSubmit={hsTx(handleTransaction)} className="space-y-4">
          <p className="text-sm text-gray-500">Current stock: <span className="font-semibold text-gray-800">{txModal?.quantity} {txModal?.unit}</span></p>
          <Select
            label="Transaction Type"
            required
            options={[
              { value: 'ADDITION', label: 'Addition (stock in)' },
              { value: 'CONSUMPTION', label: 'Consumption (stock out)' },
              { value: 'ADJUSTMENT', label: 'Adjustment (correction)' },
            ]}
            placeholder="Select type"
            {...regTx('transactionType', { required: true })}
          />
          <Input label="Quantity Change" type="number" placeholder="e.g. 5" required {...regTx('quantityChange', { required: true, valueAsNumber: true })} />
          <Textarea label="Notes" placeholder="Reason for change…" {...regTx('notes')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setTxModal(null); resetTx(); }}>Cancel</Button>
            <Button type="submit" loading={submitting2}>Log</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
