import { SettlementReport, AuthorizationReport } from '../types/transaction';

// Toggle verbose debug logging for CSV parsing. Keep false in production for performance.
const DEBUG = false;

export const parseCSV = <T>(csvText: string): T[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Try both tab and comma separators
  const firstLine = lines[0];
  const separator = firstLine.includes('\t') ? '\t' : ',';
  if (DEBUG) console.log('Using separator:', separator === '\t' ? 'tab' : 'comma');
  
  const headers = firstLine.split(separator).map(h => h.trim().replace(/"/g, ''));
  if (DEBUG) console.log('CSV Headers:', headers);
  const data: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
    const row: any = {};

    headers.forEach((header, index) => {
      const value = values[index]?.trim();

      if (value === 'n/a' || value === '') {
        row[header] = null;
      } else if (!isNaN(Number(value)) && value !== '' && value !== null) {
        row[header] = Number(value);
      } else {
        row[header] = value;
      }
    });

    // Log first few rows for debugging
    if (DEBUG && i <= 3) {
      console.log(`Row ${i}:`, row);
    }
    
    data.push(row as T);
  }

  if (DEBUG) console.log('Parsed', data.length, 'records');
  return data;
};

export const parseSettlementReport = (csvText: string): SettlementReport[] => {
  return parseCSV<SettlementReport>(csvText);
};

export const parseAuthorizationReport = (csvText: string): AuthorizationReport[] => {
  return parseCSV<AuthorizationReport>(csvText);
};