// src/lib/sentry.ts
import * as Sentry from "@sentry/react";

const SENTRY_DSN =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SENTRY_DSN) ||
  (typeof import.meta !== "undefined" && import.meta.env?.NEXT_PUBLIC_SENTRY_DSN) ||
  "";

export function initSentry() {
  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: typeof import.meta !== "undefined" ? import.meta.env.MODE : "production",
    beforeSend(event) {
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
      }
      return event;
    }
  });
}

export function captureException(error: any, context?: Record<string, any>) {
  if (!SENTRY_DSN) {
    console.error("[Qofeno Error]", error, context);
    return;
  }
  Sentry.captureException(error, { extra: context });
}
