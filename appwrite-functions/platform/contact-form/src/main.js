/**
 * contact-form — Saves contact message to Appwrite, sends notification to admin
 * and auto-reply to sender via Resend.
 */
import { Client, Databases, ID } from 'node-appwrite';

function parseBody(req) {
  const raw = req.body || req.payload || '{}';
  if (typeof raw !== 'string') return raw || {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function sanitize(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

async function sendContactEmails(payload) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'hello@qofeno.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'Qofeno';
  const adminEmail = process.env.ADMIN_EMAIL || fromAddress;
  const appUrl = process.env.APP_URL || 'https://qofeno-labs.pages.dev';

  if (!resendKey) return { sent: false, reason: 'no_resend_key' };

  const results = [];

  // 1. Forward to admin (Mohd Zaheer Uddin)
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${fromName} Contact <${fromAddress}>`,
        to: [adminEmail],
        reply_to: payload.email,
        subject: `[Qofeno Contact] ${payload.subject}`,
        html: `
          <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#7C3AED;margin:0 0 16px;">New Contact Message</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#6B7280;width:80px;font-weight:600;">From:</td><td style="padding:8px 0;color:#0F0A1E;">${payload.name} &lt;${payload.email}&gt;</td></tr>
              <tr><td style="padding:8px 0;color:#6B7280;font-weight:600;">Subject:</td><td style="padding:8px 0;color:#0F0A1E;">${payload.subject}</td></tr>
            </table>
            <div style="margin-top:16px;padding:16px;background:#F9FAFB;border-radius:8px;color:#374151;line-height:1.6;">
              ${payload.message.replace(/\n/g, '<br>')}
            </div>
            <p style="color:#9CA3AF;font-size:12px;margin-top:24px;">Sent via Qofeno contact form · ${appUrl}</p>
          </div>
        `,
      }),
    });
    const d = await res.json();
    results.push({ type: 'admin', sent: true, id: d.id });
  } catch (err) {
    results.push({ type: 'admin', sent: false, error: err.message });
  }

  // 2. Auto-reply to sender
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${fromName} <${fromAddress}>`,
        to: [payload.email],
        subject: 'Thanks for reaching out — Qofeno',
        html: `
          <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
            <h1 style="color:#7C3AED;font-size:28px;font-weight:900;margin:0 0 8px;">Qofeno</h1>
            <h2 style="color:#0F0A1E;font-size:20px;margin:0 0 16px;">Thanks for reaching out! 👋</h2>
            <p style="color:#6B7280;line-height:1.6;margin:0 0 16px;">
              Hi ${payload.name}, I've received your message about "<strong>${payload.subject}</strong>" and will reply as soon as possible.
            </p>
            <p style="color:#6B7280;line-height:1.6;margin:0 0 24px;">
              In the meantime, feel free to explore all our free tools:
            </p>
            <a href="${appUrl}/tools" style="display:inline-block;padding:12px 28px;background:#7C3AED;color:white;border-radius:10px;font-weight:600;text-decoration:none;">
              Explore Tools →
            </a>
            <p style="color:#9CA3AF;font-size:13px;margin-top:40px;">— Mohd Zaheer Uddin, Qofeno</p>
          </div>
        `,
      }),
    });
    const d = await res.json();
    results.push({ type: 'reply', sent: true, id: d.id });
  } catch (err) {
    results.push({ type: 'reply', sent: false, error: err.message });
  }

  return { sent: true, results };
}

export default async ({ req, res, log, error }) => {
  const body = parseBody(req);
  const name    = sanitize(body.name, 256);
  const email   = sanitize(body.email, 256);
  const subject = sanitize(body.subject || body.topic, 512);
  const message = sanitize(body.message, 4096);

  if (!name || !email || !subject || !message) {
    return res.json({ success: false, error: 'name, email, subject, and message are required' }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const db = new Databases(client);
  const databaseId = process.env.DATABASE_ID;
  const createdAt = new Date().toISOString();

  try {
    const document = await db.createDocument(databaseId, 'contact_messages', ID.unique(), {
      name, email, subject, message,
      read: false,
      created_at: createdAt,
    });
    log(`Contact message saved: ${document.$id}`);

    const emailStatus = await sendContactEmails({ name, email, subject, message });
    log(`Emails: ${JSON.stringify(emailStatus)}`);

    return res.json({ success: true, id: document.$id, email: emailStatus });
  } catch (err) {
    error(err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
