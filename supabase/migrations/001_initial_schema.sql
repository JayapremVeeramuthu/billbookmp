-- =============================================
-- MP Prints Bill Book Management System
-- Supabase Database Migration
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Company Settings ───────────────────────
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL DEFAULT 'MP PRINTS',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  gstin TEXT DEFAULT '',
  state TEXT DEFAULT 'Tamil Nadu',
  state_code TEXT DEFAULT '33',
  bank_name TEXT DEFAULT '',
  account_number TEXT DEFAULT '',
  ifsc_code TEXT DEFAULT '',
  branch TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  domain TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default company settings
INSERT INTO company_settings (company_name, address, phone, gstin, state, state_code)
VALUES (
  'MP PRINTS',
  '15/2, Industrial Estate, Sivakasi, Tamil Nadu - 626123',
  '9876543210, 9876543211',
  '33AABCU9603R1ZM',
  'Tamil Nadu',
  '33'
);

-- ─── Customers ──────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  gstin TEXT DEFAULT '',
  state TEXT DEFAULT '',
  state_code TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Invoice Number Sequence ────────────────
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1 INCREMENT BY 1;

-- ─── Invoices ───────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_address TEXT DEFAULT '',
  customer_gstin TEXT DEFAULT '',
  customer_state TEXT DEFAULT '',
  customer_state_code TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) DEFAULT 0,
  cgst_rate NUMERIC(5,2) DEFAULT 0,
  cgst_amount NUMERIC(12,2) DEFAULT 0,
  sgst_rate NUMERIC(5,2) DEFAULT 0,
  sgst_amount NUMERIC(12,2) DEFAULT 0,
  round_off NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  dc_image_url TEXT DEFAULT '',
  quotation_image_url TEXT DEFAULT '',
  qr_code_url TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  is_printed BOOLEAN DEFAULT false,
  printed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ────────────────────────────────
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_customer_name ON invoices(customer_name);
CREATE INDEX idx_invoices_date ON invoices(date);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE INDEX idx_customers_name ON customers(name);

-- ─── Row Level Security ─────────────────────

-- Enable RLS on all tables
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Note: The local backend uses the Service Role Key which bypasses RLS completely.
-- Therefore, these policies ONLY apply to the public frontend (QR Code viewer).

-- Company Settings: public read only
CREATE POLICY "Anyone can view company settings"
  ON company_settings FOR SELECT
  TO public
  USING (true);

-- Customers: No public access
-- (No policies created, so it defaults to deny all for public)

-- Invoices: public read only
CREATE POLICY "Anyone can view invoices"
  ON invoices FOR SELECT
  TO public
  USING (true);

-- ─── Updated At Trigger ─────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ─── Storage Buckets (run in Supabase Dashboard) ─────
-- Create buckets: dc-images, quotation-images
-- Set both to PUBLIC for read access
-- IMPORTANT: Do not create any INSERT/UPDATE/DELETE policies.
-- The local backend uses the Service Role Key and bypasses RLS for uploads.
