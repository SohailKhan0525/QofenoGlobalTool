/**
 * Qofeno PayPal Teams Plan Setup Script
 * Creates monthly Teams plan ($19.00/mo) and yearly Teams plan ($144.00/yr)
 * Run once: node scripts/setup-paypal-teams.mjs
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
const PRODUCT_ID = env.PAYPAL_PRODUCT_ID;
const BASE      = MODE === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

if (!CLIENT_ID || !SECRET) {
  console.error('❌ PAYPAL_CLIENT_ID and PAYPAL_SECRET must be set in .env');
  process.exit(1);
}

if (!PRODUCT_ID) {
  console.error('❌ PAYPAL_PRODUCT_ID must be set in .env. Run setup-paypal.mjs first.');
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
  console.log('\n🚀 Qofeno PayPal Teams Plan Setup\n');
  console.log(`Mode: ${MODE}`);
  console.log(`Product ID: ${PRODUCT_ID}`);
  console.log(`API: ${BASE}\n`);

  const token = await getToken();

  const monthlyTeamsPlanId = await createPlan(
    token, PRODUCT_ID,
    'Qofeno Teams Monthly',
    'MONTH', '19.00',
    `qofeno-plan-teams-monthly-${Date.now()}`
  );

  const yearlyTeamsPlanId = await createPlan(
    token, PRODUCT_ID,
    'Qofeno Teams Yearly',
    'YEAR', '144.00',
    `qofeno-plan-teams-yearly-${Date.now()}`
  );

  await updateEnv({
    PAYPAL_PLAN_ID_TEAMS_MONTHLY: monthlyTeamsPlanId,
    PAYPAL_PLAN_ID_TEAMS_YEARLY: yearlyTeamsPlanId,
    VITE_PAYPAL_TEAMS_PLAN_ID_MONTHLY: monthlyTeamsPlanId,
    VITE_PAYPAL_TEAMS_PLAN_ID_YEARLY: yearlyTeamsPlanId,
  });

  console.log('\n✅ PayPal Teams setup complete!\n');
  console.log(`Monthly Teams Plan ID:   ${monthlyTeamsPlanId}`);
  console.log(`Yearly Teams Plan ID:    ${yearlyTeamsPlanId}`);
  console.log('\n.env has been updated automatically.');
}

main().catch((err) => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
