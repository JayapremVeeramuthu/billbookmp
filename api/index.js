import express from 'express';
import cors from 'cors';
import multer from 'multer';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';

// Load environment variables
dotenv.config({ override: true });

const app = express();
const port = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://billbookmp.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Strict mode: Ensure valid configuration
if (!supabaseUrl || !serviceRoleKey || serviceRoleKey === 'your_service_role_key_here') {
  console.error('CRITICAL ERROR: Supabase URL or valid Service Role Key is missing.');
  console.error('Please configure SUPABASE_SERVICE_ROLE_KEY in your .env file with a valid key.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Initialize Cloudinary
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('CRITICAL ERROR: Cloudinary credentials missing in .env file.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Memory storage for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Helper to destroy Cloudinary asset
const destroyCloudinaryAsset = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`[Cloudinary Error - destroy ${publicId}]:`, error.message);
  }
};

const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;
  return parts.slice(uploadIndex + 2).join('/').replace(/\.[^/.]+$/, "");
};

const sanitizeInvoiceData = (body) => {
  const sanitized = { ...body };
  delete sanitized.dc_image_public_id;
  delete sanitized.quotation_image_public_id;
  return sanitized;
};

const sanitizeSettingsData = (body) => {
  const sanitized = { ...body };
  delete sanitized.logo_public_id;
  return sanitized;
};

// ─── INVOICES ──────────────────────────────────────────

app.get('/api/invoices', async (req, res) => {
  let query = supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });

  if (req.query.search) {
    query = query.or(`invoice_number.ilike.%${req.query.search}%,customer_name.ilike.%${req.query.search}%`);
  }
  if (req.query.dateFrom) {
    query = query.gte('date', req.query.dateFrom);
  }
  if (req.query.dateTo) {
    query = query.lte('date', req.query.dateTo);
  }
  if (req.query.customerId) {
    query = query.eq('customer_id', req.query.customerId);
  }
  if (req.query.limit) {
    query = query.limit(parseInt(req.query.limit));
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('[Supabase Error - GET /invoices]:', JSON.stringify({
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    }, null, 2));
    return res.status(400).json({ error: error.message, details: error });
  }
  
  res.json(data);
});

app.get('/api/invoices/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) {
    console.error(`[Supabase Error - GET /invoices/${req.params.id}]:`, JSON.stringify({
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    }, null, 2));
    return res.status(400).json({ error: error.message, details: error });
  }
  
  res.json(data);
});

app.post('/api/invoices', async (req, res) => {
  const sanitizedBody = sanitizeInvoiceData(req.body);
  const { data, error } = await supabase
    .from('invoices')
    .insert([sanitizedBody])
    .select()
    .single();

  if (error) {
    console.error('[Supabase Error - POST /invoices]:', JSON.stringify({
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    }, null, 2));
    return res.status(400).json({ error: error.message, details: error });
  }
  
  res.json(data);
});

app.put('/api/invoices/:id', async (req, res) => {
  // Fetch old record first to check if images changed
  const { data: oldRecord, error: fetchError } = await supabase
    .from('invoices')
    .select('dc_image_url, quotation_image_url')
    .eq('id', req.params.id)
    .single();

  if (fetchError) {
    return res.status(400).json({ error: fetchError.message });
  }
  
  const sanitizedBody = sanitizeInvoiceData(req.body);

  const { data, error } = await supabase
    .from('invoices')
    .update(sanitizedBody)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    console.error(`[Supabase Error - PUT /invoices/${req.params.id}]:`, error.message);
    return res.status(400).json({ error: error.message, details: error });
  }

  // Delete orphaned Cloudinary assets
  if (oldRecord.dc_image_url && sanitizedBody.dc_image_url !== oldRecord.dc_image_url) {
    const pubId = extractPublicId(oldRecord.dc_image_url);
    if (pubId) await destroyCloudinaryAsset(pubId);
  }
  if (oldRecord.quotation_image_url && sanitizedBody.quotation_image_url !== oldRecord.quotation_image_url) {
    const pubId = extractPublicId(oldRecord.quotation_image_url);
    if (pubId) await destroyCloudinaryAsset(pubId);
  }
  
  res.json(data);
});

app.delete('/api/invoices/:id', async (req, res) => {
  // Fetch old record first to delete Cloudinary assets
  const { data: oldRecord, error: fetchError } = await supabase
    .from('invoices')
    .select('dc_image_url, quotation_image_url')
    .eq('id', req.params.id)
    .single();

  if (!fetchError && oldRecord) {
    if (oldRecord.dc_image_url) await destroyCloudinaryAsset(extractPublicId(oldRecord.dc_image_url));
    if (oldRecord.quotation_image_url) await destroyCloudinaryAsset(extractPublicId(oldRecord.quotation_image_url));
  }

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    console.error(`[Supabase Error - DELETE /invoices/${req.params.id}]:`, error.message);
    return res.status(400).json({ error: error.message, details: error });
  }
  
  res.json({ success: true });
});

// ─── CUSTOMERS ──────────────────────────────────────────

app.get('/api/customers', async (req, res) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('[Supabase Error - GET /customers]:', error.message);
    return res.status(400).json({ error: error.message, details: error });
  }
  
  res.json(data);
});

app.post('/api/customers', async (req, res) => {
  const { data, error } = await supabase
    .from('customers')
    .insert([req.body])
    .select()
    .single();

  if (error) {
    console.error('[Supabase Error - POST /customers]:', error.message);
    return res.status(400).json({ error: error.message, details: error });
  }
  
  res.json(data);
});

app.put('/api/customers/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('customers')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    console.error(`[Supabase Error - PUT /customers/${req.params.id}]:`, error.message);
    return res.status(400).json({ error: error.message, details: error });
  }
  
  res.json(data);
});

app.delete('/api/customers/:id', async (req, res) => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    console.error(`[Supabase Error - DELETE /customers/${req.params.id}]:`, error.message);
    return res.status(400).json({ error: error.message, details: error });
  }
  
  res.json({ success: true });
});

// ─── SETTINGS ───────────────────────────────────────────

app.get('/api/settings', async (req, res) => {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    // Supabase returns PGRST116 when 0 rows are returned for a .single() query.
    if (error.code === 'PGRST116') {
      return res.json(null);
    }
    console.error('[Supabase Error - GET /settings]:', error.message);
    return res.status(400).json({ error: error.message, details: error });
  }
  
  res.json(data || null);
});

app.post('/api/settings', async (req, res) => {
  const sanitizedBody = sanitizeSettingsData(req.body);
  const { data, error } = await supabase
    .from('company_settings')
    .insert([sanitizedBody])
    .select()
    .single();

  if (error) {
    console.error('[Supabase Error - POST /settings]:', error.message);
    return res.status(400).json({ error: error.message, details: error });
  }
  
  res.json(data);
});

app.put('/api/settings/:id', async (req, res) => {
  const { data: oldRecord, error: fetchError } = await supabase
    .from('company_settings')
    .select('logo_url')
    .eq('id', req.params.id)
    .single();

  if (fetchError) {
    return res.status(400).json({ error: fetchError.message });
  }

  const sanitizedBody = sanitizeSettingsData(req.body);
  
  const { data, error } = await supabase
    .from('company_settings')
    .update(sanitizedBody)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    console.error(`[Supabase Error - PUT /settings/${req.params.id}]:`, error.message);
    return res.status(400).json({ error: error.message, details: error });
  }
  
  if (oldRecord.logo_url && sanitizedBody.logo_url !== oldRecord.logo_url) {
    const pubId = extractPublicId(oldRecord.logo_url);
    if (pubId) await destroyCloudinaryAsset(pubId);
  }
  
  res.json(data);
});

// ─── UPLOADS ────────────────────────────────────────────

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const { bucket } = req.body;
  
  if (!bucket) {
    return res.status(400).json({ error: 'Bucket is required to determine folder' });
  }

  // Map Supabase buckets to Cloudinary folders
  let folder = 'mpprints/general';
  if (bucket === 'dc-images') {
    folder = 'mpprints/dc';
  } else if (bucket === 'quotation-images') {
    folder = 'mpprints/quotation';
  }

  try {
    const uploadStream = cloudinary.uploader.unsigned_upload_stream(
      'billbookmp',
      {
        folder: folder,
      },
      (error, result) => {
        if (error) {
          console.error(`[Cloudinary Error - Upload]:`, JSON.stringify(error, null, 2));
          return res.status(400).json({ error: error });
        }
        return res.json({ url: result.secure_url, public_id: result.public_id });
      }
    );
    
    // Pipe buffer to stream
    const { Readable } = await import('stream');
    const readable = new Readable();
    readable._read = () => {};
    readable.push(req.file.buffer);
    readable.push(null);
    readable.pipe(uploadStream);
    
  } catch (err) {
    console.error(`[Upload Error]:`, err.message);
    return res.status(500).json({ error: 'Failed to upload to Cloudinary' });
  }
});

export default app;
