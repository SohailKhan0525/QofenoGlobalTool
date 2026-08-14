import { Client, Databases, Users, ID, Query } from 'node-appwrite';

function parseBody(req) {
  if (req.bodyRaw && typeof req.bodyRaw === 'string') {
    try { return JSON.parse(req.bodyRaw); } catch {}
  }
  if (req.body && typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch {}
  }
  if (typeof req.body === 'object' && req.body !== null) {
    return req.body;
  }
  return {};
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

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '69c58725000ef2b43f18')
    .setKey(process.env.APPWRITE_API_KEY);

  const users = new Users(client);
  const db = new Databases(client);
  const databaseId = process.env.DATABASE_ID || 'qofeno_db';
  const now = new Date().toISOString();

  // Handle permanent account deletion via Server API Key
  if (body.action === 'delete_user' && body.userId) {
    try {
      const targetUserId = body.userId;
      log(`Permanently deleting user ${targetUserId}`);

      // 1. Delete all user database records across collections
      const collectionsToClean = ['users_meta', 'tool_likes', 'notifications', 'subscriptions', 'tool_executions', 'recently_viewed'];
      for (const col of collectionsToClean) {
        try {
          const docs = await db.listDocuments(databaseId, col, [Query.equal('user_id', targetUserId), Query.limit(100)]);
          for (const doc of docs.documents) {
            try { await db.deleteDocument(databaseId, col, doc.$id); } catch {}
          }
        } catch {}
      }

      // 2. Permanently delete user from Appwrite Auth
      try {
        await users.delete(targetUserId);
        log(`Appwrite Auth user ${targetUserId} permanently deleted.`);
      } catch (userDelErr) {
        log(`Note on user deletion: ${userDelErr.message}`);
      }

      return res.json({ ok: true, deleted: true, userId: targetUserId });
    } catch (err) {
      error(`Error during delete_user for ${body.userId}: ${err.message}`);
      return res.json({ ok: false, error: err.message }, 500);
    }
  }

  // Handle direct client token exchange via Server API Key
  if (body.action === 'exchange_token' && body.userId) {
    try {
      const session = await users.createSession(body.userId);
      const user = await users.get(body.userId);
      log(`Server session created for user ${body.userId}`);
      return res.json({
        ok: true,
        sessionSecret: session.secret,
        user: {
          $id: user.$id,
          name: user.name || user.email,
          email: user.email,
          emailVerification: user.emailVerification,
          labels: user.labels || [],
        }
      });
    } catch (err) {
      error(`Token exchange error for user ${body.userId}: ${err.message}`);
      return res.json({ ok: false, error: err.message }, 400);
    }
  }

  // Support multiple event payload shapes from Appwrite
  const userId = body.user_id || body.userId || body.$id
    || body.event?.$id || body.user?.$id || body?.payload?.$id
    || body?.data?.$id;

  const userEmail = body.email || body.user?.email || body?.data?.email || body?.payload?.email || '';
  const userName = body.name || body.user?.name || body?.data?.name || body?.payload?.name || userEmail.split('@')[0] || 'there';

  if (!userId) {
    return res.json({ success: false, error: 'user_id required' }, 400);
  }

  try {
    // Check if user_meta already exists (idempotent)
    const existing = await db.listDocuments(databaseId, 'users_meta', [Query.equal('user_id', userId), Query.limit(1)]);

    if ((existing.documents || []).length > 0) {
      await db.updateDocument(databaseId, 'users_meta', existing.documents[0].$id, { updated_at: now });
      log(`Updated existing users_meta for ${userId}`);
      return res.json({ success: true, user_id: userId, created: false });
    }

    // Create users_meta record (default: free plan)
    const isFounder = userEmail.toLowerCase() === 'sohailkhannn.0525@gmail.com';
    const plan = isFounder ? 'teams' : 'free';

    await db.createDocument(databaseId, 'users_meta', ID.unique(), {
      user_id: userId,
      plan: plan,
      storage_used_bytes: 0,
      monthly_usage_bytes: 0,
      tools_used_count: 0,
      created_at: now,
      updated_at: now,
    });
    log(`Created users_meta for ${userId} with plan=${plan}`);

    // Create welcome notification in notifications collection
    try {
      await db.createDocument(databaseId, 'notifications', ID.unique(), {
        user_id: userId,
        title: 'Welcome to Qofeno! 🎉',
        message: 'Your account is all set. Explore 500+ free online file tools.',
        type: 'system',
        read: false,
        created_at: now,
      });
    } catch (notifErr) {
      log(`Notification creation warning: ${notifErr.message}`);
    }

    // Send welcome email via Resend
    if (userEmail) {
      const emailResult = await sendWelcomeEmail(userEmail, userName);
      log(`Welcome email result for ${userEmail}: ${JSON.stringify(emailResult)}`);
    }

    return res.json({ success: true, user_id: userId, created: true });
  } catch (err) {
    error(`auth-webhook failed: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};