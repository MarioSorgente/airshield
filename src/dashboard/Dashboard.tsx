// AirShield admin dashboard.
//
// Reads live from Firestore (see dashboardDb.ts) and lays the data out like the
// reference: stat cards, drop-off funnel, answer breakdowns, traffic source, and
// a full submissions table. Self-contained light "cream" theme so it reads as a
// back-office tool, distinct from the dark marketing site.
import { useEffect, useMemo, useState } from "react";
import { firebaseReady, missingFirebaseEnv } from "@/lib/firebase";
import { WAITLIST_OFFSET } from "@/lib/config";
import {
  loadDashboard,
  uniqueSessions,
  countEvent,
  buildFunnel,
  answerBreakdown,
  bucketRidingMinutes,
  utmBySubmission,
  utmByVisit,
  partialSessions,
  type DashboardData,
  type BreakdownRow,
} from "@/lib/dashboardDb";
import AuthGate from "./AuthGate";

const USE_LABELS: Record<string, string> = {
  commuting: "Commuting",
  grab_gojek_delivery: "Grab/Gojek/Delivery",
  bali_daily_riding: "Bali daily riding",
  sport_riding: "Sport riding",
  family_parent_use: "Family/parent use",
  other: "Other",
};
const HELMET_LABELS: Record<string, string> = {
  open_face: "Open-face",
  full_face: "Full-face",
  half_face: "Half-face",
  none: "None / other",
};
const YESNO_LABELS: Record<string, string> = {
  yes: "Yes",
  maybe: "Maybe",
  no: "No",
};

const LOAD_ERR = "Failed to load data from Firestore.";

function fmt(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  value,
  label,
  sub,
}: {
  value: number | string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#EADFD3] bg-white p-5 shadow-sm">
      <div className="text-4xl font-bold tracking-tight text-[#2A2520]">
        {value}
      </div>
      <div className="mt-1 font-medium text-[#2A2520]">{label}</div>
      {sub && <div className="text-sm text-[#A89C8E]">{sub}</div>}
    </div>
  );
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#EADFD3] bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold text-[#2A2520]">{title}</h2>
        {hint && <span className="text-xs text-[#A89C8E]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function BarRow({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.max((count / max) * 100, count > 0 ? 4 : 0) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-40 shrink-0 truncate text-sm text-[#5C5247]" title={label}>
        {label}
      </div>
      <div className="h-5 flex-1 overflow-hidden rounded-full bg-[#F3E9DD]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-10 shrink-0 text-right text-sm font-semibold text-[#2A2520]">
        {count}
      </div>
    </div>
  );
}

function Breakdown({
  title,
  rows,
  color = "#E8654F",
}: {
  title: string;
  rows: BreakdownRow[];
  color?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-bold text-[#2A2520]">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-[#A89C8E]">No data yet.</p>
      ) : (
        rows.map((r) => (
          <BarRow
            key={r.label}
            label={r.label}
            count={r.count}
            max={max}
            color={color}
          />
        ))
      )}
    </div>
  );
}

function toCsv(data: DashboardData): string {
  const headers = [
    "createdAt",
    "name",
    "email",
    "whatsapp",
    "city",
    "ridingMinutesPerDay",
    "mainUse",
    "currentHelmetType",
    "priceOpinion",
    "filterSubscription",
    "objection",
    "utmSource",
    "sessionId",
  ];
  const esc = (v: unknown) => {
    const s = v === undefined || v === null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = data.signups.map((s) =>
    [
      s.createdAt?.toISOString() ?? "",
      s.name,
      s.email,
      s.whatsapp,
      s.city,
      s.ridingMinutesPerDay,
      s.mainUse,
      s.currentHelmetType,
      s.priceOpinion,
      s.filterSubscription,
      s.objection,
      s.utmSource,
      s.sessionId,
    ]
      .map(esc)
      .join(",")
  );
  return [headers.join(","), ...lines].join("\n");
}

function DashboardInner() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Event handler — fine to set state synchronously here.
  const refresh = () => {
    setLoading(true);
    setError(null);
    loadDashboard()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : LOAD_ERR))
      .finally(() => setLoading(false));
  };

  // Initial load: keep all state updates inside the async callbacks (never
  // synchronously in the effect body) and bail out if unmounted.
  useEffect(() => {
    let cancelled = false;
    loadDashboard()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : LOAD_ERR);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const derived = useMemo(() => {
    if (!data) return null;
    const visits = uniqueSessions(data.events).size;
    const started = countEvent(data.events, "signup_started").size;
    const completed = data.signups.length;
    return {
      visits,
      started,
      completed,
      funnel: buildFunnel(data.events, data.signups),
      partial: partialSessions(data.events, data.signups),
      utmSub: utmBySubmission(data.signups),
      utmVisit: utmByVisit(data.events),
    };
  }, [data]);

  if (!firebaseReady) {
    return (
      <Shell>
        <Panel title="Firebase not configured">
          <p className="text-sm text-[#5C5247]">
            Missing env vars: {missingFirebaseEnv.join(", ")}. Add them to a local{" "}
            <code>.env</code> and restart the dev server.
          </p>
        </Panel>
      </Shell>
    );
  }

  const downloadCsv = () => {
    if (!data) return;
    const blob = new Blob([toCsv(data)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `airshield_signups_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#2A2520]">
            AirShield — Waitlist Dashboard
          </h1>
          <p className="text-sm text-[#A89C8E]">
            Live from Firestore. Includes abandoned (partial) signups so you see
            exactly where people drop.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="rounded-lg border border-[#EADFD3] bg-white px-4 py-2 text-sm font-medium text-[#2A2520] hover:bg-[#F7EFE6]"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            onClick={downloadCsv}
            className="rounded-lg bg-[#2A2520] px-4 py-2 text-sm font-medium text-white hover:bg-black"
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-[#E8654F]/40 bg-[#E8654F]/10 p-4 text-sm text-[#9c3a2a]">
          {error} — make sure the open-read Firestore rules are deployed
          (<code>firebase deploy --only firestore:rules</code>).
        </div>
      )}

      {!data || !derived ? (
        <p className="text-[#A89C8E]">Loading…</p>
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard value={derived.visits} label="Page visits" sub="unique sessions" />
            <StatCard
              value={derived.started}
              label="Signups started"
              sub={
                derived.visits
                  ? `${Math.round((derived.started / derived.visits) * 100)}% of visits`
                  : "—"
              }
            />
            <StatCard
              value={derived.completed}
              label="Emails captured"
              sub={
                derived.started
                  ? `${Math.round((derived.completed / derived.started) * 100)}% of starters`
                  : "—"
              }
            />
          </div>

          {/* Waitlist size highlight */}
          <div className="rounded-2xl border border-[#EADFD3] bg-white p-5 shadow-sm">
            <span className="text-sm text-[#A89C8E]">Public waitlist size </span>
            <span className="text-xl font-bold text-[#2A8A5C]">
              {WAITLIST_OFFSET + derived.completed}
            </span>
            <span className="text-sm text-[#A89C8E]">
              {" "}
              ({WAITLIST_OFFSET} base + {derived.completed} real signups)
            </span>
          </div>

          {/* Funnel */}
          <Panel title="Drop-off funnel">
            {(() => {
              const max = Math.max(1, ...derived.funnel.map((f) => f.count));
              return derived.funnel.map((f) => (
                <BarRow
                  key={f.label}
                  label={`${f.label} — ${f.pct}%`}
                  count={f.count}
                  max={max}
                  color="#4F8A5B"
                />
              ));
            })()}
          </Panel>

          {/* Answer breakdowns + traffic */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Answer breakdowns" hint="from waitlist signups">
              <div className="space-y-5">
                <Breakdown
                  title="Main use"
                  rows={answerBreakdown(data.signups, "mainUse", USE_LABELS)}
                />
                <Breakdown
                  title="Current helmet type"
                  rows={answerBreakdown(
                    data.signups,
                    "currentHelmetType",
                    HELMET_LABELS
                  )}
                />
                <Breakdown
                  title="Would pay the target price?"
                  rows={answerBreakdown(
                    data.signups,
                    "priceOpinion",
                    YESNO_LABELS
                  )}
                />
                <Breakdown
                  title="Filter subscription interest"
                  rows={answerBreakdown(
                    data.signups,
                    "filterSubscription",
                    YESNO_LABELS
                  )}
                />
                <Breakdown
                  title="Riding minutes / day"
                  rows={bucketRidingMinutes(data.signups)}
                  color="#E0A93B"
                />
                <Breakdown
                  title="Top cities"
                  rows={answerBreakdown(data.signups, "city").slice(0, 8)}
                  color="#4F8A5B"
                />
              </div>
            </Panel>

            <div className="space-y-6">
              <Panel title="Traffic source (UTM)">
                <div className="space-y-5">
                  <div>
                    <h3 className="mb-1 text-sm font-bold text-[#2A2520]">
                      By submission
                    </h3>
                    {derived.utmSub.length === 0 ? (
                      <p className="text-sm text-[#A89C8E]">
                        No utm_source on submissions. Add{" "}
                        <code>?utm_source=…</code> to your ad links.
                      </p>
                    ) : (
                      <Breakdown title="" rows={derived.utmSub} />
                    )}
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-bold text-[#2A2520]">
                      By visit
                    </h3>
                    {derived.utmVisit.length === 0 ? (
                      <p className="text-sm text-[#A89C8E]">
                        No utm_source on visits yet.
                      </p>
                    ) : (
                      <Breakdown title="" rows={derived.utmVisit} />
                    )}
                  </div>
                </div>
              </Panel>

              <Panel title="Other page signals" hint="secondary collections">
                <div className="space-y-5">
                  <Breakdown
                    title="Price tier chosen"
                    rows={answerBreakdown(data.priceResponses, "priceOption")}
                    color="#E0A93B"
                  />
                  <Breakdown
                    title="Variant preference"
                    rows={answerBreakdown(data.variantSelections, "variantName")}
                    color="#E0A93B"
                  />
                  <Breakdown
                    title="Use-case clicks"
                    rows={answerBreakdown(data.useCaseSelections, "useCaseName")}
                    color="#E0A93B"
                  />
                  <Breakdown
                    title="Exposure calc — cities"
                    rows={answerBreakdown(data.exposureCalculations, "city").slice(
                      0,
                      6
                    )}
                    color="#E0A93B"
                  />
                </div>
              </Panel>
            </div>
          </div>

          {/* Submissions table */}
          <Panel
            title="All submissions"
            hint={`${data.signups.length} complete + ${derived.partial.length} partial`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#EADFD3] text-xs uppercase tracking-wide text-[#A89C8E]">
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Updated</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">City</th>
                    <th className="py-2 pr-3">Min/day</th>
                    <th className="py-2 pr-3">Use</th>
                    <th className="py-2 pr-3">Helmet</th>
                    <th className="py-2 pr-3">Price</th>
                    <th className="py-2 pr-3">Sub</th>
                    <th className="py-2 pr-3">Source</th>
                    <th className="py-2 pr-3">Session</th>
                  </tr>
                </thead>
                <tbody>
                  {data.signups.map((s) => (
                    <tr key={s.id} className="border-b border-[#F3E9DD]">
                      <td className="py-2 pr-3">
                        <span className="rounded-full bg-[#DDEFE2] px-2 py-0.5 text-xs font-medium text-[#2A8A5C]">
                          complete
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-[#5C5247]">{fmt(s.createdAt)}</td>
                      <td className="py-2 pr-3 text-[#2A2520]">{s.name}</td>
                      <td className="py-2 pr-3 text-[#5C5247]">{s.email}</td>
                      <td className="py-2 pr-3 text-[#5C5247]">{s.city}</td>
                      <td className="py-2 pr-3 text-[#5C5247]">
                        {s.ridingMinutesPerDay}
                      </td>
                      <td className="py-2 pr-3 text-[#5C5247]">
                        {USE_LABELS[s.mainUse] ?? s.mainUse}
                      </td>
                      <td className="py-2 pr-3 text-[#5C5247]">
                        {s.currentHelmetType
                          ? HELMET_LABELS[s.currentHelmetType]
                          : "—"}
                      </td>
                      <td className="py-2 pr-3 text-[#5C5247]">
                        {s.priceOpinion ?? "—"}
                      </td>
                      <td className="py-2 pr-3 text-[#5C5247]">
                        {s.filterSubscription ?? "—"}
                      </td>
                      <td className="py-2 pr-3 text-[#5C5247]">
                        {s.utmSource ?? "—"}
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs text-[#A89C8E]">
                        {s.sessionId ? s.sessionId.slice(0, 6) : "—"}
                      </td>
                    </tr>
                  ))}
                  {derived.partial.map((p) => (
                    <tr key={p.sessionId} className="border-b border-[#F3E9DD] bg-[#FBF4EC]/60">
                      <td className="py-2 pr-3">
                        <span className="rounded-full bg-[#F6E0D9] px-2 py-0.5 text-xs font-medium text-[#C0573F]">
                          partial
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-[#5C5247]">{fmt(p.startedAt)}</td>
                      <td className="py-2 pr-3 text-[#A89C8E]" colSpan={8}>
                        Started signup, did not complete
                      </td>
                      <td className="py-2 pr-3 text-[#5C5247]">
                        {p.utmSource ?? "—"}
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs text-[#A89C8E]">
                        {p.sessionId.slice(0, 6)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.signups.length === 0 && derived.partial.length === 0 && (
                <p className="py-6 text-center text-[#A89C8E]">
                  No submissions yet. Submit the form on the landing page to see
                  data here.
                </p>
              )}
            </div>
          </Panel>

          {/* Reconciliation footer */}
          <div className="rounded-2xl border border-[#EADFD3] bg-white p-5 text-sm text-[#5C5247] shadow-sm">
            <div className="mb-2 font-bold text-[#2A2520]">
              Firestore collection counts
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span>waitlist_signups: {data.signups.length}</span>
              <span>events: {data.events.length}</span>
              <span>early_access_reservations: {data.reservations.length}</span>
              <span>price_responses: {data.priceResponses.length}</span>
              <span>variant_selections: {data.variantSelections.length}</span>
              <span>
                filter_subscriptions: {data.filterSubscriptions.length}
              </span>
              <span>use_case_selections: {data.useCaseSelections.length}</span>
              <span>
                exposure_calculations: {data.exposureCalculations.length}
              </span>
              <span>
                objection_selections: {data.objectionSelections.length}
              </span>
            </div>
            <p className="mt-2 text-xs text-[#A89C8E]">
              Cross-check these against the Firebase console to confirm the
              dashboard reconciles with the database.
            </p>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FBF4EC] px-4 py-8 text-[#2A2520] sm:px-8">
      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <AuthGate>
      <DashboardInner />
    </AuthGate>
  );
}
