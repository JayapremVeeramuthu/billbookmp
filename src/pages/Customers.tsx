import { useState } from 'react';
import { Plus, Edit, Trash2, Search, Users as UsersIcon, X } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useCustomers } from '../hooks/useCustomers';
import { toast } from 'sonner';
import type { Customer } from '../types';

export function Customers() {
  const { customers, loading, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [state, setState] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [phone, setPhone] = useState('');

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.gstin || '').toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setName('');
    setAddress('');
    setGstin('');
    setState('');
    setStateCode('');
    setPhone('');
    setEditingCustomer(null);
    setShowForm(false);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setAddress(customer.address || '');
    setGstin(customer.gstin || '');
    setState(customer.state || '');
    setStateCode(customer.state_code || '');
    setPhone(customer.phone || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    try {
      const data = { name, address, gstin, state, state_code: stateCode, phone };
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, data);
        toast.success('Customer updated');
      } else {
        await createCustomer(data);
        toast.success('Customer created');
      }
      resetForm();
    } catch {
      toast.error('Failed to save customer');
    }
  };

  const handleDelete = async (id: string, customerName: string) => {
    if (window.confirm(`Delete customer "${customerName}"?`)) {
      try {
        await deleteCustomer(id);
        toast.success('Customer deleted');
      } catch {
        toast.error('Failed to delete customer');
      }
    }
  };

  return (
    <div>
      <Header
        title="Customers"
        subtitle={`${customers.length} total customers`}
        actions={
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary btn-sm">
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Search */}
        <div className="glass-card p-4 animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-10"
              placeholder="Search customers..."
            />
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => resetForm()}>
            <div className="glass-card p-6 w-full max-w-lg mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingCustomer ? 'Edit Customer' : 'Add Customer'}
                </h3>
                <button onClick={resetForm} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Name *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-input" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Address</label>
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="form-input" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">GSTIN</label>
                    <input type="text" value={gstin} onChange={(e) => setGstin(e.target.value)} className="form-input" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Phone</label>
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">State</label>
                    <input type="text" value={state} onChange={(e) => setState(e.target.value)} className="form-input" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">State Code</label>
                    <input type="text" value={stateCode} onChange={(e) => setStateCode(e.target.value)} className="form-input" />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={resetForm} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    {editingCustomer ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Customer List */}
        <div className="glass-card animate-fade-in delay-1" style={{ opacity: 0 }}>
          {loading ? (
            <div className="p-16 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon bg-violet-50 dark:bg-violet-900/20">
                <UsersIcon className="w-8 h-8 text-violet-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-1">No customers found</p>
              <p className="text-gray-400 text-sm mb-4">Add your first customer to get started</p>
              <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary btn-sm">
                <Plus className="w-4 h-4" /> Add Customer
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>GSTIN</th>
                    <th>State</th>
                    <th>Phone</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
                          {c.address && <p className="text-xs text-gray-400 truncate max-w-xs">{c.address}</p>}
                        </div>
                      </td>
                      <td className="text-gray-600 dark:text-gray-400 font-mono text-sm">{c.gstin || '—'}</td>
                      <td className="text-gray-600 dark:text-gray-400">
                        {c.state || '—'}{c.state_code ? ` (${c.state_code})` : ''}
                      </td>
                      <td className="text-gray-600 dark:text-gray-400">{c.phone || '—'}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(c)} className="btn-icon btn-secondary btn-sm" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(c.id, c.name)} className="btn-icon text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
