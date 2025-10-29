import React, { useMemo, useRef, useState } from 'react';
import { DashboardMetrics } from '../types/transaction';
import { buildCountrySeries, buildDateSeries } from '../utils/analytics';
import { codeToCountryName } from '../utils/countries';
import { formatCurrency } from '../utils/format';

interface ChartsProps {
  data: DashboardMetrics[];
}

// Generic card wrapper with toolbar and fullscreen support
const ChartCard: React.FC<{
  title: string;
  right?: React.ReactNode; // toolbar info metrics
  children: React.ReactNode | ((isFullscreen: boolean) => React.ReactNode);
}> = ({ title, right, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`bg-white rounded-lg shadow ${isFullscreen ? 'p-6 h-screen w-screen flex flex-col' : 'p-4'}`}
    >
      <div className={`flex items-center justify-between ${isFullscreen ? 'mb-4' : 'mb-2'}`}>
        <h3 className={`font-semibold text-gray-800 ${isFullscreen ? 'text-xl' : 'text-md'}`}>{title}</h3>
        <div className="flex items-center gap-2">
          {right}
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 font-medium"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? '✕ Exit Fullscreen' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>
      <div className={isFullscreen ? 'flex-1 overflow-auto min-h-0' : ''}>
        {typeof children === 'function' ? children(isFullscreen) : children}
      </div>
    </div>
  );
};

const LineChart = ({
  pointsA,
  pointsB,
  labels,
  height = 200,
  padding = 28,
  colorA = '#2563eb',
  colorB = '#16a34a',
  fmt = (n: number) => n.toFixed(0),
  isFullscreen = false,
  labelA = 'Series A',
  labelB = 'Series B',
}: {
  pointsA: number[];
  pointsB?: number[];
  labels: string[];
  height?: number;
  padding?: number;
  colorA?: string;
  colorB?: string;
  fmt?: (n: number) => string;
  isFullscreen?: boolean;
  labelA?: string;
  labelB?: string;
}) => {
  const baseWidth = Math.max(labels.length * 48, 360);
  const width = isFullscreen ? Math.max(baseWidth, window.innerWidth - 100) : baseWidth;
  const finalHeight = isFullscreen ? window.innerHeight - 180 : height; // Use viewport height minus header/padding
  const topPadding = padding;
  const bottomPadding = isFullscreen ? 100 : padding; // Extra space for rotated labels
  const innerW = width - padding * 2;
  const innerH = finalHeight - topPadding - bottomPadding;

  const allVals = [...pointsA, ...(pointsB ?? [])];
  const max = Math.max(1, Math.max(...allVals, 0));
  const min = Math.min(0, Math.min(...allVals, 0));

  const yScale = (v: number) => {
    if (max === min) return topPadding + innerH / 2;
    return topPadding + innerH - ((v - min) / (max - min)) * innerH;
  };
  const xScale = (i: number) => padding + (labels.length <= 1 ? innerW / 2 : (i * innerW) / (labels.length - 1));

  const toPath = (arr: number[]) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(v)}`).join(' ');

  // Smart label display: show fewer labels if there are too many
  const labelStep = isFullscreen 
    ? Math.max(1, Math.floor(labels.length / 15))
    : Math.max(1, Math.floor(labels.length / 8));
  const fontSize = isFullscreen ? 14 : 10;
  const lineWidth = isFullscreen ? 3 : 2;

  return (
    <div>
      {/* Legend */}
      <div className={`flex items-center gap-4 mb-3 ${isFullscreen ? 'justify-center' : 'justify-start'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-0.5 bg-[${colorA}]`} style={{ backgroundColor: colorA }}></div>
          <span className={`text-sm text-gray-600 ${isFullscreen ? 'text-base' : ''}`}>{labelA}</span>
        </div>
        {pointsB && (
          <div className="flex items-center gap-2">
            <div className={`w-3 h-0.5 bg-[${colorB}]`} style={{ backgroundColor: colorB }}></div>
            <span className={`text-sm text-gray-600 ${isFullscreen ? 'text-base' : ''}`}>{labelB}</span>
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <svg width={width} height={finalHeight}>
          <line x1={padding} x2={padding} y1={topPadding} y2={topPadding + innerH} stroke="#e5e7eb" strokeWidth={isFullscreen ? 2 : 1} />
          <line x1={padding} x2={padding + innerW} y1={topPadding + innerH} y2={topPadding + innerH} stroke="#e5e7eb" strokeWidth={isFullscreen ? 2 : 1} />
          {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
            const y = topPadding + t * innerH;
            return <line key={idx} x1={padding} x2={padding + innerW} y1={y} y2={y} stroke="#f3f4f6" strokeWidth={isFullscreen ? 1.5 : 1} />;
          })}
          <path d={toPath(pointsA)} fill="none" stroke={colorA} strokeWidth={lineWidth} />
          {pointsB && <path d={toPath(pointsB)} fill="none" stroke={colorB} strokeWidth={lineWidth} />}
          {labels.map((l, i) => {
            if (i % labelStep !== 0 && i !== labels.length - 1) return null;
            const labelY = topPadding + innerH + (isFullscreen ? 20 : 14);
            return (
              <text 
                key={i} 
                x={xScale(i)} 
                y={labelY} 
                fontSize={fontSize} 
                textAnchor={isFullscreen ? "end" : "middle"}
                fill="#6b7280"
                transform={isFullscreen ? `rotate(-45 ${xScale(i)} ${labelY})` : undefined}
              >
                {l}
              </text>
            );
          })}
          {[min, (min + max) / 2, max].map((v, i) => (
            <text key={i} x={isFullscreen ? 5 : 0} y={yScale(v) + 4} fontSize={fontSize} fill="#6b7280">
              {fmt(v)}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};

const BarChart = ({
  valuesA,
  valuesB,
  labels,
  height = 240,
  barColorA = '#2563eb',
  barColorB = '#16a34a',
  fmt = (n: number) => n.toFixed(0),
  isFullscreen = false,
  labelA = 'Series A',
  labelB = 'Series B',
}: {
  valuesA: number[];
  valuesB?: number[];
  labels: string[];
  height?: number;
  barColorA?: string;
  barColorB?: string;
  fmt?: (n: number) => string;
  isFullscreen?: boolean;
  labelA?: string;
  labelB?: string;
}) => {
  const padding = 28;
  const baseWidth = Math.max(labels.length * 56, 360);
  const width = isFullscreen ? Math.max(baseWidth, window.innerWidth - 100) : baseWidth;
  const finalHeight = isFullscreen ? window.innerHeight - 180 : height; // Use viewport height minus header/padding
  const topPadding = padding;
  const bottomPadding = isFullscreen ? 100 : padding;
  const innerW = width - padding * 2;
  const innerH = finalHeight - topPadding - bottomPadding;

  const combined = valuesB ? valuesA.map((v, i) => Math.max(v, valuesB[i] ?? 0)) : valuesA.slice();
  const max = Math.max(1, Math.max(...combined, 0));

  const barGroupW = innerW / Math.max(1, labels.length);
  const barW = valuesB ? (barGroupW - 8) / 2 : Math.min(28, barGroupW - 8);

  const yScale = (v: number) => topPadding + innerH - (v / max) * innerH;

  const fontSize = isFullscreen ? 14 : 10;
  const labelStep = isFullscreen 
    ? Math.max(1, Math.floor(labels.length / 12))
    : Math.max(1, Math.floor(labels.length / 8));

  return (
    <div>
      {/* Legend */}
      <div className={`flex items-center gap-4 mb-3 ${isFullscreen ? 'justify-center' : 'justify-start'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded`} style={{ backgroundColor: barColorA }}></div>
          <span className={`text-sm text-gray-600 ${isFullscreen ? 'text-base' : ''}`}>{labelA}</span>
        </div>
        {valuesB && (
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded`} style={{ backgroundColor: barColorB }}></div>
            <span className={`text-sm text-gray-600 ${isFullscreen ? 'text-base' : ''}`}>{labelB}</span>
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <svg width={width} height={finalHeight}>
          <line x1={padding} x2={padding + innerW} y1={topPadding + innerH} y2={topPadding + innerH} stroke="#e5e7eb" strokeWidth={isFullscreen ? 2 : 1} />
          {labels.map((l, i) => {
            const x = padding + i * barGroupW + (barGroupW - (valuesB ? 2 * barW + 4 : barW)) / 2;
            const a = valuesA[i] ?? 0;
            const b = valuesB ? valuesB[i] ?? 0 : 0;
            const hA = (a / max) * innerH;
            const hB = (b / max) * innerH;
            const showLabel = i % labelStep === 0 || i === labels.length - 1;
            return (
              <g key={i}>
                <rect x={x} y={topPadding + innerH - hA} width={barW} height={hA} fill={barColorA} rx={3} />
                {valuesB && (
                  <rect x={x + barW + 4} y={topPadding + innerH - hB} width={barW} height={hB} fill={barColorB} rx={3} />
                )}
                {showLabel && (
                  <text 
                    x={x + (valuesB ? barW : barW / 2)} 
                    y={topPadding + innerH + (isFullscreen ? 20 : 12)} 
                    fontSize={fontSize} 
                    textAnchor={isFullscreen ? "end" : "middle"}
                    fill="#6b7280"
                    transform={isFullscreen ? `rotate(-45 ${x + (valuesB ? barW : barW / 2)} ${topPadding + innerH + 20})` : undefined}
                  >
                    {l}
                  </text>
                )}
              </g>
            );
          })}
          {[0, 0.5, 1].map((t, i) => {
            const val = t * max;
            const y = yScale(val);
            return (
              <g key={i}>
                <line x1={padding} x2={padding + innerW} y1={y} y2={y} stroke="#f3f4f6" strokeWidth={isFullscreen ? 1.5 : 1} />
                <text x={isFullscreen ? 5 : 0} y={y + 4} fontSize={fontSize} fill="#6b7280">
                  {fmt(val)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// Very lightweight tile map (not geographic) – each country as a colored tile
const TileMap = ({
  labels,
  values,
  onSelect,
  selectedIndex,
  isFullscreen = false,
}: {
  labels: string[];
  values: number[];
  onSelect: (index: number) => void;
  selectedIndex: number | null;
  isFullscreen?: boolean;
}) => {
  const max = Math.max(1, ...values, 0);
  const colorFor = (v: number) => {
    const t = v / max; // 0..1
    const g = Math.round(200 - t * 120);
    const b = Math.round(255 - t * 200);
    return `rgb(37, ${g}, ${b})`; // blueish to lighter
  };
  return (
    <div className={`grid gap-${isFullscreen ? '4' : '2'} ${isFullscreen ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
      {labels.map((l, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`rounded ${isFullscreen ? 'p-6 text-base' : 'p-3 text-xs'} text-left border ${selectedIndex === i ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200'} hover:ring-2 hover:ring-blue-300 transition-all`}
          style={{ backgroundColor: colorFor(values[i] ?? 0) }}
          title={`${l}: ${values[i]?.toLocaleString()}`}
        >
          <div className={`font-medium text-white drop-shadow-sm ${isFullscreen ? 'text-lg' : ''}`}>{l}</div>
          <div className={`text-white/90 ${isFullscreen ? 'mt-2 text-base' : 'mt-1'}`}>{values[i] ? values[i].toLocaleString() : 0}</div>
        </button>
      ))}
    </div>
  );
};

export const Charts: React.FC<ChartsProps> = ({ data }) => {
  const dateSeries = useMemo(() => buildDateSeries(data), [data]);
  const countrySeries = useMemo(() => buildCountrySeries(data), [data]);
  const [countryTab, setCountryTab] = useState<'bar' | 'map'>('bar');
  const [selectedCountryIndex, setSelectedCountryIndex] = useState<number | null>(null);

  const dateLabels = dateSeries.map(d => d.date);
  const dateRevenue = dateSeries.map(d => d.revenue);
  const dateFees = dateSeries.map(d => d.fees);
  const dateApproval = dateSeries.map(d => d.approvalRatio);

  const topCountries = countrySeries.slice(0, 12);
  const countryLabels = topCountries.map(c => codeToCountryName(c.country));
  const countryRevenue = topCountries.map(c => c.revenue);
  const countryFees = topCountries.map(c => c.fees);

  const toolbarMetrics = useMemo(() => {
    if (selectedCountryIndex == null || selectedCountryIndex < 0 || selectedCountryIndex >= topCountries.length) {
      const totalRev = countryRevenue.reduce((a, b) => a + b, 0);
      const totalFees = countryFees.reduce((a, b) => a + b, 0);
      // Weighted approval across shown countries
      const totTrans = topCountries.reduce((a, c) => a + c.totalTransactions, 0);
      const accTrans = topCountries.reduce((a, c) => a + c.acceptedTransactions, 0);
      const appr = totTrans > 0 ? (accTrans / totTrans) * 100 : 0;
      return { name: 'All shown', revenue: totalRev, fees: totalFees, approval: appr };
    }
    const c = topCountries[selectedCountryIndex];
    return { name: codeToCountryName(c.country), revenue: c.revenue, fees: c.fees, approval: c.approvalRatio };
  }, [selectedCountryIndex, topCountries, countryRevenue, countryFees]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <ChartCard title="Date-wise Revenue vs Fees">
        {(isFullscreen) => (
          <LineChart 
            labels={dateLabels} 
            pointsA={dateRevenue} 
            pointsB={dateFees} 
            fmt={(n) => formatCurrency(n)} 
            isFullscreen={isFullscreen}
            labelA="Revenue"
            labelB="Fees"
          />
        )}
      </ChartCard>

      <ChartCard title="Date-wise Approval Ratio">
        {(isFullscreen) => (
          <LineChart 
            labels={dateLabels} 
            pointsA={dateApproval} 
            fmt={(n) => `${n.toFixed(0)}%`} 
            colorA="#f59e0b" 
            isFullscreen={isFullscreen}
            labelA="Approval Ratio"
          />
        )}
      </ChartCard>

      <div className="lg:col-span-2">
        <ChartCard
          title="Country-wise Analysis"
          right={
            <div className="flex items-center gap-3 text-xs text-gray-700">
              <div className="hidden sm:flex items-center gap-1">
                <span className="text-gray-500">Country:</span>
                <span className="font-medium">{toolbarMetrics.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Revenue:</span>
                <span className="font-medium">{formatCurrency(toolbarMetrics.revenue)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Fees:</span>
                <span className="font-medium">{formatCurrency(toolbarMetrics.fees)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Approval:</span>
                <span className="font-medium">{toolbarMetrics.approval.toFixed(2)}%</span>
              </div>
            </div>
          }
        >
          {(isFullscreen) => (
            <>
              <div className="flex items-center gap-2 mb-3">
                <button
                  className={`px-3 py-1 text-xs rounded border ${countryTab === 'bar' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300'}`}
                  onClick={() => setCountryTab('bar')}
                >
                  Bar
                </button>
                <button
                  className={`px-3 py-1 text-xs rounded border ${countryTab === 'map' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300'}`}
                  onClick={() => setCountryTab('map')}
                >
                  Map
                </button>
              </div>

              {countryTab === 'bar' ? (
                <div onClick={() => setSelectedCountryIndex(null)}>
                  <BarChart 
                    labels={countryLabels} 
                    valuesA={countryRevenue} 
                    valuesB={countryFees} 
                    fmt={(n) => formatCurrency(n)} 
                    isFullscreen={isFullscreen}
                    labelA="Revenue"
                    labelB="Fees"
                  />
                </div>
              ) : (
                <TileMap
                  labels={countryLabels}
                  values={countryRevenue}
                  onSelect={(i) => setSelectedCountryIndex(i)}
                  selectedIndex={selectedCountryIndex}
                  isFullscreen={isFullscreen}
                />
              )}
            </>
          )}
        </ChartCard>
      </div>
    </div>
  );
};
