// Visitor session + traffic attribution.
//
// `getSessionId()` returns a stable per-browser id (persisted in localStorage)
// so the dashboard can stitch together page views, funnel steps, and the final
// submission for the same person — and surface "partial" signups (sessions that
// started but never completed).
//
// `getUtm()` captures the campaign that brought the visitor in. UTM params only
// exist on the FIRST URL, so we snapshot them into sessionStorage on first load
// and reuse that snapshot for every later event/submission in the session.

const SESSION_KEY = "airshield_session";
const UTM_KEY = "airshield_utm";

export type Utm = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;
};

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // fall through to manual id
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = randomId();
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    // Private mode / storage disabled — return an ephemeral id so events still
    // carry something, even if it isn't stable across navigations.
    return randomId();
  }
}

export function getUtm(): Utm {
  try {
    const cached = sessionStorage.getItem(UTM_KEY);
    if (cached) return JSON.parse(cached) as Utm;
  } catch {
    // ignore and re-parse from the URL below
  }

  const params = new URLSearchParams(window.location.search);
  const utm: Utm = {};
  const source = params.get("utm_source");
  const medium = params.get("utm_medium");
  const campaign = params.get("utm_campaign");
  const term = params.get("utm_term");
  const content = params.get("utm_content");
  if (source) utm.utmSource = source;
  if (medium) utm.utmMedium = medium;
  if (campaign) utm.utmCampaign = campaign;
  if (term) utm.utmTerm = term;
  if (content) utm.utmContent = content;
  if (document.referrer) utm.referrer = document.referrer;

  try {
    sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
  } catch {
    // non-fatal — we just won't cache it
  }
  return utm;
}
