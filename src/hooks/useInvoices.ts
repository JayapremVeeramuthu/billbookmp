import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { isDemoMode, demoInvoices } from '../lib/demo';
import type { Invoice, InvoiceFilters } from '../types';

export function useInvoices(filters?: InvoiceFilters) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isDemoMode()) {
        const results = demoInvoices.search(
          filters?.search || '',
          filters?.dateFrom,
          filters?.dateTo
        );
        setInvoices(results);
        setLoading(false);
        return;
      }

      const queryParams = new URLSearchParams();
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters?.customerId) queryParams.append('customerId', filters.customerId);

      const res = await fetch(`/api/invoices?${queryParams.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch invoices');
      }
      const data = await res.json();

      const parsed = (data || []).map((inv: any) => ({
        ...inv,
        items: typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items,
      }));

      setInvoices(parsed as Invoice[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch invoices';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters?.search, filters?.dateFrom, filters?.dateTo, filters?.customerId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const getInvoice = async (id: string): Promise<Invoice | null> => {
    if (isDemoMode()) {
      return demoInvoices.getById(id);
    }

    const res = await fetch(`/api/invoices/${id}`);
    if (!res.ok) throw new Error('Failed to fetch invoice');
    const data = await res.json();

    return {
      ...data,
      items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items,
    } as Invoice;
  };

  // Kept intact: This is used by Public QR View and must hit Supabase directly (using anon key)
  const getInvoiceByNumber = async (invoiceNumber: string): Promise<Invoice | null> => {
    if (isDemoMode()) {
      return demoInvoices.getByNumber(invoiceNumber);
    }

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_number', invoiceNumber)
      .single();

    if (error) return null;

    return {
      ...data,
      items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items,
    } as Invoice;
  };

  const createInvoice = async (invoice: Partial<Invoice>): Promise<Invoice> => {
    if (isDemoMode()) {
      const created = demoInvoices.create(invoice);
      await fetchInvoices();
      return created;
    }

    const res = await fetch(`/api/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create invoice');
    }
    const data = await res.json();
    await fetchInvoices();
    return data as Invoice;
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>): Promise<Invoice> => {
    if (isDemoMode()) {
      const updated = demoInvoices.update(id, updates);
      if (!updated) throw new Error('Invoice not found');
      await fetchInvoices();
      return updated;
    }

    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update invoice');
    }
    const data = await res.json();
    await fetchInvoices();
    return data as Invoice;
  };

  const deleteInvoice = async (id: string): Promise<void> => {
    if (isDemoMode()) {
      demoInvoices.delete(id);
      await fetchInvoices();
      return;
    }

    const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete invoice');
    }
    await fetchInvoices();
  };

  const getNextInvoiceNumber = async (): Promise<string> => {
    if (isDemoMode()) {
      return String(demoInvoices.getNextNumber());
    }

    const res = await fetch(`/api/invoices?limit=1`); // Backend already orders by created_at desc
    if (!res.ok) return '393';
    const data = await res.json();

    if (data && data.length > 0) {
      const lastNum = parseInt(data[0].invoice_number.replace(/\D/g, ''), 10);
      return String(lastNum + 1);
    }

    return '393';
  };

  const markAsPrinted = async (id: string): Promise<void> => {
    if (isDemoMode()) {
      demoInvoices.markPrinted(id);
      await fetchInvoices();
      return;
    }

    await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_printed: true, printed_at: new Date().toISOString() }),
    });
    await fetchInvoices();
  };

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    getInvoice,
    getInvoiceByNumber,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getNextInvoiceNumber,
    markAsPrinted,
  };
}
