// AirShield Firestore writes.
// Every public form on the landing page persists through one of these functions.
// Each writes a single document to its collection and returns the new document id.
//
// Firestore rejects `undefined` field values, so `write()` strips them and
// always stamps `createdAt` with the server timestamp.
import {
  addDoc,
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { WAITLIST_OFFSET } from "./config";

// Public, PII-free social-proof counter. Lives at counters/waitlist and holds a
// single integer. Kept separate from waitlist_signups so the landing page can
// read/increment it without unauthenticated visitors ever touching lead data
// (signup docs stay locked to the admin in firestore.rules).
const WAITLIST_COUNTER = doc(db, "counters", "waitlist");

async function write(
  collectionName: string,
  data: Record<string, unknown>
): Promise<string> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== "") {
      clean[key] = value;
    }
  }
  const ref = await addDoc(collection(db, collectionName), {
    ...clean,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── waitlist_signups ────────────────────────────────────────────────
export type WaitlistSignup = {
  name: string;
  email: string;
  whatsapp?: string;
  city: string;
  ridingMinutesPerDay: number;
  mainUse:
    | "commuting"
    | "grab_gojek_delivery"
    | "bali_daily_riding"
    | "sport_riding"
    | "family_parent_use"
    | "other";
  currentHelmetType?: "open_face" | "full_face" | "half_face" | "none";
  priceOpinion?: "yes" | "maybe" | "no";
  filterSubscription?: "yes" | "maybe" | "no";
  objection?: string;
  variantPreference?: string;
  // Attribution — lets the dashboard tie a signup to its session + campaign.
  sessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

export function saveWaitlistSignup(data: WaitlistSignup) {
  return write("waitlist_signups", data);
}

// Current public waitlist size = WAITLIST_OFFSET + the social-proof counter.
// Reads the public counter doc (no auth needed); falls back to the offset alone
// if it's missing or unreadable (e.g. rules not yet deployed / offline).
export async function getWaitlistCount(): Promise<number> {
  try {
    const snap = await getDoc(WAITLIST_COUNTER);
    const count = snap.exists() ? Number(snap.data().count ?? 0) : 0;
    return WAITLIST_OFFSET + count;
  } catch {
    return WAITLIST_OFFSET;
  }
}

// Atomically increments the public counter and returns the new position
// (OFFSET + count). Called once per completed signup.
export async function incrementWaitlistCount(): Promise<number> {
  try {
    const next = await runTransaction(db, async (tx) => {
      const snap = await tx.get(WAITLIST_COUNTER);
      const current = snap.exists() ? Number(snap.data().count ?? 0) : 0;
      const value = current + 1;
      tx.set(WAITLIST_COUNTER, { count: value }, { merge: true });
      return value;
    });
    return WAITLIST_OFFSET + next;
  } catch {
    // Couldn't increment — show the best-effort current size rather than fail.
    return getWaitlistCount();
  }
}

// ── events (page views, funnel steps, key conversions) ──────────────
export type AirshieldEvent = {
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

export function saveEvent(data: AirshieldEvent) {
  return write("events", data);
}

// ── exposure_calculations ───────────────────────────────────────────
export type ExposureCalculation = {
  city: string;
  minutesPerDay: number;
  daysPerWeek: number;
  trafficLevel: "light" | "normal" | "heavy";
  helmetType: "open_face" | "full_face" | "mask_under_helmet" | "no_mask";
  workoutsPerWeek?: number;
  email?: string;
  weeklyHours?: string;
  yearlyHours?: string;
  looksAnnual?: string;
  wastedSessions?: number;
};

export function saveExposureCalculation(data: ExposureCalculation) {
  return write("exposure_calculations", data);
}

// ── price_responses ─────────────────────────────────────────────────
export type PriceResponse = {
  priceOption: "essential" | "standard" | "premium";
  email?: string;
  whatsapp?: string;
  city?: string;
  useCase?: string;
};

export function savePriceResponse(data: PriceResponse) {
  return write("price_responses", data);
}

// ── variant_selections ──────────────────────────────────────────────
export type VariantSelection = {
  variantName: string;
  email?: string;
};

export function saveVariantSelection(data: VariantSelection) {
  return write("variant_selections", data);
}

// ── filter_subscriptions ────────────────────────────────────────────
export type FilterSubscription = {
  frequency:
    | "reminders_only"
    | "every_4_weeks"
    | "every_6_weeks"
    | "every_8_weeks"
    | "not_interested";
  email?: string;
  priceAcceptance?: "yes" | "maybe" | "no";
};

export function saveFilterSubscription(data: FilterSubscription) {
  return write("filter_subscriptions", data);
}

// ── use_case_selections ─────────────────────────────────────────────
export type UseCaseSelection = {
  useCaseName: string;
  email?: string;
};

export function saveUseCaseSelection(data: UseCaseSelection) {
  return write("use_case_selections", data);
}

// ── objection_selections ────────────────────────────────────────────
export type ObjectionSelection = {
  objectionName: string;
  email?: string;
};

export function saveObjectionSelection(data: ObjectionSelection) {
  return write("objection_selections", data);
}

// ── early_access_reservations ───────────────────────────────────────
export type EarlyAccessReservation = {
  source?: string;
  email?: string;
  whatsapp?: string;
  city?: string;
  variant?: string;
};

export function saveEarlyAccessReservation(data: EarlyAccessReservation) {
  return write("early_access_reservations", data);
}
