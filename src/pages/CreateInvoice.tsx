import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Eye, Printer, Download, ArrowLeft } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { ImageUpload } from '../components/common/ImageUpload';
import { InvoiceBillBook } from '../components/invoice/InvoiceBillBook';
import { useInvoices } from '../hooks/useInvoices';
import { useCustomers } from '../hooks/useCustomers';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { generateId, calculateRoundOff, formatDateISO } from '../lib/utils';
import { generatePDF } from '../lib/pdf';
import { uploadImage } from '../lib/supabase';
import { toast } from 'sonner';
import type { InvoiceItem, Invoice } from '../types';

export function CreateInvoice() {
  const navigate = useNavigate();
  const { createInvoice, getNextInvoiceNumber } = useInvoices();
  const { customers } = useCustomers();
  const { settings } = useCompanySettings();
  const billBookRef = useRef<HTMLDivElement>(null);

  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(formatDateISO(new Date()));
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [customerStateCode, setCustomerStateCode] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [cgstRate, setCgstRate] = useState(9);
  const [sgstRate, setSgstRate] = useState(9);
  const [notes, setNotes] = useState('');

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: generateId(), sno: 1, particulars: '', quantity: 0, rate: 0, amount: 0 },
  ]);

  // Images
  const [dcFile, setDcFile] = useState<File | null>(null);
  const [dcPreview, setDcPreview] = useState<string | null>(null);
  const [quotationFile, setQuotationFile] = useState<File | null>(null);
  const [quotationPreview, setQuotationPreview] = useState<string | null>(null);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const cgstAmount = Number(((subtotal * cgstRate) / 100).toFixed(2));
  const sgstAmount = Number(((subtotal * sgstRate) / 100).toFixed(2));
  const beforeRound = subtotal + cgstAmount + sgstAmount;
  const { roundOff, rounded: total } = calculateRoundOff(beforeRound);

  // Get next invoice number on mount
  useEffect(() => {
    getNextInvoiceNumber().then(setInvoiceNumber).catch(console.error);
  }, []);

  // Auto-fill customer details
  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setCustomerId(id);
    const customer = customers.find((c) => c.id === id);
    if (customer) {
      setCustomerName(customer.name);
      setCustomerAddress(customer.address || '');
      setCustomerGstin(customer.gstin || '');
      setCustomerState(customer.state || '');
      setCustomerStateCode(customer.state_code || '');
    }
  };

  // Item handlers
  const updateItem = useCallback((id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updated.amount = Number(updated.quantity) * Number(updated.rate);
        }
        return updated;
      })
    );
  }, []);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: generateId(), sno: prev.length + 1, particulars: '', quantity: 0, rate: 0, amount: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) =>
      prev.filter((item) => item.id !== id).map((item, i) => ({ ...item, sno: i + 1 }))
    );
  };

  // Save invoice
  const handleSave = async () => {
    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    if (items.every((item) => !item.particulars.trim())) {
      toast.error('Please add at least one item');
      return;
    }

    setSaving(true);
    try {
      let dcImageUrl = '';
      let dcImagePublicId = '';
      let quotationImageUrl = '';
      let quotationImagePublicId = '';

      // Upload images
      if (dcFile) {
        const path = `${invoiceNumber}/dc-${Date.now()}.${dcFile.name.split('.').pop()}`;
        const result = await uploadImage('dc-images', dcFile, path);
        dcImageUrl = result.url;
        dcImagePublicId = result.public_id;
      }

      if (quotationFile) {
        const path = `${invoiceNumber}/quotation-${Date.now()}.${quotationFile.name.split('.').pop()}`;
        const result = await uploadImage('quotation-images', quotationFile, path);
        quotationImageUrl = result.url;
        quotationImagePublicId = result.public_id;
      }

      const domain = settings?.domain || 'http://localhost:5173';
      const qrUrl = `${domain}/view/${invoiceNumber}`;

      const invoiceData: Partial<Invoice> = {
        invoice_number: invoiceNumber,
        customer_id: customerId || undefined,
        customer_name: customerName,
        customer_address: customerAddress,
        customer_gstin: customerGstin,
        customer_state: customerState,
        customer_state_code: customerStateCode,
        date,
        items: items.filter((item) => item.particulars.trim()),
        subtotal,
        cgst_rate: cgstRate,
        cgst_amount: cgstAmount,
        sgst_rate: sgstRate,
        sgst_amount: sgstAmount,
        round_off: roundOff,
        total,
        dc_image_url: dcImageUrl,
        dc_image_public_id: dcImagePublicId,
        quotation_image_url: quotationImageUrl,
        quotation_image_public_id: quotationImagePublicId,
        qr_code_url: qrUrl,
        notes,
      };

      await createInvoice(invoiceData);
      toast.success('Invoice created successfully!');
      navigate('/invoices');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create invoice';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // PDF download
  const handleDownloadPDF = async () => {
    if (billBookRef.current) {
      await generatePDF(billBookRef.current, `${invoiceNumber}.pdf`);
      toast.success('PDF downloaded!');
    }
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Build preview data
  const previewInvoice: Invoice = {
    id: '',
    invoice_number: invoiceNumber,
    customer_name: customerName,
    customer_address: customerAddress,
    customer_gstin: customerGstin,
    customer_state: customerState,
    customer_state_code: customerStateCode,
    date,
    items: items.filter((item) => item.particulars.trim()),
    subtotal,
    cgst_rate: cgstRate,
    cgst_amount: cgstAmount,
    sgst_rate: sgstRate,
    sgst_amount: sgstAmount,
    round_off: roundOff,
    total,
    is_printed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div>
      <Header
        title="Create Invoice"
        subtitle={`Invoice #${invoiceNumber}`}
        actions={
          <div className="flex gap-2 no-print">
            <button onClick={() => navigate('/invoices')} className="btn btn-secondary btn-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setShowPreview(!showPreview)} className="btn btn-secondary btn-sm">
              <Eye className="w-4 h-4" /> {showPreview ? 'Edit' : 'Preview'}
            </button>
          </div>
        }
      />

      <div className="p-6">
        {showPreview ? (
          /* ═══ PREVIEW MODE ═══ */
          <div>
            <div className="flex gap-3 mb-4 no-print">
              <button onClick={handlePrint} className="btn btn-secondary btn-sm">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={handleDownloadPDF} className="btn btn-secondary btn-sm">
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Invoice'}
              </button>
            </div>
            {settings && (
              <InvoiceBillBook
                ref={billBookRef}
                invoice={previewInvoice}
                settings={settings}
              />
            )}
          </div>
        ) : (
          /* ═══ FORM MODE ═══ */
          <div className="max-w-5xl space-y-6">
            {/* Invoice Details */}
            <div className="glass-card p-6 animate-fade-in">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Invoice Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Invoice Number</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="form-input"
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Tax Rate (%)</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={cgstRate}
                        onChange={(e) => setCgstRate(Number(e.target.value))}
                        className="form-input"
                        placeholder="CGST"
                        step="0.5"
                      />
                      <span className="text-xs text-gray-400">CGST</span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={sgstRate}
                        onChange={(e) => setSgstRate(Number(e.target.value))}
                        className="form-input"
                        placeholder="SGST"
                        step="0.5"
                      />
                      <span className="text-xs text-gray-400">SGST</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="glass-card p-6 animate-fade-in delay-1" style={{ opacity: 0 }}>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Customer Details</h3>

              {customers.length > 0 && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Select Existing Customer</label>
                  <select
                    value={customerId}
                    onChange={handleCustomerSelect}
                    className="form-input"
                  >
                    <option value="">-- New Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="form-input"
                    placeholder="Customer name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">GSTIN</label>
                  <input
                    type="text"
                    value={customerGstin}
                    onChange={(e) => setCustomerGstin(e.target.value)}
                    className="form-input"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Address</label>
                  <textarea
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="form-input"
                    rows={2}
                    placeholder="Customer address"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">State</label>
                  <input
                    type="text"
                    value={customerState}
                    onChange={(e) => setCustomerState(e.target.value)}
                    className="form-input"
                    placeholder="Tamil Nadu"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">State Code</label>
                  <input
                    type="text"
                    value={customerStateCode}
                    onChange={(e) => setCustomerStateCode(e.target.value)}
                    className="form-input"
                    placeholder="33"
                  />
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="glass-card p-6 animate-fade-in delay-2" style={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Particulars</h3>
                <button onClick={addItem} className="btn btn-secondary btn-sm">
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase p-2 w-12">S.No</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase p-2">Particulars</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase p-2 w-24">Qty</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase p-2 w-28">Rate (₹)</th>
                      <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase p-2 w-32">Amount (₹)</th>
                      <th className="p-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="p-2 text-sm text-gray-500">{item.sno}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.particulars}
                            onChange={(e) => updateItem(item.id, 'particulars', e.target.value)}
                            className="form-input text-sm py-1.5"
                            placeholder="Item description"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={item.quantity || ''}
                            onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                            className="form-input text-sm py-1.5"
                            placeholder="0"
                            min="0"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={item.rate || ''}
                            onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))}
                            className="form-input text-sm py-1.5"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="p-2 text-right text-sm font-medium text-gray-900 dark:text-white">
                          ₹ {item.amount.toFixed(2)}
                        </td>
                        <td className="p-2">
                          {items.length > 1 && (
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-4 ml-auto max-w-xs space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">CGST @ {cgstRate}%</span>
                  <span className="text-gray-700 dark:text-gray-300">₹ {cgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">SGST @ {sgstRate}%</span>
                  <span className="text-gray-700 dark:text-gray-300">₹ {sgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Round Off</span>
                  <span className="text-gray-700 dark:text-gray-300">{roundOff >= 0 ? '+' : ''}₹ {roundOff.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-900 dark:text-white">Grand Total</span>
                  <span className="text-blue-600 dark:text-blue-400">₹ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Image Uploads */}
            <div className="glass-card p-6 animate-fade-in delay-3" style={{ opacity: 0 }}>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Attachments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUpload
                  label="DC Image (Delivery Challan)"
                  value={dcPreview || undefined}
                  onChange={(file, preview) => {
                    setDcFile(file);
                    setDcPreview(preview);
                  }}
                />
                <ImageUpload
                  label="Rate Quotation Image"
                  value={quotationPreview || undefined}
                  onChange={(file, preview) => {
                    setQuotationFile(file);
                    setQuotationPreview(preview);
                  }}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="glass-card p-6 animate-fade-in delay-4" style={{ opacity: 0 }}>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-input"
                rows={3}
                placeholder="Additional notes (optional)"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pb-6">
              <button onClick={() => navigate('/invoices')} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={() => setShowPreview(true)} className="btn btn-secondary">
                <Eye className="w-4 h-4" /> Preview
              </button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Invoice'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
