import { Client, Databases, ID } from 'node-appwrite';
import nodemailer from 'nodemailer';

function parseBody(req) {
  const raw = req.body || req.payload || '{}';
  if (typeof raw !== 'string') return raw || {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function sanitize(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
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

async function sendContactEmails(payload) {
  const transporter = getMailer();
  if (!transporter) return { sent: false, reason: 'smtp_not_configured' };

  const fromName = process.env.EMAIL_FROM_NAME || 'Qofeno';
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'hello@qofeno.io';
  const replyTo = process.env.EMAIL_REPLY_TO || payload.email;
  const supportEmail = process.env.SUPPORT_EMAIL || fromAddress;

  await transporter.sendMail({
    from: `${fromName} <${fromAddress}>`,
    to: supportEmail,
    replyTo: payload.email,
    subject: `[Qofeno Contact] ${payload.subject}`,
    text: `Name: ${payload.name}\nEmail: ${payload.email}\nSubject: ${payload.subject}\n\n${payload.message}`,
    html: `<p><strong>Name:</strong> ${payload.name}</p><p><strong>Email:</strong> ${payload.email}</p><p><strong>Subject:</strong> ${payload.subject}</p><p>${payload.message.replace(/\n/g, '<br/>')}</p>`,
  });

  await transporter.sendMail({
    from: `${fromName} <${fromAddress}>`,
    to: payload.email,
    replyTo,
    subject: 'We received your message — Qofeno',
    text: `Hi ${payload.name},\n\nThanks for contacting Qofeno. We received your message and will get back to you soon.\n\nSubject: ${payload.subject}`,
    html: `<p>Hi ${payload.name},</p><p>Thanks for contacting <strong>Qofeno</strong>. We received your message and will get back to you soon.</p><p><strong>Subject:</strong> ${payload.subject}</p>`,
  });

  return { sent: true };
}

export default async ({ req, res, error }) => {
  const body = parseBody(req);
  const name = sanitize(body.name, 256);
  const email = sanitize(body.email, 256);
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
      name,
      email,
      subject,
      message,
      read: false,
      created_at: createdAt,
    });

    const emailStatus = await sendContactEmails({ name, email, subject, message });

    return res.json({ success: true, id: document.$id, email: emailStatus });
  } catch (err) {
    error(err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
