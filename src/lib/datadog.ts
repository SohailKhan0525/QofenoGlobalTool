/**
 * Datadog Monitoring & Analytics Integration
 * Configured with live Datadog Org API Key & Key ID from environment.
 */

const DD_API_KEY = import.meta.env.VITE_DD_API_KEY || import.meta.env.DD_API_KEY || '1e6ae311d09234b9bd0064b09af0aafe';
const DD_ORG_KEY_ID = import.meta.env.VITE_DD_ORG_KEY_ID || import.meta.env.DD_ORG_KEY_ID || 'd37ff910-6ef6-4d35-be3c-d11764f9eb7a';

export interface DatadogEvent {
  title: string;
  text: string;
  alert_type?: 'info' | 'warning' | 'error' | 'success';
  tags?: string[];
}

/**
 * Log a event or metric to Datadog.
 * Safe to call from anywhere in the application.
 */
export async function trackDatadogEvent(event: DatadogEvent) {
  if (!DD_API_KEY) return;

  try {
    const payload = {
      title: `[Qofeno] ${event.title}`,
      text: event.text,
      alert_type: event.alert_type || 'info',
      date_happened: Math.floor(Date.now() / 1000),
      tags: ['env:production', 'service:qofeno-web', ...(event.tags || [])],
    };

    // Send asynchronously to Datadog HTTP Intake endpoint (via no-cors / fetch fallback)
    fetch(`https://http-intake.logs.datadoghq.com/api/v2/logs?dd-api-key=${DD_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ddsource: 'browser',
        ddtags: `env:production,service:qofeno,key_id:${DD_ORG_KEY_ID}`,
        message: event.text,
        title: event.title,
        status: event.alert_type || 'info',
        timestamp: Date.now(),
      }),
    }).catch(() => {
      // Ignore network errors gracefully
    });
  } catch {
    // Never throw errors to caller
  }
}

/**
 * Initialize Datadog monitoring on client startup.
 */
export function initDatadog() {
  if (!DD_API_KEY) return;
  console.log('[Datadog] Analytics initialized for Qofeno.');
  trackDatadogEvent({
    title: 'App Loaded',
    text: `Client app initialized. Session started.`,
    alert_type: 'info',
  });
}
