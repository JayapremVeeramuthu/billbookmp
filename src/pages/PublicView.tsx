import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileText, Image as ImageIcon, Calendar, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ImagePreview } from '../components/common/ImagePreview';
import { formatDate, formatCurrency } from '../lib/utils';
import type { Invoice, CompanySettings } from '../types';

export function PublicView() {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch invoice
        const { data: invData, error: invError } = await supabase
          .from('invoices')
          .select('*')
          .eq('invoice_number', invoiceNumber)
          .single();

        if (invError || !invData) {
          setError('Invoice not found');
          setLoading(false);
          return;
        }

        setInvoice({
          ...invData,
          items: typeof invData.items === 'string' ? JSON.parse(invData.items) : invData.items,
        } as Invoice);

        // Fetch company settings
        const { data: settingsData } = await supabase
          .from('company_settings')
          .select('*')
          .limit(1)
          .single();

        if (settingsData) {
          setSettings(settingsData as CompanySettings);
        }
      } catch {
        setError('Failed to load invoice details');
      } finally {
        setLoading(false);
      }
    };

    if (invoiceNumber) {
      fetchData();
    }
  }, [invoiceNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
          <p className="text-gray-500">{error || 'The requested invoice could not be found. Please check the QR code and try again.'}</p>
        </div>
      </div>
    );
  }

  const handleDownload = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-3 rounded-xl" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
              <span className="text-white font-black text-xl">MP</span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{settings?.company_name || 'MP PRINTS'}</h1>
          <p className="text-sm text-gray-500 mt-1">Screen Printing Specialists</p>
        </div>

        {/* Invoice Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/5 border border-white/50 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs uppercase tracking-wider font-medium">Invoice Number</p>
                <p className="text-white text-xl font-bold mt-0.5">{invoice.invoice_number}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-xs uppercase tracking-wider font-medium">Total Amount</p>
                <p className="text-white text-xl font-bold mt-0.5">{formatCurrency(Number(invoice.total))}</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <User className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Customer</p>
                <p className="text-sm font-semibold text-gray-900">{invoice.customer_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Calendar className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Date</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(invoice.date)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-500" />
            Attachments
          </h2>

          {/* DC Image */}
          {invoice.dc_image_url ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/5 border border-white/50 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Delivery Challan</p>
                      <p className="text-xs text-gray-400">DC Document</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(invoice.dc_image_url!, `DC-${invoice.invoice_number}`)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>
              <div
                className="p-4 cursor-pointer"
                onClick={() => setPreviewImage({ src: invoice.dc_image_url!, alt: 'Delivery Challan' })}
              >
                <img
                  src={invoice.dc_image_url}
                  alt="Delivery Challan"
                  className="w-full rounded-xl object-contain max-h-80 bg-gray-50"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white/60 rounded-2xl border border-gray-200 p-8 text-center">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No Delivery Challan uploaded</p>
            </div>
          )}

          {/* Rate Quotation */}
          {invoice.quotation_image_url ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/5 border border-white/50 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Rate Quotation</p>
                      <p className="text-xs text-gray-400">Quotation Document</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(invoice.quotation_image_url!, `Quotation-${invoice.invoice_number}`)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>
              <div
                className="p-4 cursor-pointer"
                onClick={() => setPreviewImage({ src: invoice.quotation_image_url!, alt: 'Rate Quotation' })}
              >
                <img
                  src={invoice.quotation_image_url}
                  alt="Rate Quotation"
                  className="w-full rounded-xl object-contain max-h-80 bg-gray-50"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white/60 rounded-2xl border border-gray-200 p-8 text-center">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No Rate Quotation uploaded</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400">
          <p>{settings?.company_name || 'MP PRINTS'} • {settings?.phone || ''}</p>
          <p className="mt-1">{settings?.address || ''}</p>
        </div>
      </div>

      {/* Image Preview */}
      {previewImage && (
        <ImagePreview
          src={previewImage.src}
          alt={previewImage.alt}
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          downloadName={`${invoice.invoice_number}-${previewImage.alt}`}
        />
      )}
    </div>
  );
}
