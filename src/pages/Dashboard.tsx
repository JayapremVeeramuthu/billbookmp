import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Users,
  TrendingUp,
  Printer,
  Plus,
  ArrowUpRight,
  IndianRupee,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useInvoices } from '../hooks/useInvoices';
import { useCustomers } from '../hooks/useCustomers';
import { formatCurrency, formatDate } from '../lib/utils';

export function Dashboard() {
  const navigate = useNavigate();
  const { invoices, loading } = useInvoices();
  const { customers } = useCustomers();
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    printedCount: 0,
    thisMonthRevenue: 0,
    thisMonthInvoices: 0,
  });

  useEffect(() => {
    if (!loading && invoices.length >= 0) {
      const now = new Date();
      const thisMonth = invoices.filter((inv) => {
        const d = new Date(inv.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      setStats({
        totalInvoices: invoices.length,
        totalRevenue: invoices.reduce((sum, inv) => sum + Number(inv.total), 0),
        totalCustomers: customers.length,
        printedCount: invoices.filter((inv) => inv.is_printed).length,
        thisMonthRevenue: thisMonth.reduce((sum, inv) => sum + Number(inv.total), 0),
        thisMonthInvoices: thisMonth.length,
      });
    }
  }, [invoices, customers, loading]);

  const recentInvoices = invoices.slice(0, 8);

  const statCards = [
    {
      title: 'Total Invoices',
      value: stats.totalInvoices,
      icon: FileText,
      gradient: 'from-blue-500 to-blue-700',
      bgLight: 'bg-blue-50 dark:bg-blue-900/20',
      iconBg: 'bg-blue-100 dark:bg-blue-800',
      change: `${stats.thisMonthInvoices} this month`,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: IndianRupee,
      gradient: 'from-emerald-500 to-emerald-700',
      bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconBg: 'bg-emerald-100 dark:bg-emerald-800',
      change: `${formatCurrency(stats.thisMonthRevenue)} this month`,
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      gradient: 'from-violet-500 to-violet-700',
      bgLight: 'bg-violet-50 dark:bg-violet-900/20',
      iconBg: 'bg-violet-100 dark:bg-violet-800',
      change: 'Active customers',
    },
    {
      title: 'Printed Invoices',
      value: stats.printedCount,
      icon: Printer,
      gradient: 'from-amber-500 to-amber-700',
      bgLight: 'bg-amber-50 dark:bg-amber-900/20',
      iconBg: 'bg-amber-100 dark:bg-amber-800',
      change: `${stats.totalInvoices - stats.printedCount} pending`,
    },
  ];

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Overview of your business"
        actions={
          <button onClick={() => navigate('/invoices/create')} className="btn btn-primary btn-sm no-print">
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {statCards.map((card, i) => (
            <div
              key={card.title}
              className={`glass-card p-5 animate-fade-in delay-${i + 1}`}
              style={{ opacity: 0 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {card.value}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{card.change}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${card.iconBg}`}>
                  <card.icon className={`w-5 h-5 bg-gradient-to-r ${card.gradient} bg-clip-text`} style={{ color: card.gradient.includes('blue') ? '#3b82f6' : card.gradient.includes('emerald') ? '#10b981' : card.gradient.includes('violet') ? '#8b5cf6' : '#f59e0b' }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Invoices */}
        <div className="glass-card animate-fade-in delay-5" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Invoices</h3>
            <button
              onClick={() => navigate('/invoices')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading...</div>
          ) : recentInvoices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon bg-blue-50 dark:bg-blue-900/20">
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-3">No invoices yet</p>
              <button onClick={() => navigate('/invoices/create')} className="btn btn-primary btn-sm">
                <Plus className="w-4 h-4" /> Create First Invoice
              </button>
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
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <td>
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {inv.invoice_number}
                        </span>
                      </td>
                      <td>{inv.customer_name}</td>
                      <td className="text-gray-500 dark:text-gray-400">{formatDate(inv.date)}</td>
                      <td className="font-medium">{formatCurrency(Number(inv.total))}</td>
                      <td>
                        {inv.is_printed ? (
                          <span className="badge badge-success">Printed</span>
                        ) : (
                          <span className="badge badge-warning">Pending</span>
                        )}
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
