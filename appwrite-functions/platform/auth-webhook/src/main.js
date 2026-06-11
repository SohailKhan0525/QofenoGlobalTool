/**
 * auth-webhook — Called when a new user signs up (Appwrite Auth Event).
 * Creates users_meta record, welcome notification, and sends welcome email via Resend.
 */
import { Client, Databases, ID, Query } from 'node-appwrite';

function parseBody(req) {
  const raw = req.body || req.payload || '{}';
  if (typeof raw !== 'string') return raw || {};
  try { return JSON.parse(raw); } catch { return {}; }
}

async function sendWelcomeEmail(userEmail, userName) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'hello@qofeno.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'Qofeno';
  const appUrl = process.env.APP_URL || 'https://qofeno-labs.pages.dev';

  if (!resendKey || !userEmail) return { sent: false, reason: 'no_resend_key_or_email' };

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
        subject: 'Welcome to Qofeno! 🎉',
        html: `
          <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#fff;">
            <div style="text-align:center;margin-bottom:32px;">
              <h1 style="color:#7C3AED;font-size:32px;margin:0;font-weight:900;letter-spacing:-1px;">Qofeno</h1>
              <p style="color:#6B7280;margin:4px 0 0">Your all-in-one file tools platform</p>
            </div>
            <h2 style="color:#0F0A1E;font-size:22px;margin:0 0 12px;">Welcome, ${userName}! 👋</h2>
            <p style="color:#6B7280;line-height:1.6;margin:0 0 24px;">
              Your Qofeno account is ready. Start using our free PDF, image, and video tools right now — no limits, no friction.
            </p>
            <a href="${appUrl}/tools"
               style="display:inline-block;padding:14px 32px;background:#7C3AED;color:white;border-radius:12px;font-weight:600;text-decoration:none;font-size:16px;">
              Explore Free Tools →
            </a>
            <div style="margin-top:32px;padding:20px;background:#F9FAFB;border-radius:12px;">
              <p style="color:#374151;font-weight:600;margin:0 0 8px;">What you can do for free:</p>
              <ul style="color:#6B7280;margin:0;padding-left:20px;line-height:2;">
                <li>Compress, merge, split PDFs</li>
                <li>Convert PDF to text, JPG, and more</li>
                <li>Resize, compress, convert images</li>
                <li>Compress videos instantly</li>
              </ul>
            </div>
            <p style="color:#9CA3AF;font-size:13px;margin-top:40px;text-align:center;">
              Built by Mohd Zaheer Uddin ·
              <a href="${appUrl}/policy" style="color:#7C3AED;text-decoration:none;">Privacy Policy</a>
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

export default async ({ req, res, log, error }) => {
  const body = parseBody(req);

  // Support multiple event payload shapes from Appwrite
  const userId = body.user_id || body.userId || body.$id
    || body.event?.$id || body.user?.$id || body?.payload?.$id
    || body?.data?.$id;

  const userEmail = body.email || body.user?.email || body?.data?.email || body?.payload?.email || '';
  const userName = body.name || body.user?.name || body?.data?.name || body?.payload?.name || userEmail.split('@')[0] || 'there';

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
    // Check if user_meta already exists (idempotent)
    const existing = await db.listDocuments(databaseId, 'users_meta', [Query.equal('user_id', userId), Query.limit(1)]);

    if ((existing.documents || []).length > 0) {
      await db.updateDocument(databaseId, 'users_meta', existing.documents[0].$id, { updated_at: now });
      log(`Updated existing users_meta for ${userId}`);
      return res.json({ success: true, user_id: userId, created: false });
    }

    // Create users_meta document
    await db.createDocument(databaseId, 'users_meta', ID.unique(), {
      user_id: userId,
      plan: 'free',
      plan_expires_at: null,
      payment_ref: null,
      tools_used: 0,
      files_processed: 0,
      storage_used: 0,
      created_at: now,
      updated_at: now,
    });
    log(`Created users_meta for ${userId}`);

    // Create welcome notification
    try {
      await db.createDocument(databaseId, 'notifications', ID.unique(), {
        user_id: userId,
        title: 'Welcome to Qofeno! 🎉',
        message: 'Your account is ready. Start using free tools right now — no limits.',
        type: 'success',
        read: false,
        link: '/tools',
        created_at: now,
      });
    } catch (notifErr) {
      log('Notification creation failed (non-fatal): ' + notifErr.message);
    }

    // Send welcome email via Resend
    const emailResult = await sendWelcomeEmail(userEmail, userName);
    log(`Welcome email: ${JSON.stringify(emailResult)}`);

    return res.json({ success: true, user_id: userId, created: true, email: emailResult });
  } catch (err) {
    error(err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};