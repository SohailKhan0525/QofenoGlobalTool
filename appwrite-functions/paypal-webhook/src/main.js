/**
 * paypal-webhook — Receives PayPal subscription events and updates user plan in Appwrite.
 * Handles: BILLING.SUBSCRIPTION.ACTIVATED, BILLING.SUBSCRIPTION.CANCELLED,
 *          BILLING.SUBSCRIPTION.EXPIRED, PAYMENT.SALE.COMPLETED
 */
import { Client, Databases, ID, Query } from 'node-appwrite';
import crypto from 'crypto';

function parseBody(req) {
  const raw = req.body || req.payload || '{}';
  if (typeof raw !== 'string') return raw || {};
  try { return JSON.parse(raw); } catch { return {}; }
}

/**
 * Verify PayPal webhook signature using PAYPAL_WEBHOOK_ID.
 * Reference: https://developer.paypal.com/api/webhooks/v1/#verify-webhook-signature
 */
async function verifyPayPalWebhook(webhookId, headers, rawBody) {
  if (!webhookId) {
    // If webhook ID not set, skip verification but log warning
    return true;
  }

  try {
    const paypalMode = process.env.PAYPAL_MODE || 'live';
    const baseUrl = paypalMode === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';

    // Get PayPal access token
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
        ).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenRes.ok) return false;
    const { access_token } = await tokenRes.json();

    // Verify signature
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

export default async ({ req, res, log, error }) => {
  const rawBody = req.body || req.payload || '{}';
  const headers = req.headers || {};

  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID || '';
    
    // Verify PayPal signature
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
    const now = new Date().toISOString();
    const eventType = event.event_type;
    const resource = event.resource || {};

    // Extract user ID from custom_id field
    const userId = resource.custom_id || resource.custom || null;

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'PAYMENT.SALE.COMPLETED': {
        if (!userId) {
          log(`No user ID in event ${eventType}, skipping DB update`);
          break;
        }
        const docs = await db.listDocuments(process.env.DATABASE_ID, 'users_meta', [Query.equal('user_id', userId)]);
        if (docs.total > 0) {
          await db.updateDocument(process.env.DATABASE_ID, 'users_meta', docs.documents[0].$id, {
            plan: 'pro',
            payment_ref: resource.id || resource.billing_agreement_id || null,
            updated_at: now,
          });
          log(`Updated user ${userId} to PRO plan`);
        } else {
          await db.createDocument(process.env.DATABASE_ID, 'users_meta', ID.unique(), {
            user_id: userId,
            plan: 'pro',
            payment_ref: resource.id || null,
            created_at: now,
            updated_at: now,
          });
          log(`Created PRO record for user ${userId}`);
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        if (!userId) break;
        const docs = await db.listDocuments(process.env.DATABASE_ID, 'users_meta', [Query.equal('user_id', userId)]);
        if (docs.total > 0) {
          await db.updateDocument(process.env.DATABASE_ID, 'users_meta', docs.documents[0].$id, {
            plan: 'free',
            updated_at: now,
          });
          log(`Downgraded user ${userId} to FREE plan (${eventType})`);
        }
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
