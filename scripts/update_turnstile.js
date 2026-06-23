import dotenv from 'dotenv';
dotenv.config();

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_KEY || process.env.CLOUDFLARE_API_TOKEN;
const siteKey = process.env.VITE_TURNSTILE_SITE_KEY;
const domainToAdd = process.env.CLOUDFLARE_PAGES_DOMAIN || 'qofeno-labs.pages.dev';

if (!accountId || !apiToken || !siteKey) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/challenges/widgets/${siteKey}`;
const headers = {
  'Authorization': `Bearer ${apiToken}`,
  'Content-Type': 'application/json'
};

async function updateWidget() {
  try {
    // 1. Get current widget details
    console.log(`Fetching widget ${siteKey}...`);
    const getRes = await fetch(url, { method: 'GET', headers });
    const getData = await getRes.json();

    if (!getData.success) {
      console.error('Failed to fetch widget details:', getData.errors);
      process.exit(1);
    }

    const widget = getData.result;
    console.log('Current domains:', widget.domains);

    let domains = widget.domains || [];
    if (!domains.includes(domainToAdd)) {
      domains.push(domainToAdd);
      // also adding localhost for testing
      if (!domains.includes('localhost')) domains.push('localhost');
      if (!domains.includes('127.0.0.1')) domains.push('127.0.0.1');

      console.log('Updating domains to:', domains);

      // 2. Update widget
      // Cloudflare API requires sending the whole object back usually, or just specific fields depending on the endpoint.
      // The PUT request accepts domains, name, bot_fight_mode, mode, etc.
      const putBody = {
        name: widget.name,
        domains: domains,
        mode: widget.mode,
        bot_fight_mode: widget.bot_fight_mode,
        clearance_level: widget.clearance_level,
        offlabel: widget.offlabel
      };

      const putRes = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(putBody)
      });
      const putData = await putRes.json();

      if (putData.success) {
        console.log('Successfully updated Turnstile widget domains!');
      } else {
        console.error('Failed to update widget:', putData.errors);
      }
    } else {
      console.log('Domain is already in the allowed list. No update needed.');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

updateWidget();
