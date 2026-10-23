'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CalendarCheck,
  RefreshCw,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { formatPeso, type AnalyticsResult, type Delta, type RangeKey } from '@/lib/analytics';
import { HBarList, Legend, Sparkline, StackedBars, TrendChart, compact } from './charts';

/* ---------- formatting ---------- */
const peso = (v: number) => formatPeso(v);
const pesoCompact = (v: number) => `₱${compact(v)}`;
const int = (v: number) => new Intl.NumberFormat('en-PH').format(v);

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Awaiting payment',
  pending: 'Pending',
  paid_awaiting_verification: 'Awaiting review',
  confirmed: 'Confirmed',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

const GROUP_SERIES = [
  { label: 'Confirmed / approved', color: '#16a34a' },
  { label: 'Awaiting review', color: '#2563eb' },
  { label: 'Unpaid', color: '#f59e0b' },
  { label: 'Rejected / cancelled / expired', color: '#ef4444' },
];

const PERIOD_LEGEND = [
  { label: 'This period', color: '#2563eb' },
  { label: 'Previous period', color: '#94a3b8', dashed: true },
];

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'this_month', label: 'This month vs last' },
  { key: 'this_quarter', label: 'This quarter vs last' },
  { key: 'custom', label: 'Custom' },
];

type KpiKey = 'revenue' | 'bookings' | 'renters' | 'inventory';

const HREF_TO_KPI: Record<string, KpiKey> = {
  '#revenue': 'revenue',
  '#bookings': 'bookings',
  '#renters': 'renters',
  '#inventory': 'inventory',
};

/* ---------- small building blocks ---------- */
function DeltaBadge({ current, previous, upIsGood = true }: { current: number; previous: number; upIsGood?: boolean }) {
  if (previous === 0 && current === 0) return <span className="text-xs text-slate-400">No change</span>;
  if (previous === 0) return <span className="text-xs font-semibold text-blue-600">New</span>;
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 0.5) return <span className="text-xs font-semibold text-slate-400">±0%</span>;
  const up = pct > 0;
  const good = up === upIsGood;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
        good ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
      }`}
    >
      {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

/** Fixed-height panel on xl screens: header on top, body fills the rest and scrolls if needed. */
function Card({
  title,
  subtitle,
  className = '',
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >
      <div className="shrink-0">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-auto">{children}</div>
    </section>
  );
}

/** Gives a chart a fixed height on small screens and lets it fill the panel on xl. */
function ChartBox({ children }: { children: ReactNode }) {
  return <div className="relative h-56 xl:h-auto xl:min-h-0 xl:flex-1">{children}</div>;
}

function Stat({
  label,
  value,
  delta,
  upIsGood = true,
  hint,
}: {
  label: string;
  value: string;
  delta: Delta;
  upIsGood?: boolean;
  hint?: string;
}) {
  return (
    <div title={hint} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
      <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold leading-6 text-slate-900">{value}</p>
      <DeltaBadge current={delta.current} previous={delta.previous} upIsGood={upIsGood} />
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="max-h-80 min-h-0 overflow-auto rounded-xl border border-slate-100 xl:max-h-none xl:flex-1">
      <table className="w-full min-w-[360px] text-sm">
        <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`px-3 py-2 font-medium ${i > 0 ? 'text-right' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">{children}</tbody>
      </table>
    </div>
  );
}

const td = 'px-3 py-2 text-right tabular-nums';

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-slate-400">{children}</p>;
}

/* ---------- main component ---------- */
export default function AnalyticsDashboard() {
  const [range, setRange] = useState<RangeKey>('this_month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<AnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState<KpiKey>('revenue');

  useEffect(() => {
    if (range === 'custom' && (!from || !to || from > to)) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const qs = new URLSearchParams({ range });
    if (range === 'custom') {
      qs.set('from', from);
      qs.set('to', to);
    }
    fetch(`/api/admin/analytics?${qs.toString()}`, { cache: 'no-store', signal: controller.signal })
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error ?? 'Could not load analytics.');
        setData(payload as AnalyticsResult);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'Could not load analytics.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [range, from, to, reloadKey]);

  const chooseRange = (key: RangeKey) => {
    setRange(key);
    if (key === 'custom' && (!from || !to)) {
      const today = new Date();
      const fmt = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
      setTo(fmt(today));
      setFrom(fmt(new Date(today.getTime() - 29 * 86400000)));
    }
  };

  const kpis = data
    ? ([
        {
          key: 'revenue' as const,
          label: 'Paid revenue (net)',
          icon: Wallet,
          value: peso(data.kpis.netRevenue.current),
          delta: data.kpis.netRevenue,
          spark: data.kpis.netRevenue.spark,
          hint: 'Collected, minus refunds',
        },
        {
          key: 'bookings' as const,
          label: 'Bookings',
          icon: CalendarCheck,
          value: int(data.kpis.bookings.current),
          delta: data.kpis.bookings,
          spark: data.kpis.bookings.spark,
          hint: 'Created in the period',
        },
        {
          key: 'renters' as const,
          label: 'New renters',
          icon: Users,
          value: int(data.kpis.newRenters.current),
          delta: data.kpis.newRenters,
          spark: data.kpis.newRenters.spark,
          hint: 'New sign-ups',
        },
        {
          key: 'inventory' as const,
          label: 'Active inventory',
          icon: Boxes,
          value: int(data.kpis.inventory.available),
          delta: null,
          spark: [] as number[],
          hint: `of ${int(data.kpis.inventory.total)} units available now`,
        },
      ] satisfies {
        key: KpiKey;
        label: string;
        icon: LucideIcon;
        value: string;
        delta: Delta | null;
        spark: number[];
        hint: string;
      }[])
    : [];

  return (
    // On xl screens the whole dashboard fits one viewport (no page scroll).
    // Adjust 5rem to match your admin navbar/layout height.
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 xl:h-[calc(100vh-5rem)] xl:overflow-hidden">
      {/* Header and controls */}
      <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Business analytics</h1>
          <p className="text-sm text-slate-500">
            {data
              ? `${data.periods.current.label} compared with ${data.periods.previous.label}`
              : 'Revenue, demand and inventory performance'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-sm font-semibold shadow-sm">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => chooseRange(option.key)}
                className={`rounded-full px-3 py-1 transition ${
                  range === option.key ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {range === 'custom' && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1"
                aria-label="Start date"
              />
              <span>to</span>
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1"
                aria-label="End date"
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            aria-label="Refresh"
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {range === 'custom' && (!from || !to || from > to) && (
        <p className="shrink-0 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Pick a start date and an end date on or after it to load the report.
        </p>
      )}

      {error && (
        <div className="flex shrink-0 items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="font-semibold underline">
            Try again
          </button>
        </div>
      )}

      {!data && loading && (
        <div className="grid shrink-0 animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100" />
          ))}
        </div>
      )}

      {data && (
        <>
          {/* KPI row */}
          <div className={`grid shrink-0 gap-4 sm:grid-cols-2 xl:grid-cols-4 ${loading ? 'opacity-60 transition' : ''}`}>
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              const active = selected === kpi.key;
              return (
                <button
                  key={kpi.key}
                  type="button"
                  onClick={() => setSelected(kpi.key)}
                  aria-pressed={active}
                  className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md ${
                    active ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">{kpi.label}</span>
                    <span className="rounded-full bg-blue-50 p-1.5 text-blue-600">
                      <Icon size={14} />
                    </span>
                  </div>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <p className="text-2xl font-bold leading-8 text-slate-900">{kpi.value}</p>
                    <div className="w-24 shrink-0">
                      {kpi.spark.length > 1 ? <Sparkline values={kpi.spark} /> : <div className="h-7" />}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    {kpi.delta ? (
                      <>
                        <DeltaBadge current={kpi.delta.current} previous={kpi.delta.previous} />
                        <span className="truncate text-xs text-slate-400">vs previous</span>
                      </>
                    ) : (
                      <span className="truncate text-xs text-slate-400">{kpi.hint}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* One-screen panel grid */}
          <div
            className={`grid min-h-0 gap-4 xl:flex-1 xl:grid-cols-12 xl:grid-rows-[minmax(0,1fr)_minmax(0,1fr)] ${
              loading ? 'opacity-60 transition' : ''
            }`}
          >
            {/* Selected KPI detail (tall panel) */}
            <Card
              className="xl:col-span-5 xl:row-span-2"
              title={
                selected === 'revenue'
                  ? 'Paid revenue by period'
                  : selected === 'bookings'
                    ? 'Bookings by status'
                    : selected === 'renters'
                      ? 'Renter detail'
                      : 'Inventory by category'
              }
              subtitle={`Detail for the selected KPI, ${data.periods.granularity} view`}
            >
              {selected === 'revenue' && (
                <>
                  <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
                    <Stat
                      label="Booking value"
                      value={peso(data.revenue.totals.bookingValue.current)}
                      delta={data.revenue.totals.bookingValue}
                      hint="Bookings created, excluding cancelled, expired and rejected. Not money received."
                    />
                    <Stat
                      label="Collected"
                      value={peso(data.revenue.totals.collected.current)}
                      delta={data.revenue.totals.collected}
                      hint="Payments received, before refunds."
                    />
                    <Stat
                      label="Refunds"
                      value={peso(data.revenue.totals.refunds.current)}
                      delta={data.revenue.totals.refunds}
                      upIsGood={false}
                      hint="Refunded or refund pending."
                    />
                    <Stat
                      label="Net collected"
                      value={peso(data.revenue.totals.net.current)}
                      delta={data.revenue.totals.net}
                      hint="Collected minus refunds."
                    />
                  </div>
                  <div className="mt-3 shrink-0">
                    <Legend items={PERIOD_LEGEND} />
                  </div>
                  <ChartBox>
                    <TrendChart
                      fill
                      points={data.revenue.trend}
                      formatValue={peso}
                      formatTick={pesoCompact}
                    />
                  </ChartBox>
                  <p className="mt-2 shrink-0 text-[11px] text-slate-400">
                    Payments are dated by when they were paid; refunds count in the period of the original payment.
                  </p>
                </>
              )}

              {selected === 'bookings' &&
                (data.bookingTrend.statusCounts.length === 0 ? (
                  <Empty>No bookings in either period.</Empty>
                ) : (
                  <Table head={['Status', 'This period', 'Previous', 'Change']}>
                    {data.bookingTrend.statusCounts.map((row) => (
                      <tr key={row.status}>
                        <td className="px-3 py-2">{STATUS_LABEL[row.status] ?? row.status}</td>
                        <td className={td}>{int(row.current)}</td>
                        <td className={`${td} text-slate-400`}>{int(row.previous)}</td>
                        <td className={td}>
                          <DeltaBadge
                            current={row.current}
                            previous={row.previous}
                            upIsGood={!['rejected', 'cancelled', 'expired'].includes(row.status)}
                          />
                        </td>
                      </tr>
                    ))}
                  </Table>
                ))}

              {selected === 'renters' && (
                <div className="grid min-h-0 gap-4 lg:grid-cols-2 xl:flex-1">
                  <div className="min-h-0 overflow-auto">
                    <p className="mb-2 text-sm font-medium text-slate-700">Recent sign-ups</p>
                    {data.renters.recent.length === 0 ? (
                      <Empty>No new renters in this period.</Empty>
                    ) : (
                      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 text-sm">
                        {data.renters.recent.map((r, i) => (
                          <li key={i} className="flex items-center justify-between px-3 py-2">
                            <span className="font-medium text-slate-700">{r.name}</span>
                            <span className="text-xs text-slate-400">
                              {new Date(r.joined).toLocaleDateString('en-PH', {
                                month: 'short',
                                day: 'numeric',
                                timeZone: 'Asia/Manila',
                              })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="min-h-0 overflow-auto">
                    <p className="mb-2 text-sm font-medium text-slate-700">Renters who booked</p>
                    <HBarList
                      items={[
                        { label: 'First-time bookers', value: data.renters.firstTime, display: int(data.renters.firstTime) },
                        { label: 'Returning bookers', value: data.renters.returning, display: int(data.renters.returning) },
                      ]}
                      color="#16a34a"
                    />
                    <p className="mt-3 text-xs text-slate-400">
                      Returning means a confirmed or approved booking before this period began.
                    </p>
                  </div>
                </div>
              )}

              {selected === 'inventory' && (
                <Table head={['Category', 'Units', 'Available', 'Unavailable']}>
                  {data.inventory.byCategory.map((row) => (
                    <tr key={row.category}>
                      <td className="px-3 py-2">{row.category}</td>
                      <td className={td}>{int(row.total)}</td>
                      <td className={td}>{int(row.available)}</td>
                      <td className={td}>{int(row.unavailable)}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>

            {/* Booking trend */}
            <Card className="xl:col-span-4" title="Booking trend" subtitle="Are bookings turning into successful rentals?">
              <div className="shrink-0">
                <Legend items={GROUP_SERIES.map((s) => ({ label: s.label, color: s.color }))} />
              </div>
              <ChartBox>
                <StackedBars
                  fill
                  buckets={data.bookingTrend.buckets.map((b) => ({
                    label: b.label,
                    counts: [b.successful, b.awaiting_review, b.unpaid, b.lost],
                  }))}
                  series={GROUP_SERIES}
                />
              </ChartBox>
            </Card>

            {/* Demand by category */}
            <Card className="xl:col-span-3" title="Demand by category" subtitle="Bookings, units and net revenue">
              {data.categories.length === 0 ? (
                <Empty>No units have been added yet.</Empty>
              ) : (
                <HBarList
                  items={data.categories.map((c) => ({
                    label: c.category,
                    value: c.bookings.current,
                    display: `${int(c.bookings.current)} bookings`,
                    sub: `${int(c.units)} units · ${peso(c.revenue.current)} net`,
                  }))}
                />
              )}
            </Card>

            {/* Renter growth */}
            <Card className="xl:col-span-4" title="Renter growth" subtitle="New sign-ups over time">
              <div className="shrink-0">
                <Legend items={PERIOD_LEGEND} />
              </div>
              <ChartBox>
                <TrendChart
                  fill
                  points={data.renters.trend}
                  formatValue={int}
                  currentLabel="Sign-ups"
                  previousLabel="Previous"
                />
              </ChartBox>
            </Card>

            {/* Insights */}
            <Card className="xl:col-span-3" title="Noteworthy changes" subtitle="Generated from the data in this report">
              <ul className="space-y-3">
                {data.insights.map((insight) => {
                  const kpi = HREF_TO_KPI[insight.href];
                  return (
                    <li key={insight.id} className="flex gap-2.5">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          insight.tone === 'positive'
                            ? 'bg-emerald-500'
                            : insight.tone === 'negative'
                              ? 'bg-red-500'
                              : 'bg-slate-400'
                        }`}
                      />
                      <div className="text-sm">
                        <p className="leading-5 text-slate-700">{insight.text}</p>
                        {kpi && (
                          <button
                            type="button"
                            onClick={() => setSelected(kpi)}
                            className="mt-0.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            See details
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}