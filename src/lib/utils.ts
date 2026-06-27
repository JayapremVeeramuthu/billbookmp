import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency Formatting ────────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Date Formatting ────────────────────────────────────────
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ─── Number to Words (Indian) ───────────────────────────────
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitWords(n: number): string {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
}

export function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';

  const intPart = Math.floor(Math.abs(num));
  const paisePart = Math.round((Math.abs(num) - intPart) * 100);

  let words = '';

  if (intPart === 0) {
    words = 'Zero';
  } else {
    const crore = Math.floor(intPart / 10000000);
    const lakh = Math.floor((intPart % 10000000) / 100000);
    const thousand = Math.floor((intPart % 100000) / 1000);
    const hundred = Math.floor((intPart % 1000) / 100);
    const remainder = intPart % 100;

    if (crore > 0) words += twoDigitWords(crore) + ' Crore ';
    if (lakh > 0) words += twoDigitWords(lakh) + ' Lakh ';
    if (thousand > 0) words += twoDigitWords(thousand) + ' Thousand ';
    if (hundred > 0) words += ones[hundred] + ' Hundred ';
    if (remainder > 0) {
      if (words) words += 'and ';
      words += twoDigitWords(remainder);
    }
  }

  words = words.trim() + ' Rupees';

  if (paisePart > 0) {
    words += ' and ' + twoDigitWords(paisePart) + ' Paise';
  }

  return words + ' Only';
}

// ─── Invoice Number Generator ───────────────────────────────
export function generateInvoiceNumber(sequence: number): string {
  return `INV${String(sequence).padStart(6, '0')}`;
}

// ─── Round Off Calculator ───────────────────────────────────
export function calculateRoundOff(amount: number): { roundOff: number; rounded: number } {
  const rounded = Math.round(amount);
  const roundOff = Number((rounded - amount).toFixed(2));
  return { roundOff, rounded };
}

// ─── File Validation ────────────────────────────────────────
const ALLOWED_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only PNG, JPG, JPEG, and WEBP files are allowed.' };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size must be under 20MB.' };
  }
  return { valid: true };
}

// ─── Generate unique ID ────────────────────────────────────
export function generateId(): string {
  return crypto.randomUUID();
}
