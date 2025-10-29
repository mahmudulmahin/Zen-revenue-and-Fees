import { SettlementReport, AuthorizationReport, DashboardMetrics, PaymentChannel, Timezone } from '../types/transaction';
import { adjustTimezone, formatDate } from './timezone';

// Toggle verbose debug logging for analytics. Keep false in production for performance.
const DEBUG = false;

interface FilterOptions {
  startDate?: string;
  endDate?: string;
  countries: string[];
  paymentChannels: PaymentChannel[];
  timezone: Timezone;
}

export const calculateMetrics = (
  settlementData: SettlementReport[],
  authorizationData: AuthorizationReport[],
  filters: FilterOptions
): DashboardMetrics[] => {
  if (DEBUG) {
    console.log('Settlement data length:', settlementData.length);
    console.log('Authorization data length:', authorizationData.length);
    console.log('Filters:', filters);
  }
  
  const metricsMap = new Map<string, DashboardMetrics>();

  // Process settlement data
  settlementData.forEach(record => {
    if (DEBUG) {
      console.log('Processing settlement record:', {
        transaction_amount: record.transaction_amount,
        customer_country: record.customer_country,
        payment_channel: record.payment_channel,
        accepted_at: record.accepted_at,
        created_at: record.created_at
      });
    }
    
    // Try multiple date fields for settlement data
    let date = adjustTimezone(record.accepted_at, filters.timezone);
    if (!date) {
      date = adjustTimezone(record.created_at, filters.timezone);
    }
    if (!date) {
      if (DEBUG) console.log('Skipping settlement record - no valid date');
      return;
    }

    const dateStr = formatDate(date);
    if (DEBUG) console.log('Settlement record date:', dateStr);

    // Apply filters
    if (filters.startDate && dateStr < filters.startDate) {
      if (DEBUG) console.log('Filtered out by start date:', dateStr, '<', filters.startDate);
      return;
    }
    if (filters.endDate && dateStr > filters.endDate) {
      if (DEBUG) console.log('Filtered out by end date:', dateStr, '>', filters.endDate);
      return;
    }
    if (filters.countries.length > 0 && !filters.countries.includes(record.customer_country)) {
      if (DEBUG) console.log('Filtered out by country:', record.customer_country, 'not in', filters.countries);
      return;
    }
    if (filters.paymentChannels.length > 0 && !filters.paymentChannels.includes(record.payment_channel as PaymentChannel)) {
      if (DEBUG) console.log('Filtered out by payment channel:', record.payment_channel, 'not in', filters.paymentChannels);
      return;
    }

    const key = `${dateStr}_${record.customer_country}_${record.payment_channel}`;
    if (DEBUG) console.log('Settlement record key:', key);

    if (!metricsMap.has(key)) {
      metricsMap.set(key, {
        date: dateStr,
        country: record.customer_country,
        paymentChannel: record.payment_channel,
        revenue: 0,
        fees: 0,
        approvalRatio: 0,
        totalTransactions: 0,
        acceptedTransactions: 0,
      });
    }

    const metrics = metricsMap.get(key)!;
    const amount = Number(record.transaction_amount) || 0;
    metrics.revenue += amount;
    if (DEBUG) console.log('Added revenue:', amount, 'Total now:', metrics.revenue);
    
    // Calculate fees more accurately
    const totalFees = (Number(record.transaction_fee) || 0) + 
                     (Number(record.interchange_fee) || 0) + 
                     (Number(record.card_scheme_fee) || 0);
    metrics.fees += totalFees;
    if (DEBUG) console.log('Added fees:', totalFees, 'Total now:', metrics.fees);
  });

  // Process authorization data
  authorizationData.forEach(record => {
    if (DEBUG) {
      console.log('Processing authorization record:', {
        transaction_state: record.transaction_state,
        customer_country: record.customer_country,
        payment_channel: record.payment_channel,
        created_at: record.created_at
      });
    }
    
    const date = adjustTimezone(record.created_at, filters.timezone);
    if (!date) {
      if (DEBUG) console.log('Skipping authorization record - no valid date');
      return;
    }

    const dateStr = formatDate(date);
    if (DEBUG) console.log('Authorization record date:', dateStr);

    // Apply filters
    if (filters.startDate && dateStr < filters.startDate) {
      if (DEBUG) console.log('Auth filtered out by start date:', dateStr, '<', filters.startDate);
      return;
    }
    if (filters.endDate && dateStr > filters.endDate) {
      if (DEBUG) console.log('Auth filtered out by end date:', dateStr, '>', filters.endDate);
      return;
    }
    if (filters.countries.length > 0 && !filters.countries.includes(record.customer_country)) {
      if (DEBUG) console.log('Auth filtered out by country:', record.customer_country, 'not in', filters.countries);
      return;
    }
    if (filters.paymentChannels.length > 0 && !filters.paymentChannels.includes(record.payment_channel as PaymentChannel)) {
      if (DEBUG) console.log('Auth filtered out by payment channel:', record.payment_channel, 'not in', filters.paymentChannels);
      return;
    }

    const key = `${dateStr}_${record.customer_country}_${record.payment_channel}`;
    if (DEBUG) console.log('Authorization record key:', key);

    if (!metricsMap.has(key)) {
      metricsMap.set(key, {
        date: dateStr,
        country: record.customer_country,
        paymentChannel: record.payment_channel,
        revenue: 0,
        fees: 0,
        approvalRatio: 0,
        totalTransactions: 0,
        acceptedTransactions: 0,
      });
    }

    const metrics = metricsMap.get(key)!;
    metrics.totalTransactions += 1;
    if (record.transaction_state === 'ACCEPTED') {
      metrics.acceptedTransactions += 1;
    }
    if (DEBUG) console.log('Auth transactions - Total:', metrics.totalTransactions, 'Accepted:', metrics.acceptedTransactions);
  });

  // Calculate approval ratios
  const metricsArray = Array.from(metricsMap.values());
  if (DEBUG) {
    console.log('Final metrics array length:', metricsArray.length);
    console.log('Sample metrics:', metricsArray[0]);
  }
  
  metricsArray.forEach(metric => {
    if (metric.totalTransactions > 0) {
      metric.approvalRatio = (metric.acceptedTransactions / metric.totalTransactions) * 100;
    }
  });

  return metricsArray.sort((a, b) => a.date.localeCompare(b.date));
};

export const getUniqueCountries = (
  settlementData: SettlementReport[],
  authorizationData: AuthorizationReport[]
): string[] => {
  const countries = new Set<string>();
  settlementData.forEach(r => countries.add(r.customer_country));
  authorizationData.forEach(r => countries.add(r.customer_country));
  return Array.from(countries).sort();
};

export const aggregateMetrics = (metrics: DashboardMetrics[]) => {
  return metrics.reduce(
    (acc, curr) => ({
      totalRevenue: acc.totalRevenue + curr.revenue,
      totalFees: acc.totalFees + curr.fees,
      avgApprovalRatio: acc.avgApprovalRatio + curr.approvalRatio,
      count: acc.count + 1,
    }),
    { totalRevenue: 0, totalFees: 0, avgApprovalRatio: 0, count: 0 }
  );
};

// --- Aggregations for charts ---

export interface DateSeriesPoint {
  date: string;
  revenue: number;
  fees: number;
  approvalRatio: number; // percent
  totalTransactions: number;
  acceptedTransactions: number;
}

export interface CountrySeriesPoint {
  country: string;
  revenue: number;
  fees: number;
  approvalRatio: number; // percent
  totalTransactions: number;
  acceptedTransactions: number;
}

// Groups by date and aggregates, computing weighted approval ratio
export const buildDateSeries = (metrics: DashboardMetrics[]): DateSeriesPoint[] => {
  const map = new Map<string, DateSeriesPoint>();
  metrics.forEach(m => {
    const key = m.date;
    if (!map.has(key)) {
      map.set(key, {
        date: m.date,
        revenue: 0,
        fees: 0,
        approvalRatio: 0,
        totalTransactions: 0,
        acceptedTransactions: 0,
      });
    }
    const agg = map.get(key)!;
    agg.revenue += m.revenue;
    agg.fees += m.fees;
    agg.totalTransactions += m.totalTransactions;
    agg.acceptedTransactions += m.acceptedTransactions;
  });

  const arr = Array.from(map.values());
  arr.forEach(a => {
    a.approvalRatio = a.totalTransactions > 0 ? (a.acceptedTransactions / a.totalTransactions) * 100 : 0;
  });
  return arr.sort((a, b) => a.date.localeCompare(b.date));
};

// Groups by country and aggregates, computing weighted approval ratio
export const buildCountrySeries = (metrics: DashboardMetrics[]): CountrySeriesPoint[] => {
  const map = new Map<string, CountrySeriesPoint>();
  metrics.forEach(m => {
    const key = m.country;
    if (!map.has(key)) {
      map.set(key, {
        country: m.country,
        revenue: 0,
        fees: 0,
        approvalRatio: 0,
        totalTransactions: 0,
        acceptedTransactions: 0,
      });
    }
    const agg = map.get(key)!;
    agg.revenue += m.revenue;
    agg.fees += m.fees;
    agg.totalTransactions += m.totalTransactions;
    agg.acceptedTransactions += m.acceptedTransactions;
  });

  const arr = Array.from(map.values());
  arr.forEach(a => {
    a.approvalRatio = a.totalTransactions > 0 ? (a.acceptedTransactions / a.totalTransactions) * 100 : 0;
  });
  return arr.sort((a, b) => b.revenue - a.revenue);
};