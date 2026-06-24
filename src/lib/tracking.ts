// Event tracking utility for AirShield market validation.
// Events are logged to console, stored in localStorage, AND — for the curated
// set in PERSISTED_EVENTS — written to the Firestore `events` collection so the
// admin dashboard can show real traffic, funnel drop-off, and UTM attribution.
// Still ready to connect to Google Analytics, Meta Pixel, TikTok Pixel.

import { saveEvent } from "./airshieldDb";
import { getSessionId, getUtm } from "./session";

type TrackingEvent =
  | "page_view"
  | "signup_started"
  | "hero_reserve_click"
  | "exposure_calculator_started"
  | "exposure_calculator_completed"
  | "email_submitted"
  | "whatsapp_submitted"
  | "price_option_selected"
  | "variant_selected"
  | "filter_subscription_selected"
  | "use_case_selected"
  | "objection_selected"
  | "beta_application_submitted"
  | "preorder_notify_click"
  | "scroll_to_section"
  | "modal_opened"
  | "modal_closed"
  | "preset_view_selected"
  | "filter_explore_opened"
  | "view_reset";

// Only these reach Firestore — keeps write volume sane and avoids persisting
// noisy UI events (scroll, modal open/close) that don't inform the funnel.
const PERSISTED_EVENTS: ReadonlySet<TrackingEvent> = new Set<TrackingEvent>([
  "page_view",
  "signup_started",
  "email_submitted",
  "beta_application_submitted",
  "hero_reserve_click",
  "exposure_calculator_started",
  "exposure_calculator_completed",
  "price_option_selected",
  "variant_selected",
  "use_case_selected",
  "filter_subscription_selected",
]);

interface TrackingPayload {
  event: TrackingEvent;
  timestamp: string;
  url: string;
  [key: string]: unknown;
}

const STORAGE_KEY = "airshield_events";

export function trackEvent(event: TrackingEvent, metadata: Record<string, unknown> = {}): void {
  const payload: TrackingPayload = {
    event,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    ...metadata,
  };

  // Log to console
  console.log(`[AirShield Track] ${event}`, payload);

  // Store in localStorage
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    existing.push(payload);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // localStorage might be full or unavailable
  }

  // Persist the curated subset to Firestore for the dashboard (fire-and-forget;
  // never let analytics break the page).
  if (PERSISTED_EVENTS.has(event)) {
    try {
      void saveEvent({
        event,
        sessionId: getSessionId(),
        path: window.location.pathname,
        url: window.location.href,
        ...getUtm(),
        ...metadata,
      }).catch(() => {});
    } catch {
      // ignore — Firebase may be unconfigured locally
    }
  }

  // TODO: Connect to analytics
  // gtag?.("event", event, metadata);
  // fbq?.("track", event, metadata);
  // ttq?.("track", event, metadata);
}

export function getStoredEvents(): TrackingPayload[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearStoredEvents(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function storeFormData(key: string, data: Record<string, unknown>): void {
  try {
    const existing = JSON.parse(localStorage.getItem("airshield_forms") || "{}");
    existing[key] = data;
    localStorage.setItem("airshield_forms", JSON.stringify(existing));
  } catch {
    // localStorage might be full
  }
}

export function getStoredFormData(key: string): Record<string, unknown> | null {
  try {
    const forms = JSON.parse(localStorage.getItem("airshield_forms") || "{}");
    return forms[key] || null;
  } catch {
    return null;
  }
}
