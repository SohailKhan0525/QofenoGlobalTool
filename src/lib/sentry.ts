// src/lib/sentry.ts
import * as Sentry from "@sentry/react";

const SENTRY_DSN =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SENTRY_DSN) ||
  (typeof import.meta !== "undefined" && import.meta.env?.NEXT_PUBLIC_SENTRY_DSN) ||
  "https://74d8b9d370d3cd9cfc174c8af65ce5c2@o4511564830081024.ingest.de.sentry.io/4511800246534224";

export function initSentry() {
  if (!SENTRY_DSN) return;

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.2,
      environment: typeof import.meta !== "undefined" ? (import.meta.env.MODE || "production") : "production",
      beforeSend(event) {
        if (event.user) {
          delete event.user.email;
          delete event.user.username;
        }
        return event;
      }
    });
    console.log("[Qofeno] Sentry initialized successfully.");
  } catch (err) {
    console.warn("[Qofeno] Sentry initialization warning:", err);
  }
}

export function captureException(error: any, context?: Record<string, any>) {
  try {
    const errToCapture = typeof error === 'string' ? new Error(error) : (error || new Error('Unknown error'));
    if (SENTRY_DSN) {
      Sentry.captureException(errToCapture, { extra: context });
    }
  } catch {
    console.error("[Qofeno Error]", error, context);
  }
}
