import { Client, Databases, ID, Query } from 'node-appwrite';
import nodemailer from 'nodemailer';

function parseBody(req) {
  const raw = req.body || req.payload || '{}';
  if (typeof raw !== 'string') return raw || {};
  try { return JSON.parse(raw); } catch { return {}; }
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

async function sendWelcomeEmail(userId) {
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
    subject: 'Welcome to Qofeno 🎉',
    text: `Welcome to Qofeno! Your account (${userId}) is ready to use.`,
    html: `<p>Welcome to <strong>Qofeno</strong>! Your account is ready to use.</p><p>User: <code>${userId}</code></p>`,
  });

  return { sent: true };
}

export default async ({ req, res, error }) => {
  const body = parseBody(req);
  const userId = body.user_id || body.userId || body.$id || body.event?.$id || body.user?.$id || body?.payload?.$id;

  if (!userId) {
    return res.json({ success: false, error: 'user_id required' }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const db = new Databases(client);
  const databaseId = process.env.DATABASE_ID;
  const now = new Date().toISOString();

  try {
    const existing = await db.listDocuments(databaseId, 'users_meta', [Query.equal('user_id', userId), Query.limit(1)]);
    if ((existing.documents || []).length > 0) {
      const doc = existing.documents[0];
      await db.updateDocument(databaseId, 'users_meta', doc.$id, { updated_at: now });
      return res.json({ success: true, user_id: userId, created: false });
    }

    await db.createDocument(databaseId, 'users_meta', ID.unique(), {
      user_id: userId,
      plan: 'free',
      plan_expires_at: null,
      payment_ref: null,
      tools_used: 0,
      files_processed: 0,
      storage_used: 0,
      created_at: now,
      updated_at: now
    });

    // Create welcome notification for new users.
    await db.createDocument(databaseId, 'notifications', ID.unique(), {
      user_id: userId,
      title: 'Welcome to Qofeno! 🎉',
      message: 'Your account is ready. Start using free tools right now - no limits.',
      type: 'success',
      read: false,
      link: '/tools',
      created_at: now,
    });

    const email = await sendWelcomeEmail(userId);

    return res.json({ success: true, user_id: userId, created: true, email });
  } catch (err) {
    error(err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
}