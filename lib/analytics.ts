export const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;
export const STATUS_GROUPS = {
  successful: ['confirmed', 'approved'],
  awaiting_review: ['paid_awaiting_verification'],
  unpaid: ['pending', 'pending_payment'],
  lost: ['rejected', 'cancelled', 'expired'],
} as const;
export type StatusGroupKey = keyof typeof STATUS_GROUPS;

/** Abandoned bookings never became real demand (excluded from unit/category counts). */
const ABANDONED = ['cancelled', 'expired'];
/** Excluded from "booking value" (the pipeline of live or fulfilled bookings). */
const VALUE_EXCLUDED = ['cancelled', 'expired', 'rejected'];
/** Payment statuses that mean money was received at some point. */
const COLLECTED = ['paid', 'refund_pending', 'refunded'];
/** Payment statuses that mean money is going back (or went back) to the renter. */
const REFUNDS = ['refund_pending', 'refunded'];

const STATUS_ORDER = [
  'pending_payment',
  'pending',
  'paid_awaiting_verification',
  'confirmed',
  'approved',
  'rejected',
  'cancelled',
  'expired',
];

const has = (list: readonly string[], value: string) => list.includes(value);

function groupOf(status: string): StatusGroupKey {
  for (const key of Object.keys(STATUS_GROUPS) as StatusGroupKey[]) {
    if (has(STATUS_GROUPS[key], status)) return key;
  }
  return 'unpaid';
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type RawBooking = {
  booking_id: string;
  user_id: string;
  unit_id: string;
  status: string;
  total_amount: number | string;
  created_at: string;
};
export type RawPayment = {
  booking_id: string;
  amount_paid: number | string;
  payment_status: string | null;
  paid_at: string | null;
};
export type RawUnit = {
  unit_id: string;
  unit_name: string;
  category: string | null;
  status: string | null;
  daily_rate: number | string;
};
export type RawUser = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string | null;
  role: string | null;
};
export type AnalyticsInput = {
  bookings: RawBooking[];
  payments: RawPayment[];
  units: RawUnit[];
  users: RawUser[];
};

export type Delta = { current: number; previous: number };
export type TrendPoint = { label: string; current: number; previous: number };
export type Insight = {
  id: string;
  tone: 'positive' | 'negative' | 'neutral';
  text: string;
  href: string;
};

export type AnalyticsResult = {
  generatedAt: string;
  periods: {
    current: { label: string; start: string; end: string };
    previous: { label: string; start: string; end: string };
    bucketDays: number;
    granularity: string;
  };
  kpis: {
    netRevenue: Delta & { spark: number[] };
    bookings: Delta & { spark: number[] };
    newRenters: Delta & { spark: number[] };
    inventory: { available: number; total: number };
  };
  revenue: {
    trend: TrendPoint[];
    totals: {
      bookingValue: Delta;
      collected: Delta;
      refunds: Delta;
      net: Delta;
      avgBookingValue: Delta;
      paidBookings: Delta;
    };
  };
  bookingTrend: {
    buckets: {
      label: string;
      successful: number;
      awaiting_review: number;
      unpaid: number;
      lost: number;
    }[];
    statusCounts: { status: string; current: number; previous: number }[];
  };
  renters: {
    trend: TrendPoint[];
    newRenters: Delta;
    activeRenters: number;
    firstTime: number;
    returning: number;
    recent: { name: string; joined: string }[];
  };
  categories: {
    category: string;
    units: number;
    bookings: Delta;
    revenue: Delta;
    avgBookingValue: number;
    bookingValue: number;
  }[];
  topUnits: {
    unitId: string;
    name: string;
    category: string;
    bookings: number;
    revenue: number;
    status: string;
  }[];
  inventory: {
    totalUnits: number;
    availableUnits: number;
    byCategory: { category: string; total: number; available: number; unavailable: number }[];
    idleCount: number;
    idle: { unitId: string; name: string; category: string; dailyRate: number }[];
    unavailable: { unitId: string; name: string; category: string; status: string }[];
  };
  insights: Insight[];
};

/* ------------------------------------------------------------------ */
/* Dates and periods                                                   */
/* ------------------------------------------------------------------ */

export type RangeKey = 'this_month' | 'this_quarter' | 'custom';
export type Period = { start: number; end: number; label: string };
export type Periods = { current: Period; previous: Period; bucketDays: number };

function manilaYmd(ms: number) {
  const d = new Date(ms + MANILA_OFFSET_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() };
}
function manilaMidnight(y: number, m: number, d: number) {
  return Date.UTC(y, m, d) - MANILA_OFFSET_MS;
}
export function fmtDay(ms: number, withYear = false) {
  return new Date(ms + MANILA_OFFSET_MS).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' as const } : {}),
    timeZone: 'UTC',
  });
}
function periodLabel(start: number, end: number) {
  return `${fmtDay(start)} – ${fmtDay(end - DAY_MS, true)}`;
}
function parseYmd(value: string | null | undefined) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return null;
  const y = Number(match[1]);
  const mo = Number(match[2]) - 1;
  const d = Number(match[3]);
  const check = new Date(Date.UTC(y, mo, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo || check.getUTCDate() !== d) {
    return null;
  }
  return { y, mo, d };
}

/**
 * Month and quarter views compare like-for-like: Oct 1-21 against Sep 1-21,
 * not against all of September. Custom ranges compare with the period of
 * equal length immediately before.
 */
export function resolvePeriods(
  range: RangeKey,
  from?: string | null,
  to?: string | null,
  now = Date.now(),
): Periods {
  const today = manilaYmd(now);
  const endOfToday = manilaMidnight(today.y, today.m, today.d + 1);
  let curStart: number;
  let curEnd: number;
  let prevStart: number;
  let prevEnd: number;

  if (range === 'this_month') {
    curStart = manilaMidnight(today.y, today.m, 1);
    curEnd = endOfToday;
    prevStart = manilaMidnight(today.y, today.m - 1, 1);
    prevEnd = Math.min(prevStart + (curEnd - curStart), curStart);
  } else if (range === 'this_quarter') {
    const quarterMonth = Math.floor(today.m / 3) * 3;
    curStart = manilaMidnight(today.y, quarterMonth, 1);
    curEnd = endOfToday;
    prevStart = manilaMidnight(today.y, quarterMonth - 3, 1);
    prevEnd = Math.min(prevStart + (curEnd - curStart), curStart);
  } else {
    const a = parseYmd(from);
    const b = parseYmd(to);
    if (!a || !b) throw new Error('Choose a valid start and end date.');
    curStart = manilaMidnight(a.y, a.mo, a.d);
    curEnd = manilaMidnight(b.y, b.mo, b.d + 1);
    if (curEnd <= curStart) throw new Error('The end date must be on or after the start date.');
    if (curEnd - curStart > 731 * DAY_MS) throw new Error('Please choose a range of two years or less.');
    prevEnd = curStart;
    prevStart = curStart - (curEnd - curStart);
  }

  const days = Math.round((curEnd - curStart) / DAY_MS);
  const bucketDays = days <= 31 ? 1 : days <= 120 ? 7 : 30;
  return {
    current: { start: curStart, end: curEnd, label: periodLabel(curStart, curEnd) },
    previous: { start: prevStart, end: prevEnd, label: periodLabel(prevStart, prevEnd) },
    bucketDays,
  };
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

export function formatPeso(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const ts = (v: string | null | undefined) => (v ? new Date(v).getTime() : NaN);

/* ------------------------------------------------------------------ */
/* Main computation                                                    */
/* ------------------------------------------------------------------ */

export function computeAnalytics(
  input: AnalyticsInput,
  periods: Periods,
  now = Date.now(),
): AnalyticsResult {
  const { current: cur, previous: prev, bucketDays } = periods;
  const bucketMs = bucketDays * DAY_MS;
  const n = Math.max(1, Math.ceil((cur.end - cur.start) / bucketMs));
  const labels = Array.from({ length: n }, (_, i) => fmtDay(cur.start + i * bucketMs));
  const zeros = () => new Array<number>(n).fill(0);
  const idx = (t: number, p: Period) =>
    Math.min(n - 1, Math.max(0, Math.floor((t - p.start) / bucketMs)));
  const inP = (t: number, p: Period) => t >= p.start && t < p.end;
  const sum = (list: number[]) => list.reduce((s, v) => s + v, 0);

  const unitById = new Map(input.units.map((u) => [u.unit_id, u]));
  const bookingById = new Map(input.bookings.map((b) => [b.booking_id, b]));
  const categoryOfUnit = (unitId: string) =>
    unitById.get(unitId)?.category?.trim() || 'Uncategorized';

  /* ---- bookings ---- */
  const bookings = input.bookings.map((b) => ({ ...b, t: ts(b.created_at), amount: num(b.total_amount) }));
  const curB = bookings.filter((b) => inP(b.t, cur));
  const prevB = bookings.filter((b) => inP(b.t, prev));
  const bookingValue = (list: typeof bookings) =>
    sum(list.filter((b) => !has(VALUE_EXCLUDED, b.status)).map((b) => b.amount));

  const groupBuckets: Record<StatusGroupKey, number[]> = {
    successful: zeros(),
    awaiting_review: zeros(),
    unpaid: zeros(),
    lost: zeros(),
  };
  const bookingSpark = zeros();
  for (const b of curB) {
    const i = idx(b.t, cur);
    groupBuckets[groupOf(b.status)][i] += 1;
    bookingSpark[i] += 1;
  }
  const countStatus = (list: typeof bookings, status: string) =>
    list.filter((b) => b.status === status).length;
  const statusCounts = STATUS_ORDER.map((status) => ({
    status,
    current: countStatus(curB, status),
    previous: countStatus(prevB, status),
  })).filter((row) => row.current > 0 || row.previous > 0);

  /* ---- payments ---- */
  const payments = input.payments.map((p) => ({
    booking_id: p.booking_id,
    amount: num(p.amount_paid),
    status: p.payment_status ?? '',
    t: ts(p.paid_at),
  }));
  const curP = payments.filter((p) => inP(p.t, cur));
  const prevP = payments.filter((p) => inP(p.t, prev));
  const payTotals = (list: typeof payments) => {
    let collected = 0;
    let refunds = 0;
    const paid = new Set<string>();
    for (const p of list) {
      if (has(COLLECTED, p.status)) collected += p.amount;
      if (has(REFUNDS, p.status)) refunds += p.amount;
      if (p.status === 'paid') paid.add(p.booking_id);
    }
    const net = collected - refunds;
    return { collected, refunds, net, paidBookings: paid.size, avg: paid.size ? net / paid.size : 0 };
  };
  const payCur = payTotals(curP);
  const payPrev = payTotals(prevP);

  const netCur = zeros();
  const netPrev = zeros();
  for (const p of curP) if (p.status === 'paid') netCur[idx(p.t, cur)] += p.amount;
  for (const p of prevP) if (p.status === 'paid') netPrev[idx(p.t, prev)] += p.amount;

  /* ---- renters ---- */
  const customers = input.users
    .filter((u) => (u.role ?? 'customer') === 'customer')
    .map((u) => ({ ...u, t: ts(u.created_at) }));
  const newCur = customers.filter((u) => inP(u.t, cur));
  const newPrev = customers.filter((u) => inP(u.t, prev));
  const signupCur = zeros();
  const signupPrev = zeros();
  for (const u of newCur) signupCur[idx(u.t, cur)] += 1;
  for (const u of newPrev) signupPrev[idx(u.t, prev)] += 1;

  const priorSuccess = new Set(
    bookings.filter((b) => b.t < cur.start && has(STATUS_GROUPS.successful, b.status)).map((b) => b.user_id),
  );
  const activeUsers = new Set(
    curB.filter((b) => !has(ABANDONED, b.status)).map((b) => b.user_id),
  );
  let returning = 0;
  activeUsers.forEach((id) => {
    if (priorSuccess.has(id)) returning += 1;
  });

  const recent = [...newCur]
    .sort((a, b) => b.t - a.t)
    .slice(0, 8)
    .map((u) => ({
      name: `${u.first_name ?? ''} ${(u.last_name ?? '').charAt(0)}${u.last_name ? '.' : ''}`.trim() || 'New renter',
      joined: new Date(u.t).toISOString(),
    }));

  /* ---- categories and units ---- */
  type CatAgg = {
    units: number;
    bookingsCur: number;
    bookingsPrev: number;
    revCur: number;
    revPrev: number;
    value: number;
    paid: Set<string>;
  };
  const cats = new Map<string, CatAgg>();
  const cat = (name: string) => {
    let c = cats.get(name);
    if (!c) {
      c = { units: 0, bookingsCur: 0, bookingsPrev: 0, revCur: 0, revPrev: 0, value: 0, paid: new Set() };
      cats.set(name, c);
    }
    return c;
  };
  for (const u of input.units) cat(u.category?.trim() || 'Uncategorized').units += 1;

  const unitCountCur = new Map<string, number>();
  const unitRevCur = new Map<string, number>();
  for (const b of curB) {
    if (has(ABANDONED, b.status)) continue;
    const c = cat(categoryOfUnit(b.unit_id));
    c.bookingsCur += 1;
    if (!has(VALUE_EXCLUDED, b.status)) c.value += b.amount;
    unitCountCur.set(b.unit_id, (unitCountCur.get(b.unit_id) ?? 0) + 1);
  }
  for (const b of prevB) {
    if (has(ABANDONED, b.status)) continue;
    cat(categoryOfUnit(b.unit_id)).bookingsPrev += 1;
  }
  for (const p of curP) {
    if (p.status !== 'paid') continue;
    const booking = bookingById.get(p.booking_id);
    if (!booking) continue;
    const c = cat(categoryOfUnit(booking.unit_id));
    c.revCur += p.amount;
    c.paid.add(p.booking_id);
    unitRevCur.set(booking.unit_id, (unitRevCur.get(booking.unit_id) ?? 0) + p.amount);
  }
  for (const p of prevP) {
    if (p.status !== 'paid') continue;
    const booking = bookingById.get(p.booking_id);
    if (booking) cat(categoryOfUnit(booking.unit_id)).revPrev += p.amount;
  }

  const categories = Array.from(cats.entries())
    .map(([category, c]) => ({
      category,
      units: c.units,
      bookings: { current: c.bookingsCur, previous: c.bookingsPrev },
      revenue: { current: c.revCur, previous: c.revPrev },
      avgBookingValue: c.paid.size ? c.revCur / c.paid.size : 0,
      bookingValue: c.value,
    }))
    .sort((a, b) => b.bookings.current - a.bookings.current || b.revenue.current - a.revenue.current);

  const topUnits = input.units
    .map((u) => ({
      unitId: u.unit_id,
      name: u.unit_name,
      category: u.category?.trim() || 'Uncategorized',
      bookings: unitCountCur.get(u.unit_id) ?? 0,
      revenue: unitRevCur.get(u.unit_id) ?? 0,
      status: u.status ?? 'available',
    }))
    .filter((u) => u.bookings > 0 || u.revenue > 0)
    .sort((a, b) => b.bookings - a.bookings || b.revenue - a.revenue)
    .slice(0, 8);

  /* ---- inventory ---- */
  const isAvailable = (u: RawUnit) => (u.status ?? 'available') === 'available';
  const byCat = new Map<string, { total: number; available: number }>();
  for (const u of input.units) {
    const key = u.category?.trim() || 'Uncategorized';
    const row = byCat.get(key) ?? { total: 0, available: 0 };
    row.total += 1;
    if (isAvailable(u)) row.available += 1;
    byCat.set(key, row);
  }
  const byCategory = Array.from(byCat.entries())
    .map(([category, r]) => ({ category, total: r.total, available: r.available, unavailable: r.total - r.available }))
    .sort((a, b) => b.total - a.total);
  const idleAll = input.units.filter((u) => isAvailable(u) && !(unitCountCur.get(u.unit_id) ?? 0));
  const idle = idleAll.slice(0, 12).map((u) => ({
    unitId: u.unit_id,
    name: u.unit_name,
    category: u.category?.trim() || 'Uncategorized',
    dailyRate: num(u.daily_rate),
  }));
  const unavailable = input.units
    .filter((u) => !isAvailable(u))
    .slice(0, 12)
    .map((u) => ({
      unitId: u.unit_id,
      name: u.unit_name,
      category: u.category?.trim() || 'Uncategorized',
      status: u.status ?? 'unavailable',
    }));
  const availableUnits = input.units.filter(isAvailable).length;

  /* ---- insights (generated from the numbers above) ---- */
  const insights: Insight[] = [];
  const compare = (
    id: string,
    label: string,
    c: number,
    p: number,
    href: string,
    fmt: (v: number) => string,
    upIsGood = true,
  ): Insight | null => {
    if (p <= 0 && c <= 0) return null;
    if (p <= 0) {
      return { id, tone: 'neutral', href, text: `${label} was ${fmt(c)}; there was none in the previous period.` };
    }
    const raw = ((c - p) / p) * 100;
    const magnitude = Math.round(Math.abs(raw)); // round by size so up and down match the UI badge
    if (magnitude === 0) {
      return { id, tone: 'neutral', href, text: `${label} stayed about the same (${fmt(p)} → ${fmt(c)}).` };
    }
    const up = raw > 0;
    return {
      id,
      href,
      tone: up === upIsGood ? 'positive' : 'negative',
      text: `${label} ${up ? 'increased' : 'decreased'} ${magnitude}% vs the previous period (${fmt(p)} → ${fmt(c)}).`,
    };
  };
  const plain = (v: number) => String(v);

  const revenueInsight = compare('revenue', 'Net collected revenue', payCur.net, payPrev.net, '#revenue', formatPeso);
  if (revenueInsight) insights.push(revenueInsight);
  else insights.push({ id: 'revenue', tone: 'neutral', href: '#revenue', text: 'No payments were collected in either period.' });

  const bookingInsight = compare('bookings', 'Bookings', curB.length, prevB.length, '#bookings', plain);
  if (bookingInsight) insights.push(bookingInsight);

  if (payCur.refunds > payPrev.refunds && curB.length > prevB.length) {
    insights.push({
      id: 'refunds',
      tone: 'negative',
      href: '#revenue',
      text: `Bookings increased, but refunds also rose (${formatPeso(payPrev.refunds)} → ${formatPeso(payCur.refunds)}).`,
    });
  }
  if (curB.length > prevB.length && payPrev.avg > 0 && payCur.avg < payPrev.avg) {
    const drop = Math.round(((payPrev.avg - payCur.avg) / payPrev.avg) * 100);
    if (drop > 0) {
      insights.push({
        id: 'avg-value',
        tone: 'neutral',
        href: '#revenue',
        text: `Bookings grew while the average paid amount per booking fell ${drop}% (${formatPeso(payPrev.avg)} → ${formatPeso(payCur.avg)}).`,
      });
    }
  }

  const movers = categories.map((c) => ({
    name: c.category,
    cur: c.bookings.current,
    prev: c.bookings.previous,
    diff: c.bookings.current - c.bookings.previous,
  }));
  const gainer = [...movers].sort((a, b) => b.diff - a.diff)[0];
  const decliner = [...movers].sort((a, b) => a.diff - b.diff)[0];
  const g = gainer && gainer.diff > 0 ? gainer : null;
  const d = decliner && decliner.diff < 0 ? decliner : null;
  if (g && d) {
    insights.push({
      id: 'categories',
      tone: 'neutral',
      href: '#categories',
      text: `${g.name} bookings grew (${g.prev} → ${g.cur}), while ${d.name} bookings declined (${d.prev} → ${d.cur}).`,
    });
  } else if (g) {
    insights.push({ id: 'categories', tone: 'positive', href: '#categories', text: `${g.name} bookings grew (${g.prev} → ${g.cur}).` });
  } else if (d) {
    insights.push({ id: 'categories', tone: 'negative', href: '#categories', text: `${d.name} bookings declined (${d.prev} → ${d.cur}).` });
  }

  if (idleAll.length > 0) {
    insights.push({
      id: 'idle',
      tone: 'negative',
      href: '#inventory',
      text: `${idleAll.length} available unit${idleAll.length === 1 ? ' has' : 's have'} had no bookings in the selected period.`,
    });
  }
  const renterInsight = compare('renters', 'New renter sign-ups', newCur.length, newPrev.length, '#renters', plain);
  if (renterInsight) insights.push(renterInsight);

  return {
    generatedAt: new Date(now).toISOString(),
    periods: {
      current: { label: cur.label, start: new Date(cur.start).toISOString(), end: new Date(cur.end).toISOString() },
      previous: { label: prev.label, start: new Date(prev.start).toISOString(), end: new Date(prev.end).toISOString() },
      bucketDays,
      granularity: bucketDays === 1 ? 'daily' : bucketDays === 7 ? 'weekly' : '30-day blocks',
    },
    kpis: {
      netRevenue: { current: payCur.net, previous: payPrev.net, spark: netCur },
      bookings: { current: curB.length, previous: prevB.length, spark: bookingSpark },
      newRenters: { current: newCur.length, previous: newPrev.length, spark: signupCur },
      inventory: { available: availableUnits, total: input.units.length },
    },
    revenue: {
      trend: labels.map((label, i) => ({ label, current: netCur[i], previous: netPrev[i] })),
      totals: {
        bookingValue: { current: bookingValue(curB), previous: bookingValue(prevB) },
        collected: { current: payCur.collected, previous: payPrev.collected },
        refunds: { current: payCur.refunds, previous: payPrev.refunds },
        net: { current: payCur.net, previous: payPrev.net },
        avgBookingValue: { current: payCur.avg, previous: payPrev.avg },
        paidBookings: { current: payCur.paidBookings, previous: payPrev.paidBookings },
      },
    },
    bookingTrend: {
      buckets: labels.map((label, i) => ({
        label,
        successful: groupBuckets.successful[i],
        awaiting_review: groupBuckets.awaiting_review[i],
        unpaid: groupBuckets.unpaid[i],
        lost: groupBuckets.lost[i],
      })),
      statusCounts,
    },
    renters: {
      trend: labels.map((label, i) => ({ label, current: signupCur[i], previous: signupPrev[i] })),
      newRenters: { current: newCur.length, previous: newPrev.length },
      activeRenters: activeUsers.size,
      firstTime: activeUsers.size - returning,
      returning,
      recent,
    },
    categories,
    topUnits,
    inventory: {
      totalUnits: input.units.length,
      availableUnits,
      byCategory,
      idleCount: idleAll.length,
      idle,
      unavailable,
    },
    insights: insights.slice(0, 7),
  };
}