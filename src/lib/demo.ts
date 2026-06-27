// ─── Demo Mode ──────────────────────────────────────────
// When Supabase is not configured, the app runs in demo mode
// with local storage persistence and mock data.

import type { Invoice, Customer, CompanySettings, InvoiceItem } from '../types';
import { generateId } from './utils';

const STORAGE_KEYS = {
  invoices: 'mp-prints-demo-invoices',
  customers: 'mp-prints-demo-customers',
  settings: 'mp-prints-demo-settings',
  sequence: 'mp-prints-demo-sequence',
};

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key && !url.includes('placeholder') && !key.includes('placeholder'));
}

export function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}

// ─── Local Storage Helpers ──────────────────────────────
function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Default Company Settings ───────────────────────────
export const DEFAULT_SETTINGS: CompanySettings = {
  id: 'demo-settings-1',
  company_name: 'MP PRINTS',
  address: '15/2, Industrial Estate, Sivakasi, Virudhunagar Dist, Tamil Nadu - 626123',
  phone: '98765 43210, 98765 43211',
  gstin: '33AABCU9603R1ZM',
  state: 'Tamil Nadu',
  state_code: '33',
  bank_name: 'State Bank of India',
  account_number: '39aborb834567890',
  ifsc_code: 'SBIN0001234',
  branch: 'Sivakasi',
  logo_url: '',
  domain: window.location.origin,
  updated_at: new Date().toISOString(),
};

// ─── Sample Customers ───────────────────────────────────
const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: generateId(),
    name: 'Sri Lakshmi Offset Printers',
    address: '45, Anna Nagar, Sivakasi - 626123',
    gstin: '33BBBBB0000B1Z5',
    state: 'Tamil Nadu',
    state_code: '33',
    phone: '98765 11111',
    created_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: 'Rajesh Screen Prints',
    address: '78, Industrial Area, Madurai - 625001',
    gstin: '33CCCCC0000C1Z5',
    state: 'Tamil Nadu',
    state_code: '33',
    phone: '98765 22222',
    created_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: 'Murugan Traders',
    address: '12, Market Road, Coimbatore - 641001',
    gstin: '33DDDDD0000D1Z5',
    state: 'Tamil Nadu',
    state_code: '33',
    phone: '98765 33333',
    created_at: new Date().toISOString(),
  },
];

// ─── Sample Invoice Items ───────────────────────────────
function makeSampleItems(): InvoiceItem[] {
  return [
    { id: generateId(), sno: 1, particulars: 'Visiting Card Printing (300 GSM)', quantity: 500, rate: 2.50, amount: 1250 },
    { id: generateId(), sno: 2, particulars: 'Letter Head A4 (100 GSM)', quantity: 1000, rate: 3.00, amount: 3000 },
    { id: generateId(), sno: 3, particulars: 'Bill Book (50x3) Printing', quantity: 20, rate: 150.00, amount: 3000 },
  ];
}

// ─── Demo Invoices ──────────────────────────────────────
export const demoInvoices = {
  getAll(): Invoice[] {
    return getStored<Invoice[]>(STORAGE_KEYS.invoices, []);
  },

  getById(id: string): Invoice | null {
    const invoices = this.getAll();
    return invoices.find((inv) => inv.id === id) || null;
  },

  getByNumber(invoiceNumber: string): Invoice | null {
    const invoices = this.getAll();
    return invoices.find((inv) => inv.invoice_number === invoiceNumber) || null;
  },

  getNextNumber(): number {
    const seq = getStored<number>(STORAGE_KEYS.sequence, 393);
    return seq;
  },

  create(invoice: Partial<Invoice>): Invoice {
    const invoices = this.getAll();
    const seq = this.getNextNumber();
    const newInvoice: Invoice = {
      id: generateId(),
      customer_name: invoice.customer_name || '',
      customer_address: invoice.customer_address || '',
      customer_gstin: invoice.customer_gstin || '',
      customer_state: invoice.customer_state || '',
      customer_state_code: invoice.customer_state_code || '',
      date: invoice.date || new Date().toISOString().split('T')[0],
      items: invoice.items || [],
      subtotal: invoice.subtotal || 0,
      cgst_rate: invoice.cgst_rate || 9,
      cgst_amount: invoice.cgst_amount || 0,
      sgst_rate: invoice.sgst_rate || 9,
      sgst_amount: invoice.sgst_amount || 0,
      round_off: invoice.round_off || 0,
      total: invoice.total || 0,
      dc_image_url: invoice.dc_image_url || '',
      quotation_image_url: invoice.quotation_image_url || '',
      qr_code_url: invoice.qr_code_url || '',
      notes: invoice.notes || '',
      is_printed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...invoice,
      invoice_number: invoice.invoice_number || String(seq),
    };

    invoices.unshift(newInvoice);
    setStored(STORAGE_KEYS.invoices, invoices);
    setStored(STORAGE_KEYS.sequence, seq + 1);
    return newInvoice;
  },

  update(id: string, updates: Partial<Invoice>): Invoice | null {
    const invoices = this.getAll();
    const index = invoices.findIndex((inv) => inv.id === id);
    if (index === -1) return null;

    invoices[index] = {
      ...invoices[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.invoices, invoices);
    return invoices[index];
  },

  delete(id: string): boolean {
    const invoices = this.getAll();
    const filtered = invoices.filter((inv) => inv.id !== id);
    if (filtered.length === invoices.length) return false;
    setStored(STORAGE_KEYS.invoices, filtered);
    return true;
  },

  markPrinted(id: string): void {
    this.update(id, { is_printed: true, printed_at: new Date().toISOString() });
  },

  search(query: string, dateFrom?: string, dateTo?: string): Invoice[] {
    let results = this.getAll();

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        (inv) =>
          inv.invoice_number.toLowerCase().includes(q) ||
          inv.customer_name.toLowerCase().includes(q)
      );
    }

    if (dateFrom) {
      results = results.filter((inv) => inv.date >= dateFrom);
    }

    if (dateTo) {
      results = results.filter((inv) => inv.date <= dateTo);
    }

    return results;
  },

  // Initialize with sample data if empty
  initSampleData(): void {
    if (this.getAll().length === 0) {
      const items = makeSampleItems();
      const subtotal = items.reduce((s, i) => s + i.amount, 0);
      const cgst = Number((subtotal * 0.09).toFixed(2));
      const sgst = Number((subtotal * 0.09).toFixed(2));
      const total = Math.round(subtotal + cgst + sgst);
      const roundOff = Number((total - (subtotal + cgst + sgst)).toFixed(2));

      const customers = SAMPLE_CUSTOMERS;

      // Create 3 sample invoices
      for (let i = 0; i < 3; i++) {
        const customer = customers[i];
        this.create({
          customer_name: customer.name,
          customer_address: customer.address,
          customer_gstin: customer.gstin,
          customer_state: customer.state,
          customer_state_code: customer.state_code,
          date: new Date(Date.now() - i * 86400000 * 3).toISOString().split('T')[0],
          items: i === 0 ? items : makeSampleItems(),
          subtotal,
          cgst_rate: 9,
          cgst_amount: cgst,
          sgst_rate: 9,
          sgst_amount: sgst,
          round_off: roundOff,
          total,
          is_printed: i > 0,
          printed_at: i > 0 ? new Date().toISOString() : undefined,
        });
      }
    }
  },
};

// ─── Demo Customers ─────────────────────────────────────
export const demoCustomers = {
  getAll(): Customer[] {
    const stored = getStored<Customer[]>(STORAGE_KEYS.customers, []);
    if (stored.length === 0) {
      setStored(STORAGE_KEYS.customers, SAMPLE_CUSTOMERS);
      return SAMPLE_CUSTOMERS;
    }
    return stored;
  },

  create(customer: Partial<Customer>): Customer {
    const customers = this.getAll();
    const newCustomer: Customer = {
      id: generateId(),
      name: customer.name || '',
      address: customer.address || '',
      gstin: customer.gstin || '',
      state: customer.state || '',
      state_code: customer.state_code || '',
      phone: customer.phone || '',
      created_at: new Date().toISOString(),
    };
    customers.push(newCustomer);
    setStored(STORAGE_KEYS.customers, customers);
    return newCustomer;
  },

  update(id: string, updates: Partial<Customer>): Customer | null {
    const customers = this.getAll();
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) return null;
    customers[index] = { ...customers[index], ...updates };
    setStored(STORAGE_KEYS.customers, customers);
    return customers[index];
  },

  delete(id: string): boolean {
    const customers = this.getAll();
    const filtered = customers.filter((c) => c.id !== id);
    if (filtered.length === customers.length) return false;
    setStored(STORAGE_KEYS.customers, filtered);
    return true;
  },
};

// ─── Demo Settings ──────────────────────────────────────
export const demoSettings = {
  get(): CompanySettings {
    return getStored<CompanySettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  },

  update(updates: Partial<CompanySettings>): CompanySettings {
    const current = this.get();
    const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
    setStored(STORAGE_KEYS.settings, updated);
    return updated;
  },
};

// ─── Demo Image Upload ──────────────────────────────────
export async function demoUploadImage(file: File): Promise<{ url: string; public_id: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({ url: reader.result as string, public_id: `demo-${Date.now()}` });
    };
    reader.readAsDataURL(file);
  });
}

// Initialize demo data on first load
export function initDemoMode(): void {
  if (isDemoMode()) {
    demoInvoices.initSampleData();
    demoCustomers.getAll(); // triggers initialization
    demoSettings.get(); // triggers initialization
  }
}
