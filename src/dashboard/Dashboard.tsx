// AirShield admin dashboard.
//
// Reads live from Firestore (see dashboardDb.ts) and presents the data the way a
// founder actually reads it: an at-a-glance overview, then three goal-framed
// chapters — how to improve (funnel + objections), demand/consensus (would they
// pay), and who the users are (audience) — each led by a plain-language insight
// callout. Dark theme matched to the marketing site (index.css tokens).
import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  RefreshCw,
  Download,
  ArrowUpRight,
  TrendingDown,
  DollarSign,
  Users,
  Radio,
  Package,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  funnelDropOffs,
  sentimentShare,
  topAnswer,
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

// Landing-page accent palette (see index.css / SectionHeader.tsx).
type Tone = "teal" | "orange" | "gold" | "blue";
const TONE: Record<Tone, string> = {
  teal: "#00D4AA",
  orange: "#FF4D1C",
  gold: "#F5C842",
  blue: "#3A7CA5",
};

function fmt(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pctOf(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

// ── Presentational primitives (dark landing theme) ──────────────────

function SectionLabel({
  eyebrow,
  title,
  tone = "teal",
}: {
  eyebrow: string;
  title: string;
  tone?: Tone;
}) {
  return (
    <div className="space-y-1">
      <p
        className="font-mono-label text-xs uppercase tracking-widest"
        style={{ color: TONE[tone] }}
      >
        {eyebrow}
      </p>
      <h2 className="font-heading text-3xl tracking-tight text-[#F4F1EC] sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}

function InsightCallout({
  tone,
  icon: Icon,
  headline,
  detail,
}: {
  tone: Tone;
  icon: typeof Shield;
  headline: string;
  detail?: string;
}) {
  const color = TONE[tone];
  return (
    <div
      className="flex items-start gap-3 rounded-2xl border p-4"
      style={{ borderColor: `${color}4D`, backgroundColor: `${color}14` }}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color }} />
      <div>
        <p className="font-medium text-[#F4F1EC]">{headline}</p>
        {detail && <p className="mt-0.5 text-sm text-[#8A8A93]">{detail}</p>}
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  sub,
  tone = "teal",
  highlight = false,
}: {
  value: number | string;
  label: string;
  sub?: string;
  tone?: Tone;
  highlight?: boolean;
}) {
  const color = TONE[tone];
  return (
    <div
      className="rounded-2xl border bg-[#0D0D10] p-5"
      style={
        highlight
          ? { borderColor: `${color}59`, backgroundColor: `${color}0D` }
          : { borderColor: "#1A1A22" }
      }
    >
      <div
        className="font-heading text-5xl leading-none tracking-tight"
        style={{ color: highlight ? color : "#F4F1EC" }}
      >
        {value}
      </div>
      <div className="mt-2 text-sm font-medium text-[#F4F1EC]">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-[#8A8A93]">{sub}</div>}
    </div>
  );
}

function BigStatCard({
  pct,
  label,
  sub,
  tone,
}: {
  pct: number;
  label: string;
  sub?: string;
  tone: Tone;
}) {
  return (
    <div className="rounded-2xl border border-[#1A1A22] bg-[#0D0D10] p-6">
      <div
        className="font-heading text-6xl leading-none tracking-tight"
        style={{ color: TONE[tone] }}
      >
        {pct}%
      </div>
      <div className="mt-3 font-medium text-[#F4F1EC]">{label}</div>
      {sub && <div className="mt-0.5 text-sm text-[#8A8A93]">{sub}</div>}
    </div>
  );
}

function Panel({
  title,
  hint,
  children,
  className,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#1A1A22] bg-[#0D0D10] p-6",
        className
      )}
    >
      {(title || hint) && (
        <div className="mb-4 flex items-baseline justify-between gap-3">
          {title && (
            <h3 className="text-base font-semibold text-[#F4F1EC]">{title}</h3>
          )}
          {hint && (
            <span className="font-mono-label text-xs text-[#8A8A93]">{hint}</span>
          )}
        </div>
      )}
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
      <div
        className="w-40 shrink-0 truncate text-sm text-[#8A8A93]"
        title={label}
      >
        {label}
      </div>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#13131A]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-10 shrink-0 text-right text-sm font-semibold text-[#F4F1EC]">
        {count}
      </div>
    </div>
  );
}

function Breakdown({
  title,
  rows,
  tone = "teal",
  empty = "No data yet.",
}: {
  title: string;
  rows: BreakdownRow[];
  tone?: Tone;
  empty?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-1">
      {title && (
        <h4 className="text-sm font-semibold text-[#F4F1EC]">{title}</h4>
      )}
      {rows.length === 0 ? (
        <p className="text-sm text-[#8A8A93]">{empty}</p>
      ) : (
        rows.map((r) => (
          <BarRow
            key={r.label}
            label={r.label}
            count={r.count}
            max={max}
            color={TONE[tone]}
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
    "featureRequest",
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
      s.featureRequest,
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
    const funnel = buildFunnel(data.events, data.signups);
    return {
      visits,
      started,
      completed,
      funnel,
      drop: funnelDropOffs(funnel),
      partial: partialSessions(data.events, data.signups),
      utmSub: utmBySubmission(data.signups),
      utmVisit: utmByVisit(data.events),
      pay: sentimentShare(data.signups, "priceOpinion"),
      sub: sentimentShare(data.signups, "filterSubscription"),
      topUse: topAnswer(data.signups, "mainUse", USE_LABELS),
      topHelmet: topAnswer(data.signups, "currentHelmetType", HELMET_LABELS),
      topCity: topAnswer(data.signups, "city"),
      topDesign: topAnswer(data.variantSelections, "variantName"),
      designVotes: data.variantSelections.length,
      feedback: data.signups
        .filter((s) => typeof s.featureRequest === "string" && s.featureRequest.trim() !== "")
        .map((s) => ({
          text: (s.featureRequest as string).trim(),
          name: s.name,
          city: s.city,
          at: s.createdAt,
        })),
    };
  }, [data]);

  if (!firebaseReady) {
    return (
      <Shell>
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
          <Panel title="Firebase not configured">
            <p className="text-sm text-[#8A8A93]">
              Missing env vars: {missingFirebaseEnv.join(", ")}. Add them to a
              local <code>.env</code> and restart the dev server.
            </p>
          </Panel>
        </main>
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
      {/* Sticky toolbar */}
      <header className="sticky top-0 z-40 border-b border-[#1A1A22] bg-[#060608]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#00D4AA]/30 bg-[#00D4AA]/10">
              <Shield className="h-4 w-4 text-[#00D4AA]" />
            </span>
            <div>
              <div className="font-heading text-xl leading-none tracking-wide text-[#F4F1EC]">
                AirShield Waitlist
              </div>
              <div className="font-mono-label text-[10px] uppercase tracking-widest text-[#8A8A93]">
                Live from Firestore
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-lg border border-[#1A1A22] bg-[#0D0D10] px-3.5 py-2 text-sm font-medium text-[#F4F1EC] transition-colors hover:border-[#00D4AA]/40 hover:text-[#00D4AA]"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              <span className="hidden sm:inline">
                {loading ? "Refreshing…" : "Refresh"}
              </span>
            </button>
            <button
              onClick={downloadCsv}
              className="inline-flex items-center gap-2 rounded-lg bg-[#00D4AA] px-3.5 py-2 text-sm font-semibold text-[#060608] transition-colors hover:bg-[#00E0B4]"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:px-8">
        {error && (
          <div className="rounded-xl border border-[#FF4D1C]/40 bg-[#FF4D1C]/10 p-4 text-sm text-[#FF4D1C]">
            {error} — make sure the open-read Firestore rules are deployed (
            <code>firebase deploy --only firestore:rules</code>).
          </div>
        )}

        {!data || !derived ? (
          <p className="text-[#8A8A93]">Loading…</p>
        ) : (
          <>
            {/* ── Overview ─────────────────────────────────────────── */}
            <section className="space-y-4">
              <SectionLabel eyebrow="Overview" title="At a glance" tone="teal" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  value={derived.visits}
                  label="Page visits"
                  sub="unique sessions"
                  tone="teal"
                />
                <StatCard
                  value={derived.started}
                  label="Signups started"
                  sub={`${pctOf(derived.started, derived.visits)}% of visits`}
                  tone="gold"
                />
                <StatCard
                  value={derived.completed}
                  label="Emails captured"
                  sub={`${pctOf(derived.completed, derived.started)}% of starters`}
                  tone="orange"
                />
                <StatCard
                  value={WAITLIST_OFFSET + derived.completed}
                  label="Public waitlist size"
                  sub={`${WAITLIST_OFFSET} base + ${derived.completed} real signups`}
                  tone="teal"
                  highlight
                />
              </div>
              <InsightCallout
                tone="teal"
                icon={ArrowUpRight}
                headline={
                  derived.visits > 0
                    ? `${derived.completed} of ${derived.visits} visitors joined the waitlist — a ${pctOf(
                        derived.completed,
                        derived.visits
                      )}% visitor-to-signup rate.`
                    : "No visits tracked yet — share the landing page to start collecting data."
                }
                detail="The public counter adds a base offset for social proof; the 'real signups' number is your true demand."
              />
            </section>

            {/* ── How to improve ───────────────────────────────────── */}
            <section className="space-y-4">
              <SectionLabel
                eyebrow="How to improve"
                title="Where people drop off"
                tone="orange"
              />
              {derived.drop && (
                <InsightCallout
                  tone="orange"
                  icon={TrendingDown}
                  headline={`Biggest leak: ${derived.drop.dropPct}% don't continue from “${derived.drop.fromLabel}” to “${derived.drop.toLabel}”.`}
                  detail="Focus copy, speed, or friction reduction on this step first — it's where you lose the most people."
                />
              )}
              <Panel title="Drop-off funnel">
                {(() => {
                  const max = Math.max(1, ...derived.funnel.map((f) => f.count));
                  return derived.funnel.map((f) => (
                    <BarRow
                      key={f.label}
                      label={`${f.label} — ${f.pct}%`}
                      count={f.count}
                      max={max}
                      color={TONE.teal}
                    />
                  ));
                })()}
                <p className="mt-3 border-t border-[#1A1A22] pt-3 text-xs text-[#8A8A93]">
                  {derived.partial.length} started the signup but didn't finish —
                  see the partial rows in the submissions table below.
                </p>
              </Panel>
              <Panel title="Top objections" hint="why people hesitate">
                <Breakdown
                  title=""
                  rows={answerBreakdown(data.objectionSelections, "objectionName")}
                  tone="orange"
                  empty="No objections logged yet. Capturing these tells you exactly what to address."
                />
              </Panel>
            </section>

            {/* ── Demand / consensus ───────────────────────────────── */}
            <section className="space-y-4">
              <SectionLabel
                eyebrow="Demand & consensus"
                title="Is there a market?"
                tone="teal"
              />
              <InsightCallout
                tone={derived.pay.yesPct >= 50 ? "teal" : "gold"}
                icon={DollarSign}
                headline={
                  derived.pay.total > 0
                    ? `${derived.pay.yesPct}% of people who answered would pay the target price.`
                    : "No price feedback yet — ask the price question to gauge willingness to pay."
                }
                detail={
                  derived.pay.total > 0
                    ? `Based on ${derived.pay.total} answer${
                        derived.pay.total === 1 ? "" : "s"
                      }. Above ~50% is a strong signal the price lands.`
                    : undefined
                }
              />
              <InsightCallout
                tone="teal"
                icon={Package}
                headline={
                  derived.topDesign
                    ? `Build the ${derived.topDesign.label} first — it's leading with ${
                        derived.designVotes > 0
                          ? Math.round((derived.topDesign.count / derived.designVotes) * 100)
                          : 0
                      }% of design votes.`
                    : "No design votes yet — the design switcher in the product section feeds this."
                }
                detail={
                  derived.topDesign
                    ? `${derived.topDesign.count} of ${derived.designVotes} design picks. This is your steer on which shell to engineer first.`
                    : undefined
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <BigStatCard
                  pct={derived.pay.yesPct}
                  label="Would pay the target price"
                  sub={`${derived.pay.yes} yes of ${derived.pay.total} answered`}
                  tone={derived.pay.yesPct >= 50 ? "teal" : "gold"}
                />
                <BigStatCard
                  pct={derived.sub.yesPct}
                  label="Want the filter subscription"
                  sub={`${derived.sub.yes} yes of ${derived.sub.total} answered`}
                  tone={derived.sub.yesPct >= 50 ? "teal" : "gold"}
                />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Panel title="Sentiment detail">
                  <div className="space-y-5">
                    <Breakdown
                      title="Would pay the target price?"
                      rows={answerBreakdown(
                        data.signups,
                        "priceOpinion",
                        YESNO_LABELS
                      )}
                      tone="teal"
                    />
                    <Breakdown
                      title="Filter subscription interest"
                      rows={answerBreakdown(
                        data.signups,
                        "filterSubscription",
                        YESNO_LABELS
                      )}
                      tone="teal"
                    />
                  </div>
                </Panel>
                <Panel title="Product preferences" hint="from page interactions">
                  <div className="space-y-5">
                    <Breakdown
                      title="Price tier chosen"
                      rows={answerBreakdown(data.priceResponses, "priceOption")}
                      tone="gold"
                    />
                    <Breakdown
                      title="Design preference (build first)"
                      rows={answerBreakdown(
                        data.variantSelections,
                        "variantName"
                      )}
                      tone="gold"
                      empty="No design votes yet. The product-section switcher records these."
                    />
                    <Breakdown
                      title="Use-case clicks"
                      rows={answerBreakdown(
                        data.useCaseSelections,
                        "useCaseName"
                      )}
                      tone="gold"
                    />
                  </div>
                </Panel>
              </div>
            </section>

            {/* ── Who your users are ───────────────────────────────── */}
            <section className="space-y-4">
              <SectionLabel
                eyebrow="Audience"
                title="Who your users are"
                tone="blue"
              />
              <InsightCallout
                tone="blue"
                icon={Users}
                headline={
                  derived.topUse
                    ? `Mostly ${derived.topUse.label.toLowerCase()} riders${
                        derived.topHelmet
                          ? ` on ${derived.topHelmet.label.toLowerCase()} helmets`
                          : ""
                      }${derived.topCity ? `, most in ${derived.topCity.label}` : ""}.`
                    : "Not enough signups yet to profile your audience."
                }
                detail="Use this to tailor messaging, partnerships, and where you advertise."
              />
              <div className="grid gap-6 lg:grid-cols-2">
                <Panel title="Use & equipment">
                  <div className="space-y-5">
                    <Breakdown
                      title="Main use"
                      rows={answerBreakdown(data.signups, "mainUse", USE_LABELS)}
                      tone="blue"
                    />
                    <Breakdown
                      title="Current helmet type"
                      rows={answerBreakdown(
                        data.signups,
                        "currentHelmetType",
                        HELMET_LABELS
                      )}
                      tone="blue"
                    />
                    <Breakdown
                      title="Riding minutes / day"
                      rows={bucketRidingMinutes(data.signups)}
                      tone="blue"
                    />
                  </div>
                </Panel>
                <Panel title="Location">
                  <div className="space-y-5">
                    <Breakdown
                      title="Top cities (signups)"
                      rows={answerBreakdown(data.signups, "city").slice(0, 8)}
                      tone="blue"
                    />
                    <Breakdown
                      title="Exposure calculator — cities"
                      rows={answerBreakdown(
                        data.exposureCalculations,
                        "city"
                      ).slice(0, 6)}
                      tone="blue"
                    />
                  </div>
                </Panel>
              </div>
            </section>

            {/* ── Product feedback — early-stage feature requests ──── */}
            <section className="space-y-4">
              <SectionLabel
                eyebrow="Product feedback"
                title="What riders want built"
                tone="teal"
              />
              <InsightCallout
                tone="teal"
                icon={Lightbulb}
                headline={
                  derived.feedback.length > 0
                    ? `${derived.feedback.length} rider${
                        derived.feedback.length === 1 ? "" : "s"
                      } left a specific request for the helmet.`
                    : "No feature requests yet — the beta form's “what would make it perfect” box feeds this."
                }
                detail={
                  derived.feedback.length > 0
                    ? "Raw, unprompted asks straight from sign-ups — your roadmap signal for what to build next."
                    : undefined
                }
              />
              {derived.feedback.length > 0 && (
                <Panel title="Requests & ideas" hint={`${derived.feedback.length} total`}>
                  <ul className="max-h-96 space-y-3 overflow-y-auto pr-1">
                    {derived.feedback.map((f, i) => (
                      <li
                        key={i}
                        className="rounded-xl border border-[#1A1A22] bg-[#0D0D10] p-3"
                      >
                        <p className="text-sm text-[#F4F1EC]">“{f.text}”</p>
                        <p className="mt-1 text-xs text-[#8A8A93]">
                          {[f.name, f.city, f.at ? f.at.toLocaleDateString() : null]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
            </section>

            {/* ── Traffic sources ──────────────────────────────────── */}
            <section className="space-y-4">
              <SectionLabel
                eyebrow="Traffic"
                title="Where they come from"
                tone="gold"
              />
              <div className="grid gap-6 lg:grid-cols-2">
                <Panel title="By submission" hint="utm_source on signups">
                  {derived.utmSub.length === 0 ? (
                    <p className="text-sm text-[#8A8A93]">
                      No utm_source on submissions. Add{" "}
                      <code>?utm_source=…</code> to your ad links to see which
                      channels convert.
                    </p>
                  ) : (
                    <Breakdown title="" rows={derived.utmSub} tone="gold" />
                  )}
                </Panel>
                <Panel title="By visit" hint="utm_source on traffic">
                  {derived.utmVisit.length === 0 ? (
                    <p className="text-sm text-[#8A8A93]">
                      No utm_source on visits yet.
                    </p>
                  ) : (
                    <Breakdown title="" rows={derived.utmVisit} tone="gold" />
                  )}
                </Panel>
              </div>
            </section>

            {/* ── All submissions (collapsible) ────────────────────── */}
            <details className="group rounded-2xl border border-[#1A1A22] bg-[#0D0D10]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
                <span className="flex items-center gap-2 text-base font-semibold text-[#F4F1EC]">
                  <Radio className="h-4 w-4 text-[#8A8A93]" />
                  All submissions
                </span>
                <span className="font-mono-label text-xs text-[#8A8A93]">
                  {data.signups.length} complete + {derived.partial.length}{" "}
                  partial · click to expand
                </span>
              </summary>
              <div className="overflow-x-auto border-t border-[#1A1A22] p-5">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#1A1A22] text-xs uppercase tracking-wide text-[#8A8A93]">
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
                      <tr key={s.id} className="border-b border-[#15151B]">
                        <td className="py-2 pr-3">
                          <span className="rounded-full bg-[#00D4AA]/15 px-2 py-0.5 text-xs font-medium text-[#00D4AA]">
                            complete
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-[#8A8A93]">
                          {fmt(s.createdAt)}
                        </td>
                        <td className="py-2 pr-3 text-[#F4F1EC]">{s.name}</td>
                        <td className="py-2 pr-3 text-[#8A8A93]">{s.email}</td>
                        <td className="py-2 pr-3 text-[#8A8A93]">{s.city}</td>
                        <td className="py-2 pr-3 text-[#8A8A93]">
                          {s.ridingMinutesPerDay}
                        </td>
                        <td className="py-2 pr-3 text-[#8A8A93]">
                          {USE_LABELS[s.mainUse] ?? s.mainUse}
                        </td>
                        <td className="py-2 pr-3 text-[#8A8A93]">
                          {s.currentHelmetType
                            ? HELMET_LABELS[s.currentHelmetType]
                            : "—"}
                        </td>
                        <td className="py-2 pr-3 text-[#8A8A93]">
                          {s.priceOpinion ?? "—"}
                        </td>
                        <td className="py-2 pr-3 text-[#8A8A93]">
                          {s.filterSubscription ?? "—"}
                        </td>
                        <td className="py-2 pr-3 text-[#8A8A93]">
                          {s.utmSource ?? "—"}
                        </td>
                        <td className="py-2 pr-3 font-mono text-xs text-[#5C5C66]">
                          {s.sessionId ? s.sessionId.slice(0, 6) : "—"}
                        </td>
                      </tr>
                    ))}
                    {derived.partial.map((p) => (
                      <tr
                        key={p.sessionId}
                        className="border-b border-[#15151B] bg-[#13131A]/60"
                      >
                        <td className="py-2 pr-3">
                          <span className="rounded-full bg-[#FF4D1C]/15 px-2 py-0.5 text-xs font-medium text-[#FF4D1C]">
                            partial
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-[#8A8A93]">
                          {fmt(p.startedAt)}
                        </td>
                        <td className="py-2 pr-3 text-[#8A8A93]" colSpan={8}>
                          Started signup, did not complete
                        </td>
                        <td className="py-2 pr-3 text-[#8A8A93]">
                          {p.utmSource ?? "—"}
                        </td>
                        <td className="py-2 pr-3 font-mono text-xs text-[#5C5C66]">
                          {p.sessionId.slice(0, 6)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.signups.length === 0 && derived.partial.length === 0 && (
                  <p className="py-6 text-center text-[#8A8A93]">
                    No submissions yet. Submit the form on the landing page to
                    see data here.
                  </p>
                )}
              </div>
            </details>

            {/* ── Reconciliation footer ────────────────────────────── */}
            <div className="rounded-2xl border border-[#1A1A22] bg-[#0D0D10] p-5 text-sm text-[#8A8A93]">
              <div className="mb-2 font-semibold text-[#F4F1EC]">
                Firestore collection counts
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <span>waitlist_signups: {data.signups.length}</span>
                <span>events: {data.events.length}</span>
                <span>
                  early_access_reservations: {data.reservations.length}
                </span>
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
              <p className="mt-2 text-xs text-[#5C5C66]">
                Cross-check these against the Firebase console to confirm the
                dashboard reconciles with the database.
              </p>
            </div>
          </>
        )}
      </main>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#060608] font-body text-[#F4F1EC]">
      {children}
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
