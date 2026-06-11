/**
 * paypal-webhook-setup — registers the Appwrite paypal-webhook function URL
 * with PayPal and stores the returned Webhook ID in .env
 * Run once: node scripts/setup-paypal-webhook.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const m = t.match(/^(\w+)=(.*)/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

async function updateEnv(updates) {
  let content = fs.readFileSync(envPath, 'utf8');
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^(${key}=).*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `$1${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  }
  fs.writeFileSync(envPath, content);
}

async function getToken(base, clientId, secret) {
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('No access token: ' + JSON.stringify(data));
  return data.access_token;
}

async function main() {
  const env = loadEnv();
  const MODE      = env.PAYPAL_MODE || 'live';
  const BASE      = MODE === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
  const CLIENT_ID = env.PAYPAL_CLIENT_ID;
  const SECRET    = env.PAYPAL_SECRET || env.PAYPAL_CLIENT_SECRET;
  const ENDPOINT  = (env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1').replace(/\/$/, '');
  
  // The paypal-webhook function URL in Appwrite
  // Appwrite function executions endpoint: {endpoint}/functions/{functionId}/executions
  const endpointBase = ENDPOINT.replace(/\/v1$/, '');
  const webhookUrl = `${endpointBase}/v1/functions/paypal-webhook/executions`;

  console.log('\n🚀 PayPal Webhook Setup');
  console.log('Webhook URL:', webhookUrl);

  const token = await getToken(BASE, CLIENT_ID, SECRET);
  console.log('✅ Access token obtained');

  const res = await fetch(`${BASE}/v1/notifications/webhooks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: webhookUrl,
      event_types: [
        { name: 'BILLING.SUBSCRIPTION.ACTIVATED' },
        { name: 'BILLING.SUBSCRIPTION.CANCELLED' },
        { name: 'BILLING.SUBSCRIPTION.EXPIRED' },
        { name: 'BILLING.SUBSCRIPTION.SUSPENDED' },
        { name: 'PAYMENT.SALE.COMPLETED' },
        { name: 'PAYMENT.SALE.DENIED' },
        { name: 'PAYMENT.SALE.REFUNDED' },
      ],
    }),
  });

  const data = await res.json();
  if (!data.id) {
    console.error('❌ Failed to create webhook:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  await updateEnv({ PAYPAL_WEBHOOK_ID: data.id });

  console.log('✅ Created PayPal webhook:', data.id);
  console.log('✅ .env updated with PAYPAL_WEBHOOK_ID');
  console.log('\nWebhook URL:', webhookUrl);
  console.log('Webhook ID: ', data.id);
}

main().catch((err) => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
