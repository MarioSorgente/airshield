// Event tracking utility for AirShield market validation
// Events are logged to console and stored in localStorage
// Ready to connect to Google Analytics, Meta Pixel, TikTok Pixel, or backend

type TrackingEvent =
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
