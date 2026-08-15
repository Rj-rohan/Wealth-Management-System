export function formatCurrency(amount: number, currencyCode: string = 'INR'): string {
  // Common currency mappings (for formatting symbol if Intl fails or we want custom behavior)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
