import { useMemo, useState } from 'react';
import { TrendingUp, DollarSign, Percent, FileText } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { Filters } from './components/Filters';
import { MetricsCard } from './components/MetricsCard';
import { DataTable } from './components/DataTable';
import { Charts } from './components/Charts';
import { SettlementReport, AuthorizationReport, PaymentChannel, Timezone, FeeComponent } from './types/transaction';
import { parseSettlementReport, parseAuthorizationReport } from './utils/csvParser';
import { calculateMetrics, getUniqueCountries, aggregateMetrics } from './utils/analytics';
import { formatCurrency } from './utils/format';
import { exportAggregatedToCSV, exportAggregatedToXLSX } from './utils/export';

function App() {
  const [settlementData, setSettlementData] = useState<SettlementReport[]>([]);
  const [authorizationData, setAuthorizationData] = useState<AuthorizationReport[]>([]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedPaymentChannels, setSelectedPaymentChannels] = useState<PaymentChannel[]>([]);
  const [timezone, setTimezone] = useState<Timezone>('GMT+0');
  const [selectedFeeComponents, setSelectedFeeComponents] = useState<FeeComponent[]>(['transaction_fee']);

  const handleSettlementUpload = (content: string) => {
    const data = parseSettlementReport(content);
    setSettlementData(data);
  };

  const handleAuthorizationUpload = (content: string) => {
    const data = parseAuthorizationReport(content);
    setAuthorizationData(data);
  };

  const availableCountries = useMemo(() => (
    getUniqueCountries(settlementData, authorizationData)
  ), [settlementData, authorizationData]);

  const metrics = useMemo(() => (
    calculateMetrics(settlementData, authorizationData, {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      countries: selectedCountries,
      paymentChannels: selectedPaymentChannels,
      timezone,
      feeComponents: selectedFeeComponents,
    })
  ), [settlementData, authorizationData, startDate, endDate, selectedCountries, selectedPaymentChannels, timezone, selectedFeeComponents]);

  const aggregated = useMemo(() => aggregateMetrics(metrics), [metrics]);
  const avgApprovalRatio = useMemo(() => (
    aggregated.count > 0 ? aggregated.avgApprovalRatio / aggregated.count : 0
  ), [aggregated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Transaction Analytics Dashboard</h1>
          <p className="text-gray-600">Upload your reports and analyze transaction metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <FileUpload
            label="Settlement Report"
            onFileUpload={handleSettlementUpload}
          />
          <FileUpload
            label="Authorization Report"
            onFileUpload={handleAuthorizationUpload}
          />
        </div>

        {(settlementData.length > 0 || authorizationData.length > 0) && (
          <>
            <Filters
              startDate={startDate}
              endDate={endDate}
              countries={selectedCountries}
              availableCountries={availableCountries}
              paymentChannels={selectedPaymentChannels}
              timezone={timezone}
              feeComponents={selectedFeeComponents}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onCountriesChange={setSelectedCountries}
              onPaymentChannelsChange={setSelectedPaymentChannels}
              onTimezoneChange={setTimezone}
              onFeeComponentsChange={setSelectedFeeComponents}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <MetricsCard
                title="Total Revenue"
                value={formatCurrency(aggregated.totalRevenue)}
                icon={DollarSign}
                color="text-green-600"
                subtext={`${metrics.length} records`}
              />
              <MetricsCard
                title="Total Fees"
                value={formatCurrency(aggregated.totalFees)}
                icon={TrendingUp}
                color="text-blue-600"
                subtext={`${((aggregated.totalFees / aggregated.totalRevenue) * 100 || 0).toFixed(2)}% of revenue`}
              />
              <MetricsCard
                title="Avg Approval Ratio"
                value={`${avgApprovalRatio.toFixed(2)}%`}
                icon={Percent}
                color="text-orange-600"
                subtext="Across all transactions"
              />
            </div>

            <Charts data={metrics} />

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Detailed Breakdown
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  Showing {metrics.length} records
                </span>
                <button
                  onClick={() => exportAggregatedToCSV(metrics)}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                  title="Export CSV"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => exportAggregatedToXLSX(metrics)}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                  title="Export XLSX"
                >
                  Export XLSX
                </button>
              </div>
            </div>

            <DataTable data={metrics} />
          </>
        )}

        {settlementData.length === 0 && authorizationData.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Data Yet</h3>
            <p className="text-gray-500">
              Upload your settlement and authorization reports to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;