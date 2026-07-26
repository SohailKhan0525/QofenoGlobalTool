// src/lib/analytics.ts
// Safe wrapper — only runs client-side, never crashes if GA fails

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const GA_MEASUREMENT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GA_MEASUREMENT_ID) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_GA_MEASUREMENT_ID) ||
  'G-DZB3DZP46T';

export function trackEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;

  window.gtag("event", eventName, {
    ...params,
    app_name: "Qofeno",
    send_to: GA_MEASUREMENT_ID
  });
}

// Track tool usage:
export function trackToolUse(toolSlug: string, toolName: string, category: string, isPro: boolean) {
  trackEvent("tool_used", {
    tool_slug:  toolSlug,
    tool_name:  toolName,
    category:   category,
    plan_type:  isPro ? "pro" : "free",
    event_category: "Tools"
  });
}

// Track file processed:
export function trackFileProcessed(toolSlug: string, fileSizeBytes: number, durationMs: number, success: boolean) {
  trackEvent("file_processed", {
    tool_slug:    toolSlug,
    file_size_kb: Math.round(fileSizeBytes / 1024),
    duration_ms:  durationMs,
    success:      success,
    event_category: "Processing"
  });
}

// Track signup:
export function trackSignup(method: string) {
  trackEvent("sign_up", { method, event_category: "Auth" });
}

// Track upgrade click:
export function trackUpgradeClick(source: string, plan: string) {
  trackEvent("upgrade_click", { source, plan, event_category: "Revenue" });
}

// Track download:
export function trackDownload(toolSlug: string, outputSizeBytes: number) {
  trackEvent("file_download", {
    tool_slug:       toolSlug,
    output_size_kb:  Math.round(outputSizeBytes / 1024),
    event_category: "Downloads"
  });
}
