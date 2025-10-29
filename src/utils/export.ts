import { DashboardMetrics } from '../types/transaction';
import { codeToCountryName } from './countries';
import { formatCurrency, formatDateForFile } from './format';

export const exportMetricsToCSV = (rows: DashboardMetrics[], filename = 'detailed_breakdown.csv', currency = 'USD') => {
  const header = ['date', 'country', 'revenue', 'fees'];
  const csvRows = [header.join(',')];

  for (const r of rows) {
    const date = formatDateForFile(r.date);
    const country = codeToCountryName(r.country);
    const revenue = formatCurrency(r.revenue, currency);
    const fees = formatCurrency(r.fees, currency);
    // Keep comma separation safe by quoting fields that may include commas (currency symbol)
    csvRows.push([date, country, revenue, fees].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Aggregation helpers and exporters (date + country)
type AggRow = {
  date: string; // YYYY-MM-DD
  country: string; // full name
  revenue: number;
  fees: number;
  accepted: number;
  total: number;
};

const aggregateByDateCountry = (rows: DashboardMetrics[]): AggRow[] => {
  const map = new Map<string, AggRow>();
  for (const r of rows) {
    const date = formatDateForFile(r.date);
    const country = codeToCountryName(r.country);
    const key = `${date}__${country}`;
    const existing = map.get(key);
    if (existing) {
      existing.revenue += r.revenue || 0;
      existing.fees += r.fees || 0;
      existing.accepted += r.acceptedTransactions || 0;
      existing.total += r.totalTransactions || 0;
    } else {
      map.set(key, {
        date,
        country,
        revenue: r.revenue || 0,
        fees: r.fees || 0,
        accepted: r.acceptedTransactions || 0,
        total: r.totalTransactions || 0,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date) || a.country.localeCompare(b.country));
};

export const exportAggregatedToCSV = (rows: DashboardMetrics[], filename = 'detailed_breakdown_aggregated.csv', currency = 'USD') => {
  const aggs = aggregateByDateCountry(rows);
  const header = ['date', 'country', 'revenue', 'fees', 'approval_ratio'];
  const csvRows = [header.join(',')];
  for (const a of aggs) {
    const approvalPct = a.total > 0 ? (a.accepted / a.total) * 100 : 0;
    const revenue = formatCurrency(a.revenue, currency);
    const fees = formatCurrency(a.fees, currency);
    const row = [a.date, a.country, revenue, fees, `${approvalPct.toFixed(2)}%`]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`) // quote fields
      .join(',');
    csvRows.push(row);
  }
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportAggregatedToXLSX = async (rows: DashboardMetrics[], filename = 'detailed_breakdown_aggregated.xlsx') => {
  try {
    const XLSX = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm');
    const aggs = aggregateByDateCountry(rows);
    const data = aggs.map((a) => ({
      date: a.date,
      country: a.country,
      revenue: a.revenue,
      fees: a.fees,
      approval_ratio: a.total > 0 ? a.accepted / a.total : 0, // fraction; we'll format as percent
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Breakdown');

    // Determine header positions
    const headers = ['date', 'country', 'revenue', 'fees', 'approval_ratio'];
    const headerToCol = (name: string) => {
      const idx = headers.indexOf(name); // 0-based
      let s = '';
      let n = idx + 1;
      while (n > 0) {
        const m = (n - 1) % 26;
        s = String.fromCharCode(65 + m) + s;
        n = Math.floor((n - m) / 26);
      }
      return s;
    };

    const revCol = headerToCol('revenue');
    const feeCol = headerToCol('fees');
    const aprCol = headerToCol('approval_ratio');
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = 1; R <= range.e.r; R++) {
      const rRef = `${revCol}${R + 1}`;
      const fRef = `${feeCol}${R + 1}`;
      const aRef = `${aprCol}${R + 1}`;
      if (ws[rRef]) ws[rRef].z = "$#,##0.00";
      if (ws[fRef]) ws[fRef].z = "$#,##0.00";
      if (ws[aRef]) ws[aRef].z = "0.00%";
    }

    XLSX.writeFile(wb, filename);
  } catch (e) {
    alert('XLSX export requires network access to the CDN. If offline, please use CSV export.');
  }
};

// Optional XLSX export (requires sheetjs). If xlsx is unavailable, we fall back to CSV or alert.
export const exportMetricsToXLSX = async (rows: DashboardMetrics[], filename = 'detailed_breakdown.xlsx') => {
  try {
    // Use CDN ESM build to avoid requiring a local dependency. Vite will not pre-bundle due to vite-ignore.
    const XLSX = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm');
    const data = rows.map((r) => ({
      date: formatDateForFile(r.date),
      country: codeToCountryName(r.country),
      revenue: r.revenue,
      fees: r.fees,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Breakdown');

    // Apply currency formatting (basic)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = 1; R <= range.e.r; R++) {
      for (const col of ['C', 'D']) {
        const cellRef = `${col}${R + 1}`;
        if (ws[cellRef]) {
          ws[cellRef].z = "$#,##0.00";
        }
      }
    }

    XLSX.writeFile(wb, filename);
  } catch (e) {
    alert('XLSX export requires the \"xlsx\" package. Please install it, or use CSV export.');
  }
};
