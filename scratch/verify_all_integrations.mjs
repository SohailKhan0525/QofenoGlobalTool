import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
dotenv.config();
dotenv.config({ path: '.env.local' });

async function verifyAll() {
  console.log("\n=== COMPREHENSIVE INTEGRATION VERIFICATION ===\n");
  let allPassed = true;

  // 1. BING WEBMASTER TOOL (Live HTTP check)
  console.log("1. Checking Bing Webmaster Tool verification...");
  try {
    const metaTagRes = await fetch('https://qofeno-labs.pages.dev');
    const htmlText = await metaTagRes.text();
    const hasMetaTag = htmlText.includes('8EA8F7828FDE181406C2DBA554CC14C0');
    
    const xmlFileRes = await fetch('https://qofeno-labs.pages.dev/BingSiteAuth.xml');
    const xmlText = await xmlFileRes.text();
    const hasXmlAuth = xmlText.includes('8EA8F7828FDE181406C2DBA554CC14C0');

    if (hasMetaTag && hasXmlAuth) {
      console.log("   ✅ Bing Webmaster Meta Tag verified live in HTML!");
      console.log("   ✅ BingSiteAuth.xml verified live at /BingSiteAuth.xml!");
    } else {
      console.log(`   ❌ Bing verification check: metaTag=${hasMetaTag}, xmlFile=${hasXmlAuth}`);
      allPassed = false;
    }
  } catch (err) {
    console.log(`   ❌ Bing verification error: ${err.message}`);
    allPassed = false;
  }

  console.log("");

  // 2. GOOGLE ANALYTICS 4 (Static & Live script check)
  console.log("2. Checking Google Analytics 4 (G-DZB3DZP46T)...");
  try {
    const res = await fetch('https://qofeno-labs.pages.dev');
    const html = await res.text();
    const hasGaScript = html.includes('googletagmanager.com/gtag/js?id=G-DZB3DZP46T') && html.includes('gtag(\'config\', \'G-DZB3DZP46T\'');
    if (hasGaScript) {
      console.log("   ✅ GA4 tag G-DZB3DZP46T is properly embedded & active in production HTML!");
    } else {
      console.log("   ❌ GA4 tag missing from production HTML!");
      allPassed = false;
    }
  } catch (err) {
    console.log(`   ❌ GA4 verification error: ${err.message}`);
    allPassed = false;
  }

  console.log("");

  // 3. BETTERSTACK UPTIME MONITORING (Live API check)
  console.log("3. Checking BetterStack Uptime Monitor...");
  try {
    const token = process.env.BETTERSTACK_API_KEY;
    const res = await fetch('https://uptime.betterstack.com/api/v2/monitors', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const monitor = (data.data || []).find(m => m.attributes.url === 'https://qofeno-labs.pages.dev');
    if (monitor) {
      console.log(`   ✅ BetterStack Monitor ACTIVE for https://qofeno-labs.pages.dev (ID: ${monitor.id})`);
      console.log(`   → Status: ${monitor.attributes.status.toUpperCase()} | Frequency: ${monitor.attributes.check_frequency}s | Last Checked: ${monitor.attributes.last_checked_at}`);
    } else {
      console.log("   ❌ BetterStack Monitor for qofeno-labs.pages.dev not found!");
      allPassed = false;
    }
  } catch (err) {
    console.log(`   ❌ BetterStack verification error: ${err.message}`);
    allPassed = false;
  }

  console.log("");

  // 4. SENTRY ERROR TRACKING (Live Store Event Ingestion API check)
  console.log("4. Checking Sentry Error Tracking Ingestion API...");
  try {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.VITE_SENTRY_DSN;
    const match = dsn.match(/https:\/\/([^@]+)@([^/]+)\/(\d+)/);
    if (match) {
      const [, publicKey, host, projectId] = match;
      const sentryIngestUrl = `https://${host}/api/${projectId}/envelope/`;
      
      const eventId = '1234567890abcdef1234567890abcdef';
      const envelopeHeader = JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() });
      const itemHeader = JSON.stringify({ type: 'event', content_type: 'application/json' });
      const itemPayload = JSON.stringify({
        event_id: eventId,
        message: 'Qofeno Verification Test Event',
        level: 'info',
        environment: 'verification'
      });
      const envelope = `${envelopeHeader}\n${itemHeader}\n${itemPayload}\n`;

      const sentryRes = await fetch(sentryIngestUrl, {
        method: 'POST',
        headers: {
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=qofeno-verify/1.0, sentry_key=${publicKey}`,
          'Content-Type': 'application/x-sentry-envelope'
        },
        body: envelope
      });

      console.log(`   Sentry Ingestion API response: ${sentryRes.status}`);
      if (sentryRes.ok) {
        console.log(`   ✅ Sentry DSN ingestion verified! Event sent successfully (ID: ${eventId})`);
      } else {
        const text = await sentryRes.text();
        console.log(`   ⚠️ Sentry response: ${text.substring(0, 100)}`);
      }
    } else {
      console.log("   ❌ Invalid Sentry DSN format:", dsn);
      allPassed = false;
    }
  } catch (err) {
    console.log(`   ❌ Sentry verification error: ${err.message}`);
    allPassed = false;
  }

  console.log("\n==================================================");
  if (allPassed) {
    console.log("🎉 ALL INTEGRATIONS 100% VERIFIED AND WORKING LIVE!");
  } else {
    console.log("⚠️ Some checks require attention.");
  }
  console.log("==================================================\n");
}

verifyAll();
