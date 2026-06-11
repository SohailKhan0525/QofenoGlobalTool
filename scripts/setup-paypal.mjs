/**
 * Qofeno PayPal Setup Script
 * Creates product, monthly plan ($9/mo), and yearly plan ($64.80/yr)
 * Run once: node scripts/setup-paypal.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env
const envPath = path.resolve(__dirname, '..', '.env');
const envLines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
const env = {};
for (const line of envLines) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const m = t.match(/^(\w+)=(.*)/);
  if (m) env[m[1]] = m[2].trim();
}

const CLIENT_ID = env.PAYPAL_CLIENT_ID;
const SECRET    = env.PAYPAL_SECRET;
const MODE      = env.PAYPAL_MODE || 'live';
const BASE      = MODE === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

if (!CLIENT_ID || !SECRET) {
  console.error('❌ PAYPAL_CLIENT_ID and PAYPAL_SECRET must be set in .env');
  process.exit(1);
}

async function getToken() {
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!data.access_token) {
    console.error('❌ Failed to get PayPal access token:', JSON.stringify(data, null, 2));
    process.exit(1);
  }
  console.log('✅ Got PayPal access token');
  return data.access_token;
}

async function createProduct(token) {
  const res = await fetch(`${BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `qofeno-product-${Date.now()}`,
    },
    body: JSON.stringify({
      name: 'Qofeno Pro',
      description: 'Access to all Qofeno PRO tools with priority processing and unlimited usage.',
      type: 'SERVICE',
      category: 'SOFTWARE',
      image_url: 'https://qofeno-labs.pages.dev/logo.png',
      home_url: 'https://qofeno-labs.pages.dev',
    }),
  });
  const data = await res.json();
  if (!data.id) {
    console.error('❌ Failed to create product:', JSON.stringify(data, null, 2));
    process.exit(1);
  }
  console.log('✅ Created PayPal product:', data.id);
  return data.id;
}

async function createPlan(token, productId, name, intervalUnit, amount, requestId) {
  const res = await fetch(`${BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': requestId,
    },
    body: JSON.stringify({
      product_id: productId,
      name,
      description: name,
      status: 'ACTIVE',
      billing_cycles: [{
        frequency: { interval_unit: intervalUnit, interval_count: 1 },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: { fixed_price: { value: amount, currency_code: 'USD' } },
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: { value: '0', currency_code: 'USD' },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    }),
  });
  const data = await res.json();
  if (!data.id) {
    console.error(`❌ Failed to create ${name} plan:`, JSON.stringify(data, null, 2));
    process.exit(1);
  }
  console.log(`✅ Created plan: ${name} → ${data.id}`);
  return data.id;
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
  console.log('✅ Updated .env with:', Object.keys(updates).join(', '));
}

async function main() {
  console.log('\n🚀 Qofeno PayPal Setup\n');
  console.log(`Mode: ${MODE}`);
  console.log(`API: ${BASE}\n`);

  const token = await getToken();
  const productId = await createProduct(token);

  const monthlyPlanId = await createPlan(
    token, productId,
    'Qofeno Pro Monthly',
    'MONTH', '9.00',
    `qofeno-plan-monthly-${Date.now()}`
  );

  const yearlyPlanId = await createPlan(
    token, productId,
    'Qofeno Pro Yearly',
    'YEAR', '64.80',
    `qofeno-plan-yearly-${Date.now()}`
  );

  await updateEnv({
    PAYPAL_PRODUCT_ID: productId,
    PAYPAL_PLAN_ID_MONTHLY: monthlyPlanId,
    PAYPAL_PLAN_ID_YEARLY: yearlyPlanId,
    VITE_PAYPAL_PLAN_ID_MONTHLY: monthlyPlanId,
    VITE_PAYPAL_PLAN_ID_YEARLY: yearlyPlanId,
  });

  console.log('\n✅ PayPal setup complete!\n');
  console.log(`Product ID:        ${productId}`);
  console.log(`Monthly Plan ID:   ${monthlyPlanId}`);
  console.log(`Yearly Plan ID:    ${yearlyPlanId}`);
  console.log('\n.env has been updated automatically.');
  console.log('Next: Run "node scripts/setup-paypal-webhook.mjs" after deploying paypal-webhook function.');
}

main().catch((err) => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
