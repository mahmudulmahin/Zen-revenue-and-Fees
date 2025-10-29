export const formatCurrency = (amount: number, currency: string = 'USD', locale: string = 'en-US') => {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
  } catch {
    // Fallback
    return `$${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

export const formatDateDisplay = (isoDate: string) => {
  // Expecting YYYY-MM-DD (already bucketed) or ISO string. Return readable format.
  if (!isoDate) return '';
  // If already YYYY-MM-DD, keep it consistent for display or convert to locale
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    const d = new Date(`${isoDate}T00:00:00Z`);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
  }
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
};

export const formatDateForFile = (isoDate: string) => {
  // Normalize to YYYY-MM-DD for CSV/XLSX
  if (!isoDate) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
