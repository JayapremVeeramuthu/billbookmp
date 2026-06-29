import { forwardRef } from 'react';
import { QRCodeBlock } from './QRCodeBlock';
import { formatNumber, numberToWords, formatDate } from '../../lib/utils';
import type { Invoice, CompanySettings } from '../../types';

interface InvoiceBillBookProps {
  invoice: Invoice;
  settings: CompanySettings;
  domain?: string;
}

export const InvoiceBillBook = forwardRef<HTMLDivElement, InvoiceBillBookProps>(
  ({ invoice, settings, domain }, ref) => {
    const publicUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const qrUrl = `${publicUrl}/view/${invoice.invoice_number}`;

    const tableRows = invoice.items || [];

    return (
      <div className="responsive-bill-container">
        <div className="responsive-bill-scaler">
          <div ref={ref} className="bill-book-wrapper">
            <div className="bill-book">
          {/* ═══ OUTER BORDER ═══ */}
          <div className="bill-outer-border">
            <div className="bill-inner-border">

              {/* ═══ HEADER SECTION ═══ */}
              <div className="bill-header">
                <div className="bill-header-left">
                  {settings.logo_url ? (
                    <img src={settings.logo_url} alt="Logo" className="bill-logo" />
                  ) : (
                    <div className="bill-logo-placeholder">
                      <span>MP</span>
                    </div>
                  )}
                </div>

                <div className="bill-header-center">
                  <h1 className="bill-company-name">{settings.company_name || 'MP PRINTS'}</h1>
                  <p className="bill-company-subtitle">Screen Printing Specialists</p>
                  <p className="bill-company-gstin">GSTIN: {settings.gstin || ''}</p>
                  <p className="bill-company-address">{settings.address || ''}</p>
                  <p className="bill-company-phone">Ph: {settings.phone || ''}</p>
                </div>

                <div className="bill-header-right">
                  <QRCodeBlock url={qrUrl} size={85} />
                  <p className="bill-qr-label">Scan for Details</p>
                </div>
              </div>

              {/* ═══ TAX INVOICE TITLE ═══ */}
              <div className="bill-title-row">
                <h2 className="bill-title">TAX INVOICE</h2>
              </div>

              {/* ═══ INVOICE META ═══ */}
              <div className="bill-meta-row">
                <div className="bill-meta-left">
                  <span className="bill-meta-label">Invoice No:</span>
                  <span className="bill-meta-value">{invoice.invoice_number}</span>
                </div>
                <div className="bill-meta-right">
                  <span className="bill-meta-label">Date:</span>
                  <span className="bill-meta-value">{formatDate(invoice.date)}</span>
                </div>
              </div>

              {/* ═══ CUSTOMER DETAILS ═══ */}
              <div className="bill-customer-section">
                <div className="bill-customer-left">
                  <p className="bill-customer-to">To,</p>
                  <p className="bill-customer-name">{invoice.customer_name}</p>
                  <p className="bill-customer-address">{invoice.customer_address || ''}</p>
                </div>
                <div className="bill-customer-right">
                  <p><span className="bill-meta-label">GSTIN:</span> {invoice.customer_gstin || 'N/A'}</p>
                  <p><span className="bill-meta-label">State:</span> {invoice.customer_state || ''}</p>
                  <p><span className="bill-meta-label">State Code:</span> {invoice.customer_state_code || ''}</p>
                </div>
              </div>

              {/* ═══ PARTICULARS TABLE ═══ */}
              <div className="bill-table-container">
                <table className="bill-table">
                  <thead>
                    <tr>
                      <th className="bill-th bill-th-sno">S.No</th>
                      <th className="bill-th bill-th-particulars">Particulars</th>
                      <th className="bill-th bill-th-qty">Qty</th>
                      <th className="bill-th bill-th-rate">Rate</th>
                      <th className="bill-th bill-th-amount">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((item, index) => (
                      <tr key={item.id || index}>
                        <td className="bill-td bill-td-sno">{item.sno || ''}</td>
                        <td className="bill-td bill-td-particulars">{item.particulars || ''}</td>
                        <td className="bill-td bill-td-qty">{item.quantity ? item.quantity : ''}</td>
                        <td className="bill-td bill-td-rate">{item.rate ? formatNumber(item.rate) : ''}</td>
                        <td className="bill-td bill-td-amount">{item.amount ? formatNumber(item.amount) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ═══ TOTALS SECTION ═══ */}
              <div className="bill-totals">
                <div className="bill-totals-row">
                  <span className="bill-totals-label">Sub Total</span>
                  <span className="bill-totals-value">{formatNumber(invoice.subtotal)}</span>
                </div>
                <div className="bill-totals-row">
                  <span className="bill-totals-label">CGST @ {invoice.cgst_rate}%</span>
                  <span className="bill-totals-value">{formatNumber(invoice.cgst_amount)}</span>
                </div>
                <div className="bill-totals-row">
                  <span className="bill-totals-label">SGST @ {invoice.sgst_rate}%</span>
                  <span className="bill-totals-value">{formatNumber(invoice.sgst_amount)}</span>
                </div>
                <div className="bill-totals-row">
                  <span className="bill-totals-label">Round Off</span>
                  <span className="bill-totals-value">{invoice.round_off >= 0 ? '+' : ''}{formatNumber(invoice.round_off)}</span>
                </div>
                <div className="bill-totals-row bill-grand-total">
                  <span className="bill-totals-label">GRAND TOTAL</span>
                  <span className="bill-totals-value">₹ {formatNumber(invoice.total)}</span>
                </div>
              </div>

              {/* ═══ AMOUNT IN WORDS ═══ */}
              <div className="bill-words-row">
                <span className="bill-words-label">Amount in Words:</span>
                <span className="bill-words-value">{numberToWords(invoice.total)}</span>
              </div>

              {/* ═══ FOOTER: BANK + SIGNATURE ═══ */}
              <div className="bill-footer">
                <div className="bill-bank-details">
                  <p className="bill-bank-title">Bank Details:</p>
                  <p>Bank: {settings.bank_name || ''}</p>
                  <p>A/C No: {settings.account_number || ''}</p>
                  <p>IFSC: {settings.ifsc_code || ''}</p>
                  <p>Branch: {settings.branch || ''}</p>
                </div>
                <div className="bill-signature">
                  <p className="bill-signature-for">For {settings.company_name || 'MP PRINTS'}</p>
                  <div className="bill-signature-space"></div>
                  <p className="bill-signature-label">Authorized Signatory</p>
                </div>
              </div>

              {/* ═══ BOTTOM NOTE ═══ */}
              <div className="bill-note">
                <p>Subject to Sivakasi Jurisdiction. E. & O.E.</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
    );
  }
);

InvoiceBillBook.displayName = 'InvoiceBillBook';
