import { Client, Databases, ID, Query } from 'node-appwrite';
import nodemailer from 'nodemailer';

function parseBody(req) {
  if (req.bodyRaw && typeof req.bodyRaw === 'string') {
    try { return JSON.parse(req.bodyRaw); } catch { /* ignore */ }
  }
  if (req.body && typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { /* ignore */ }
  }
  if (typeof req.body === 'object' && req.body !== null) {
    return req.body;
  }
  return {};
}

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getMailer() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USERNAME;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendPaymentEmail(userId, plan) {
  const transporter = getMailer();
  if (!transporter) return { sent: false, reason: 'smtp_not_configured' };

  const to = process.env.EMAIL_TO_OVERRIDE;
  if (!to) return { sent: false, reason: 'no_target_email' };

  const fromName = process.env.EMAIL_FROM_NAME || 'Qofeno';
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'hello@qofeno.io';
  const replyTo = process.env.EMAIL_REPLY_TO || fromAddress;

  await transporter.sendMail({
    from: `${fromName} <${fromAddress}>`,
    to,
    replyTo,
    subject: `Qofeno ${plan.toUpperCase()} plan activated ✦`,
    text: `Your subscription is active for account ${userId}. Plan: ${plan}.`,
    html: `<p>Your Qofeno subscription is now <strong>active</strong>.</p><p>Plan: <strong>${plan}</strong><br/>User: <code>${userId}</code></p>`,
  });

  return { sent: true };
}

export default async ({ req, res, error }) => {
  const body = parseBody(req);
  const userId = body.user_id || body.userId;
  const status = String(body.status || body.event_type || 'active').toLowerCase();
  const plan = String(body.plan || 'pro').toLowerCase();
  const paymentSubId = body.payment_sub_id || body.subscription_id || body.id || body.paymentSubId;

  if (!userId || !paymentSubId) {
    return res.json({ success: false, error: 'user_id and payment_sub_id are required' }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const db = new Databases(client);
  const databaseId = process.env.DATABASE_ID;
  const now = new Date().toISOString();
  const isActive = status === 'active' || status === 'renewed' || status === 'created';

  try {
    const subscriptionData = {
      user_id: userId,
      plan: plan === 'enterprise' ? 'enterprise' : 'pro',
      status: isActive ? 'active' : status,
      payment_provider: String(body.payment_provider || body.provider || 'stripe'),
      payment_sub_id: paymentSubId,
      payment_customer: body.payment_customer || body.customer_id || null,
      current_period_start: toIso(body.current_period_start || body.period_start) || now,
      current_period_end: toIso(body.current_period_end || body.period_end) || now,
      cancelled_at: toIso(body.cancelled_at),
      created_at: now
    };

    const existing = await db.listDocuments(databaseId, 'subscriptions', [Query.equal('payment_sub_id', paymentSubId), Query.limit(1)]);
    if ((existing.documents || []).length > 0) {
      await db.updateDocument(databaseId, 'subscriptions', existing.documents[0].$id, subscriptionData);
    } else {
      await db.createDocument(databaseId, 'subscriptions', ID.unique(), subscriptionData);
    }

    const meta = await db.listDocuments(databaseId, 'users_meta', [Query.equal('user_id', userId), Query.limit(1)]);
    if ((meta.documents || []).length > 0) {
      await db.updateDocument(databaseId, 'users_meta', meta.documents[0].$id, {
        plan: isActive ? 'pro' : 'free',
        plan_expires_at: subscriptionData.current_period_end,
        updated_at: now
      });
    }

    if (isActive) {
      await db.createDocument(databaseId, 'notifications', ID.unique(), {
        user_id: userId,
        title: "You're now on Pro ✦",
        message: 'All tools are now unlocked. Enjoy priority processing.',
        type: 'success',
        read: false,
        link: '/dashboard',
        created_at: now,
      });

      const email = await sendPaymentEmail(userId, subscriptionData.plan);
      return res.json({ success: true, user_id: userId, status: 'active', email });
    }

    return res.json({ success: true, user_id: userId, status: isActive ? 'active' : status });
  } catch (err) {
    error(err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
}