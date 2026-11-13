'use client';

import { useState } from 'react';
import type { TrendPoint } from '@/lib/analytics';

// Dependency-free SVG charts.

const W = 640;
const H = 240;
const PL = 52;
const PR = 14;
const PT = 14;
const PB = 30;

function niceMax(v: number) {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * exp;
}

const compactFmt = new Intl.NumberFormat('en-PH', { notation: 'compact', maximumFractionDigits: 1 });
export const compact = (v: number) => compactFmt.format(v);

export function Legend({
  items,
}: {
  items: { label: string; color: string; dashed?: boolean }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-0 w-4 border-t-2"
            style={{ borderColor: item.color, borderStyle: item.dashed ? 'dashed' : 'solid' }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function Sparkline({ values, stroke = '#2563eb' }: { values: number[]; stroke?: string }) {
  if (values.length < 2) return <div className="h-7" />;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${26 - ((v - min) / range) * 24}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// TrendChart props: add `fill = false` and its type
export function TrendChart({
  points,
  formatValue,
  formatTick,
  currentLabel = 'This period',
  previousLabel = 'Previous period',
  fill = false,
}: {
  points: TrendPoint[];
  formatValue: (v: number) => string;
  formatTick?: (v: number) => string;
  currentLabel?: string;
  previousLabel?: string;
  fill?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const n = points.length;
  const max = niceMax(Math.max(0, ...points.flatMap((p) => [p.current, p.previous])));
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const x = (i: number) => PL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => PT + innerH - (v / max) * innerH;
  const path = (key: 'current' | 'previous') =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
  const area = `${path('current')} L${x(n - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const step = Math.max(1, Math.ceil(n / 7));
  const ticks = [0, 1, 2, 3, 4].map((k) => (max / 4) * k);
  const tick = formatTick ?? ((v: number) => String(Math.round(v)));
  const colW = innerW / Math.max(1, n);
  const hovered = hover !== null ? points[hover] : null;
  const tipLeft = hover !== null ? Math.min(85, Math.max(15, (x(hover) / W) * 100)) : 0;

  return (
   <div className={fill ? 'absolute inset-0' : 'relative'}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={fill ? 'h-full w-full' : 'h-auto w-full'}
        role="img"
        aria-label="Trend chart comparing this period with the previous period"
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
              {tick(t)}
            </text>
          </g>
        ))}
        <path d={area} fill="#2563eb" fillOpacity="0.08" />
        <path d={path('previous')} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 4" />
        <path d={path('current')} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((p, i) =>
          i % step === 0 ? (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#94a3b8">
              {p.label}
            </text>
          ) : null,
        )}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PT} y2={PT + innerH} stroke="#cbd5e1" strokeWidth="1" />
            <circle cx={x(hover)} cy={y(points[hover].current)} r="4" fill="#2563eb" />
            <circle cx={x(hover)} cy={y(points[hover].previous)} r="3.5" fill="#94a3b8" />
          </g>
        )}
        {points.map((_, i) => (
          <rect
            key={i}
            x={x(i) - colW / 2}
            y={PT}
            width={colW}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>
      {hovered && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: `${tipLeft}%` }}
        >
          <p className="font-semibold text-slate-900">{hovered.label}</p>
          <p className="mt-1 text-blue-700">
            {currentLabel}: {formatValue(hovered.current)}
          </p>
          <p className="text-slate-500">
            {previousLabel}: {formatValue(hovered.previous)}
          </p>
        </div>
      )}
    </div>
  );
}

export function StackedBars({
  buckets,
  series,
  fill = false,
}: {
  buckets: { label: string; counts: number[] }[];
  series: { label: string; color: string }[];
  fill?: boolean;
}) {
  const n = buckets.length;
  const totals = buckets.map((b) => b.counts.reduce((s, v) => s + v, 0));
  const max = niceMax(Math.max(0, ...totals));
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const slot = innerW / Math.max(1, n);
  const barW = Math.max(2, slot * 0.7);
  const y = (v: number) => PT + innerH - (v / max) * innerH;
  const step = Math.max(1, Math.ceil(n / 7));
  const ticks = [0, 1, 2, 3, 4].map((k) => (max / 4) * k);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={fill ? 'absolute inset-0 h-full w-full' : 'h-auto w-full'}
      role="img"
      aria-label="Bookings over time by status"
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeWidth="1" />
          <text x={PL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
            {Math.round(t * 10) / 10}
          </text>
        </g>
      ))}
      {buckets.map((b, i) => {
        const left = PL + i * slot + (slot - barW) / 2;
        let acc = 0;
        return (
          <g key={i}>
            <title>
              {b.label}: {series.map((s, k) => `${b.counts[k]} ${s.label.toLowerCase()}`).join(', ')}
            </title>
            {b.counts.map((count, k) => {
              if (count <= 0) return null;
              const top = y(acc + count);
              const height = y(acc) - top;
              acc += count;
              return <rect key={k} x={left} y={top} width={barW} height={height} fill={series[k].color} rx="1.5" />;
            })}
            {i % step === 0 && (
              <text x={left + barW / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#94a3b8">
                {b.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function HBarList({
  items,
  color = '#2563eb',
}: {
  items: { label: string; value: number; display: string; sub?: string }[];
  color?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) return <p className="py-6 text-center text-sm text-slate-400">No data for this period.</p>;
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-slate-700">{item.label}</span>
            <span className="shrink-0 font-semibold text-slate-900">{item.display}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%`, backgroundColor: color }}
            />
          </div>
          {item.sub && <p className="mt-0.5 text-xs text-slate-400">{item.sub}</p>}
        </li>
      ))}
    </ul>
  );
}