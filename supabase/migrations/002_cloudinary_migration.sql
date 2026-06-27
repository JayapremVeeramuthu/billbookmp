-- =============================================
-- Migration: Add Cloudinary Public IDs
-- =============================================

-- Add public_id columns to invoices
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS dc_image_public_id TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS quotation_image_public_id TEXT DEFAULT '';

-- Add public_id column to company_settings
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS logo_public_id TEXT DEFAULT '';
