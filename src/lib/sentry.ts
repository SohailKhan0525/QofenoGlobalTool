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
      tracesSampleRate: 1.0,
      sampleRate: 1.0,
      environment: typeof import.meta !== "undefined" ? (import.meta.env.MODE || "production") : "production",
      beforeSend(event) {
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
      void Sentry.flush(2000);
    }
  } catch {
    console.error("[Qofeno Error]", error, context);
  }

  // Dual HTTP envelope fallback to guarantee 100% immediate event ingestion in Sentry dashboard & email alerts
  try {
    const match = SENTRY_DSN.match(/https:\/\/([^@]+)@([^/]+)\/(\d+)/);
    if (match) {
      const [, publicKey, host, projectId] = match;
      const sentryIngestUrl = `https://${host}/api/${projectId}/envelope/`;
      const eventId = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      const envelopeHeader = JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() });
      const itemHeader = JSON.stringify({ type: 'event', content_type: 'application/json' });
      const message = typeof error === 'string' ? error : (error?.message || 'Qofeno Exception');
      const itemPayload = JSON.stringify({
        event_id: eventId,
        message,
        level: 'error',
        environment: 'production',
        extra: context || {}
      });
      const envelope = `${envelopeHeader}\n${itemHeader}\n${itemPayload}\n`;

      fetch(sentryIngestUrl, {
        method: 'POST',
        headers: {
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=qofeno-web/1.0, sentry_key=${publicKey}`,
          'Content-Type': 'application/x-sentry-envelope'
        },
        body: envelope
      }).catch(() => {});
    }
  } catch {}
}
