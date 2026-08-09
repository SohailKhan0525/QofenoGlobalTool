/**
 * Sentry error monitoring — initialized only when VITE_SENTRY_DSN is set.
 * Get your DSN from: sentry.io ? Your Project ? Settings ? Client Keys (DSN)
 *
 * Add to .env.local:  VITE_SENTRY_DSN=https://abc@o123.ingest.sentry.io/456
 */

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

let _sentry: typeof import('@sentry/browser') | null = null;

export async function initSentry() {
  if (!DSN) {
    return;
  }
  try {
    const Sentry = await import('@sentry/browser');
    _sentry = Sentry;
    Sentry.init({
      dsn: DSN,
      environment: import.meta.env.MODE,
      release: `qofeno@${import.meta.env.VITE_APP_VERSION || 'unknown'}`,
      tracesSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0.0,
      integrations: [],
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        /chrome-extension/,
      ],
    });
  } catch (err) {
    console.warn('[Sentry] Failed to initialize:', err);
  }
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  if (!_sentry) return;
  try {
    _sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
      }
      _sentry!.captureException(error);
    });
  } catch {}
}

export function setSentryUser(user: { id: string; email?: string; plan?: string } | null) {
  if (!_sentry) return;
  try {
    if (user) {
      _sentry.setUser({ id: user.id, email: user.email, plan: user.plan });
    } else {
      _sentry.setUser(null);
    }
  } catch {}
}

