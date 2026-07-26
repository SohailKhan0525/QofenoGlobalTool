import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

const token = process.env.BETTERSTACK_API_KEY;

async function setupBetterStackMonitor() {
  if (!token) return;
  const res = await fetch('https://uptime.betterstack.com/api/v2/monitors', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log("Status:", res.status);
}

setupBetterStackMonitor();
