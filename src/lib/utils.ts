import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency to Mongolian Togrog (₮) with optional 2 decimal places
export function formatMNT(amount: number | null | undefined, showDecimals: boolean = false): string {
  if (amount === undefined || amount === null || isNaN(amount)) return showDecimals ? '0.00 ₮' : '0 ₮';
  return new Intl.NumberFormat('mn-MN', {
    style: 'currency',
    currency: 'MNT',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount).replace('MNT', '₮');
}

// Format Chinese Yuan (¥)
export function formatYuan(amount: number | null | undefined): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '¥ 0.00';
  return `¥ ${amount.toFixed(2)}`;
}

// Auto generate EAN-13 compatible barcode starting with 869
export function generateBarcode(): string {
  const prefix = '86901'; // Inky Sisters standard prefix
  const random = Math.floor(10000000 + Math.random() * 90000000).toString().substring(0, 7);
  const codeWithoutCheck = prefix + random;
  
  // Calculate check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(codeWithoutCheck[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${codeWithoutCheck}${checkDigit}`;
}

// Generate Order Number INKY-XXXXXX
export function generateOrderNumber(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `INKY-${digits}`;
}

// Real-time instant data sync notifier across browser tabs & admin panel
export function notifyDataSync() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('inky_cached_products');
      localStorage.removeItem('inky_cached_categories');
      localStorage.removeItem('inky_cached_hero_slides');
      localStorage.removeItem('inky_cached_settings');
      localStorage.setItem('inky_last_stock_update', Date.now().toString());

      const channel = new BroadcastChannel('inky_stock_sync');
      channel.postMessage({ type: 'sync', timestamp: Date.now() });
      channel.close();
    } catch (e) {}
  }
}
