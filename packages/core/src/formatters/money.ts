export function formatPrice(amount: number, currency: 'USD' | 'EUR' = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPriceCompact(amount: number, currency: 'USD' | 'EUR' = 'USD'): string {
  if (amount >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return formatPrice(amount, currency);
}

export function formatPriceChange(current: number, previous: number): string {
  const change = current - previous;
  const pct = previous > 0 ? (change / previous) * 100 : 0;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}
