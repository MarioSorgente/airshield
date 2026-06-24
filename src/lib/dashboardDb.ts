// Dashboard read + aggregation layer.
//
// Reads every public collection straight from Firestore (client SDK) and shapes
// it for the admin dashboard. This only works while `firestore.rules` allows
// reads — see the note in firestore.rules about gating this behind auth before a
// public deploy.
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { WaitlistSignup } from "./airshieldDb";

export type WithMeta<T> = T & {
  id: string;
  createdAt: Date | null;
};

export type EventDoc = {
  event: string;
  sessionId?: string;
  path?: string;
  url?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  [key: string]: unknown;
};

export type GenericDoc = Record<string, unknown>;

export type DashboardData = {
  signups: WithMeta<WaitlistSignup>[];
  events: WithMeta<EventDoc>[];
  reservations: WithMeta<GenericDoc>[];
  priceResponses: WithMeta<GenericDoc>[];
  variantSelections: WithMeta<GenericDoc>[];
  filterSubscriptions: WithMeta<GenericDoc>[];
  useCaseSelections: WithMeta<GenericDoc>[];
  exposureCalculations: WithMeta<GenericDoc>[];
  objectionSelections: WithMeta<GenericDoc>[];
};

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

async function readCollection<T>(name: string): Promise<WithMeta<T>[]> {
  // Order newest-first; fall back to an unordered read if the index/field is
  // missing on older docs.
  let snap;
  try {
    snap = await getDocs(query(collection(db, name), orderBy("createdAt", "desc")));
  } catch {
    snap = await getDocs(collection(db, name));
  }
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      ...(data as T),
      id: d.id,
      createdAt: toDate(data.createdAt),
    };
  });
}

export async function loadDashboard(): Promise<DashboardData> {
  const [
    signups,
    events,
    reservations,
    priceResponses,
    variantSelections,
    filterSubscriptions,
    useCaseSelections,
    exposureCalculations,
    objectionSelections,
  ] = await Promise.all([
    readCollection<WaitlistSignup>("waitlist_signups"),
    readCollection<EventDoc>("events"),
    readCollection<GenericDoc>("early_access_reservations"),
    readCollection<GenericDoc>("price_responses"),
    readCollection<GenericDoc>("variant_selections"),
    readCollection<GenericDoc>("filter_subscriptions"),
    readCollection<GenericDoc>("use_case_selections"),
    readCollection<GenericDoc>("exposure_calculations"),
    readCollection<GenericDoc>("objection_selections"),
  ]);

  return {
    signups,
    events,
    reservations,
    priceResponses,
    variantSelections,
    filterSubscriptions,
    useCaseSelections,
    exposureCalculations,
    objectionSelections,
  };
}

// ── Aggregation helpers (pure) ──────────────────────────────────────

export function uniqueSessions(events: WithMeta<EventDoc>[]): Set<string> {
  const ids = new Set<string>();
  for (const e of events) {
    if (e.sessionId) ids.add(e.sessionId);
  }
  return ids;
}

export function countEvent(
  events: WithMeta<EventDoc>[],
  name: string
): Set<string> {
  // Returns the set of sessions that fired this event (so it counts unique
  // people, not raw event volume).
  const ids = new Set<string>();
  for (const e of events) {
    if (e.event === name && e.sessionId) ids.add(e.sessionId);
  }
  return ids;
}

export type FunnelStep = { label: string; count: number; pct: number };

export function buildFunnel(
  events: WithMeta<EventDoc>[],
  signups: WithMeta<WaitlistSignup>[]
): FunnelStep[] {
  const landed = uniqueSessions(events).size || 0;
  const pageViews = countEvent(events, "page_view").size;
  const base = Math.max(landed, pageViews, signups.length);
  const started = countEvent(events, "signup_started").size;
  const calc = countEvent(events, "exposure_calculator_started").size;
  const priced = countEvent(events, "price_option_selected").size;
  const completed = signups.length;

  const pct = (n: number) => (base > 0 ? Math.round((n / base) * 100) : 0);
  return [
    { label: "Landed on page", count: base, pct: 100 },
    { label: "Opened exposure calculator", count: calc, pct: pct(calc) },
    { label: "Selected a price", count: priced, pct: pct(priced) },
    { label: "Started signup", count: started, pct: pct(started) },
    { label: "Completed (email captured)", count: completed, pct: pct(completed) },
  ];
}

export type BreakdownRow = { label: string; count: number };

export function answerBreakdown<T extends Record<string, unknown>>(
  rows: WithMeta<T>[],
  field: keyof T,
  labels?: Record<string, string>
): BreakdownRow[] {
  const tally = new Map<string, number>();
  for (const r of rows) {
    const raw = r[field];
    if (raw === undefined || raw === null || raw === "") continue;
    const key = String(raw);
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }
  return [...tally.entries()]
    .map(([key, count]) => ({ label: labels?.[key] ?? key, count }))
    .sort((a, b) => b.count - a.count);
}

export function bucketRidingMinutes(
  signups: WithMeta<WaitlistSignup>[]
): BreakdownRow[] {
  const buckets: { label: string; min: number; max: number }[] = [
    { label: "0–30 min", min: 0, max: 30 },
    { label: "31–60 min", min: 31, max: 60 },
    { label: "61–120 min", min: 61, max: 120 },
    { label: "120+ min", min: 121, max: Infinity },
  ];
  return buckets
    .map((b) => ({
      label: b.label,
      count: signups.filter(
        (s) =>
          typeof s.ridingMinutesPerDay === "number" &&
          s.ridingMinutesPerDay >= b.min &&
          s.ridingMinutesPerDay <= b.max
      ).length,
    }))
    .filter((r) => r.count > 0);
}

export function utmBySubmission(
  signups: WithMeta<WaitlistSignup>[]
): BreakdownRow[] {
  return answerBreakdown(
    signups.map((s) => ({ ...s, src: s.utmSource ?? "" })),
    "src"
  );
}

export function utmByVisit(events: WithMeta<EventDoc>[]): BreakdownRow[] {
  // One vote per session, using that session's first-seen utm_source.
  const bySession = new Map<string, string>();
  for (const e of events) {
    if (!e.sessionId || bySession.has(e.sessionId)) continue;
    if (e.utmSource) bySession.set(e.sessionId, e.utmSource);
  }
  const tally = new Map<string, number>();
  for (const src of bySession.values()) {
    tally.set(src, (tally.get(src) ?? 0) + 1);
  }
  return [...tally.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

// Sessions that started the signup but never completed it — the reference's
// "partial" rows. Matched to events by sessionId.
export function partialSessions(
  events: WithMeta<EventDoc>[],
  signups: WithMeta<WaitlistSignup>[]
): { sessionId: string; startedAt: Date | null; utmSource?: string }[] {
  const completedSessions = new Set(
    signups.map((s) => s.sessionId).filter(Boolean) as string[]
  );
  const started = new Map<
    string,
    { startedAt: Date | null; utmSource?: string }
  >();
  for (const e of events) {
    if (e.event !== "signup_started" || !e.sessionId) continue;
    if (completedSessions.has(e.sessionId)) continue;
    const prev = started.get(e.sessionId);
    if (!prev) {
      started.set(e.sessionId, {
        startedAt: e.createdAt,
        utmSource: e.utmSource,
      });
    }
  }
  return [...started.entries()].map(([sessionId, v]) => ({
    sessionId,
    ...v,
  }));
}
