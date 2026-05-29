import { Client, Databases, ID, Query } from 'node-appwrite';

function parseBody(req) {
  const raw = req.body || req.payload || '{}';
  if (typeof raw !== 'string') return raw || {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
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
    }

    return res.json({ success: true, user_id: userId, status: isActive ? 'active' : status });
  } catch (err) {
    error(err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
}