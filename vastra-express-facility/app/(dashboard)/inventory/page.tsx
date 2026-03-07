'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatDateTime, getApiError } from '@/lib/utils';
import { Card, KpiCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loading, TableSkeleton } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import {
  Package,
  AlertTriangle,
  Plus,
  Pencil,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  ListOrdered,
} from 'lucide-react';
import type { InventoryItem, InventoryLog, InventoryCategory } from '@/types';

const CATEGORIES: { value: InventoryCategory; label: string }[] = [
  { value: 'DETERGENT',  label: 'Detergent' },
  { value: 'PACKAGING',  label: 'Packaging' },
  { value: 'TAG',        label: 'Tag' },
  { value: 'MACHINERY',  label: 'Machinery' },
  { value: 'MISC',       label: 'Misc' },
];

const LOG_TYPES = [
  { value: 'ADDITION',     label: 'Addition' },
  { value: 'CONSUMPTION',  label: 'Consumption' },
  { value: 'ADJUSTMENT',   label: 'Adjustment' },
];

const LOG_COLORS: Record<string, string> = {
  ADDITION:    'bg-emerald-100 text-emerald-700',
  CONSUMPTION: 'bg-red-100 text-red-700',
  ADJUSTMENT:  'bg-blue-100 text-blue-700',
};

interface ItemForm {
  itemName: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
}

const EMPTY_ITEM_FORM: ItemForm = {
  itemName: '',
  category: 'MISC',
  quantity: 0,
  unit: 'pcs',
  lowStockThreshold: 5,
};

export default function InventoryPage() {
  const [items, setItems]             = useState<InventoryItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly]     = useState(false);
  const LIMIT = 20;

  // Stats
  const [totalItems, setTotalItems]       = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Item form modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem]           = useState<InventoryItem | null>(null);
  const [itemForm, setItemForm]           = useState<ItemForm>(EMPTY_ITEM_FORM);
  const [savingItem, setSavingItem]       = useState(false);

  // Log modal
  const [showLogModal, setShowLogModal]   = useState(false);
  const [logItem, setLogItem]             = useState<InventoryItem | null>(null);
  const [logForm, setLogForm]             = useState({
    transactionType: 'CONSUMPTION',
    quantityChange: 1,
    notes: '',
  });
  const [loggingTx, setLoggingTx]         = useState(false);
  const [itemLogs, setItemLogs]           = useState<InventoryLog[]>([]);
  const [logsLoading, setLogsLoading]     = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...(lowStockOnly ? { lowStockOnly: 'true' } : {}),
      });
      const res = await api.get(`/inventory?${params}`);
      const data = res.data;
      const list: InventoryItem[] = Array.isArray(data) ? data : (data.data ?? []);
      setItems(list);
      setTotalPages(Array.isArray(data) ? 1 : (data.meta?.totalPages ?? data.totalPages ?? 1));
      setTotalItems(Array.isArray(data) ? list.length : (data.meta?.total ?? data.total ?? list.length));
      setLowStockCount(list.filter((i) => i.isLowStock || i.quantity <= i.lowStockThreshold).length);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, lowStockOnly]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function openLogs(item: InventoryItem) {
    setLogItem(item);
    setLogForm({ transactionType: 'CONSUMPTION', quantityChange: 1, notes: '' });
    setLogsLoading(true);
    setShowLogModal(true);
    try {
      const res = await api.get(`/inventory/${item.id}/logs?limit=20`);
      setItemLogs(res.data.data ?? res.data ?? []);
    } catch {
      setItemLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }

  async function handleLogTransaction() {
    if (!logItem || logForm.quantityChange < 1) {
      toast.error('Enter a valid quantity');
      return;
    }
    setLoggingTx(true);
    try {
      await api.patch(`/inventory/${logItem.id}`, {
        transactionType: logForm.transactionType,
        quantityChange: logForm.quantityChange,
        notes: logForm.notes || undefined,
      });
      toast.success('Transaction logged');
      // Reload logs
      const res = await api.get(`/inventory/${logItem.id}/logs?limit=20`);
      setItemLogs(res.data.data ?? res.data ?? []);
      setLogForm({ transactionType: 'CONSUMPTION', quantityChange: 1, notes: '' });
      loadItems();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoggingTx(false);
    }
  }

  function openEdit(item: InventoryItem) {
    setEditItem(item);
    setItemForm({
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      lowStockThreshold: item.lowStockThreshold,
    });
    setShowItemModal(true);
  }

  function openCreate() {
    setEditItem(null);
    setItemForm(EMPTY_ITEM_FORM);
    setShowItemModal(true);
  }

  async function handleSaveItem() {
    if (!itemForm.itemName || !itemForm.unit) {
      toast.error('Fill in all required fields');
      return;
    }
    setSavingItem(true);
    try {
      if (editItem) {
        await api.patch(`/inventory/${editItem.id}`, itemForm);
        toast.success('Item updated');
      } else {
        await api.post('/inventory', itemForm);
        toast.success('Item added');
      }
      setShowItemModal(false);
      loadItems();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSavingItem(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">Track stock levels and log consumption</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={loadItems}>
            Refresh
          </Button>
          <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>
            Add Item
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          title="Total Items"
          value={totalItems}
          icon={<Package className="w-5 h-5" />}
          color="emerald"
        />
        <KpiCard
          title="Low Stock Items"
          value={lowStockCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={lowStockCount > 0 ? 'red' : 'green'}
          subtitle={lowStockCount > 0 ? 'Needs restocking' : 'All levels OK'}
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <Select
              options={[{ value: '', label: 'All Categories' }, ...CATEGORIES]}
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="w-44"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              checked={lowStockOnly}
              onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }}
            />
            Low stock only
          </label>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Item</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Quantity</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Threshold</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6}><TableSkeleton rows={8} cols={6} /></td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Package className="w-8 h-8 text-gray-300" />
                      <p className="text-gray-400">No items found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isLow = item.isLowStock || item.quantity <= item.lowStockThreshold;
                  return (
                    <tr key={item.id} className={isLow ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{item.itemName}</p>
                        <p className="text-xs text-gray-400">{item.unit}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-gray-100 text-gray-600">{item.category}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                          {item.quantity}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.lowStockThreshold} {item.unit}</td>
                      <td className="px-4 py-3">
                        {isLow ? (
                          <Badge className="bg-red-100 text-red-700">
                            <AlertTriangle className="w-3 h-3 mr-1 inline" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700">OK</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                            title="Edit item"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openLogs(item)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-400 hover:text-emerald-700"
                            title="Log transaction"
                          >
                            <ListOrdered className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Item Form Modal */}
      <Modal open={showItemModal} onClose={() => setShowItemModal(false)} title={editItem ? 'Edit Item' : 'Add Item'}>
        <div className="space-y-4">
          <Input label="Item Name" value={itemForm.itemName} onChange={(e) => setItemForm({ ...itemForm, itemName: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={itemForm.category}
              options={CATEGORIES}
              onChange={(e) => setItemForm({ ...itemForm, category: e.target.value as InventoryCategory })}
            />
            <Input label="Unit" placeholder="pcs, kg, L…" value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity" type="number" min="0" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: parseInt(e.target.value) || 0 })} />
            <Input label="Low Stock Threshold" type="number" min="0" value={itemForm.lowStockThreshold} onChange={(e) => setItemForm({ ...itemForm, lowStockThreshold: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSaveItem} loading={savingItem} className="flex-1">
              {editItem ? 'Save Changes' : 'Add Item'}
            </Button>
            <Button variant="outline" onClick={() => setShowItemModal(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Log Transaction Modal */}
      <Modal open={showLogModal} onClose={() => setShowLogModal(false)} title="Log Transaction" size="lg">
        {logItem && (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-semibold text-gray-900">{logItem.itemName}</p>
              <p className="text-gray-500 mt-1">
                Current stock: <span className="font-medium">{logItem.quantity} {logItem.unit}</span>
              </p>
            </div>

            {/* New transaction */}
            <div className="border border-dashed border-gray-300 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">New Transaction</p>
              <div className="space-y-3">
                <Select
                  label="Type"
                  value={logForm.transactionType}
                  options={LOG_TYPES}
                  onChange={(e) => setLogForm({ ...logForm, transactionType: e.target.value })}
                />
                <Input
                  label="Quantity"
                  type="number"
                  min="1"
                  value={logForm.quantityChange}
                  onChange={(e) => setLogForm({ ...logForm, quantityChange: parseInt(e.target.value) || 1 })}
                />
                <Textarea
                  label="Notes (optional)"
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  placeholder="Reason or batch info…"
                />
                <Button onClick={handleLogTransaction} loading={loggingTx} className="w-full">
                  Log Transaction
                </Button>
              </div>
            </div>

            {/* History */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Recent Transactions</p>
              {logsLoading ? (
                <Loading message="Loading logs…" />
              ) : itemLogs.length === 0 ? (
                <p className="text-sm text-gray-400">No transactions yet</p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {itemLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-xs bg-gray-50 rounded px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Badge className={LOG_COLORS[log.transactionType] ?? 'bg-gray-100 text-gray-600'}>
                          {log.transactionType}
                        </Badge>
                        <span className="text-gray-600">
                          {log.transactionType === 'CONSUMPTION' ? '−' : '+'}
                          {log.quantityChange}
                        </span>
                        {log.notes && <span className="text-gray-400">· {log.notes}</span>}
                      </div>
                      <span className="text-gray-400">{formatDateTime(log.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
