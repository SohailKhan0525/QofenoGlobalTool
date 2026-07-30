const fs = require('fs');

async function testPayPal() {
  const envText = fs.readFileSync('.env', 'utf-8');
  let clientId = '';
  let secret = '';
  let planIdMonthly = '';

  for (const line of envText.split('\n')) {
    if (line.startsWith('PAYPAL_CLIENT_ID=')) clientId = line.split('=')[1].trim();
    if (line.startsWith('PAYPAL_SECRET=')) secret = line.split('=')[1].trim();
    if (line.startsWith('VITE_PAYPAL_PLAN_ID_MONTHLY=')) planIdMonthly = line.split('=')[1].trim();
  }

  console.log('Client ID:', clientId ? clientId.slice(0, 15) + '...' : '(none)');
  console.log('Secret:', secret ? secret.slice(0, 10) + '...' : '(none)');
  console.log('Plan ID Monthly:', planIdMonthly);

  // 1. Get OAuth Access Token from PayPal API
  const authHeader = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const tokenRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  console.log('Token Status:', tokenRes.status);
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    console.error('Token Error:', tokenData);
    return;
  }

  const accessToken = tokenData.access_token;
  console.log('Access token retrieved successfully! Scope:', tokenData.scope);

  // 2. Verify Subscription Plan ID details
  const planRes = await fetch(`https://api-m.paypal.com/v1/billing/plans/${planIdMonthly}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('Plan Status:', planRes.status);
  const planData = await planRes.json();
  console.log('Plan Details:', JSON.stringify(planData, null, 2));
}

testPayPal().catch(console.error);
