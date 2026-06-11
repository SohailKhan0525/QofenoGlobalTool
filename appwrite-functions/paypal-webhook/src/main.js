/**
 * paypal-webhook — Receives PayPal subscription events and updates user plan in Appwrite.
 * Sends PRO upgrade email via Resend.
 * Handles: BILLING.SUBSCRIPTION.ACTIVATED, BILLING.SUBSCRIPTION.CANCELLED,
 *          BILLING.SUBSCRIPTION.EXPIRED, BILLING.SUBSCRIPTION.SUSPENDED,
 *          PAYMENT.SALE.COMPLETED
 */
import { Client, Databases, ID, Query } from 'node-appwrite';

function parseBody(req) {
  const raw = req.body || req.payload || '{}';
  if (typeof raw !== 'string') return raw || {};
  try { return JSON.parse(raw); } catch { return {}; }
}

async function verifyPayPalWebhook(webhookId, headers, rawBody) {
  if (!webhookId) return true; // Skip verification if not configured yet

  try {
    const paypalMode = process.env.PAYPAL_MODE || 'live';
    const baseUrl = paypalMode === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';

    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET}`
        ).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!tokenRes.ok) return false;
    const { access_token } = await tokenRes.json();

    const verifyRes = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: headers['paypal-auth-algo'] || headers['PAYPAL-AUTH-ALGO'],
        cert_id: headers['paypal-cert-id'] || headers['PAYPAL-CERT-ID'],
        transmission_id: headers['paypal-transmission-id'] || headers['PAYPAL-TRANSMISSION-ID'],
        transmission_sig: headers['paypal-transmission-sig'] || headers['PAYPAL-TRANSMISSION-SIG'],
        transmission_time: headers['paypal-transmission-time'] || headers['PAYPAL-TRANSMISSION-TIME'],
        webhook_id: webhookId,
        webhook_event: typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody,
      }),
    });
    if (!verifyRes.ok) return false;
    const { verification_status } = await verifyRes.json();
    return verification_status === 'SUCCESS';
  } catch (_) {
    return false;
  }
}

async function sendProUpgradeEmail(userEmail, userName) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'hello@qofeno.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'Qofeno';
  const appUrl = process.env.APP_URL || 'https://qofeno-labs.pages.dev';

  if (!resendKey || !userEmail) return { sent: false };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromAddress}>`,
        to: [userEmail],
        subject: "You're now on Qofeno Pro ✦",
        html: `
          <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#fff;">
            <div style="text-align:center;margin-bottom:32px;">
              <h1 style="color:#7C3AED;font-size:32px;margin:0;font-weight:900;">Qofeno</h1>
            </div>
            <div style="background:linear-gradient(135deg,#7C3AED,#a855f7);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
              <p style="color:rgba(255,255,255,0.8);margin:0 0 8px;font-size:14px;">YOU'RE NOW</p>
              <h2 style="color:white;font-size:36px;margin:0;font-weight:900;">Qofeno Pro ✦</h2>
            </div>
            <p style="color:#374151;line-height:1.6;margin:0 0 16px;">Hi ${userName},</p>
            <p style="color:#374151;line-height:1.6;margin:0 0 24px;">
              Welcome to Qofeno Pro! Your subscription is now active and you have full access to all PRO features.
            </p>
            <div style="background:#F5F3FF;border-radius:12px;padding:24px;margin-bottom:24px;">
              <p style="color:#5B21B6;font-weight:700;margin:0 0 12px;">Your PRO benefits:</p>
              <ul style="color:#6B7280;margin:0;padding-left:20px;line-height:2.2;">
                <li>PDF to Word, Excel, PowerPoint conversion</li>
                <li>PDF OCR (make scanned PDFs searchable)</li>
                <li>PDF Watermark, Protect, Redact, Sign</li>
                <li>Priority processing — no queues</li>
                <li>Files up to 500MB (vs 50MB free)</li>
                <li>All future PRO tools included</li>
              </ul>
            </div>
            <a href="${appUrl}/dashboard"
               style="display:block;text-align:center;padding:16px 32px;background:#7C3AED;color:white;border-radius:12px;font-weight:700;text-decoration:none;font-size:16px;margin-bottom:16px;">
              Go to Your Dashboard →
            </a>
            <p style="color:#9CA3AF;font-size:13px;text-align:center;margin-top:32px;">
              Built by Mohd Zaheer Uddin ·
              <a href="${appUrl}/policy" style="color:#7C3AED;">Privacy</a>
            </p>
          </div>
        `,
      }),
    });
    const data = await res.json();
    return { sent: true, id: data.id };
  } catch (err) {
    return { sent: false, error: err.message };
  }
}

async function sendCancellationEmail(userEmail, userName) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'hello@qofeno.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'Qofeno';
  const appUrl = process.env.APP_URL || 'https://qofeno-labs.pages.dev';
  if (!resendKey || !userEmail) return { sent: false };
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${fromName} <${fromAddress}>`,
        to: [userEmail],
        subject: 'Your Qofeno Pro subscription has been cancelled',
        html: `
          <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
            <h1 style="color:#7C3AED;font-size:28px;">Qofeno</h1>
            <h2 style="color:#0F0A1E;">Subscription Cancelled</h2>
            <p style="color:#6B7280;">Hi ${userName}, your Qofeno Pro subscription has been cancelled. You'll continue to have PRO access until the end of your current billing period.</p>
            <p style="color:#6B7280;">After that, your account will revert to our free plan.</p>
            <a href="${appUrl}/pricing" style="display:inline-block;margin-top:16px;padding:14px 32px;background:#7C3AED;color:white;border-radius:12px;font-weight:600;text-decoration:none;">Resubscribe →</a>
            <p style="color:#9CA3AF;font-size:13px;margin-top:32px;">— Mohd Zaheer Uddin, Qofeno</p>
          </div>
        `,
      }),
    });
    return { sent: true };
  } catch { return { sent: false }; }
}

async function getUserEmail(db, databaseId, userId) {
  try {
    const docs = await db.listDocuments(databaseId, 'users_meta', [Query.equal('user_id', userId), Query.limit(1)]);
    if (docs.total > 0) return { email: docs.documents[0].email || '', name: docs.documents[0].name || '' };
  } catch (_) {}
  return { email: '', name: '' };
}

export default async ({ req, res, log, error }) => {
  const rawBody = req.body || req.payload || '{}';
  const headers = req.headers || {};

  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID || '';
    const isValid = await verifyPayPalWebhook(webhookId, headers, rawBody);
    if (!isValid) {
      error('Invalid PayPal webhook signature');
      return res.json({ error: 'Invalid signature' }, 401);
    }

    const event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    log(`PayPal webhook received: ${event.event_type}`);

    if (!event || !event.event_type) {
      return res.json({ error: 'Invalid payload structure' }, 400);
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const db = new Databases(client);
    const databaseId = process.env.DATABASE_ID;
    const now = new Date().toISOString();
    const eventType = event.event_type;
    const resource = event.resource || {};
    const userId = resource.custom_id || resource.custom || null;
    const subscriptionId = resource.id || resource.billing_agreement_id || null;

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'PAYMENT.SALE.COMPLETED': {
        if (!userId) { log(`No user ID in event ${eventType}, skipping`); break; }

        const docs = await db.listDocuments(databaseId, 'users_meta', [Query.equal('user_id', userId), Query.limit(1)]);
        const userEmail = docs.total > 0 ? (docs.documents[0].email || '') : '';
        const userName = docs.total > 0 ? (docs.documents[0].name || 'there') : 'there';

        if (docs.total > 0) {
          await db.updateDocument(databaseId, 'users_meta', docs.documents[0].$id, {
            plan: 'pro',
            payment_ref: subscriptionId,
            updated_at: now,
          });
          log(`Updated user ${userId} to PRO plan`);
        } else {
          await db.createDocument(databaseId, 'users_meta', ID.unique(), {
            user_id: userId,
            plan: 'pro',
            payment_ref: subscriptionId,
            created_at: now,
            updated_at: now,
          });
          log(`Created PRO record for user ${userId}`);
        }

        // Create/update subscription record
        try {
          const existingSubs = await db.listDocuments(databaseId, 'subscriptions', [Query.equal('user_id', userId), Query.limit(1)]);
          const subPayload = {
            user_id: userId,
            plan: 'pro',
            status: 'active',
            payment_method: 'paypal',
            subscription_id: subscriptionId,
            period: resource.billing_info?.billing_cycle_override?.frequency?.interval_unit === 'YEAR' ? 'yearly' : 'monthly',
            updated_at: now,
          };
          if (existingSubs.total > 0) {
            await db.updateDocument(databaseId, 'subscriptions', existingSubs.documents[0].$id, subPayload);
          } else {
            await db.createDocument(databaseId, 'subscriptions', ID.unique(), { ...subPayload, created_at: now });
          }
        } catch (subErr) { log('Subscription record update failed (non-fatal): ' + subErr.message); }

        // Pro upgrade notification
        try {
          await db.createDocument(databaseId, 'notifications', ID.unique(), {
            user_id: userId,
            title: 'You\'re now on Qofeno Pro ✦',
            message: 'All PRO tools are now unlocked. Enjoy priority processing and no limits.',
            type: 'success',
            read: false,
            link: '/dashboard',
            created_at: now,
          });
        } catch (_) {}

        // Send PRO upgrade email
        const emailResult = await sendProUpgradeEmail(userEmail, userName);
        log(`Pro upgrade email: ${JSON.stringify(emailResult)}`);
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        if (!userId) break;
        const docs = await db.listDocuments(databaseId, 'users_meta', [Query.equal('user_id', userId), Query.limit(1)]);
        const userEmail = docs.total > 0 ? (docs.documents[0].email || '') : '';
        const userName = docs.total > 0 ? (docs.documents[0].name || 'there') : 'there';

        if (docs.total > 0) {
          await db.updateDocument(databaseId, 'users_meta', docs.documents[0].$id, {
            plan: 'free',
            updated_at: now,
          });
          log(`Downgraded user ${userId} to FREE plan (${eventType})`);
        }

        // Update subscription record
        try {
          const existingSubs = await db.listDocuments(databaseId, 'subscriptions', [Query.equal('user_id', userId), Query.limit(1)]);
          if (existingSubs.total > 0) {
            await db.updateDocument(databaseId, 'subscriptions', existingSubs.documents[0].$id, {
              status: 'cancelled',
              updated_at: now,
            });
          }
        } catch (_) {}

        // Cancellation notification
        try {
          await db.createDocument(databaseId, 'notifications', ID.unique(), {
            user_id: userId,
            title: 'Pro subscription cancelled',
            message: 'Your Qofeno Pro subscription has been cancelled. You\'ll have access until the end of your billing period.',
            type: 'info',
            read: false,
            link: '/pricing',
            created_at: now,
          });
        } catch (_) {}

        await sendCancellationEmail(userEmail, userName);
        break;
      }

      default:
        log(`Ignored event type: ${eventType}`);
    }

    return res.json({ received: true, event_type: eventType });
  } catch (err) {
    error(err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
