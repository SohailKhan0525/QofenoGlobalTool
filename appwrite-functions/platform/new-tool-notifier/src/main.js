/**
 * new-tool-notifier — Triggers when a new tool document is created.
 * Loops through registered users to create in-app notifications and send Resend email alerts.
 */
import { Client, Databases, ID, Query, Users } from 'node-appwrite';

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

async function sendNewToolEmail(email, name, toolName, toolDesc, appUrl) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'hello@qofeno.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'Qofeno';

  if (!resendKey || !email) return { sent: false, reason: 'no_resend_key_or_email' };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromAddress}>`,
        to: [email],
        subject: `New Tool Available: ${toolName}! 🚀`,
        html: `
          <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#fff;">
            <div style="text-align:center;margin-bottom:32px;">
              <h1 style="color:#7C3AED;font-size:32px;margin:0;font-weight:900;letter-spacing:-1px;">Qofeno</h1>
              <p style="color:#6B7280;margin:4px 0 0">Continuous tooling expansion</p>
            </div>
            <h2 style="color:#0F0A1E;font-size:22px;margin:0 0 12px;">Hi ${name},</h2>
            <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
              We have just launched a brand new tool: <strong>${toolName}</strong>!
            </p>
            <p style="color:#6B7280;line-height:1.6;margin:0 0 24px;">
              ${toolDesc}
            </p>
            <a href="${appUrl}/tools"
               style="display:inline-block;padding:14px 32px;background:#7C3AED;color:white;border-radius:12px;font-weight:600;text-decoration:none;font-size:16px;">
              Try ${toolName} Now →
            </a>
            <p style="color:#9CA3AF;font-size:11px;margin-top:40px;text-align:center;">
              You are receiving this because you signed up on Qofeno. You can disable notifications in your settings page at any time.
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
  log(`Payload: ${JSON.stringify(body)}`);

  // Newly created tool details
  const toolName = body.name || 'New Tool';
  const toolSlug = body.slug;
  const toolDesc = body.description || body.desc || 'A new useful tool has been added to our catalog.';

  if (!toolSlug) {
    return res.json({ success: false, error: 'tool slug is missing in payload' }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const db = new Databases(client);
  const usersService = new Users(client);
  const databaseId = process.env.DATABASE_ID || 'qofeno_db';
  const appUrl = process.env.APP_URL || 'https://qofeno-labs.pages.dev';
  const now = new Date().toISOString();

  try {
    // 1. Fetch all users from users_meta
    let offset = 0;
    const limit = 50;
    const usersToNotify = [];

    while (true) {
      const metaDocs = await db.listDocuments(databaseId, 'users_meta', [
        Query.limit(limit),
        Query.offset(offset)
      ]);
      if (metaDocs.documents.length === 0) break;
      usersToNotify.push(...metaDocs.documents);
      offset += limit;
      if (metaDocs.documents.length < limit) break;
    }

    log(`Found ${usersToNotify.length} users to evaluate for notifications.`);

    // 2. Loop through users, check preferences and send notifications
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const title = `New Tool: ${toolName}`;

    for (const meta of usersToNotify) {
      const userId = meta.user_id;

      try {
        // A. Deduplicate check: look for same notification for this user in last 30 days
        const existing = await db.listDocuments(databaseId, 'notifications', [
          Query.equal('user_id', userId),
          Query.equal('title', title),
          Query.greaterThan('created_at', thirtyDaysAgo),
          Query.limit(1)
        ]);

        if (existing.total > 0) {
          log(`User ${userId} already notified. Skipping.`);
          continue;
        }

        // B. Create in-app notification
        await db.createDocument(databaseId, 'notifications', ID.unique(), {
          user_id: userId,
          title,
          message: toolDesc,
          type: 'info',
          read: false,
          link: `/tools?q=${toolSlug}`,
          created_at: now
        });
        log(`Created in-app notification for user: ${userId}`);

        // C. Fetch email and preferences to send alert via Resend
        try {
          const userDetails = await usersService.get(userId);
          const userPrefs = await usersService.getPrefs(userId).catch(() => ({}));

          if (userDetails.email && userPrefs.notify_new_tools !== false) {
            const emailResult = await sendNewToolEmail(
              userDetails.email,
              userDetails.name || 'there',
              toolName,
              toolDesc,
              appUrl
            );
            log(`Email alert to ${userDetails.email}: ${JSON.stringify(emailResult)}`);
          }
        } catch (userErr) {
          log(`Failed to fetch email/preferences or send email for user ${userId} (non-fatal): ${userErr.message}`);
        }

      } catch (userLoopErr) {
        error(`Failed processing notifications for user ${userId}: ${userLoopErr.message}`);
      }
    }

    return res.json({ success: true, count: usersToNotify.length });
  } catch (err) {
    error(`Failed new-tool-notifier execution: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
