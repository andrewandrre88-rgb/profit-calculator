import { CurrencyCode, ExchangeRates } from '../types';

// Default rates relative to USD (1 USD = X in target currency)
export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  USD: 1.0,
  CNY: 7.24, // 1 USD = 7.24 RMB / Chinese Yuan
  MAD: 9.95, // 1 USD = 9.95 MAD / Moroccan Dirham
  EGP: 48.60, // 1 USD = 48.60 EGP / Egyptian Pound
  EUR: 0.92, // 1 USD = 0.92 EUR
  GBP: 0.78, // 1 USD = 0.78 GBP
  AUD: 1.52, // 1 USD = 1.52 AUD
  CAD: 1.38, // 1 USD = 1.38 CAD
};

export const CURRENCY_INFO: Record<
  CurrencyCode,
  { name: string; symbol: string; flag: string; nativeSymbol: string }
> = {
  CNY: { name: 'Chinese Yuan (RMB)', symbol: '¥', flag: '🇨🇳', nativeSymbol: '¥' },
  USD: { name: 'US Dollar', symbol: '$', flag: '🇺🇸', nativeSymbol: '$' },
  MAD: { name: 'Moroccan Dirham (MAD)', symbol: 'DH', flag: '🇲🇦', nativeSymbol: 'د.م.' },
  EGP: { name: 'Egyptian Pound (EGP)', symbol: 'E£', flag: '🇪🇬', nativeSymbol: 'ج.م.' },
  EUR: { name: 'Euro', symbol: '€', flag: '🇪🇺', nativeSymbol: '€' },
  GBP: { name: 'British Pound', symbol: '£', flag: '🇬🇧', nativeSymbol: '£' },
  AUD: { name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', nativeSymbol: '$' },
  CAD: { name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', nativeSymbol: '$' },
};

// Prominent sourcing currencies explicitly requested by the user
export const KEY_SOURCING_CURRENCIES: CurrencyCode[] = ['CNY', 'USD', 'MAD', 'EGP'];
export const ALL_CURRENCIES: CurrencyCode[] = ['CNY', 'USD', 'MAD', 'EGP', 'EUR', 'GBP', 'AUD', 'CAD'];

/**
 * Convert an amount from one currency to another using the USD-based exchange rate table
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ExchangeRates = DEFAULT_EXCHANGE_RATES,
  bufferPercent: number = 0 // e.g. 1.5 for 1.5% FX buffer
): number {
  if (from === to) return amount;
  if (!amount || isNaN(amount)) return 0;

  // Convert `from` to USD first
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;

  const inUSD = amount / fromRate;
  let inTarget = inUSD * toRate;

  // If buffer is applied and converting from foreign currency to CNY or vice versa
  if (bufferPercent !== 0) {
    inTarget = inTarget * (1 + bufferPercent / 100);
  }

  // Prevent floating point drift (e.g. 0.30000000000000004 -> 0.3)
  return Math.round((inTarget + Number.EPSILON) * 100000000) / 100000000;
}

/**
 * Cleanly rounds a number to avoid float drift, keeping up to `maxDecimals` without trailing float errors.
 */
export function roundClean(value: number, maxDecimals: number = 6): number {
  if (!value || isNaN(value)) return 0;
  const factor = Math.pow(10, maxDecimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Formats a unit quotation price cleanly with high precision, avoiding both loss of micro-cents
 * and ugly excessive trailing zeroes (e.g., 0.30 RMB -> ¥0.30, 0.0414 USD -> $0.0414).
 */
export function formatCardUnit(val: number, currency: CurrencyCode): string {
  const symbol = CURRENCY_INFO[currency]?.symbol || '';
  if (!val || isNaN(val)) return `${symbol}0.00`;

  // Check if it cleanly rounds to 2 decimals without losing value (e.g. 0.30, 0.35, 1.50)
  const rounded2 = Math.round(val * 100) / 100;
  if (Math.abs(val - rounded2) < 0.00001) {
    return `${symbol}${rounded2.toFixed(2)}`;
  }

  // For small fractional units (< 1) with micro-cents (like 0.0414 or 0.0483):
  if (Math.abs(val) < 1) {
    const rounded4 = Math.round(val * 10000) / 10000;
    return `${symbol}${rounded4.toFixed(4)}`;
  }

  // For values >= 1 with 3 decimal precision
  const rounded3 = Math.round(val * 1000) / 1000;
  return `${symbol}${rounded3.toFixed(3)}`;
}

/**
 * Format money with smart precision.
 * For tiny margins/prices (like 0.05, 0.34, 0.008), allows up to 3 or 4 decimals so nothing is lost.
 */
export function formatMoney(
  amount: number,
  currency: CurrencyCode,
  decimals: number = 2,
  includeSymbol: boolean = true
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return includeSymbol ? `${CURRENCY_INFO[currency].symbol}0.00` : '0.00';
  }

  // If amount has tiny fractions (like < 1 and has non-zero 3rd or 4th decimal) and decimals requested is 2,
  // we automatically bump to 3 or 4 decimals if needed so micro-margins aren't rounded to 0
  const absAmount = Math.abs(amount);
  let effectiveDecimals = decimals;
  if (decimals === 2 && absAmount > 0 && absAmount < 1) {
    const fractionPart = absAmount - Math.floor(absAmount);
    // check if it has 3rd or 4th decimal place
    const rounded2 = Number(absAmount.toFixed(2));
    if (Math.abs(rounded2 - absAmount) > 0.0001) {
      effectiveDecimals = 3;
    }
    if (absAmount < 0.1) {
      effectiveDecimals = 4;
    }
  }

  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: effectiveDecimals,
    maximumFractionDigits: effectiveDecimals,
  });

  const symbol = CURRENCY_INFO[currency]?.symbol || '';
  return includeSymbol ? `${symbol}${formatted}` : formatted;
}

/**
 * Get direct conversion rate between two currencies (e.g. 1 USD = ? CNY, or 1 CNY = ? USD)
 */
export function getExchangeRatePair(
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ExchangeRates
): number {
  if (from === to) return 1;
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;
  return toRate / fromRate;
}
