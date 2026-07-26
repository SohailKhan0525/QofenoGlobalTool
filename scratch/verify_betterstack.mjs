import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

const token = process.env.BETTERSTACK_API_KEY;

async function verifyBetterStack() {
  if (!token) return;
  console.log("\n=== VERIFYING BETTERSTACK UPTIME MONITORS ===\n");
  const res = await fetch('https://uptime.betterstack.com/api/v2/monitors', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  const monitors = data.data || [];
  console.log(`Found ${monitors.length} monitors:`);
  for (const m of monitors) {
    console.log(`  - [ID: ${m.id}] ${m.attributes.pronounceable_name || m.attributes.url} -> ${m.attributes.url}`);
    console.log(`    Status: ${m.attributes.status} | Last Check: ${m.attributes.last_checked_at} | Frequency: ${m.attributes.check_frequency}s`);
  }
}

verifyBetterStack();
