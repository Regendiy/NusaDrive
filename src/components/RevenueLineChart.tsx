import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Booking } from '../types';
import { formatRupiah } from '../utils/clientPricing';
import {
  buildDailyRevenueSeries,
  DailyRevenuePoint,
  formatCompactIdrAxis,
  summarize30DayRevenue,
} from '../utils/revenueChart';
import type { ThemeMode } from '../utils/theme';

interface RevenueLineChartProps {
  bookings: Booking[];
  loading: boolean;
  theme?: ThemeMode;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DailyRevenuePoint }>;
}

function RevenueTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 shadow-sm text-xs">
      <p className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
        {point.date}
      </p>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        Pendapatan:{' '}
        <span className="font-mono font-bold text-blue-700 dark:text-blue-400 tabular-nums">
          {formatRupiah(point.revenue)}
        </span>
      </p>
      <p className="mt-0.5 text-slate-500 dark:text-slate-400 font-mono tabular-nums">
        {point.bookingCount} transaksi lunas
      </p>
    </div>
  );
}

export function RevenueLineChart({
  bookings,
  loading,
  theme = 'light',
}: RevenueLineChartProps) {
  const series = useMemo(() => buildDailyRevenueSeries(bookings), [bookings]);
  const summary = useMemo(() => summarize30DayRevenue(series), [series]);
  const isDark = theme === 'dark';

  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const tickFill = isDark ? '#94a3b8' : '#64748b';
  const axisStroke = isDark ? '#334155' : '#cbd5e1';
  const lineStroke = isDark ? '#60a5fa' : '#1d4ed8';
  const activeDotStroke = isDark ? '#0f172a' : '#ffffff';

  return (
    <section
      aria-labelledby="revenue-chart-heading"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2
            id="revenue-chart-heading"
            className="font-display text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            Pendapatan Rental Harian (30 Hari Terakhir)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Akumulasi harian dari pemesanan berstatus lunas · Diperbarui otomatis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-left sm:text-right">
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Total 30 Hari</p>
            <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatRupiah(summary.totalRevenue)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Rata-Rata / Hari</p>
            <p className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
              {formatRupiah(summary.averageDaily)}
            </p>
          </div>
          {summary.peakDay && (
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Puncak ({summary.peakDay.label})
              </p>
              <p className="font-mono text-sm font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                {formatRupiah(summary.peakDay.revenue)}
              </p>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-72 w-full rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
      ) : (
        <div className="h-72 w-full" data-testid="revenue-line-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: tickFill, fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={{ stroke: axisStroke }}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tickFormatter={formatCompactIdrAxis}
                tick={{ fontSize: 11, fill: tickFill, fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={false}
                tickLine={false}
                width={76}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Pendapatan Harian"
                stroke={lineStroke}
                strokeWidth={2.25}
                dot={{ r: 2.5, fill: lineStroke, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: lineStroke, stroke: activeDotStroke, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && summary.totalRevenue === 0 && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Belum ada pembayaran lunas dalam 30 hari terakhir. Grafik akan otomatis terisi setelah pemesanan diselesaikan.
        </p>
      )}
    </section>
  );
}
