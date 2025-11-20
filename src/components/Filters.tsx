import { PaymentChannel, Timezone, FeeComponent } from '../types/transaction';
import { MultiSelect } from './MultiSelect';
import { countryOptionsFromCodes } from '../utils/countries';

interface FiltersProps {
  startDate: string;
  endDate: string;
  countries: string[];
  availableCountries: string[];
  paymentChannels: PaymentChannel[];
  timezone: Timezone;
  feeComponents: FeeComponent[];
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onCountriesChange: (countries: string[]) => void;
  onPaymentChannelsChange: (channels: PaymentChannel[]) => void;
  onTimezoneChange: (timezone: Timezone) => void;
  onFeeComponentsChange: (components: FeeComponent[]) => void;
}

const PAYMENT_CHANNEL_OPTIONS: PaymentChannel[] = ['Apple Pay', 'Google Pay', 'Card'];

export const Filters = ({
  startDate,
  endDate,
  countries,
  availableCountries,
  paymentChannels,
  timezone,
  feeComponents,
  onStartDateChange,
  onEndDateChange,
  onCountriesChange,
  onPaymentChannelsChange,
  onTimezoneChange,
  onFeeComponentsChange,
}: FiltersProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => onTimezoneChange(e.target.value as Timezone)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="GMT+0">GMT+0</option>
            <option value="GMT+6">GMT+6</option>
          </select>
        </div>

        <div className="md:col-span-2 lg:col-span-1">
          <MultiSelect
            label="Countries"
            options={countryOptionsFromCodes(availableCountries)}
            selected={countries}
            onChange={onCountriesChange}
            placeholder="All countries"
          />
        </div>

        <div className="md:col-span-2 lg:col-span-2">
          <MultiSelect
            label="Payment Channels"
            options={PAYMENT_CHANNEL_OPTIONS as unknown as string[]}
            selected={paymentChannels as unknown as string[]}
            onChange={(vals) => onPaymentChannelsChange(vals as PaymentChannel[])}
            placeholder="All channels"
          />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">Fee Components</label>
          <div className="flex flex-wrap gap-4 bg-white border border-gray-300 rounded-lg px-4 py-3">
            {([
              'transaction_fee',
              'interchange_fee',
              'card_scheme_fee',
              'secure_deposit_amount',
            ] as FeeComponent[]).map((key) => (
              <label key={key} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={feeComponents.includes(key)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onFeeComponentsChange([...feeComponents, key]);
                    } else {
                      onFeeComponentsChange(feeComponents.filter((k) => k !== key));
                    }
                  }}
                />
                <span>{key.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};