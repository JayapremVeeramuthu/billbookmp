import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Copy, Edit, QrCode, Image as ImageIcon } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { InvoiceBillBook } from '../components/invoice/InvoiceBillBook';
import { ImagePreview } from '../components/common/ImagePreview';
import { useInvoices } from '../hooks/useInvoices';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { generatePDF } from '../lib/pdf';
import { toast } from 'sonner';
import type { Invoice } from '../types';
import { QRCodeSVG } from 'qrcode.react';

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getInvoice, markAsPrinted } = useInvoices();
  const { settings } = useCompanySettings();
  const billBookRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    if (id) {
      getInvoice(id)
        .then((data) => {
          setInvoice(data);
          setLoading(false);
        })
        .catch(() => {
          toast.error('Invoice not found');
          navigate('/invoices');
        });
    }
  }, [id]);

  // Auto-print or download if query param present
  useEffect(() => {
    if (!loading && invoice && billBookRef.current) {
      if (searchParams.get('print') === 'true') {
        setTimeout(() => window.print(), 500);
      }
      if (searchParams.get('download') === 'true') {
        setTimeout(() => handleDownloadPDF(), 500);
      }
    }
  }, [loading, invoice, searchParams]);

  const handlePrint = async () => {
    if (invoice) {
      await markAsPrinted(invoice.id);
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    if (billBookRef.current && invoice) {
      await generatePDF(billBookRef.current, `${invoice.invoice_number}.pdf`);
      toast.success('PDF downloaded!');
    }
  };

  const handleDownloadQR = () => {
    const svg = document.querySelector('.qr-download-target svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 300, 300);
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR-${invoice?.invoice_number}.png`;
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!invoice || !settings) return null;

  const publicUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const qrUrl = `${publicUrl}/view/${invoice.invoice_number}`;

  return (
    <div>
      <Header
        title={invoice.invoice_number}
        subtitle={`Invoice for ${invoice.customer_name}`}
        actions={
          <div className="flex gap-2 no-print">
            <button onClick={() => navigate('/invoices')} className="btn btn-secondary btn-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        }
      />

      <div className="p-6">
        {/* Action Bar */}
        <div className="flex flex-wrap gap-2 mb-6 no-print">
          <button onClick={handlePrint} className="btn btn-secondary btn-sm">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handleDownloadPDF} className="btn btn-secondary btn-sm">
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <button onClick={handleDownloadQR} className="btn btn-secondary btn-sm">
            <QrCode className="w-4 h-4" /> Download QR
          </button>
          <button
            onClick={() => navigate('/invoices/create', {
              state: {
                duplicate: {
                  customer_name: invoice.customer_name,
                  customer_address: invoice.customer_address,
                  customer_gstin: invoice.customer_gstin,
                  customer_state: invoice.customer_state,
                  customer_state_code: invoice.customer_state_code,
                  items: invoice.items,
                  cgst_rate: invoice.cgst_rate,
                  sgst_rate: invoice.sgst_rate,
                  notes: invoice.notes,
                },
              },
            })}
            className="btn btn-secondary btn-sm"
          >
            <Copy className="w-4 h-4" /> Duplicate
          </button>
          <button onClick={() => navigate(`/invoices/${invoice.id}/edit`)} className="btn btn-primary btn-sm">
            <Edit className="w-4 h-4" /> Edit
          </button>
        </div>

        {/* Bill Book Preview */}
        <InvoiceBillBook
          ref={billBookRef}
          invoice={invoice}
          settings={settings}
        />

        {/* Hidden QR for download */}
        <div className="qr-download-target" style={{ position: 'absolute', left: '-9999px' }}>
          <QRCodeSVG value={qrUrl} size={300} level="M" />
        </div>

        {/* Attachments Section */}
        {(invoice.dc_image_url || invoice.quotation_image_url) && (
          <div className="max-w-[210mm] mx-auto mt-8 no-print">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attachments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invoice.dc_image_url && (
                <div
                  className="glass-card p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setPreviewImage({ src: invoice.dc_image_url!, alt: 'Delivery Challan' })}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Challan</span>
                  </div>
                  <img src={invoice.dc_image_url} alt="DC" className="w-full h-48 object-contain bg-gray-50 dark:bg-gray-800 rounded-lg" />
                </div>
              )}
              {invoice.quotation_image_url && (
                <div
                  className="glass-card p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setPreviewImage({ src: invoice.quotation_image_url!, alt: 'Rate Quotation' })}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rate Quotation</span>
                  </div>
                  <img src={invoice.quotation_image_url} alt="Quotation" className="w-full h-48 object-contain bg-gray-50 dark:bg-gray-800 rounded-lg" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
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
    </div>
  );
}
