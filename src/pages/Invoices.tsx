import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Calendar,
  Eye,
  Copy,
  Printer,
  Download,
  Trash2,
  Filter,
  X,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useInvoices } from '../hooks/useInvoices';
import { formatCurrency, formatDate } from '../lib/utils';
import { toast } from 'sonner';

export function Invoices() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { invoices, loading, deleteInvoice, markAsPrinted } = useInvoices({
    search,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const handleDuplicate = (inv: typeof invoices[0]) => {
    // Navigate to create with pre-filled data via state
    navigate('/invoices/create', {
      state: {
        duplicate: {
          customer_name: inv.customer_name,
          customer_address: inv.customer_address,
          customer_gstin: inv.customer_gstin,
          customer_state: inv.customer_state,
          customer_state_code: inv.customer_state_code,
          items: inv.items,
          cgst_rate: inv.cgst_rate,
          sgst_rate: inv.sgst_rate,
          notes: inv.notes,
        },
      },
    });
    toast.info('Invoice duplicated — edit and save as new');
  };

  const handleDelete = async (id: string, number: string) => {
    if (window.confirm(`Delete invoice ${number}? This cannot be undone.`)) {
      try {
        await deleteInvoice(id);
        toast.success(`Invoice ${number} deleted`);
      } catch {
        toast.error('Failed to delete invoice');
      }
    }
  };

  const handlePrint = async (id: string) => {
    await markAsPrinted(id);
    navigate(`/invoices/${id}?print=true`);
  };

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setShowFilters(false);
  };

  return (
    <div>
      <Header
        title="Invoices"
        subtitle={`${invoices.length} total invoices`}
        actions={
          <button onClick={() => navigate('/invoices/create')} className="btn btn-primary btn-sm no-print">
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Search & Filter Bar */}
        <div className="glass-card p-4 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input pl-10"
                placeholder="Search by invoice number or customer name..."
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-secondary btn-sm ${showFilters ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300' : ''}`}
            >
              <Filter className="w-4 h-4" /> Filters
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-col md:flex-row gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 flex-1">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="form-input text-sm"
                  placeholder="From"
                />
                <span className="text-gray-400 text-sm">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="form-input text-sm"
                />
              </div>
              <button onClick={clearFilters} className="btn btn-secondary btn-sm">
                <X className="w-4 h-4" /> Clear
              </button>
            </div>
          )}
        </div>

        {/* Invoice List */}
        <div className="glass-card animate-fade-in delay-1" style={{ opacity: 0 }}>
          {loading ? (
            <div className="p-16 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-gray-400 mt-3">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon bg-blue-50 dark:bg-blue-900/20">
                <Search className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-1">No invoices found</p>
              <p className="text-gray-400 text-sm mb-4">
                {search ? 'Try a different search term' : 'Create your first invoice to get started'}
              </p>
              {!search && (
                <button onClick={() => navigate('/invoices/create')} className="btn btn-primary btn-sm">
                  <Plus className="w-4 h-4" /> Create Invoice
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <button
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {inv.invoice_number}
                        </button>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{inv.customer_name}</p>
                          {inv.customer_gstin && (
                            <p className="text-xs text-gray-400">{inv.customer_gstin}</p>
                          )}
                        </div>
                      </td>
                      <td className="text-gray-500 dark:text-gray-400">{formatDate(inv.date)}</td>
                      <td className="font-semibold text-gray-900 dark:text-white">{formatCurrency(Number(inv.total))}</td>
                      <td>
                        {inv.is_printed ? (
                          <span className="badge badge-success">Printed</span>
                        ) : (
                          <span className="badge badge-warning">Pending</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                            className="btn-icon btn-secondary btn-sm"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(inv)}
                            className="btn-icon btn-secondary btn-sm"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrint(inv.id)}
                            className="btn-icon btn-secondary btn-sm"
                            title="Print"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/invoices/${inv.id}?download=true`)}
                            className="btn-icon btn-secondary btn-sm"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(inv.id, inv.invoice_number)}
                            className="btn-icon text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors"
                            title="Delete"
                          >
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
