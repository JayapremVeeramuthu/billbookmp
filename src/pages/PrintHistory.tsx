import { useNavigate } from 'react-router-dom';
import { Printer, Eye, Calendar } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useInvoices } from '../hooks/useInvoices';
import { formatCurrency, formatDate } from '../lib/utils';

export function PrintHistory() {
  const navigate = useNavigate();
  const { invoices, loading } = useInvoices();

  const printedInvoices = invoices
    .filter((inv) => inv.is_printed)
    .sort((a, b) => new Date(b.printed_at || b.created_at).getTime() - new Date(a.printed_at || a.created_at).getTime());

  return (
    <div>
      <Header
        title="Print History"
        subtitle={`${printedInvoices.length} printed invoices`}
      />

      <div className="p-6">
        <div className="glass-card animate-fade-in">
          {loading ? (
            <div className="p-16 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : printedInvoices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon bg-amber-50 dark:bg-amber-900/20">
                <Printer className="w-8 h-8 text-amber-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-1">No print history</p>
              <p className="text-gray-400 text-sm">Printed invoices will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Printed At</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {printedInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <span className="font-medium text-blue-600 dark:text-blue-400">{inv.invoice_number}</span>
                      </td>
                      <td className="text-gray-900 dark:text-white">{inv.customer_name}</td>
                      <td className="font-medium text-gray-900 dark:text-white">{formatCurrency(Number(inv.total))}</td>
                      <td>
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-sm">{inv.printed_at ? formatDate(inv.printed_at) : formatDate(inv.created_at)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                            className="btn btn-secondary btn-sm"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                          <button
                            onClick={() => navigate(`/invoices/${inv.id}?print=true`)}
                            className="btn btn-secondary btn-sm"
                          >
                            <Printer className="w-4 h-4" /> Reprint
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
