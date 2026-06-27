// ─── Invoice Item ───────────────────────────────────────────
export interface InvoiceItem {
  id: string;
  sno: number;
  particulars: string;
  quantity: number;
  rate: number;
  amount: number;
}

// ─── Invoice ────────────────────────────────────────────────
export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name: string;
  customer_address?: string;
  customer_gstin?: string;
  customer_state?: string;
  customer_state_code?: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  round_off: number;
  total: number;
  dc_image_url?: string;
  dc_image_public_id?: string;
  quotation_image_url?: string;
  quotation_image_public_id?: string;
  qr_code_url?: string;
  notes?: string;
  is_printed: boolean;
  printed_at?: string;
  created_at: string;
  updated_at: string;
}

// ─── Customer ───────────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  address?: string;
  gstin?: string;
  state?: string;
  state_code?: string;
  phone?: string;
  created_at: string;
}

// ─── Company Settings ───────────────────────────────────────
export interface CompanySettings {
  id: string;
  company_name: string;
  address?: string;
  phone?: string;
  gstin?: string;
  state?: string;
  state_code?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch?: string;
  logo_url?: string;
  logo_public_id?: string;
  domain: string;
  updated_at: string;
}

// ─── Form types ─────────────────────────────────────────────
export type InvoiceFormData = Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'qr_code_url'>;

export type CustomerFormData = Omit<Customer, 'id' | 'created_at'>;

// ─── Filter types ───────────────────────────────────────────
export interface InvoiceFilters {
  search: string;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
}
