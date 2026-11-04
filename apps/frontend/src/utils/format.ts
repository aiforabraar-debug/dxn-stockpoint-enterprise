/**
 * Formatting utilities for currency, dates, and numbers.
 */

import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';

export function money(amount: number, currency = 'BDT'): string {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-BD', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const date = parseISO(isoString);
    return format(date, 'dd MMM yyyy, h:mm a');
  } catch {
    return isoString;
  }
}

export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const date = parseISO(isoString);
    return formatDistanceToNowStrict(date, { addSuffix: true });
  } catch {
    return isoString;
  }
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-BD').format(n);
}

export function formatPv(n: number): string {
  return n.toFixed(2);
}

export function compactMoney(amount: number, currency = 'BDT'): string {
  if (amount >= 100000) {
    return `${money(amount / 100000, currency).replace(/[0-9.,]/g, '')}${Math.floor(amount / 100000)}L`;
  }
  if (amount >= 1000) {
    return `${Math.floor(amount / 1000)}K`;
  }
  return money(amount, currency);
}

export function digits(str: string): string {
  return str.replace(/\D/g, '');
}
