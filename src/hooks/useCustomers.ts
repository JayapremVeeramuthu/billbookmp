import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { isDemoMode, demoCustomers } from '../lib/demo';
import type { Customer } from '../types';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      if (isDemoMode()) {
        setCustomers(demoCustomers.getAll());
        setLoading(false);
        return;
      }

      const res = await fetch('/api/customers');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch customers');
      }
      const data = await res.json();
      setCustomers(data as Customer[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch customers';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const createCustomer = async (customer: Partial<Customer>): Promise<Customer> => {
    if (isDemoMode()) {
      const created = demoCustomers.create(customer);
      await fetchCustomers();
      return created;
    }

    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create customer');
    }
    const data = await res.json();
    await fetchCustomers();
    return data as Customer;
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<Customer> => {
    if (isDemoMode()) {
      const updated = demoCustomers.update(id, updates);
      if (!updated) throw new Error('Customer not found');
      await fetchCustomers();
      return updated;
    }

    const res = await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update customer');
    }
    const data = await res.json();
    await fetchCustomers();
    return data as Customer;
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    if (isDemoMode()) {
      demoCustomers.delete(id);
      await fetchCustomers();
      return;
    }

    const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete customer');
    }
    await fetchCustomers();
  };

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
